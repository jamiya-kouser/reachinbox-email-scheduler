export type EmailStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'RESCHEDULED'
  | 'FAILED'
  | 'CANCELLED';

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sender {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  hourlyQuota: number;
  minDelayMs: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailBatch {
  id: string;
  userId: string;
  senderId: string;
  name: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  rescheduledCount: number;
  createdAt: Date;
}

export interface Email {
  id: string;
  userId: string;
  senderId: string;
  batchId: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  bodyText: string;
  status: EmailStatus;
  scheduledFor: Date;
  sentAt: Date | null;
  bullJobId: string | null;
  idempotencyKey: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  smtpMessageId: string | null;
  etherealPreviewUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlackConnection {
  id: string;
  userId: string;
  teamId: string;
  teamName: string;
  channelId: string;
  channelName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailJobData {
  emailId: string;
  userId: string;
  senderId: string;
}

export interface SlackAlertData {
  userId: string;
  senderEmail: string;
  hourlyQuota: number;
  nextWindowStart: string;
}
