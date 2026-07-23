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

// Extended columns with candidate name and question count — used by list queries
const REVIEW_WITH_CANDIDATE_COLUMNS = `
  r.id, r.candidate_id, r.status, r.theory_score, r.practical_score,
  r.feedback, r.conducted_at, r.created_at, r.updated_at,
  c.name AS candidate_name,
  COUNT(rtq.id)::INT AS question_count
`;

interface ReviewWithCandidateRow extends ReviewRow {
  candidate_name: string;
  question_count: number;
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
  practicalScore: number | null,
): Promise<Review | null> {
  const { rows } = await pool.query<ReviewRow>(
    `UPDATE reviews
     SET status          = 'finalized',
         theory_score    = $1,
         practical_score = $2,
         conducted_at    = now()
     WHERE id = $3
     RETURNING ${REVIEW_COLUMNS}`,
    [theoryScore, practicalScore, id],
  );

  return rows[0] ? toReview(rows[0]) : null;
}

/**
 * Return the current draft review for a candidate, or null if none exists.
 */
export async function findDraftByCandidateId(candidateId: string): Promise<Review | null> {
  const { rows } = await pool.query<ReviewRow>(
    `SELECT ${REVIEW_COLUMNS}
     FROM reviews
     WHERE candidate_id = $1
       AND status = 'draft'
     LIMIT 1`,
    [candidateId],
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

/**
 * Return all reviews joined with candidate name, ordered newest first.
 * Optionally filter by candidateId and/or status.
 */
export async function findAll(params: {
  candidateId?: string;
  status?: string;
} = {}): Promise<(Review & { candidateName: string; questionCount: number })[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.candidateId) {
    values.push(params.candidateId);
    conditions.push(`r.candidate_id = $${values.length}`);
  }

  if (params.status) {
    values.push(params.status);
    conditions.push(`r.status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query<ReviewWithCandidateRow>(
    `SELECT ${REVIEW_WITH_CANDIDATE_COLUMNS}
     FROM reviews r
     JOIN candidates c ON c.id = r.candidate_id
     LEFT JOIN review_theory_questions rtq ON rtq.review_id = r.id
     ${where}
     GROUP BY r.id, c.name
     ORDER BY r.created_at DESC`,
    values,
  );

  return rows.map((row) => ({
    ...toReview(row),
    candidateName:  row.candidate_name,
    questionCount:  row.question_count,
  }));
}
