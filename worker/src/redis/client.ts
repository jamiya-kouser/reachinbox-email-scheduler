import Redis from 'ioredis';
import { redisConnectionFromEnv } from '@reachinbox/shared';
import { env } from '../config/env';

export const redis = new Redis(redisConnectionFromEnv(env));

redis.on('error', (err) => {
  console.error('❌ Worker Redis error:', err.message);
});

redis.on('connect', () => {
  console.log('🔗 Worker Redis connected successfully.');
});
