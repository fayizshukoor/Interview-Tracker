-- Keep the original start time stable while tracking the start of the current
-- active segment separately for Stop/Resume timer cycles.

ALTER TABLE review_practical_tasks
  ADD COLUMN IF NOT EXISTS active_start_time TIMESTAMPTZ NULL;

-- Tasks that were running before this migration use their existing start time
-- as the current active segment start. Stopped tasks remain paused.
UPDATE review_practical_tasks
SET active_start_time = start_time
WHERE start_time IS NOT NULL
  AND end_time IS NULL
  AND active_start_time IS NULL;
