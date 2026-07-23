import { pool } from '../config/db.js';
import type { ReviewPracticalTask } from '../types/index.js';

// ---------------------------------------------------------------------------
// Row type — matches the column names returned by PostgreSQL
// ---------------------------------------------------------------------------

interface ReviewPracticalTaskRow {
  id: string;
  review_id: string;
  task_text: string;
  expected_answer: string | null;
  score: string | null;     // pg returns NUMERIC as string
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function toTask(row: ReviewPracticalTaskRow): ReviewPracticalTask {
  return {
    id:             row.id,
    reviewId:       row.review_id,
    taskText:       row.task_text,
    expectedAnswer: row.expected_answer,
    score:          row.score !== null ? parseFloat(row.score) : null,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

const COLUMNS = `id, review_id, task_text, expected_answer, score, created_at, updated_at`;

// ---------------------------------------------------------------------------
// Repository methods
// ---------------------------------------------------------------------------

/**
 * Insert a new practical task for a review.
 * score and expectedAnswer are optional at creation time.
 */
export async function create(
  reviewId: string,
  taskText: string,
  expectedAnswer: string | null,
): Promise<ReviewPracticalTask> {
  const { rows } = await pool.query<ReviewPracticalTaskRow>(
    `INSERT INTO review_practical_tasks (review_id, task_text, expected_answer)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [reviewId, taskText, expectedAnswer],
  );

  return toTask(rows[0]!);
}

/**
 * Return all practical tasks for a review, ordered by creation time.
 */
export async function findByReviewId(reviewId: string): Promise<ReviewPracticalTask[]> {
  const { rows } = await pool.query<ReviewPracticalTaskRow>(
    `SELECT ${COLUMNS}
     FROM review_practical_tasks
     WHERE review_id = $1
     ORDER BY created_at ASC`,
    [reviewId],
  );

  return rows.map(toTask);
}

/**
 * Update the score of a practical task.
 * Returns the updated task, or null if the id is not found.
 */
export async function updateScore(
  id: string,
  score: number,
): Promise<ReviewPracticalTask | null> {
  const { rows } = await pool.query<ReviewPracticalTaskRow>(
    `UPDATE review_practical_tasks
     SET score = $1
     WHERE id = $2
     RETURNING ${COLUMNS}`,
    [score, id],
  );

  return rows[0] ? toTask(rows[0]) : null;
}

/**
 * Delete a practical task by id.
 * Returns true if a row was deleted, false if not found.
 */
export async function deleteById(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM review_practical_tasks WHERE id = $1`,
    [id],
  );

  return (rowCount ?? 0) > 0;
}
