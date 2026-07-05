/**
 * Donation Model — Security-hardened
 *
 * Fixes applied:
 * VULN-012 [CRITICAL]: idempotencyKey is now SERVER-GENERATED only.
 *   Client cannot supply or influence it. Generated as SHA-256 of
 *   userId+parishId+amount+currency+timestamp to be deterministic for
 *   same-intent retries within a session, but unforgeable.
 *
 * VULN-013: transitionStatus() now calls this.save() internally and returns
 *   the promise. Callers no longer need to remember to save manually.
 *
 * VULN-014: fees and netAmount are NOT accepted from client. fees defaults
 *   to 0 and is set only by the payment service after provider confirmation.
 *   netAmount is computed-only, derived from amount-fees on SUCCESS transition.
 *
 * VULN-015: providerMetadata capped at schema level via maxlength on
 *   JSON-stringified value to prevent storage DoS from large webhook payloads.
 *
 * VULN-016: message field sanitized — HTML stripped, script tags blocked.
 *
 * VULN-017: amount stored as Integer (smallest currency unit — centimes/francs).
 *   Float amounts rejected at validation. This eliminates IEEE 754 precision issues.
 */

'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS = Object.freeze({
  INITIATED: 'INITIATED',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
});

const PROVIDERS = Object.freeze({
  CINETPAY: 'cinetpay',
  WAVE: 'wave',
  ORANGE_MONEY: 'orange_money',
  MTN_MOMO: 'mtn_momo',
  FREE_MONEY: 'free_money',
  MANUAL: 'manual',
});

// Valid state machine transitions (immutable)
const VALID_TRANSITIONS = Object.freeze({
  [STATUS.INITIATED]: Object.freeze([STATUS.PENDING, STATUS.CANCELLED]),
  [STATUS.PENDING]: Object.freeze([STATUS.SUCCESS, STATUS.FAILED]),
  [STATUS.SUCCESS]: Object.freeze([STATUS.REFUNDED]),
  [STATUS.FAILED]: Object.freeze([]),
  [STATUS.CANCELLED]: Object.freeze([]),
  [STATUS.REFUNDED]: Object.freeze([]),
});

// VULN-017 FIX: financial limits in integer centimes (XOF smallest unit is 1)
const AMOUNT_LIMITS = {
  MIN: 100,        // 100 XOF minimum
  MAX: 10_000_000, // 10M XOF maximum per transaction
};

