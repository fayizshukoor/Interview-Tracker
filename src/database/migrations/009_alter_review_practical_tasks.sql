-- =============================================================================
-- Migration 009 — Alter review_practical_tasks
-- Description : Makes score nullable (can be filled after timing the task),
--               and adds an optional expected_answer column.
--
-- Before this migration:
--   score    NUMERIC(5,2) NOT NULL
--   (no expected_answer column)
--
-- After this migration:
--   score            NUMERIC(5,2) NULL   — filled when interviewer enters score
--   expected_answer  TEXT         NULL   — optional model answer
--
-- Idempotent : Yes — uses IF NOT EXISTS / DO blocks
-- =============================================================================

-- Make score nullable so tasks can be created before a score is entered
ALTER TABLE review_practical_tasks
  ALTER COLUMN score DROP NOT NULL;

-- Add expected_answer column if it does not already exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'review_practical_tasks'
       AND column_name = 'expected_answer'
  ) THEN
    ALTER TABLE review_practical_tasks
      ADD COLUMN expected_answer TEXT NULL;
  END IF;
END $$;

-- Update comment to reflect new semantics
COMMENT ON COLUMN review_practical_tasks.score IS
  'Score awarded for this task (0–100). NULL until the interviewer enters it.';

COMMENT ON COLUMN review_practical_tasks.expected_answer IS
  'Optional model answer shown to the interviewer during the session.';
