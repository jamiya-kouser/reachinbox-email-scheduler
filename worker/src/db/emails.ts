import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { EmailStatus } from '@reachinbox/shared';
import { pool } from './mysql';

export interface EmailRow {
  id: string;
  user_id: string;
  sender_id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_text: string;
  status: EmailStatus;
  attempts: number;
  max_attempts: number;
}

export async function findEmailById(emailId: string): Promise<EmailRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       id,
       user_id,
       sender_id,
       recipient_email,
       recipient_name,
       subject,
       body_text,
       status,
       attempts,
       max_attempts
     FROM emails
     WHERE id = ?
     LIMIT 1`,
    [emailId]
  );

  const row = rows[0] as EmailRow | undefined;
  return row ?? null;
}

export async function markEmailProcessing(emailId: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE emails
     SET status = 'PROCESSING',
         attempts = attempts + 1
     WHERE id = ?
       AND status IN ('PENDING', 'QUEUED', 'RESCHEDULED')`,
    [emailId]
  );

  return result.affectedRows === 1;
}

export async function markEmailSent(
  emailId: string,
  messageId: string,
  previewUrl: string | null
): Promise<void> {
  await pool.execute(
    `UPDATE emails
     SET status = 'SENT',
         sent_at = UTC_TIMESTAMP(),
         smtp_message_id = ?,
         ethereal_preview_url = ?,
         last_error = NULL
     WHERE id = ?`,
    [messageId, previewUrl, emailId]
  );
}

export async function markEmailFailed(emailId: string, lastError: string): Promise<void> {
  await pool.execute(
    `UPDATE emails
     SET status = 'FAILED',
         last_error = ?
     WHERE id = ?`,
    [lastError, emailId]
  );
}

export async function recordEmailAttemptError(emailId: string, lastError: string): Promise<void> {
  await pool.execute(
    `UPDATE emails
     SET last_error = ?
     WHERE id = ?`,
    [lastError, emailId]
  );
}

