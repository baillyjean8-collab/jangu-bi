/**
 * RefreshToken Model — Security-hardened
 *
 * Fixes applied:
 * VULN-022: Removed duplicate index. unique:true in field definition creates
 *   one index; the explicit index() call creates another. Kept only the explicit
 *   index with full options. Removed field-level unique:true.
 *
 * VULN-023: Added compound index {tokenHash, isRevoked, expiresAt} for fast
 *   token validation queries that check all three conditions simultaneously.
 *   Added separate cleanup mechanism for revoked tokens via a flag index.
 *
 * VULN-024: Added {family, isRevoked} compound index for efficient theft-detection
 *   queries that revoke an entire token family.
 */

'use strict';

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    // Store only the HMAC-SHA256 hash of the raw token (never the token itself)
    // VULN-022 FIX: removed duplicate unique:true here — enforced by index only
    tokenHash: {
      type: String,
      required: [true, 'tokenHash is required'],
      select: false,
      validate: {
        validator: (v) => /^[a-f0-9]{64}$/.test(v),
        message: 'tokenHash must be a SHA-256 hex string (64 chars)',
      },
    },
    // Token family: all refresh tokens issued in one session chain share a family.
    // If a revoked token from this family is used, ALL tokens in the family are revoked.
    family: {
      type: String,
      required: [true, 'Token family is required'],
      validate: {
        validator: (v) => /^[a-f0-9]{32}$/.test(v),
        message: 'family must be a 32-char hex string',
      },
    },
    userAgent: {
      type: String,
      default: null,
      maxlength: [500, 'User-Agent too long'],
    },
    ipAddress: {
      type: String,
      default: null,
      maxlength: [45, 'IP address too long'],
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      enum: {
        values: ['logout', 'rotation', 'theft_detected', 'admin_revoke', 'expired'],
        message: 'Invalid revocation reason: {VALUE}',
      },
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      validate: {
        validator: (v) => v > new Date(),
        message: 'expiresAt must be in the future',
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// TTL: auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// VULN-022 FIX: single unique index on tokenHash (no duplicate from field definition)
refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

// VULN-023 FIX: compound index for token validation query:
// db.refreshtokens.findOne({ tokenHash: X, isRevoked: false, expiresAt: { $gt: now } })
refreshTokenSchema.index({ tokenHash: 1, isRevoked: 1, expiresAt: 1 });

// userId for "list my sessions" and "revoke all sessions for user" operations
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

// VULN-024 FIX: compound index for theft detection — revoke entire token family
// db.refreshtokens.updateMany({ family: X }, { $set: { isRevoked: true } })
refreshTokenSchema.index({ family: 1, isRevoked: 1 });

// Index for admin cleanup of revoked tokens (background job can delete old revoked tokens)
refreshTokenSchema.index(
  { isRevoked: 1, revokedAt: 1 },
  {
    sparse: true,
    name: 'revoked_tokens_cleanup_idx',
  }
);

// ─── Instance Methods ─────────────────────────────────────────────────────────

refreshTokenSchema.methods.isValid = function () {
  return !this.isRevoked && this.expiresAt > new Date();
};

refreshTokenSchema.methods.revoke = async function (reason) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

// ─── Statics ──────────────────────────────────────────────────────────────────

/**
 * Revoke all tokens in a family (theft detection).
 * Called when a previously-used (rotated) token is presented again.
 */
refreshTokenSchema.statics.revokeFamily = async function (family, reason = 'theft_detected') {
  return this.updateMany(
    { family, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: reason } }
  );
};

/**
 * Revoke all active tokens for a user (logout all devices).
 */
refreshTokenSchema.statics.revokeAllForUser = async function (userId, reason = 'logout') {
  return this.updateMany(
    { userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: reason } }
  );
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
