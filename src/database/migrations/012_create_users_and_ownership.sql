-- =============================================================================
-- Migration 012 — Create users table and add owner_id columns
-- Description : Adds a simple users table for authentication and an optional
--               owner_id column to candidate, question, practical_question,
--               and reviews tables to enable per-user ownership.
-- Idempotent  : Yes — uses IF NOT EXISTS / DO blocks
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Users table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id           UUID        NOT NULL DEFAULT gen_random_uuid(),
    email        TEXT        NOT NULL UNIQUE,
    password_hash TEXT       NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Attach trigger for updated_at if needed (set_updated_at exists from earlier migration)
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE users IS 'Application users who own question banks, candidates and reviews.';

-- ---------------------------------------------------------------------------
-- Add owner_id columns to existing tables (nullable initially)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE candidates ADD COLUMN owner_id UUID NULL;
    ALTER TABLE candidates ADD CONSTRAINT candidates_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_candidates_owner_id ON candidates (owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN owner_id UUID NULL;
    ALTER TABLE questions ADD CONSTRAINT questions_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_questions_owner_id ON questions (owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practical_questions' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE practical_questions ADD COLUMN owner_id UUID NULL;
    ALTER TABLE practical_questions ADD CONSTRAINT pq_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_pq_owner_id ON practical_questions (owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN owner_id UUID NULL;
    ALTER TABLE reviews ADD CONSTRAINT reviews_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_reviews_owner_id ON reviews (owner_id);
  END IF;
END $$;

COMMENT ON COLUMN candidates.owner_id IS 'Owner (user) who created this candidate profile.';
COMMENT ON COLUMN questions.owner_id IS 'Owner (user) who created this question.';
COMMENT ON COLUMN practical_questions.owner_id IS 'Owner (user) who created this practical question.';
COMMENT ON COLUMN reviews.owner_id IS 'Owner (user) who created this review session.';
