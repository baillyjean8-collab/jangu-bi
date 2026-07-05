'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const env = process.env.NODE_ENV || 'development';
const config = {
  env,
  isDevelopment: env === 'development',
  isProduction:  env === 'production',
  isTest:        env === 'test',
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173',
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jangu-bi',
  },
  jwt: {
    accessSecret:    process.env.JWT_ACCESS_SECRET  || 'dev-access-secret',
    refreshSecret:   process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiresIn:  process.env.JWT_ACCESS_EXPIRY  || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  otp: {
    ttlMinutes:  parseInt(process.env.OTP_TTL_MINUTES  || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5',  10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX      || '100', 10),
    authMax:  parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10',  10),
  },
  email: {
    host:     process.env.EMAIL_HOST     || 'smtp.mailtrap.io',
    port:     parseInt(process.env.EMAIL_PORT || '587', 10),
    user:     process.env.EMAIL_USER     || '',
    password: process.env.EMAIL_PASSWORD || '',
    from:     process.env.EMAIL_FROM     || 'noreply@jangu-bi.sn',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey:    process.env.CLOUDINARY_API_KEY    || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};
module.exports = config;
