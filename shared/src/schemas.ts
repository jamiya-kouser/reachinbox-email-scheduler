import { z } from 'zod';

export const ScheduleEmailSchema = z.object({
  senderId: z.string().uuid(),
  recipientEmail: z.string().email(),
  recipientName: z.string().optional().nullable(),
  subject: z.string().min(1).max(500),
  bodyText: z.string().min(1),
  scheduledFor: z.string().datetime().or(z.date()),
});

export type ScheduleEmailInput = z.infer<typeof ScheduleEmailSchema>;

export const UpdateSenderSchema = z.object({
  displayName: z.string().optional(),
  hourlyQuota: z.number().int().min(1).max(10000).optional(),
  minDelayMs: z.number().int().min(0).max(60000).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSenderInput = z.infer<typeof UpdateSenderSchema>;
