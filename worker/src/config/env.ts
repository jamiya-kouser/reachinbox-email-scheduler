import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.string().transform(Number).default('3306'),
  MYSQL_USER: z.string().default('reachinbox'),
  MYSQL_PASSWORD: z.string().default('password123'),
  MYSQL_DATABASE: z.string().default('email_scheduler'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional().default(''),

  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Worker environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
