'use strict';

const { User, OTP, RefreshToken } = require('../../models');

/**
 * Auth Repository — pure DB access. No business logic.
 * All queries use .lean() for performance unless the document is mutated.
 */

// ─── User ──────────────────────────────────────────────────────────────────────

async function createUser(data) {
  return User.create(data);
}

async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil').exec();
}

async function findUserById(id) {
  return User.findById(id).exec();
}

async function findUserByIdLean(id) {
  return User.findById(id).lean().exec();
}

async function markUserVerified(userId) {
  return User.findByIdAndUpdate(
    userId,
    { $set: { isVerified: true } },
    { new: true }
  ).lean().exec();
}

async function updateUserPassword(userId, hashedPassword) {
  return User.findByIdAndUpdate(
    userId,
    { $set: { password: hashedPassword } },
    { new: true }
  ).exec();
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

async function upsertOTP({ userId, hashedOtp, purpose, expiresAt }) {
  // deleteOne first to avoid unique constraint conflicts (VULN-009 fix enforcement)
  await OTP.deleteOne({ userId, purpose });

  return OTP.create({ userId, hashedOtp, purpose, expiresAt });
}

async function findOTP(userId, purpose) {
  return OTP.findOne({ userId, purpose }).select('+hashedOtp').exec();
}

async function incrementOTPAttempts(otpId) {
  return OTP.findByIdAndUpdate(
    otpId,
    { $inc: { attempts: 1 } },
    { new: true }
  ).exec();
}

async function consumeOTP(otpId) {
  // Mark as used — prevents replay. TTL will clean it up.
  return OTP.findByIdAndUpdate(
    otpId,
    { $set: { usedAt: new Date() } },
    { new: true }
  ).exec();
}

async function deleteOTPsForUser(userId, purpose) {
  return OTP.deleteMany({ userId, purpose });
}

// ─── Refresh Tokens ────────────────────────────────────────────────────────────

async function createRefreshToken({ userId, tokenHash, family, userAgent, ipAddress, expiresAt }) {
  return RefreshToken.create({ userId, tokenHash, family, userAgent, ipAddress, expiresAt });
}

async function findRefreshTokenByHash(tokenHash) {
  return RefreshToken.findOne({ tokenHash }).select('+tokenHash').exec();
}

async function revokeRefreshToken(tokenId, reason) {
  return RefreshToken.findByIdAndUpdate(
    tokenId,
    { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: reason } },
    { new: true }
  ).exec();
}

async function revokeTokenFamily(family) {
  return RefreshToken.revokeFamily(family, 'theft_detected');
}

async function revokeAllUserTokens(userId) {
  return RefreshToken.revokeAllForUser(userId, 'logout');
}

module.exports = {
  // User
  createUser,
  findUserByEmail,
  findUserById,
  findUserByIdLean,
  markUserVerified,
  updateUserPassword,
  // OTP
  upsertOTP,
  findOTP,
  incrementOTPAttempts,
  consumeOTP,
  deleteOTPsForUser,
  // Refresh tokens
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  revokeTokenFamily,
  revokeAllUserTokens,
};
