-- =============================================================================
-- Migration 008 — Triggers and Views
-- Description : Installs the shared updated_at trigger function and attaches
--               it to all mutable tables, then creates the two dashboard
--               convenience views.
--
-- Depends on  : 002–007 (all tables must exist)
-- Idempotent  : Yes — uses CREATE OR REPLACE and DROP IF EXISTS / CREATE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Trigger function: set_updated_at
-- Automatically sets updated_at = now() on every UPDATE.
-- Attached to all tables that carry an updated_at column.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Attach trigger to: candidates
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_candidates_updated_at ON candidates;

CREATE TRIGGER trg_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Attach trigger to: questions
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_questions_updated_at ON questions;

CREATE TRIGGER trg_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Attach trigger to: reviews
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Attach trigger to: review_theory_questions
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_rtq_updated_at ON review_theory_questions;

CREATE TRIGGER trg_rtq_updated_at
    BEFORE UPDATE ON review_theory_questions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Attach trigger to: review_practical_tasks
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_rpt_updated_at ON review_practical_tasks;

CREATE TRIGGER trg_rpt_updated_at
    BEFORE UPDATE ON review_practical_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- View: v_candidate_latest_review
-- Purpose : Returns the most recent finalized review for each candidate.
--           Used by the dashboard candidate list to show last review date
--           and scores without a subquery in every controller.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_candidate_latest_review AS
SELECT DISTINCT ON (r.candidate_id)
    r.candidate_id,
    r.id              AS review_id,
    r.theory_score,
    r.practical_score,
    r.conducted_at    AS last_review_at
FROM reviews r
WHERE r.status = 'finalized'
ORDER BY r.candidate_id, r.conducted_at DESC NULLS LAST;

COMMENT ON VIEW v_candidate_latest_review IS
    'Most recent finalized review per candidate. Used by the dashboard candidate list.';

-- ---------------------------------------------------------------------------
-- View: v_topic_failure_counts
-- Purpose : Aggregates failure counts per topic across all finalized reviews.
--           Used by the dashboard "top failed topics" widget.
--           Accepts optional date filtering by joining to reviews.conducted_at
--           in the calling query when a date range is required.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_topic_failure_counts AS
SELECT
    rpen.topic,
    COUNT(*)::INT  AS failure_count
FROM review_pending_topics rpen
INNER JOIN reviews r ON r.id = rpen.review_id
WHERE r.status = 'finalized'
GROUP BY rpen.topic
ORDER BY failure_count DESC;

COMMENT ON VIEW v_topic_failure_counts IS
    'Aggregated failure count per topic across all finalized reviews. Used by the dashboard.';
