ALTER TABLE review_theory_questions ADD COLUMN IF NOT EXISTS sort_order INTEGER;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY review_id ORDER BY created_at, id) - 1 AS position
  FROM review_theory_questions
)
UPDATE review_theory_questions q SET sort_order = numbered.position
FROM numbered WHERE q.id = numbered.id AND q.sort_order IS NULL;

ALTER TABLE review_theory_questions
  ALTER COLUMN sort_order SET DEFAULT 0,
  ALTER COLUMN sort_order SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rtq_review_order ON review_theory_questions (review_id, sort_order);
