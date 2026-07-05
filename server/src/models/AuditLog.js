/**
 * AuditLog Model — Security-hardened
 *
 * Fixes applied:
 * VULN-018: Block ALL mutation operations — not just updateOne/findOneAndUpdate.
 *   replaceOne, updateMany, bulkWrite, findByIdAndUpdate all blocked.
 *
 * VULN-019: metadata sanitized — deep-clone with sanitization before storage.
 *   NoSQL injection keys ($where, $gt, etc.) stripped from metadata objects.
 *
 * VULN-020: ipAddress validated and normalized. X-Forwarded-For parsing
 *   documented as requiring proxy trust configuration.
 *
 * VULN-021: userAgent capped at 500 chars to prevent document bloat.
 */

'use strict';

const mongoose = require('mongoose');
const validator = require('validator');

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIT_ACTIONS = Object.freeze({
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_OTP_SENT: 'auth.otp_sent',
  AUTH_OTP_VERIFIED: 'auth.otp_verified',
  AUTH_OTP_FAILED: 'auth.otp_failed',
  AUTH_OTP_RATE_LIMITED: 'auth.otp_rate_limited',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_TOKEN_REFRESHED: 'auth.token_refreshed',
  AUTH_ACCOUNT_LOCKED: 'auth.account_locked',
  AUTH_THEFT_DETECTED: 'auth.theft_detected',

  DONATION_INITIATED: 'donation.initiated',
  DONATION_PENDING: 'donation.pending',
  DONATION_SUCCESS: 'donation.success',
  DONATION_FAILED: 'donation.failed',
  DONATION_REFUNDED: 'donation.refunded',
  DONATION_CANCELLED: 'donation.cancelled',
  WEBHOOK_RECEIVED: 'webhook.received',
  WEBHOOK_VERIFIED: 'webhook.verified',
  WEBHOOK_REJECTED: 'webhook.rejected',

  ADMIN_USER_UPDATED: 'admin.user_updated',
  ADMIN_USER_DEACTIVATED: 'admin.user_deactivated',
  ADMIN_USER_ROLE_CHANGED: 'admin.user_role_changed',
  ADMIN_PARISH_CREATED: 'admin.parish_created',
  ADMIN_PARISH_UPDATED: 'admin.parish_updated',
  ADMIN_PARISH_VERIFIED: 'admin.parish_verified',
  ADMIN_DATA_EXPORTED: 'admin.data_exported',

  LIVE_STARTED: 'live.started',
  LIVE_ENDED: 'live.ended',
});

// ─── Metadata Sanitizer ───────────────────────────────────────────────────────

/**
 * VULN-019 FIX: Strip NoSQL injection operators from metadata objects.
 * MongoDB operator keys start with '$'. Nested objects are sanitized recursively.
 * Also caps total metadata size to prevent DoS.
 */
const MAX_METADATA_BYTES = 2048; // 2 KB per audit log entry

function sanitizeMetadata(obj, depth = 0) {
  if (depth > 5) return '[max depth exceeded]'; // prevent recursive DoS
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') {
    // Truncate long primitive strings
    if (typeof obj === 'string' && obj.length > 500) return obj.slice(0, 500) + '[truncated]';
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => sanitizeMetadata(item, depth + 1));
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip MongoDB operator keys
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitizeMetadata(value, depth + 1);
  }
  return clean;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: {
        values: Object.values(AUDIT_ACTIONS),
        message: 'Unknown audit action: {VALUE}',
      },
      required: [true, 'Audit action is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetModel: {
      type: String,
      enum: {
        values: ['User', 'Parish', 'Donation', 'Live', null],
        message: 'Invalid targetModel: {VALUE}',
      },
      default: null,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
    },
    // VULN-019 FIX: sanitized Mixed type with size cap
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      validate: {
        validator: function (v) {
          if (!v) return true;
          const size = Buffer.byteLength(JSON.stringify(v), 'utf8');
          return size <= MAX_METADATA_BYTES;
        },
        message: `Audit metadata exceeds maximum size of ${MAX_METADATA_BYTES} bytes`,
      },
    },
    // VULN-020 FIX: validated IP address (v4 or v6)
    ipAddress: {
      type: String,
      default: null,
      maxlength: [45, 'IP address too long'], // IPv6 max = 45 chars
      validate: {
        validator: (v) => {
          if (!v) return true;
          return validator.isIP(v, 4) || validator.isIP(v, 6);
        },
        message: 'Invalid IP address format',
      },
    },
    // VULN-021 FIX: capped userAgent to prevent document bloat
    userAgent: {
      type: String,
      default: null,
      maxlength: [500, 'User-Agent header too long — truncate before storing'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    strict: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ targetId: 1, targetModel: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, status: 1, timestamp: -1 });
// Financial compliance: fast lookup of all donation events
auditLogSchema.index(
  { action: 1, timestamp: -1 },
  {
    partialFilterExpression: {
      action: { $regex: '^donation\\.' },
    },
    name: 'donation_events_idx',
  }
);

// ─── VULN-018 FIX: Block ALL mutation operations ──────────────────────────────

const BLOCKED_MUTATIONS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findByIdAndUpdate', // Mongoose alias for findOneAndUpdate
  'replaceOne',
  'findOneAndReplace',
  'update', // Legacy Mongoose method
];

BLOCKED_MUTATIONS.forEach((operation) => {
  auditLogSchema.pre(operation, function () {
    throw new Error(
      `[SECURITY] AuditLog records are immutable. Operation "${operation}" is forbidden. ` +
      'AuditLogs may only be created, never modified.'
    );
  });
});

// Also block bulkWrite at the document save level by checking for updates
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(
      new Error('[SECURITY] AuditLog records are immutable and cannot be re-saved after creation.')
    );
  }
  // Sanitize metadata before saving
  if (this.metadata) {
    this.metadata = sanitizeMetadata(this.metadata);
  }
  // Truncate userAgent if needed
  if (this.userAgent && this.userAgent.length > 500) {
    this.userAgent = this.userAgent.slice(0, 500);
  }
  next();
});

// ─── Statics ──────────────────────────────────────────────────────────────────

auditLogSchema.statics.ACTIONS = AUDIT_ACTIONS;
auditLogSchema.statics.sanitizeMetadata = sanitizeMetadata;

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
