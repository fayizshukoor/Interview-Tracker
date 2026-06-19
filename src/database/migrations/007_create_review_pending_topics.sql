-- =============================================================================
-- Migration 007 — Create review_pending_topics table
-- Description : Denormalized store of topics that a candidate failed in a
--               review. A row is inserted here whenever a theory question is
--               marked 'incorrect'. Storing this separately avoids a costly
--               JOIN + GROUP BY across review_theory_questions on every
--               dashboard load and enables a simple indexed aggregation for
--               "most frequently failed topics".
--
--               This table is append-only from the application perspective.
--               Rows are removed only via CASCADE when the parent review is
--               deleted. The application never updates existing rows; to
--               correct a marking, the application deletes rows for a review
--               and re-inserts.
--
-- Depends on  : 001 (pgcrypto)
--               004 (reviews table)
-- Idempotent  : Yes
-- =============================================================================

CREATE TABLE IF NOT EXISTS review_pending_topics (
    -- Primary key
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),

    -- Parent review
    review_id      UUID         NOT NULL,

    -- Topic that was failed (snapshot from review_theory_questions.topic)
    topic          VARCHAR(255) NOT NULL,

    -- The specific question that was answered incorrectly for this topic entry
    question_text  TEXT         NOT NULL,

    -- No updated_at — this table is append-only
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------

    CONSTRAINT rpen_pkey
        PRIMARY KEY (id),

    CONSTRAINT rpen_review_fk
        FOREIGN KEY (review_id)
        REFERENCES reviews (id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Dashboard aggregation: GROUP BY topic to count failures
CREATE INDEX IF NOT EXISTS idx_rpen_topic
    ON review_pending_topics (topic);

-- Fetch all pending topics for a single review (review summary screen)
CREATE INDEX IF NOT EXISTS idx_rpen_review_id
    ON review_pending_topics (review_id);

-- Dashboard date-range filter: join to reviews.conducted_at via review_id
-- then group by topic — this composite index covers both predicates
CREATE INDEX IF NOT EXISTS idx_rpen_topic_review
    ON review_pending_topics (topic, review_id);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE  review_pending_topics              IS 'Denormalized failed topics per review. Populated when a theory question is marked incorrect.';
COMMENT ON COLUMN review_pending_topics.topic        IS 'Snapshot of the topic from the incorrectly answered theory question.';
COMMENT ON COLUMN review_pending_topics.question_text IS 'Snapshot of the question text for display in the review summary.';
