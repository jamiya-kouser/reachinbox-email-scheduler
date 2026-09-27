import { UnrecoverableError, type Job } from 'bullmq';
import type { EmailJobData } from '@reachinbox/shared';
import {
  findEmailById,
  markEmailFailed,
  markEmailProcessing,
  markEmailSent,
  recordEmailAttemptError,
} from '../db/emails';
import { sendViaSmtp } from '../services/smtp';

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }
  return 'Unknown email delivery error';
}

export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { emailId, userId, senderId } = job.data;

  const email = await findEmailById(emailId);
  if (!email) {
    throw new UnrecoverableError(`Email ${emailId} was not found`);
  }

  if (email.user_id !== userId || email.sender_id !== senderId) {
    throw new UnrecoverableError(`Email ${emailId} job payload does not match stored record`);
  }

  if (email.status === 'SENT' || email.status === 'CANCELLED') {
    return;
  }

  const claimed = await markEmailProcessing(emailId);
  if (!claimed) {
    const latest = await findEmailById(emailId);
    if (latest?.status === 'SENT' || latest?.status === 'CANCELLED') {
      return;
    }
    throw new Error(`Unable to claim email ${emailId} for processing`);
  }

  try {
    const result = await sendViaSmtp({
      to: email.recipient_email,
      subject: email.subject,
      text: email.body_text,
    });

    await markEmailSent(emailId, result.messageId, result.previewUrl);
    console.log(`Email ${emailId} sent`, { messageId: result.messageId });
  } catch (error) {
    const message = safeErrorMessage(error);
    const attempts = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? email.max_attempts;

    if (attempts >= maxAttempts) {
      await markEmailFailed(emailId, message);
    } else {
      await recordEmailAttemptError(emailId, message);
    }

    throw error;
  }
}
