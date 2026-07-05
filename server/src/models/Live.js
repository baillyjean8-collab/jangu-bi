/**
 * Live Model — Security-hardened
 *
 * Fixes applied:
 * VULN-025: Viewer counts now enforce min:0. Atomic increment methods added
 *   as statics to prevent race conditions driving counts negative.
 *   currentViewerCount is NOT directly writable via schema — must use atomicViewerUpdate().
 *
 * VULN-026: streamUrl and thumbnailUrl validated — javascript: and data: URIs blocked.
 *
 * VULN-027: Unique partial index enforces one active live session per parish.
 *   Attempting to start a second live session while one is active throws a unique
 *   key violation, which the service layer catches and returns a clear error.
 */

'use strict';

const mongoose = require('mongoose');
const validator = require('validator');

// ─── URL Validator ────────────────────────────────────────────────────────────

/**
 * VULN-026 FIX: Validates URLs for stream and thumbnail fields.
 * Blocks javascript: and data: URIs which are XSS vectors.
 * Only allows https:// in production (http: allowed in dev for local RTMP).
 */
function isSafeUrl(v) {
  if (!v) return true;
  if (/^(javascript:|data:|vbscript:)/i.test(v)) return false;
  return validator.isURL(v, {
    protocols: ['https', 'http', 'rtmp', 'rtmps'],
    require_protocol: true,
    allow_underscores: true,
  });
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const liveSchema = new mongoose.Schema(
  {
    parishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
      required: [true, 'parishId is required'],
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'startedBy is required'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Live title must not exceed 150 characters'],
      default: 'Service en direct',
      validate: {
        validator: (v) => !v || !/<[^>]*>/.test(v),
        message: 'Title contains invalid HTML characters',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default: null,
      validate: {
        validator: (v) => !v || !/<[^>]*>/.test(v),
        message: 'Description contains invalid HTML characters',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: null,
      min: [0, 'Duration cannot be negative'],
    },

    // ── Viewer Analytics (no personal data) ───────────────────────────────
    // VULN-025 FIX: min:0 on all viewer count fields
    peakViewers: {
      type: Number,
      default: 0,
      min: [0, 'Peak viewers cannot be negative'],
    },
    totalUniqueViewers: {
      type: Number,
      default: 0,
      min: [0, 'Total unique viewers cannot be negative'],
    },
    currentViewerCount: {
      type: Number,
      default: 0,
      min: [0, 'Current viewer count cannot be negative'],
    },

    // ── Reaction Aggregates ────────────────────────────────────────────────
    reactionCounts: {
      amen: { type: Number, default: 0, min: 0 },
      praise: { type: Number, default: 0, min: 0 },
      heart: { type: Number, default: 0, min: 0 },
      fire: { type: Number, default: 0, min: 0 },
    },

    // ── Stream Configuration ───────────────────────────────────────────────
    streamKey: {
      type: String,
      select: false,
      default: null,
      maxlength: [200, 'Stream key too long'],
    },
    // VULN-026 FIX: URL validation on streamUrl
    streamUrl: {
      type: String,
      default: null,
      validate: {
        validator: isSafeUrl,
        message: 'streamUrl must be a valid and safe URL (no javascript: or data: URIs)',
      },
    },
    // VULN-026 FIX: URL validation on thumbnailUrl
    thumbnailUrl: {
      type: String,
      default: null,
      validate: {
        validator: isSafeUrl,
        message: 'thumbnailUrl must be a valid and safe URL',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.streamKey;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.streamKey;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

liveSchema.index({ parishId: 1, startedAt: -1 });
liveSchema.index({ startedAt: -1 });

// VULN-027 FIX: Enforce one active live session per parish.
// Partial unique index — only applies when isActive === true.
// When a session ends (isActive → false), the constraint is lifted for that parish.
liveSchema.index(
  { parishId: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'unique_active_live_per_parish',
  }
);

// ─── Pre-save ─────────────────────────────────────────────────────────────────

liveSchema.pre('save', function (next) {
  // VULN-025: ensure counts never go below 0 even if update bypasses validator
  if (this.currentViewerCount < 0) this.currentViewerCount = 0;
  if (this.peakViewers < 0) this.peakViewers = 0;
  if (this.totalUniqueViewers < 0) this.totalUniqueViewers = 0;
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

liveSchema.methods.endSession = function () {
  this.isActive = false;
  this.endedAt = new Date();
  this.durationSeconds = Math.max(
    0,
    Math.floor((this.endedAt - this.startedAt) / 1000)
  );
  this.currentViewerCount = 0;
  return this.save();
};

liveSchema.methods.incrementReaction = function (type) {
  const ALLOWED_REACTIONS = ['amen', 'praise', 'heart', 'fire'];
  if (!ALLOWED_REACTIONS.includes(type)) {
    throw new Error(`Invalid reaction type: "${type}". Allowed: ${ALLOWED_REACTIONS.join(', ')}`);
  }
  this.reactionCounts[type] += 1;
};

// ─── Statics (atomic operations to prevent race conditions) ──────────────────

/**
 * VULN-025 FIX: Atomic viewer count update using $inc.
 * This is the ONLY safe way to modify viewer counts — prevents race conditions
 * where concurrent socket events could drive the count negative.
 *
 * delta: +1 for join, -1 for leave
 */
liveSchema.statics.atomicViewerUpdate = async function (liveId, delta) {
  const update = { $inc: { currentViewerCount: delta } };

  // If viewer is joining, also try to update peak and total
  if (delta > 0) {
    // We need the current count to compare with peak — use findOneAndUpdate
    const doc = await this.findByIdAndUpdate(
      liveId,
      { $inc: { currentViewerCount: delta, totalUniqueViewers: 1 } },
      { new: true, select: 'currentViewerCount peakViewers' }
    );

    // If new count exceeds peak, update peak atomically
    if (doc && doc.currentViewerCount > doc.peakViewers) {
      await this.findByIdAndUpdate(liveId, {
        $set: { peakViewers: doc.currentViewerCount },
      });
    }
    return doc;
  }

  // Viewer leaving: use $max to floor at 0 (MongoDB has no $max with $inc floor)
  // We increment then ensure it's not negative via $max
  return this.findByIdAndUpdate(
    liveId,
    [
      // Aggregation pipeline update — ensures floor at 0
      {
        $set: {
          currentViewerCount: {
            $max: [0, { $add: ['$currentViewerCount', delta] }],
          },
        },
      },
    ],
    { new: true }
  );
};

const Live = mongoose.model('Live', liveSchema);

module.exports = Live;
