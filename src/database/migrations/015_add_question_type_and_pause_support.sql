-- Add the type of theory question and persisted accumulated time for pausable timers.

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) NOT NULL DEFAULT 'normal';

ALTER TABLE questions
  ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN ('normal', 'code_snippet'));

ALTER TABLE review_theory_questions
  ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) NOT NULL DEFAULT 'normal';

ALTER TABLE review_theory_questions
  ADD CONSTRAINT rtq_question_type_check
  CHECK (question_type IN ('normal', 'code_snippet'));

ALTER TABLE review_practical_tasks
  ADD COLUMN IF NOT EXISTS elapsed_seconds INTEGER NOT NULL DEFAULT 0;

UPDATE review_practical_tasks
SET elapsed_seconds = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (end_time - start_time)))::INTEGER)
WHERE start_time IS NOT NULL
  AND end_time IS NOT NULL
  AND elapsed_seconds = 0;

COMMENT ON COLUMN questions.question_type IS 'normal or code_snippet';
COMMENT ON COLUMN review_theory_questions.question_type IS 'Snapshot of the source question type.';
COMMENT ON COLUMN review_practical_tasks.elapsed_seconds IS 'Accumulated active timer seconds, excluding paused periods.';
