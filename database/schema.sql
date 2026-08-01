-- =============================================================================
-- Interview Tracker — PostgreSQL Database Schema
-- Version: 2.0
-- Description: Current schema aligned with the migrations under src/database/migrations
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE IF NOT EXISTS review_status AS ENUM ('draft', 'finalized');
CREATE TYPE IF NOT EXISTS question_result AS ENUM ('correct', 'incorrect');

-- =============================================================================
-- TABLE: users
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id           UUID        NOT NULL DEFAULT gen_random_uuid(),
    email        TEXT        NOT NULL UNIQUE,
    password_hash TEXT       NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- TABLE: candidates
-- =============================================================================

CREATE TABLE IF NOT EXISTS candidates (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        CITEXT      NOT NULL,
    owner_id    UUID        NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT candidates_pkey        PRIMARY KEY (id),
    CONSTRAINT candidates_name_unique UNIQUE (name),
    CONSTRAINT candidates_owner_fk FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_candidates_name ON candidates (name);
CREATE INDEX IF NOT EXISTS idx_candidates_owner_id ON candidates (owner_id);

-- =============================================================================
-- TABLE: questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS questions (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    question_text    TEXT        NOT NULL,
    expected_answer  TEXT        NOT NULL,
    topic            VARCHAR(255) NOT NULL,
    question_type    VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (question_type IN ('normal', 'code_snippet')),
    is_deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
    owner_id         UUID        NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_owner_fk FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_topic      ON questions (topic) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_questions_is_deleted ON questions (is_deleted);
CREATE INDEX IF NOT EXISTS idx_questions_owner_id   ON questions (owner_id);

-- =============================================================================
-- TABLE: practical_questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS practical_questions (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    task_text        TEXT         NOT NULL,
    expected_answer  TEXT         NULL,
    topic            VARCHAR(255) NOT NULL,
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    owner_id         UUID         NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pq_pkey PRIMARY KEY (id),
    CONSTRAINT pq_owner_fk FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pq_topic ON practical_questions (topic) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_pq_is_deleted ON practical_questions (is_deleted);
CREATE INDEX IF NOT EXISTS idx_pq_owner_id ON practical_questions (owner_id);

-- =============================================================================
-- TABLE: reviews
-- =============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id               UUID           NOT NULL DEFAULT gen_random_uuid(),
    candidate_id     UUID           NOT NULL,
    owner_id         UUID           NULL,
    status           review_status  NOT NULL DEFAULT 'draft',
    theory_score     NUMERIC(5, 2)  NULL CHECK (theory_score BETWEEN 0 AND 100),
    practical_score  NUMERIC(5, 2)  NULL CHECK (practical_score BETWEEN 0 AND 100),
    feedback         TEXT           NULL,
    conducted_at     TIMESTAMPTZ    NULL,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT reviews_pkey PRIMARY KEY (id),
    CONSTRAINT reviews_candidate_fk FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE RESTRICT,
    CONSTRAINT reviews_owner_fk FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT reviews_one_draft_per_candidate
        EXCLUDE USING btree (candidate_id WITH =)
        WHERE (status = 'draft')
);

CREATE INDEX IF NOT EXISTS idx_reviews_candidate_conducted ON reviews (candidate_id, conducted_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_conducted_at ON reviews (conducted_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);
CREATE INDEX IF NOT EXISTS idx_reviews_owner_id ON reviews (owner_id);

-- =============================================================================
-- TABLE: review_theory_questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS review_theory_questions (
    id               UUID            NOT NULL DEFAULT gen_random_uuid(),
    review_id        UUID            NOT NULL,
    question_id      UUID            NULL,
    question_text    TEXT            NOT NULL,
    expected_answer  TEXT            NOT NULL,
    topic            VARCHAR(255)    NOT NULL,
    question_type    VARCHAR(20)     NOT NULL DEFAULT 'normal' CHECK (question_type IN ('normal', 'code_snippet')),
    result           question_result NULL,
    sort_order       INTEGER         NULL,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT rtq_pkey PRIMARY KEY (id),
    CONSTRAINT rtq_review_fk FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE,
    CONSTRAINT rtq_question_fk FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE SET NULL,
    CONSTRAINT rtq_unique_question_per_review UNIQUE (review_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_rtq_review_id ON review_theory_questions (review_id);
CREATE INDEX IF NOT EXISTS idx_rtq_question_id ON review_theory_questions (question_id);
CREATE INDEX IF NOT EXISTS idx_rtq_result ON review_theory_questions (review_id, result);
CREATE INDEX IF NOT EXISTS idx_rtq_review_order ON review_theory_questions (review_id, sort_order);

-- =============================================================================
-- TABLE: review_practical_tasks
-- =============================================================================

CREATE TABLE IF NOT EXISTS review_practical_tasks (
    id                  UUID           NOT NULL DEFAULT gen_random_uuid(),
    review_id           UUID           NOT NULL,
    task_text           TEXT           NOT NULL,
    expected_answer     TEXT           NULL,
    score               NUMERIC(5, 2)  NULL CHECK (score BETWEEN 0 AND 100),
    start_time          TIMESTAMPTZ    NULL,
    end_time            TIMESTAMPTZ    NULL,
    active_start_time   TIMESTAMPTZ    NULL,
    elapsed_seconds     INTEGER        NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT rpt_pkey PRIMARY KEY (id),
    CONSTRAINT rpt_review_fk FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rpt_review_id ON review_practical_tasks (review_id);

-- =============================================================================
-- TABLE: review_pending_topics
-- =============================================================================

CREATE TABLE IF NOT EXISTS review_pending_topics (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    review_id      UUID         NOT NULL,
    topic          VARCHAR(255) NOT NULL,
    question_text  TEXT         NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT rpen_pkey PRIMARY KEY (id),
    CONSTRAINT rpen_review_fk FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rpen_topic ON review_pending_topics (topic);
CREATE INDEX IF NOT EXISTS idx_rpen_review_id ON review_pending_topics (review_id);
CREATE INDEX IF NOT EXISTS idx_rpen_topic_review ON review_pending_topics (topic, review_id);

-- =============================================================================
-- TABLE: refresh_tokens
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    family_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON refresh_tokens (family_id);

-- =============================================================================
-- TABLE: email_verification_otps
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_verification_otps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email ON email_verification_otps (email, created_at DESC);

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

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pq_updated_at
    BEFORE UPDATE ON practical_questions
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
-- VIEWS: convenience views for common queries
-- =============================================================================

CREATE VIEW v_candidate_latest_review AS
SELECT DISTINCT ON (r.candidate_id)
    r.candidate_id,
    r.id AS review_id,
    r.theory_score,
    r.practical_score,
    r.conducted_at AS last_review_at
FROM reviews r
WHERE r.status = 'finalized'
ORDER BY r.candidate_id, r.conducted_at DESC;

CREATE VIEW v_topic_failure_counts AS
SELECT
    rpen.topic,
    COUNT(*)::INT AS failure_count
FROM review_pending_topics rpen
JOIN reviews r ON r.id = rpen.review_id
WHERE r.status = 'finalized'
GROUP BY rpen.topic
ORDER BY failure_count DESC;
