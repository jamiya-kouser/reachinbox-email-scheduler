import Redis from 'ioredis';
import { redisConnectionFromEnv } from '@reachinbox/shared';
import { env } from '../config/env';

export const redis = new Redis({
  ...redisConnectionFromEnv(env),
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('connect', () => {
  console.log('🔗 Redis connected successfully.');
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      await redis.connect();
    }
    const pingResponse = await redis.ping();
    return pingResponse === 'PONG';
  } catch (error) {
    console.error('Redis connection ping failed:', error);
    return false;
  }
}
