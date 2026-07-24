import { pool } from '../config/db.js';
import type { User } from '../types/index.js';

interface UserRow {
    id: string;
    email: string;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
}

function toUser(row: UserRow): User {
    return {
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function create(email: string, passwordHash: string): Promise<User> {
    const { rows } = await pool.query<UserRow>(
        `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, password_hash, created_at, updated_at`,
        [email, passwordHash],
    );

    return toUser(rows[0]!);
}

export async function findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query<UserRow>(
        `SELECT id, email, password_hash, created_at, updated_at
     FROM users
     WHERE email = $1`,
        [email],
    );

    return rows[0] ? toUser(rows[0]) : null;
}

export async function findById(id: string): Promise<User | null> {
    const { rows } = await pool.query<UserRow>(
        `SELECT id, email, password_hash, created_at, updated_at
     FROM users
     WHERE id = $1`,
        [id],
    );

    return rows[0] ? toUser(rows[0]) : null;
}

export async function getPasswordHashByEmail(email: string): Promise<string | null> {
    const { rows } = await pool.query<{ password_hash: string }>(
        `SELECT password_hash
     FROM users
     WHERE email = $1`,
        [email],
    );

    return rows[0]?.password_hash ?? null;
}
