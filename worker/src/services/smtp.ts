import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface SmtpSendInput {
  to: string;
  subject: string;
  text: string;
}

export interface SmtpSendResult {
  messageId: string;
  previewUrl: string | null;
}

export async function sendViaSmtp(input: SmtpSendInput): Promise<SmtpSendResult> {
  const info = await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl: typeof previewUrl === 'string' ? previewUrl : null,
  };
}
