-- =============================================================================
-- Migration 004 — Create reviews table
-- Description : Top-level review session aggregate. A review is owned by one
--               candidate and progresses from 'draft' to 'finalized'.
--               Scores are NULL while in draft and are computed and stored
--               atomically when the review is finalized.
--
--               A partial EXCLUDE constraint ensures a candidate can only have
--               one active draft at a time (requires btree_gist extension from
--               migration 001).
--
-- Depends on  : 001 (pgcrypto, btree_gist, review_status enum)
--               002 (candidates table)
-- Idempotent  : Yes
-- =============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    -- Primary key
    id               UUID          NOT NULL DEFAULT gen_random_uuid(),

    -- Owning candidate — restrict delete so candidate history is preserved
    candidate_id     UUID          NOT NULL,

    -- Lifecycle state
    status           review_status NOT NULL DEFAULT 'draft',

    -- Computed scores; NULL while draft, populated on finalization
    -- theory_score  = (correct questions / total selected) * 100
    -- practical_score = average of all practical task scores
    theory_score     NUMERIC(5, 2) NULL,
    practical_score  NUMERIC(5, 2) NULL,

    -- Free-text interviewer feedback; may be added any time before finalization
    feedback         TEXT          NULL,

    -- Set to now() at the moment of finalization; NULL while draft
    conducted_at     TIMESTAMPTZ   NULL,

    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------

    CONSTRAINT reviews_pkey
        PRIMARY KEY (id),

    CONSTRAINT reviews_candidate_fk
        FOREIGN KEY (candidate_id)
        REFERENCES candidates (id)
        ON DELETE RESTRICT,

    -- Score bounds — enforced at DB level as a safety net
    CONSTRAINT reviews_theory_score_range
        CHECK (theory_score IS NULL OR (theory_score BETWEEN 0 AND 100)),

    CONSTRAINT reviews_practical_score_range
        CHECK (practical_score IS NULL OR (practical_score BETWEEN 0 AND 100)),

    -- A candidate may only have one draft review at a time.
    -- EXCLUDE uses btree_gist; the WHERE clause makes it a partial constraint
    -- so finalized reviews are unaffected and multiple finalised reviews are allowed.
    CONSTRAINT reviews_one_draft_per_candidate
        EXCLUDE USING btree (candidate_id WITH =)
        WHERE (status = 'draft')
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Candidate review history — ordered most-recent first
CREATE INDEX IF NOT EXISTS idx_reviews_candidate_conducted
    ON reviews (candidate_id, conducted_at DESC NULLS LAST);

-- Dashboard date-range queries on finalized reviews
CREATE INDEX IF NOT EXISTS idx_reviews_conducted_at
    ON reviews (conducted_at)
    WHERE status = 'finalized';

-- Draft lookup (find active draft for a given candidate)
CREATE INDEX IF NOT EXISTS idx_reviews_candidate_status
    ON reviews (candidate_id, status);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE  reviews                 IS 'Top-level review session. Progresses from draft to finalized.';
COMMENT ON COLUMN reviews.status          IS 'draft: in progress, editable. finalized: locked, scores computed.';
COMMENT ON COLUMN reviews.theory_score    IS 'Percentage of theory questions answered correctly. Computed on finalization.';
COMMENT ON COLUMN reviews.practical_score IS 'Average score across all practical tasks. Computed on finalization.';
COMMENT ON COLUMN reviews.conducted_at    IS 'Timestamp set when the review is finalized. NULL while in draft.';
