import { Worker } from 'bullmq';
import { EMAIL_QUEUE_NAME, type EmailJobData } from '@reachinbox/shared';
import { pool } from './db/mysql';
import { processEmailJob } from './processors/emailProcessor';
import { redis } from './redis/client';

const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, {
  connection: redis,
});

worker.on('ready', () => {
  console.log(`📬 Email worker listening on queue "${EMAIL_QUEUE_NAME}"`);
});

worker.on('failed', (job, error) => {
  console.error(`Email job ${job?.id ?? 'unknown'} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('Email worker error:', error.message);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Worker received ${signal}, shutting down...`);
  await worker.close();
  redis.disconnect();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
