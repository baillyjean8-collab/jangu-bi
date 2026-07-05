'use strict';

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const config = require('../config/env');
const { sendError } = require('../shared/utils/response');
const { getRedisClient } = require('../config/redis');

const redisClient = getRedisClient();

function makeStore(prefix) {
  if (!redisClient) return undefined;
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: prefix,
  });
}

const rateLimitHandler = (req, res) => {
  sendError(res, 'Too many requests. Please wait before trying again.', 429, 'RATE_LIMIT_EXCEEDED');
};

const authRateLimiter = rateLimit({
  store: makeStore('rl:auth:'),
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
  skip: (req) => config.isDevelopment,
});

const apiRateLimiter = rateLimit({
  store: makeStore('rl:api:'),
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
});

const otpRateLimiter = rateLimit({
  store: makeStore('rl:otp:'),
  windowMs: 30 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'Too many OTP requests. Please wait 30 minutes before requesting a new code.', 429, 'OTP_RATE_LIMIT_EXCEEDED');
  },
  keyGenerator: (req) => req.ip,
  skip: (req) => config.isDevelopment,
});

const donationRateLimiter = rateLimit({
  store: makeStore('rl:don:'),
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.user?.userId || req.ip,
  skip: (req) => config.isDevelopment,
});

module.exports = {
  authRateLimiter,
  apiRateLimiter,
  otpRateLimiter,
  donationRateLimiter,
};
