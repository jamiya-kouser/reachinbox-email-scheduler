export const EMAIL_QUEUE_NAME = 'email-delivery';
export const EMAIL_JOB_NAME = 'send-email';

export function redisConnectionFromEnv(env: {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
}): {
  host: string;
  port: number;
  password: string | undefined;
  maxRetriesPerRequest: null;
} {
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
}
