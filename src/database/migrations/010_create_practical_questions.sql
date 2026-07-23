-- =============================================================================
-- Migration 010 — Create practical_questions table
-- Description : Persistent bank of reusable practical questions/tasks.
--               Mirrors the theory questions bank but for coding exercises,
--               system design tasks, and other practical assessments.
--               Questions use soft-delete (is_deleted) to preserve history.
-- Depends on  : 001 (pgcrypto)
-- Idempotent  : Yes
-- =============================================================================

CREATE TABLE IF NOT EXISTS practical_questions (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    task_text        TEXT         NOT NULL,
    expected_answer  TEXT         NULL,
    topic            VARCHAR(255) NOT NULL,
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pq_pkey PRIMARY KEY (id)
);

-- Filter active questions by topic
CREATE INDEX IF NOT EXISTS idx_pq_topic
    ON practical_questions (topic)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_pq_is_deleted
    ON practical_questions (is_deleted);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_pq_updated_at ON practical_questions;
CREATE TRIGGER trg_pq_updated_at
    BEFORE UPDATE ON practical_questions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE  practical_questions              IS 'Reusable practical task bank. Mirrors theory question bank.';
COMMENT ON COLUMN practical_questions.task_text     IS 'Description of the practical task or coding exercise.';
COMMENT ON COLUMN practical_questions.expected_answer IS 'Optional model answer / evaluation criteria.';
COMMENT ON COLUMN practical_questions.topic         IS 'Category label (e.g. Node.js, SQL, System Design).';
COMMENT ON COLUMN practical_questions.is_deleted    IS 'Soft delete — TRUE hides from active bank, data preserved.';
