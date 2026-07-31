import 'dotenv/config.js';

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: Number(process.env['PORT'] ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiry: process.env['JWT_EXPIRES_IN'] ?? '15m',
  refreshTokenExpiryDays: Number(process.env['REFRESH_TOKEN_EXPIRY_DAYS'] ?? 30),
  otpExpiryMinutes: Number(process.env['OTP_EXPIRY_MINUTES'] ?? 10),
  otpResendSeconds: Number(process.env['OTP_RESEND_SECONDS'] ?? 60),
  smtpHost: process.env['SMTP_HOST'],
  smtpPort: Number(process.env['SMTP_PORT'] ?? 587),
  smtpSecure: process.env['SMTP_SECURE'] === 'true',
  smtpUser: process.env['SMTP_USER'],
  smtpPassword: process.env['SMTP_PASSWORD'],
  smtpFrom: process.env['SMTP_FROM'],
};