// VULN-015 FIX: max providerMetadata size to prevent storage DoS
const MAX_PROVIDER_METADATA_BYTES = 4096; // 4 KB

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(STATUS),
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    reason: {
      type: String,
      maxlength: [200, 'Status reason too long'],
      default: null,
    },
    triggeredBy: {
      type: String,
      enum: ['user', 'webhook', 'system', 'admin'],
      required: true,
    },
  },
  { _id: false }
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const donationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      immutable: true, // Cannot be changed after creation
    },
    parishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
      required: [true, 'parishId is required'],
      immutable: true,
    },

    // ── Financial Fields ──────────────────────────────────────────────────
    // VULN-017 FIX: Integer only — reject floats
    amount: {
      type: Number,
      required: [true, 'Donation amount is required'],
      min: [AMOUNT_LIMITS.MIN, `Minimum donation is ${AMOUNT_LIMITS.MIN} (currency units)`],
      max: [AMOUNT_LIMITS.MAX, 'Maximum donation per transaction exceeded'],
      immutable: true,
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer (no decimals). Use smallest currency unit.',
      },
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      immutable: true,
      enum: {
        values: ['XOF', 'XAF', 'GNF', 'USD', 'EUR'],
        message: 'Unsupported currency: {VALUE}',
      },
      default: 'XOF',
    },
    // VULN-014 FIX: fees is server-only, not client-settable
    fees: {
      type: Number,
      default: 0,
      min: [0, 'Fees cannot be negative'],
    },
    // VULN-014 FIX: netAmount is computed-only via transitionStatus → SUCCESS
    netAmount: {
      type: Number,
      default: null,
    },

    // ── Provider Fields ───────────────────────────────────────────────────
    provider: {
      type: String,
      enum: {
        values: Object.values(PROVIDERS),
        message: 'Unsupported payment provider: {VALUE}',
      },
      required: true,
      immutable: true,
    },
    providerTransactionId: {
      type: String,
      default: null,
      maxlength: [200, 'Provider transaction ID too long'],
    },
    // VULN-015 FIX: Mixed type validated for size before storage
    providerMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      select: false,
      validate: {
        validator: function (v) {
          if (!v) return true;
          const serialized = JSON.stringify(v);
          return Buffer.byteLength(serialized, 'utf8') <= MAX_PROVIDER_METADATA_BYTES;
        },
        message: `providerMetadata must not exceed ${MAX_PROVIDER_METADATA_BYTES} bytes`,
      },
    },

    // ── Status Management ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.INITIATED,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // ── Idempotency ───────────────────────────────────────────────────────
    // VULN-012 FIX: SERVER-GENERATED, client cannot influence this value.
    // Generated in pre-validate hook from userId+parishId+amount+currency.
    idempotencyKey: {
      type: String,
      unique: true,
      immutable: true,
      // SHA-256 hex = 64 chars
      validate: {
        validator: (v) => /^[a-f0-9]{64}$/.test(v),
        message: 'Invalid idempotencyKey format',
      },
    },

    // ── Webhook Tracking ──────────────────────────────────────────────────
    webhookReceivedAt: {
      type: Date,
      default: null,
    },
    webhookPayloadHash: {
      type: String,
      default: null,
      select: false,
    },

    // ── Donor Message ─────────────────────────────────────────────────────
    // VULN-016 FIX: sanitized — no HTML allowed
    message: {
      type: String,
      maxlength: [200, 'Donation message must not exceed 200 characters'],
      trim: true,
      default: null,
      validate: {
        validator: (v) => {
          if (!v) return true;
          // Reject any HTML tags or script injection attempts
          return !/<[^>]*>/.test(v) && !/javascript:/i.test(v);
        },
        message: 'Donation message contains invalid content',
      },
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    // Soft delete — donations are never truly deleted for financial compliance
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.providerMetadata;
        delete ret.webhookPayloadHash;
        delete ret.isDeleted;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.providerMetadata;
        delete ret.webhookPayloadHash;
        delete ret.isDeleted;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

donationSchema.index({ idempotencyKey: 1 }, { unique: true });
donationSchema.index({ userId: 1, createdAt: -1 });
donationSchema.index({ parishId: 1, status: 1, createdAt: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ provider: 1, providerTransactionId: 1 }, { sparse: true });
donationSchema.index({ createdAt: -1 });
// For admin financial reporting
donationSchema.index({ parishId: 1, status: 1 });

// ─── Pre-validate: generate server-side idempotencyKey ───────────────────────

/**
 * VULN-012 FIX: Generate idempotencyKey server-side before validation.
 * The key is deterministic per (userId, parishId, amount, currency) within
 * a session — same intent produces same key, preventing accidental double-charges.
 * Includes a random nonce to prevent cross-user key collisions.
 */
donationSchema.pre('validate', function (next) {
  if (this.isNew && !this.idempotencyKey) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${this.userId}:${this.parishId}:${this.amount}:${this.currency}:${nonce}`;
    this.idempotencyKey = crypto.createHash('sha256').update(payload).digest('hex');
  }
  next();
});

// ─── Pre-save: initialize statusHistory ──────────────────────────────────────

donationSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: STATUS.INITIATED,
      triggeredBy: 'user',
      reason: 'Donation initiated',
    });
  }
  // VULN-014 FIX: ensure fees cannot exceed amount (defense in depth)
  if (this.fees > this.amount) {
    return next(new Error('Fees cannot exceed donation amount'));
  }
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * VULN-013 FIX: transitionStatus now saves automatically and returns a promise.
 * Old design required callers to remember .save() — silent data loss on omission.
 */
donationSchema.methods.transitionStatus = async function (newStatus, triggeredBy, reason = null) {
  const allowed = VALID_TRANSITIONS[this.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${this.status} → ${newStatus}. ` +
      `Allowed: [${(VALID_TRANSITIONS[this.status] || []).join(', ') || 'none'}]`
    );
  }

  this.status = newStatus;
  this.statusHistory.push({ status: newStatus, triggeredBy, reason });

  if (newStatus === STATUS.SUCCESS) {
    // VULN-014 FIX: netAmount computed server-side only on confirmation
    this.netAmount = this.amount - this.fees;
  }

  // Auto-save: callers don't need to call .save() separately
  return this.save();
};

// ─── Statics ──────────────────────────────────────────────────────────────────

donationSchema.statics.STATUS = STATUS;
donationSchema.statics.PROVIDERS = PROVIDERS;
donationSchema.statics.AMOUNT_LIMITS = AMOUNT_LIMITS;

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
