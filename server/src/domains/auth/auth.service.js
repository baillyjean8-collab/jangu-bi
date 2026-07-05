'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../../config/env');
const repo = require('./auth.repository');
const { generateOTP } = require('../../shared/utils/otp');
const { signAccessToken, signRefreshToken, hashToken, generateFamily } = require('../../shared/utils/jwt');
const { OTP: OTPModel } = require('../../models');
const { audit } = require('../../shared/utils/auditLogger');
const { AuditLog } = require('../../models');
const {
  ConflictError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} = require('../../shared/errors');

/**
 * Auth Service — all authentication business logic.
 * Orchestrates repository calls, token issuance, and audit logging.
 */

// ─── Register ──────────────────────────────────────────────────────────────────

async function register({ firstName, lastName, email, phone, password }, req) {
  // Check for existing email
  const existingEmail = await repo.findUserByEmail(email);
  if (existingEmail) throw new ConflictError('An account with this email already exists');

  const user = await repo.createUser({ firstName, lastName, email, phone, password, role: 'user' });

  // Generate and send OTP
  const { otp, expiresAt } = await issueOTP(user._id, 'email_verification');

  // Simulate OTP delivery (replace with SMS/email service in production)
  // OTP logged masked — last 2 digits only — never log full OTP even in dev
console.log(`[OTP-DEV] OTP issued for ${user?._id} (masked): ${'*'.repeat(4)}${String(otp).slice(-2)}`);

  await audit.auth(AuditLog.ACTIONS.AUTH_REGISTER, user._id, req, { email });
  await audit.auth(AuditLog.ACTIONS.AUTH_OTP_SENT, user._id, req, { purpose: 'email_verification' });

  return {
    userId: user._id,
    message: 'Account created. Please verify your phone/email with the OTP sent.',
    // In production: remove this. Return only message.
    ...(config.isDevelopment && { _devOtp: otp }),
  };
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

async function verifyOtp({ userId, otp, purpose }, req) {
  const otpRecord = await repo.findOTP(userId, purpose);

  if (!otpRecord) {
    await audit.auth(AuditLog.ACTIONS.AUTH_OTP_FAILED, userId, req, { reason: 'not_found', purpose }, 'failure');
    throw new AuthenticationError('OTP not found or already used. Please request a new one.');
  }

  // Check invalid states
  if (otpRecord.isInvalid()) {
    await audit.auth(AuditLog.ACTIONS.AUTH_OTP_FAILED, userId, req, {
      reason: otpRecord.isExpired() ? 'expired' : otpRecord.isUsed() ? 'already_used' : 'max_attempts',
      purpose,
    }, 'failure');
    throw new AuthenticationError('OTP is expired or invalid. Please request a new one.');
  }

  // Verify — uses timingSafeEqual internally (VULN-008 fix)
  const isValid = otpRecord.verify(otp);

  if (!isValid) {
    await repo.incrementOTPAttempts(otpRecord._id);
    await audit.auth(AuditLog.ACTIONS.AUTH_OTP_FAILED, userId, req, { reason: 'wrong_code', purpose }, 'failure');
    const remaining = config.otp.maxAttempts - (otpRecord.attempts + 1);
    throw new AuthenticationError(
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt(s) remaining.`
        : 'Too many incorrect attempts. Please request a new OTP.'
    );
  }

  // OTP valid — consume immediately (one-time use)
  await repo.consumeOTP(otpRecord._id);

  if (purpose === 'email_verification') {
    await repo.markUserVerified(userId);
  }

  await audit.auth(AuditLog.ACTIONS.AUTH_OTP_VERIFIED, userId, req, { purpose });

  const user = await repo.findUserByIdLean(userId);

  // Issue tokens now that user is verified
  const { accessToken, refreshToken } = await issueTokenPair(user, req);

  return { accessToken, refreshToken, user };
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function login({ email, password }, req) {
  const user = await repo.findUserByEmail(email);

  // Generic error — don't reveal whether email exists
  const genericError = new AuthenticationError('Invalid email or password');

  if (!user) {
    // Still do a dummy bcrypt compare to prevent timing-based email enumeration
    await bcrypt.compare(password, '$2a$12$dummyhashfortimingnormalization1234567');
    throw genericError;
  }

  if (user.isLocked()) {
    await audit.auth(AuditLog.ACTIONS.AUTH_LOGIN_FAILED, user._id, req, { reason: 'account_locked' }, 'failure');
    const lockMins = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new AuthenticationError(`Account is temporarily locked. Try again in ${lockMins} minutes.`);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    const updatedUser = await repo.findUserByEmail(email);
    if (updatedUser?.isLocked()) {
      await audit.auth(AuditLog.ACTIONS.AUTH_ACCOUNT_LOCKED, user._id, req, {}, 'warning');
    }
    await audit.auth(AuditLog.ACTIONS.AUTH_LOGIN_FAILED, user._id, req, { reason: 'wrong_password' }, 'failure');
    throw genericError;
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account has been deactivated. Contact support.');
  }

  if (!user.isVerified) {
    // Re-issue OTP for unverified users attempting to log in
    const { otp } = await issueOTP(user._id, 'email_verification');
    console.log(`[OTP-DEV] OTP issued for ${user?._id || userId} (masked): ${'*'.repeat(4)}${String(otp).slice(-2)}`);
    throw new AuthenticationError('Account not verified. A new OTP has been sent.');
  }

  // Reset lockout on successful login
  await user.resetLoginAttempts();

  const { accessToken, refreshToken } = await issueTokenPair(user, req);

  await audit.auth(AuditLog.ACTIONS.AUTH_LOGIN, user._id, req);

  return { accessToken, refreshToken, user };
}

// ─── Refresh Tokens ───────────────────────────────────────────────────────────

async function refreshTokens(rawRefreshToken, req) {
  const { verifyRefreshToken } = require('../../shared/utils/jwt');

  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AuthenticationError('Invalid refresh token — please log in again');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await repo.findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    throw new AuthenticationError('Refresh token not found');
  }

  // Token theft detection — reuse of a rotated token
  if (storedToken.isRevoked) {
    await repo.revokeTokenFamily(storedToken.family);
    await audit.auth(AuditLog.ACTIONS.AUTH_THEFT_DETECTED, storedToken.userId, req, {
      family: storedToken.family,
    }, 'warning');
    throw new AuthenticationError('Security alert: token reuse detected. All sessions revoked. Please log in again.');
  }

  if (!storedToken.isValid()) {
    throw new AuthenticationError('Refresh token expired — please log in again');
  }

  // Rotate: revoke old token, issue new pair in same family
  await repo.revokeRefreshToken(storedToken._id, 'rotation');

  const user = await repo.findUserByIdLean(storedToken.userId);
  if (!user || !user.isActive) throw new AuthenticationError('User account not found or inactive');

  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
    user, req, storedToken.family
  );

  await audit.auth(AuditLog.ACTIONS.AUTH_TOKEN_REFRESHED, user._id, req);

  return { accessToken, refreshToken: newRefreshToken };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logout(rawRefreshToken, userId, req) {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await repo.findRefreshTokenByHash(tokenHash);
    if (storedToken) {
      await repo.revokeRefreshToken(storedToken._id, 'logout');
    }
  }
  await audit.auth(AuditLog.ACTIONS.AUTH_LOGOUT, userId, req);
}

async function logoutAll(userId, req) {
  await repo.revokeAllUserTokens(userId);
  await audit.auth(AuditLog.ACTIONS.AUTH_LOGOUT, userId, req, { allDevices: true });
}

// ─── Forgot / Reset Password ──────────────────────────────────────────────────

async function forgotPassword({ email }, req) {
  const user = await repo.findUserByEmail(email);

  // Always respond identically — don't reveal if email exists
  const genericResponse = { message: 'If an account exists, a reset OTP has been sent.' };

  if (!user) return genericResponse;

  const { otp } = await issueOTP(user._id, 'password_reset');
  console.log(`[OTP-DEV] Password reset OTP for ${user._id}: ${'*'.repeat(4)}${otp.slice(-2)}`);

  await audit.auth(AuditLog.ACTIONS.AUTH_OTP_SENT, user._id, req, { purpose: 'password_reset' });

  return {
    ...genericResponse,
    userId: user._id,
    ...(config.isDevelopment && { _devOtp: otp }),
  };
}

async function resetPassword({ userId, otp, newPassword }, req) {
  // Verify OTP (reuse verifyOtp flow without issuing tokens)
  const otpRecord = await repo.findOTP(userId, 'password_reset');
  if (!otpRecord || otpRecord.isInvalid()) {
    throw new AuthenticationError('OTP is invalid or expired. Please request a new one.');
  }

  if (!otpRecord.verify(otp)) {
    await repo.incrementOTPAttempts(otpRecord._id);
    throw new AuthenticationError('Incorrect OTP.');
  }

  await repo.consumeOTP(otpRecord._id);

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  await repo.updateUserPassword(userId, hashedPassword);

  // Revoke all existing sessions after password reset
  await repo.revokeAllUserTokens(userId);

  await audit.auth(AuditLog.ACTIONS.AUTH_PASSWORD_RESET, userId, req);

  return { message: 'Password reset successfully. Please log in with your new password.' };
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

async function resendOtp({ userId, purpose }, req) {
  const user = await repo.findUserById(userId);
  if (!user) throw new NotFoundError('User');

  if (purpose === 'email_verification' && user.isVerified) {
    throw new ValidationError('Account is already verified');
  }

  const { otp } = await issueOTP(user._id, purpose);
  console.log(`[OTP-DEV] OTP issued for ${user?._id || userId} (masked): ${'*'.repeat(4)}${String(otp).slice(-2)}`);

  await audit.auth(AuditLog.ACTIONS.AUTH_OTP_SENT, userId, req, { purpose });

  return {
    message: 'OTP sent. Check your phone or email.',
    ...(config.isDevelopment && { _devOtp: otp }),
  };
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Issue a new OTP: generate → hash → upsert to DB.
 * Returns raw OTP for delivery (never stored).
 */
async function issueOTP(userId, purpose) {
  const rawOtp = generateOTP(6);
  const hashedOtp = OTPModel.hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);

  await repo.upsertOTP({ userId, hashedOtp, purpose, expiresAt });

  return { otp: rawOtp, expiresAt };
}

/**
 * Issue access + refresh token pair.
 * Stores hashed refresh token in DB.
 */
async function issueTokenPair(user, req, existingFamily = null) {
  const family = existingFamily || generateFamily();
  const rawRefreshToken = signRefreshToken({ userId: user._id, family });
  const tokenHash = hashToken(rawRefreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await repo.createRefreshToken({
    userId: user._id,
    tokenHash,
    family,
    userAgent: req?.headers?.['user-agent']?.slice(0, 500) || null,
    ipAddress: req?.ip || null,
    expiresAt,
  });

  const accessToken = signAccessToken({
    userId: user._id,
    role: user.role,
    isVerified: user.isVerified,
    parishId: user.parishId,
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

module.exports = {
  register,
  verifyOtp,
  login,
  refreshTokens,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  resendOtp,
};
