import { pool } from '../config/db.js';

export interface RefreshTokenRecord {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    revokedAt: Date | null;
}

interface RefreshTokenRow {
    id: string;
    user_id: string;
    token_hash: string;
    family_id: string;
    expires_at: Date;
    revoked_at: Date | null;
}

function toRefreshToken(row: RefreshTokenRow): RefreshTokenRecord {
    return { id: row.id, userId: row.user_id, tokenHash: row.token_hash, familyId: row.family_id, expiresAt: row.expires_at, revokedAt: row.revoked_at };
}

export async function createRefreshToken(userId: string, tokenHash: string, familyId: string, expiresAt: Date): Promise<void> {
    await pool.query(`INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at) VALUES ($1, $2, $3, $4)`, [userId, tokenHash, familyId, expiresAt]);
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const { rows } = await pool.query<RefreshTokenRow>(`SELECT id, user_id, token_hash, family_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
    return rows[0] ? toRefreshToken(rows[0]) : null;
}

export async function revokeRefreshToken(id: string): Promise<void> {
    await pool.query(`UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1`, [id]);
}

export async function revokeFamily(familyId: string): Promise<void> {
    await pool.query(`UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, now()) WHERE family_id = $1`, [familyId]);
}

export async function createOtp(email: string, codeHash: string, expiresAt: Date): Promise<void> {
    await pool.query(`INSERT INTO email_verification_otps (email, code_hash, expires_at) VALUES ($1, $2, $3)`, [email, codeHash, expiresAt]);
}

export async function latestOtp(email: string): Promise<{ createdAt: Date } | null> {
    const { rows } = await pool.query<{ created_at: Date }>(`SELECT created_at FROM email_verification_otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`, [email]);
    return rows[0] ? { createdAt: rows[0].created_at } : null;
}

export async function consumeOtp(email: string, codeHash: string): Promise<boolean> {
    const { rowCount } = await pool.query(
        `UPDATE email_verification_otps SET consumed_at = now()
         WHERE id = (SELECT id FROM email_verification_otps
           WHERE email = $1 AND code_hash = $2 AND consumed_at IS NULL AND expires_at > now()
           ORDER BY created_at DESC LIMIT 1 FOR UPDATE SKIP LOCKED)`,
        [email, codeHash],
    );
    return rowCount === 1;
}

export async function isOtpValid(email: string, codeHash: string): Promise<boolean> {
    const { rowCount } = await pool.query(
        `SELECT id FROM email_verification_otps
         WHERE email = $1 AND code_hash = $2 AND consumed_at IS NULL AND expires_at > now()
         ORDER BY created_at DESC LIMIT 1`, [email, codeHash],
    );
    return rowCount === 1;
}
