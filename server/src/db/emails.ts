import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { randomUUID } from 'crypto';
import { pool } from './mysql';

export interface CreateEmailInput {
  userId: string;
  senderId: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  bodyText: string;
  scheduledFor: Date;
  idempotencyKey: string;
}

export async function findEmailByIdempotencyKey(
  userId: string,
  idempotencyKey: string
) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT *
     FROM emails
     WHERE user_id = ? AND idempotency_key = ?
     LIMIT 1`,
    [userId, idempotencyKey]
  );

  return rows[0] ?? null;
}

export async function createEmail(input: CreateEmailInput) {
  const id = randomUUID();

  await pool.execute<ResultSetHeader>(
    `INSERT INTO emails (
      id,
      user_id,
      sender_id,
      recipient_email,
      recipient_name,
      subject,
      body_text,
      status,
      scheduled_for,
      idempotency_key
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'QUEUED', ?, ?)`,
    [
      id,
      input.userId,
      input.senderId,
      input.recipientEmail,
      input.recipientName,
      input.subject,
      input.bodyText,
      input.scheduledFor,
      input.idempotencyKey,
    ]
  );

  return id;
}

export async function setBullJobId(
  emailId: string,
  bullJobId: string
): Promise<void> {
  await pool.execute(
    `UPDATE emails
     SET bull_job_id = ?
     WHERE id = ?`,
    [bullJobId, emailId]
  );
}