-- =============================================================================
-- Migration 011 — Add start_time and end_time to review_practical_tasks
-- Description : Store real start and end timestamps for practical task timers.
-- Idempotent  : Yes
-- =============================================================================

ALTER TABLE review_practical_tasks
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS end_time   TIMESTAMPTZ NULL;

COMMENT ON COLUMN review_practical_tasks.start_time IS 'Recorded real-world start time when interviewer begins the practical task.';
COMMENT ON COLUMN review_practical_tasks.end_time   IS 'Recorded real-world end time when interviewer stops the practical task.';
