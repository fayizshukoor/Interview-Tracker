import { pool } from '../config/db.js';
import type { ReviewTheoryQuestion, QuestionResult } from '../types/index.js';

// ---------------------------------------------------------------------------
// Row type — matches the column names returned by PostgreSQL
// ---------------------------------------------------------------------------

interface ReviewTheoryQuestionRow {
  id: string;
  review_id: string;
  question_id: string | null;
  question_text: string;
  expected_answer: string;
  topic: string;
  result: QuestionResult | null;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function toReviewTheoryQuestion(row: ReviewTheoryQuestionRow): ReviewTheoryQuestion {
  return {
    id:             row.id,
    reviewId:       row.review_id,
    questionId:     row.question_id,
    questionText:   row.question_text,
    expectedAnswer: row.expected_answer,
    topic:          row.topic,
    result:         row.result,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Repository methods
// ---------------------------------------------------------------------------

/**
 * Insert a snapshot of a question into a review.
 * question_id is stored for traceability but the snapshot columns
 * (question_text, expected_answer, topic) are the canonical values —
 * they are never affected by future edits or deletes of the source question.
 */
export async function create(
  reviewId: string,
  questionId: string,
  questionText: string,
  expectedAnswer: string,
  topic: string,
): Promise<ReviewTheoryQuestion> {
  const { rows } = await pool.query<ReviewTheoryQuestionRow>(
    `INSERT INTO review_theory_questions
       (review_id, question_id, question_text, expected_answer, topic)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, review_id, question_id, question_text, expected_answer,
               topic, result, created_at, updated_at`,
    [reviewId, questionId, questionText, expectedAnswer, topic],
  );

  return toReviewTheoryQuestion(rows[0]!);
}

/**
 * Return all theory questions for a given review, ordered by insertion time.
 */
export async function findByReviewId(reviewId: string): Promise<ReviewTheoryQuestion[]> {
  const { rows } = await pool.query<ReviewTheoryQuestionRow>(
    `SELECT id, review_id, question_id, question_text, expected_answer,
            topic, result, created_at, updated_at
     FROM review_theory_questions
     WHERE review_id = $1
     ORDER BY created_at ASC`,
    [reviewId],
  );

  return rows.map(toReviewTheoryQuestion);
}

/**
 * Set the result (correct | incorrect) for a single theory question.
 * Returns the updated record, or null if the id is not found.
 */
export async function updateResult(
  id: string,
  result: QuestionResult,
): Promise<ReviewTheoryQuestion | null> {
  const { rows } = await pool.query<ReviewTheoryQuestionRow>(
    `UPDATE review_theory_questions
     SET result = $1
     WHERE id = $2
     RETURNING id, review_id, question_id, question_text, expected_answer,
               topic, result, created_at, updated_at`,
    [result, id],
  );

  return rows[0] ? toReviewTheoryQuestion(rows[0]) : null;
}

/**
 * Return true if the review already contains a snapshot for the given
 * source question id.
 */
export async function exists(reviewId: string, questionId: string): Promise<boolean> {
  const { rows } = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM review_theory_questions
       WHERE review_id  = $1
         AND question_id = $2
     ) AS exists`,
    [reviewId, questionId],
  );

  return rows[0]?.exists ?? false;
}

/**
 * Delete a single theory question row by its id.
 * Returns true if a row was deleted, false if the id was not found.
 */
export async function deleteById(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM review_theory_questions WHERE id = $1`,
    [id],
  );

  return (rowCount ?? 0) > 0;
}
