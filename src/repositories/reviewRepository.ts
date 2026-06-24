import { pool } from '../config/db.js';
import type { Review } from '../types/index.js';

// ---------------------------------------------------------------------------
// Row type — matches the columns returned by PostgreSQL
// ---------------------------------------------------------------------------

interface ReviewRow {
  id: string;
  candidate_id: string;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// Mapper — converts a raw DB row to a Review plain object
// ---------------------------------------------------------------------------

function toReview(row: ReviewRow): Review {
  return {
    id:          row.id,
    candidateId: row.candidate_id,
    createdAt:   row.created_at,
  };
}

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
     RETURNING id, candidate_id, created_at`,
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
    `SELECT id, candidate_id, created_at
     FROM reviews
     WHERE id = $1`,
    [id],
  );

  return rows[0] ? toReview(rows[0]) : null;
}
