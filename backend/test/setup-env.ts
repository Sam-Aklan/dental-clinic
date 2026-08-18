import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env.test')) {
  loadEnvFile('.env.test');
}

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_ACCESS_EXPIRY ??= '15m';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRY ??= '7d';
process.env.FRONTEND_URL ??= 'http://localhost:5173';
process.env.CLINIC_EMAIL ??= 'support@dentalclinic.local';

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
