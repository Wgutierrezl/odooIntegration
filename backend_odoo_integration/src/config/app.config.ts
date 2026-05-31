import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}));

export const databaseConfig = registerAs('database', () => ({
  path: process.env.DATABASE_PATH || './data/platform.db',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret',
  expiration: process.env.JWT_EXPIRATION || '8h',
}));

export const odooConfig = registerAs('odoo', () => ({
  url: process.env.ODOO_URL,
  db: process.env.ODOO_DB,
  username: process.env.ODOO_USERNAME,
  apiKey: process.env.ODOO_API_KEY,
  webPassword: process.env.ODOO_WEB_PASSWORD,
  timeoutMs: parseInt(process.env.ODOO_TIMEOUT_MS ?? '15000', 10),
  maxRetries: parseInt(process.env.ODOO_MAX_RETRIES ?? '3', 10),
  syncIntervalMinutes: parseInt(
    process.env.ODOO_SYNC_INTERVAL_MINUTES ?? '5',
    10,
  ),
}));
