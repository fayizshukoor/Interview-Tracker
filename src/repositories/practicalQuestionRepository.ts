import { pool } from '../config/db.js';
import type { PracticalQuestion } from '../types/index.js';

interface PracticalQuestionRow {
  id: string;
  task_text: string;
  expected_answer: string | null;
  topic: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

function toQuestion(row: PracticalQuestionRow): PracticalQuestion {
  return {
    id:             row.id,
    taskText:       row.task_text,
    expectedAnswer: row.expected_answer,
    topic:          row.topic,
    isDeleted:      row.is_deleted,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

const COLUMNS = `id, task_text, expected_answer, topic, is_deleted, created_at, updated_at`;

export async function create(
  taskText: string,
  expectedAnswer: string | null,
  topic: string,
): Promise<PracticalQuestion> {
  const { rows } = await pool.query<PracticalQuestionRow>(
    `INSERT INTO practical_questions (task_text, expected_answer, topic)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [taskText, expectedAnswer, topic],
  );
  return toQuestion(rows[0]!);
}

export async function findById(id: string): Promise<PracticalQuestion | null> {
  const { rows } = await pool.query<PracticalQuestionRow>(
    `SELECT ${COLUMNS} FROM practical_questions WHERE id = $1 AND is_deleted = FALSE`,
    [id],
  );
  return rows[0] ? toQuestion(rows[0]) : null;
}

export async function findAll(params: {
  topic?: string;
  search?: string;
} = {}): Promise<PracticalQuestion[]> {
  const conditions = ['is_deleted = FALSE'];
  const values: unknown[] = [];

  if (params.topic) {
    values.push(params.topic);
    conditions.push(`topic ILIKE $${values.length}`);
  }
  if (params.search) {
    values.push(`%${params.search}%`);
    conditions.push(`task_text ILIKE $${values.length}`);
  }

  const { rows } = await pool.query<PracticalQuestionRow>(
    `SELECT ${COLUMNS} FROM practical_questions
     WHERE ${conditions.join(' AND ')}
     ORDER BY topic ASC, task_text ASC`,
    values,
  );
  return rows.map(toQuestion);
}

export async function findAllTopics(): Promise<string[]> {
  const { rows } = await pool.query<{ topic: string }>(
    `SELECT DISTINCT topic FROM practical_questions
     WHERE is_deleted = FALSE ORDER BY topic ASC`,
  );
  return rows.map((r) => r.topic);
}

export async function softDelete(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE practical_questions SET is_deleted = TRUE
     WHERE id = $1 AND is_deleted = FALSE`,
    [id],
  );
  return (rowCount ?? 0) > 0;
}
