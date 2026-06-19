-- =============================================================================
-- Interview Tracker — PostgreSQL Database Schema
-- Version: 1.0
-- Description: Full schema with tables, constraints, indexes, and triggers.
-- =============================================================================

-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable citext for case-insensitive text comparisons
CREATE EXTENSION IF NOT EXISTS "citext";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE review_status     AS ENUM ('draft', 'finalized');
CREATE TYPE question_result   AS ENUM ('correct', 'incorrect');

-- =============================================================================
-- TABLE: candidates
-- Stores candidate profiles managed by interviewers.
-- =============================================================================

CREATE TABLE candidates (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        CITEXT      NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT candidates_pkey        PRIMARY KEY (id),
    CONSTRAINT candidates_name_unique UNIQUE (name)
);

-- Index for partial name search (ILIKE queries use this via lower())
CREATE INDEX idx_candidates_name ON candidates (name);

-- =============================================================================
-- TABLE: questions
-- Persistent question bank used across all reviews.
-- =============================================================================

CREATE TABLE questions (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    question_text    TEXT        NOT NULL,
    expected_answer  TEXT        NOT NULL,
    topic            VARCHAR(255) NOT NULL,
    is_deleted       BOOLEAN     NOT NULL DEFAULT FALSE,   -- soft delete
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT questions_pkey PRIMARY KEY (id)
);

-- Index for topic-based filtering (most common query pattern)
CREATE INDEX idx_questions_topic      ON questions (topic)      WHERE is_deleted = FALSE;
CREATE INDEX idx_questions_is_deleted ON questions (is_deleted);

-- =============================================================================
-- TABLE: reviews
-- Top-level review session for a candidate.
-- Scores are NULL while status = 'draft', populated on finalization.
-- =============================================================================

CREATE TABLE reviews (
    id               UUID           NOT NULL DEFAULT gen_random_uuid(),
    candidate_id     UUID           NOT NULL,
    status           review_status  NOT NULL DEFAULT 'draft',
    theory_score     NUMERIC(5, 2)  NULL CHECK (theory_score   BETWEEN 0 AND 100),
    practical_score  NUMERIC(5, 2)  NULL CHECK (practical_score BETWEEN 0 AND 100),
    feedback         TEXT           NULL,
    conducted_at     TIMESTAMPTZ    NULL,   -- set when finalized
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT reviews_pkey             PRIMARY KEY (id),
    CONSTRAINT reviews_candidate_fk     FOREIGN KEY (candidate_id)
        REFERENCES candidates (id) ON DELETE RESTRICT,

    -- Enforce at most one draft per candidate at a time
    CONSTRAINT reviews_one_draft_per_candidate
        EXCLUDE USING btree (candidate_id WITH =)
        WHERE (status = 'draft')
);

-- History queries: candidate reviews ordered by date
CREATE INDEX idx_reviews_candidate_conducted ON reviews (candidate_id, conducted_at DESC);
-- Dashboard date-range filtering
CREATE INDEX idx_reviews_conducted_at        ON reviews (conducted_at);
CREATE INDEX idx_reviews_status              ON reviews (status);

-- =============================================================================
-- TABLE: review_theory_questions
-- Snapshot of each question selected for a theory review.
-- Question text and expected answer are copied at selection time so that
-- future edits or deletions of the source question never corrupt history.
-- =============================================================================

CREATE TABLE review_theory_questions (
    id               UUID            NOT NULL DEFAULT gen_random_uuid(),
    review_id        UUID            NOT NULL,
    -- Nullable: source question may be deleted; snapshot is preserved regardless
    question_id      UUID            NULL,
    -- Snapshot columns (copied from questions at selection time)
    question_text    TEXT            NOT NULL,
    expected_answer  TEXT            NOT NULL,
    topic            VARCHAR(255)    NOT NULL,
    result           question_result NULL,    -- NULL until interviewer marks it
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT rtq_pkey        PRIMARY KEY (id),
    CONSTRAINT rtq_review_fk   FOREIGN KEY (review_id)
        REFERENCES reviews (id) ON DELETE CASCADE,
    CONSTRAINT rtq_question_fk FOREIGN KEY (question_id)
        REFERENCES questions (id) ON DELETE SET NULL,

    -- A question should not be added twice to the same review
    CONSTRAINT rtq_unique_question_per_review UNIQUE (review_id, question_id)
);

CREATE INDEX idx_rtq_review_id   ON review_theory_questions (review_id);
CREATE INDEX idx_rtq_question_id ON review_theory_questions (question_id);
-- Used when computing theory score (counting correct/incorrect)
CREATE INDEX idx_rtq_result      ON review_theory_questions (review_id, result);

-- =============================================================================
-- TABLE: review_practical_tasks
-- One or more practical tasks assigned during a review, each with a score.
-- =============================================================================

CREATE TABLE review_practical_tasks (
    id          UUID           NOT NULL DEFAULT gen_random_uuid(),
    review_id   UUID           NOT NULL,
    task_text   TEXT           NOT NULL,
    score       NUMERIC(5, 2)  NOT NULL CHECK (score BETWEEN 0 AND 100),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT rpt_pkey      PRIMARY KEY (id),
    CONSTRAINT rpt_review_fk FOREIGN KEY (review_id)
        REFERENCES reviews (id) ON DELETE CASCADE
);

CREATE INDEX idx_rpt_review_id ON review_practical_tasks (review_id);

-- =============================================================================
-- TABLE: review_pending_topics
-- Denormalized record of topics that failed in a review.
-- Populated automatically when a theory question is marked 'incorrect'.
-- Stored separately to enable efficient GROUP BY aggregations on the dashboard
-- without scanning all theory question rows.
-- =============================================================================

CREATE TABLE review_pending_topics (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    review_id      UUID         NOT NULL,
    topic          VARCHAR(255) NOT NULL,
    question_text  TEXT         NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT rpen_pkey      PRIMARY KEY (id),
    CONSTRAINT rpen_review_fk FOREIGN KEY (review_id)
        REFERENCES reviews (id) ON DELETE CASCADE
);

-- Primary access pattern: aggregate by topic across all reviews
CREATE INDEX idx_rpen_topic     ON review_pending_topics (topic);
CREATE INDEX idx_rpen_review_id ON review_pending_topics (review_id);
-- Dashboard date-range join via review
CREATE INDEX idx_rpen_topic_review ON review_pending_topics (topic, review_id);

-- =============================================================================
-- TRIGGERS: updated_at auto-maintenance
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rtq_updated_at
    BEFORE UPDATE ON review_theory_questions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rpt_updated_at
    BEFORE UPDATE ON review_practical_tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- VIEWS: Convenience views for common queries
-- =============================================================================

-- Latest finalized review per candidate (used by dashboard candidate list)
CREATE VIEW v_candidate_latest_review AS
SELECT DISTINCT ON (r.candidate_id)
    r.candidate_id,
    r.id              AS review_id,
    r.theory_score,
    r.practical_score,
    r.conducted_at    AS last_review_at
FROM reviews r
WHERE r.status = 'finalized'
ORDER BY r.candidate_id, r.conducted_at DESC;

-- Pending topic failure counts (used by dashboard top-failed-topics)
CREATE VIEW v_topic_failure_counts AS
SELECT
    rpen.topic,
    COUNT(*)::INT AS failure_count
FROM review_pending_topics rpen
JOIN reviews r ON r.id = rpen.review_id
WHERE r.status = 'finalized'
GROUP BY rpen.topic
ORDER BY failure_count DESC;
