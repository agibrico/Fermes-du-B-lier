/**
 * Authentication and security utilities for Fermes du Bélier SaaS
 * Secure password hashing, session tokens, email verification simulation
 */

import crypto from 'crypto';
import { DbClient } from './db';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  is_email_verified: boolean;
  verification_token?: string | null;
  reset_token?: string | null;
  reset_token_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  type: 'verification' | 'reset_password';
  token: string;
  link: string;
  createdAt: string;
}

// In-memory local mailbox for testing and verification without external SMTP
export const devMailbox: SimulatedEmail[] = [];

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hashToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hashToVerify, 'hex'), Buffer.from(originalHash, 'hex'));
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function createSession(db: DbClient, userId: string, daysValid: number = 14): Promise<{ token: string; expiresAt: Date }> {
  const token = generateRandomToken(32);
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
  const sessionId = 'ses_' + generateRandomToken(12);

  await db.query(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [sessionId, userId, tokenHash, expiresAt.toISOString()]
  );

  return { token, expiresAt };
}

export async function revokeSession(db: DbClient, token: string): Promise<boolean> {
  const tokenHash = hashSessionToken(token);
  const res = await db.query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
  return res.rowCount > 0;
}

export async function getUserBySessionToken(db: DbClient, token: string): Promise<UserRecord | null> {
  const tokenHash = hashSessionToken(token);
  const res = await db.query<UserRecord>(
    `SELECT u.* FROM users u
     JOIN sessions s ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash]
  );
  return res.rows[0] || null;
}

export function recordSimulatedEmail(to: string, type: 'verification' | 'reset_password', token: string) {
  const emailItem: SimulatedEmail = {
    id: 'mail_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    to,
    subject: type === 'verification' ? 'Vérification de votre compte — Fermes du Bélier' : 'Réinitialisation de votre mot de passe',
    type,
    token,
    link: `/auth/${type === 'verification' ? 'verify' : 'reset'}?token=${token}`,
    createdAt: new Date().toISOString()
  };
  devMailbox.unshift(emailItem);
  if (devMailbox.length > 50) devMailbox.pop();
  console.log(`[SIMULATED-EMAIL] Sent ${type} email to ${to} with token: ${token}`);
  return emailItem;
}
