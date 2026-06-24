import { pool } from '../config/db.js';
import type { ReviewPendingTopic } from '../types/index.js';

// ---------------------------------------------------------------------------
// Row type — matches the column names returned by PostgreSQL
// ---------------------------------------------------------------------------

interface ReviewPendingTopicRow {
  id: string;
  review_id: string;
  topic: string;
  question_text: string;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function toReviewPendingTopic(row: ReviewPendingTopicRow): ReviewPendingTopic {
  return {
    id:           row.id,
    reviewId:     row.review_id,
    topic:        row.topic,
    questionText: row.question_text,
    createdAt:    row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Repository methods
// ---------------------------------------------------------------------------

/**
 * Insert a pending topic entry for a review.
 * Called whenever a theory question is marked 'incorrect'.
 */
export async function create(
  reviewId: string,
  topic: string,
  questionText: string,
): Promise<ReviewPendingTopic> {
  const { rows } = await pool.query<ReviewPendingTopicRow>(
    `INSERT INTO review_pending_topics (review_id, topic, question_text)
     VALUES ($1, $2, $3)
     RETURNING id, review_id, topic, question_text, created_at`,
    [reviewId, topic, questionText],
  );

  return toReviewPendingTopic(rows[0]!);
}

/**
 * Return all pending topics for a given review, ordered by insertion time.
 */
export async function findByReviewId(reviewId: string): Promise<ReviewPendingTopic[]> {
  const { rows } = await pool.query<ReviewPendingTopicRow>(
    `SELECT id, review_id, topic, question_text, created_at
     FROM review_pending_topics
     WHERE review_id = $1
     ORDER BY created_at ASC`,
    [reviewId],
  );

  return rows.map(toReviewPendingTopic);
}
