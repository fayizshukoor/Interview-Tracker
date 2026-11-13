-- =============================================================================
-- Migration 003 — Create questions table
-- Description : Persistent question bank. Questions are never hard-deleted;
--               is_deleted = TRUE acts as a soft delete to preserve referential
--               integrity with historical review snapshots.
-- Depends on  : 001 (pgcrypto extension)
-- Idempotent  : Yes
-- =============================================================================

CREATE TABLE IF NOT EXISTS questions (
    -- Primary key
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),

    -- The question posed to the candidate
    question_text    TEXT         NOT NULL,

    -- The model answer / key points the interviewer expects
    expected_answer  TEXT         NOT NULL,

    -- Categorical label used for filtering and pending-topic aggregation
    topic            VARCHAR(255) NOT NULL,

    -- Soft delete flag. When TRUE the question is hidden from the active bank
    -- but its data remains intact in historical review_theory_questions rows.
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,

    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT questions_pkey PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Primary filter: list questions by topic (active only)
CREATE INDEX IF NOT EXISTS idx_questions_topic
    ON questions (topic)
    WHERE is_deleted = FALSE;

-- Efficient filtering of soft-deleted rows across all queries
CREATE INDEX IF NOT EXISTS idx_questions_is_deleted
    ON questions (is_deleted);

-- Full-text search support on question text (optional, can be expanded later)
CREATE INDEX IF NOT EXISTS idx_questions_text_search
    ON questions USING gin(to_tsvector('english', question_text))
    WHERE is_deleted = FALSE;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE  questions               IS 'Persistent question bank. Questions use soft delete to protect review history.';
COMMENT ON COLUMN questions.topic         IS 'Categorical topic label (e.g. JavaScript, SQL, Node.js).';
COMMENT ON COLUMN questions.is_deleted    IS 'Soft delete flag. TRUE = hidden from active bank, data preserved for history.';
COMMENT ON COLUMN questions.expected_answer IS 'Model answer key points the interviewer uses during scoring.';
