import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or server
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),

  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.string().transform(Number).default('3306'),
  MYSQL_USER: z.string().default('reachinbox'),
  MYSQL_PASSWORD: z.string().default('password123'),
  MYSQL_DATABASE: z.string().default('email_scheduler'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional().default(''),

  ELASTICSEARCH_URL: z.string().url().default('http://localhost:9200'),

  SESSION_SECRET: z.string().min(16).default('super-secret-session-key-at-least-32-characters-long'),
  ENCRYPTION_KEY: z.string().min(32).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),
GOOGLE_CLIENT_ID: z.string().min(1),
GOOGLE_CLIENT_SECRET: z.string().min(1),
GOOGLE_CALLBACK_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
