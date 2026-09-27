import { Queue } from 'bullmq';
import { EMAIL_JOB_NAME, EMAIL_QUEUE_NAME, type EmailJobData } from '@reachinbox/shared';
import { redis } from '../redis/client';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export async function enqueueEmailJob(
  data: EmailJobData,
  delayMs = 0
): Promise<void> {
  await emailQueue.add(EMAIL_JOB_NAME, data, {
    jobId: data.emailId,
    delay: delayMs > 0 ? delayMs : undefined,
  });
}
