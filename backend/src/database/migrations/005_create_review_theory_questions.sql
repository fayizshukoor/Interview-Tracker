-- =============================================================================
-- Migration 005 — Create review_theory_questions table
-- Description : Stores a snapshot of each question selected for a theory
--               review. The question's text, expected answer, and topic are
--               copied at selection time (snapshot pattern) so that future
--               edits or soft-deletes of the source question never corrupt
--               historical review records.
--
--               question_id is a nullable FK: it points to the originating
--               question for traceability, but becomes NULL (via ON DELETE
--               SET NULL) if that question is hard-deleted. The snapshot
--               columns are always preserved regardless.
--
-- Depends on  : 001 (pgcrypto, question_result enum)
--               003 (questions table)
--               004 (reviews table)
-- Idempotent  : Yes
-- =============================================================================

CREATE TABLE IF NOT EXISTS review_theory_questions (
    -- Primary key
    id               UUID            NOT NULL DEFAULT gen_random_uuid(),

    -- Parent review
    review_id        UUID            NOT NULL,

    -- Source question — nullable; SET NULL if source is hard-deleted
    question_id      UUID            NULL,

    -- -------------------------------------------------------------------------
    -- Snapshot columns — copied from questions at selection time
    -- These are the canonical values for this review; source question changes
    -- do NOT affect these columns.
    -- -------------------------------------------------------------------------
    question_text    TEXT            NOT NULL,
    expected_answer  TEXT            NOT NULL,
    topic            VARCHAR(255)    NOT NULL,

    -- Interviewer marks each question; NULL = not yet marked
    result           question_result NULL,

    created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------

    CONSTRAINT rtq_pkey
        PRIMARY KEY (id),

    CONSTRAINT rtq_review_fk
        FOREIGN KEY (review_id)
        REFERENCES reviews (id)
        ON DELETE CASCADE,

    -- Traceability link; nullified if source question is removed
    CONSTRAINT rtq_question_fk
        FOREIGN KEY (question_id)
        REFERENCES questions (id)
        ON DELETE SET NULL,

    -- Prevent the same question from being added to the same review twice.
    -- This constraint is on (review_id, question_id); since question_id is
    -- nullable, duplicates with NULL question_id are handled at the
    -- application layer.
    CONSTRAINT rtq_unique_question_per_review
        UNIQUE (review_id, question_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Fetch all theory questions for a given review
CREATE INDEX IF NOT EXISTS idx_rtq_review_id
    ON review_theory_questions (review_id);

-- Traceability: which reviews used a particular source question
CREATE INDEX IF NOT EXISTS idx_rtq_question_id
    ON review_theory_questions (question_id)
    WHERE question_id IS NOT NULL;

-- Theory score computation: COUNT correct / incorrect per review
CREATE INDEX IF NOT EXISTS idx_rtq_review_result
    ON review_theory_questions (review_id, result);

-- Topic-level filtering within a review
CREATE INDEX IF NOT EXISTS idx_rtq_topic
    ON review_theory_questions (topic);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE  review_theory_questions             IS 'Snapshot of theory questions used in a review. Immutable once created.';
COMMENT ON COLUMN review_theory_questions.question_id IS 'FK to source question. NULL if source was hard-deleted; snapshot columns are preserved.';
COMMENT ON COLUMN review_theory_questions.result      IS 'Marked by interviewer: correct | incorrect | NULL (unmarked).';
COMMENT ON COLUMN review_theory_questions.question_text   IS 'Snapshot of question text at time of selection.';
COMMENT ON COLUMN review_theory_questions.expected_answer IS 'Snapshot of expected answer at time of selection.';
COMMENT ON COLUMN review_theory_questions.topic           IS 'Snapshot of topic at time of selection.';
