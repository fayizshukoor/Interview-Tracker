-- =============================================================================
-- Migration 001 — Extensions and Enum Types
-- Description : Bootstraps the PostgreSQL extensions and custom enum types
--               required by all subsequent migrations.
-- Run order   : Must run FIRST before any table migrations.
-- Idempotent  : Yes — all statements use IF NOT EXISTS / DO blocks.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- gen_random_uuid() — used as the default for all UUID primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CITEXT — case-insensitive text type used on candidates.name
CREATE EXTENSION IF NOT EXISTS "citext";

-- btree_gist — required for EXCLUDE USING btree constraints (used on reviews)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ---------------------------------------------------------------------------
-- Enum: review_status
-- Represents the lifecycle state of a review session.
--   draft     : review is in progress, can be modified
--   finalized : review is locked, scores are computed and stored
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('draft', 'finalized');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Enum: question_result
-- The outcome of a single theory question within a review.
--   correct   : candidate answered correctly
--   incorrect : candidate answered incorrectly; topic added to pending list
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE question_result AS ENUM ('correct', 'incorrect');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
