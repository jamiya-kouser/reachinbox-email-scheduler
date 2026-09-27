import { env } from './config/env';
import { Router } from 'express';
import { ScheduleEmailSchema } from '@reachinbox/shared';
import { randomUUID } from 'crypto';
import { pool } from './db/mysql';
import {
  createEmail,
  findEmailByIdempotencyKey,
  setBullJobId,
} from './db/emails';
import { enqueueEmailJob } from './queues/emailQueue';

export const router = Router();

router.post('/api/v1/emails/schedule', async (req, res) => {
  try {
    const demoMode =
  env.NODE_ENV === 'development' &&
  req.header('X-Demo-Mode') === 'true';

if (!demoMode && (!req.isAuthenticated?.() || !req.user)) {
  return res.status(401).json({ error: 'Authentication required' });
}

    const idempotencyKey = req.header('Idempotency-Key');

    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required',
      });
    }

    const parsed = ScheduleEmailSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }
const userId = demoMode
  ? 'c5f53081-ba6d-11f1-84ff-76fc32eb794b'
  : (req.user as { id: string }).id;

    const existing = await findEmailByIdempotencyKey(
      userId,
      idempotencyKey
    );

    if (existing) {
      return res.status(200).json({
        email: existing,
        replay: true,
      });
    }

    const [senders] = await pool.execute<any[]>(
      `SELECT id, user_id, is_active
       FROM senders
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [parsed.data.senderId, userId]
    );

    const sender = senders[0];

    if (!sender) {
      return res.status(404).json({
        error: 'Sender not found',
      });
    }

    if (!sender.is_active) {
      return res.status(400).json({
        error: 'Sender is inactive',
      });
    }

    const scheduledFor =
      parsed.data.scheduledFor instanceof Date
        ? parsed.data.scheduledFor
        : new Date(parsed.data.scheduledFor);

    if (Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({
        error: 'Invalid scheduledFor date',
      });
    }

    const emailId = await createEmail({
      userId,
      senderId: parsed.data.senderId,
      recipientEmail: parsed.data.recipientEmail,
      recipientName: parsed.data.recipientName ?? null,
      subject: parsed.data.subject,
      bodyText: parsed.data.bodyText,
      scheduledFor,
      idempotencyKey,
    });

    const delayMs = Math.max(
      0,
      scheduledFor.getTime() - Date.now()
    );

    try {
      await enqueueEmailJob(
        {
          emailId,
          userId,
          senderId: parsed.data.senderId,
        },
        delayMs
      );

      await setBullJobId(emailId, emailId);
    } catch (queueError) {
      await pool.execute(
        `UPDATE emails
         SET status = 'FAILED',
             last_error = ?
         WHERE id = ?`,
        [
          queueError instanceof Error
            ? queueError.message
            : 'Failed to enqueue email job',
          emailId,
        ]
      );

      throw queueError;
    }

    return res.status(201).json({
      emailId,
      status: 'QUEUED',
      scheduledFor: scheduledFor.toISOString(),
    });
  } catch (error) {
    console.error('Schedule email error:', error);

    return res.status(500).json({
      error: 'Failed to schedule email',
    });
  }
});