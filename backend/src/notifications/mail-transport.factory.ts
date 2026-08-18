import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export function createMailTransport(configService: ConfigService): Transporter {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const host = configService.get<string>('SMTP_HOST') ?? 'localhost';
  const port = Number(configService.get<string>('SMTP_PORT') ?? 1025);
  const from = configService.get<string>('SMTP_FROM');
  const user = configService.get<string>('SMTP_USER')?.trim();
  const pass = configService.get<string>('SMTP_PASS')?.trim();

  if (nodeEnv === 'production' && (!host || !port || !from)) {
    throw new Error('SMTP_HOST, SMTP_PORT, and SMTP_FROM are required in production');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}
