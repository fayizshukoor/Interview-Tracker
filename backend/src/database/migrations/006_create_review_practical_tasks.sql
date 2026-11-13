-- =============================================================================
-- Migration 006 — Create review_practical_tasks table
-- Description : One or more practical tasks assigned during a review.
--               Each task has a description and a numeric score (0–100).
--               The overall practical score stored on the parent review is
--               the average of all task scores, computed at finalization.
--
-- Depends on  : 001 (pgcrypto)
--               004 (reviews table)
-- Idempotent  : Yes
-- =============================================================================

CREATE TABLE IF NOT EXISTS review_practical_tasks (
    -- Primary key
    id          UUID          NOT NULL DEFAULT gen_random_uuid(),

    -- Parent review
    review_id   UUID          NOT NULL,

    -- Description of the practical task or coding exercise given to the candidate
    task_text   TEXT          NOT NULL,

    -- Score awarded for this task — validated 0 to 100 inclusive
    score       NUMERIC(5, 2) NOT NULL,

    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------

    CONSTRAINT rpt_pkey
        PRIMARY KEY (id),

    CONSTRAINT rpt_review_fk
        FOREIGN KEY (review_id)
        REFERENCES reviews (id)
        ON DELETE CASCADE,

    CONSTRAINT rpt_score_range
        CHECK (score BETWEEN 0 AND 100)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Fetch all practical tasks for a given review
CREATE INDEX IF NOT EXISTS idx_rpt_review_id
    ON review_practical_tasks (review_id);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE  review_practical_tasks           IS 'Practical tasks assigned during a review, each scored 0–100.';
COMMENT ON COLUMN review_practical_tasks.task_text IS 'Description of the practical question or task given to the candidate.';
COMMENT ON COLUMN review_practical_tasks.score     IS 'Score awarded for this task (0–100). Practical score on the review is the average of all task scores.';
