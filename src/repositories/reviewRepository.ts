import { pool } from '../config/db.js';
import type { Review } from '../types/index.js';

// ---------------------------------------------------------------------------
// Row type — matches the columns returned by PostgreSQL
// ---------------------------------------------------------------------------

interface ReviewRow {
  id: string;
  candidate_id: string;
  status: string;
  theory_score: string | null;   // pg returns NUMERIC as string
  practical_score: string | null;
  feedback: string | null;
  conducted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Mapper — converts a raw DB row to a Review plain object
// ---------------------------------------------------------------------------

function toReview(row: ReviewRow): Review {
  return {
    id:             row.id,
    candidateId:    row.candidate_id,
    status:         row.status,
    theoryScore:    row.theory_score    !== null ? parseFloat(row.theory_score)    : null,
    practicalScore: row.practical_score !== null ? parseFloat(row.practical_score) : null,
    feedback:       row.feedback,
    conductedAt:    row.conducted_at,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

// Columns selected by every query — defined once to avoid repetition
const REVIEW_COLUMNS = `
  id, candidate_id, status, theory_score, practical_score,
  feedback, conducted_at, created_at, updated_at
`;

// ---------------------------------------------------------------------------
// Repository methods
// ---------------------------------------------------------------------------

/**
 * Insert a new review for the given candidate.
 * Status defaults to 'draft' in the DB; UUID and timestamps are DB-generated.
 */
export async function create(candidateId: string): Promise<Review> {
  const { rows } = await pool.query<ReviewRow>(
    `INSERT INTO reviews (candidate_id)
     VALUES ($1)
     RETURNING ${REVIEW_COLUMNS}`,
    [candidateId],
  );

  return toReview(rows[0]!);
}

/**
 * Find a review by its UUID.
 * Returns null if no review with that id exists.
 */
export async function findById(id: string): Promise<Review | null> {
  const { rows } = await pool.query<ReviewRow>(
    `SELECT ${REVIEW_COLUMNS}
     FROM reviews
     WHERE id = $1`,
    [id],
  );

  return rows[0] ? toReview(rows[0]) : null;
}

/**
 * Finalise a review: set status = 'finalized', record the theory score,
 * and stamp conducted_at. Returns the updated Review.
 */
export async function updateFinalizedReview(
  id: string,
  theoryScore: number,
): Promise<Review | null> {
  const { rows } = await pool.query<ReviewRow>(
    `UPDATE reviews
     SET status       = 'finalized',
         theory_score = $1,
         conducted_at = now()
     WHERE id = $2
     RETURNING ${REVIEW_COLUMNS}`,
    [theoryScore, id],
  );

  return rows[0] ? toReview(rows[0]) : null;
}

/**
 * Update the feedback field on a review.
 * Returns the updated Review, or null if the id is not found.
 */
export async function updateFeedback(
  reviewId: string,
  feedback: string,
): Promise<Review | null> {
  const { rows } = await pool.query<ReviewRow>(
    `UPDATE reviews
     SET feedback = $1
     WHERE id = $2
     RETURNING ${REVIEW_COLUMNS}`,
    [feedback, reviewId],
  );

  return rows[0] ? toReview(rows[0]) : null;
}
