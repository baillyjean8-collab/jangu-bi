'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config/env');
const { AuthenticationError } = require('../errors');

/**
 * JWT Utilities
 * Access tokens: short-lived (15m), signed with ACCESS secret
 * Refresh tokens: long-lived (7d), signed with REFRESH secret (different key)
 */

// ─── Access Token ──────────────────────────────────────────────────────────────

function signAccessToken(payload) {
  // Minimal payload — never include sensitive data in JWT
  const safePayload = {
    sub: payload.userId.toString(),
    role: payload.role,
    isVerified: payload.isVerified,
    parishId: payload.parishId ? payload.parishId.toString() : null,
  };

  return jwt.sign(safePayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    algorithm: 'HS256',
    issuer: 'jangu-bi',
    audience: 'jangu-bi-client',
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.accessSecret, {
      algorithms: ['HS256'],
      issuer: 'jangu-bi',
      audience: 'jangu-bi-client',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Access token expired');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid access token');
    }
    throw new AuthenticationError('Token verification failed');
  }
}

// ─── Refresh Token ─────────────────────────────────────────────────────────────

function signRefreshToken(payload) {
  const safePayload = {
    sub: payload.userId.toString(),
    family: payload.family,
  };

  return jwt.sign(safePayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    algorithm: 'HS256',
    issuer: 'jangu-bi',
    audience: 'jangu-bi-refresh',
  });
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      algorithms: ['HS256'],
      issuer: 'jangu-bi',
      audience: 'jangu-bi-refresh',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token expired — please log in again');
    }
    throw new AuthenticationError('Invalid refresh token');
  }
}

// ─── Token Hashing (for DB storage) ───────────────────────────────────────────

/**
 * Hash a raw token for secure storage in RefreshToken collection.
 * We store the hash, never the raw token.
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generate a new token family ID (used for theft detection).
 */
function generateFamily() {
  return crypto.randomBytes(16).toString('hex');
}

// ─── Cookie options ────────────────────────────────────────────────────────────

function getRefreshCookieOptions() {
  return {
    httpOnly: true,                              // JS cannot access
    secure: config.isProduction,                 // HTTPS only in prod
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,           // 7 days in ms
    path: '/',                           // Only sent to auth endpoints
  };
}

function clearRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateFamily,
  getRefreshCookieOptions,
  clearRefreshCookieOptions,
};
