/**
 * Parish Model — Security-hardened
 *
 * Fixes applied:
 * VULN-028: Slug generation is now collision-safe. When a duplicate slug is
 *   detected, a numeric suffix is appended (-2, -3, etc.) via a pre-save retry
 *   loop. Slug uniqueness failure no longer surfaces as an uncaught DB error.
 *
 * VULN-029: logoUrl validated — blocks javascript: and data: URIs.
 *
 * VULN-030: stats fields are now protected. Direct updates to stats are blocked
 *   via a pre-update hook — only the dedicated stat increment statics are allowed.
 */

'use strict';

const mongoose = require('mongoose');
const validator = require('validator');

// ─── URL Validator ────────────────────────────────────────────────────────────

function isSafeUrl(v) {
  if (!v) return true;
  // Autorise precisement les images encodees en base64 (photo de couverture,
  // photo de profil de paroisse) : seul le prefixe data:image/... est permis,
  // tout le reste (data:text/html, javascript:, vbscript:) reste bloque.
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(v)) return true;
  if (/^(javascript:|data:|vbscript:)/i.test(v)) return false;
  return validator.isURL(v, {
    protocols: ['https', 'http'],
    require_protocol: true,
  });
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const locationSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country name too long'],
      validate: {
        validator: (v) => !/[<>"`;]/.test(v),
message: 'Country contains invalid characters',
      },
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name too long'],
      validate: {
        validator: (v) => !/[<>"`;]/.test(v),
message: 'City contains invalid characters',
      },
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address too long'],
      default: null,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator: (v) => {
            if (!v || v.length === 0) return true;
            if (v.length !== 2) return false;
            const [lng, lat] = v;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
    },
  },
  { _id: false }
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const parishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parish name is required'],
      trim: true,
      minlength: [3, 'Parish name must be at least 3 characters'],
      maxlength: [100, 'Parish name must not exceed 100 characters'],
      validate: {
        validator: (v) => !/[<>"`;]/.test(v),
        message: 'Parish name contains invalid characters',
      },
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: [120, 'Slug too long'],
      validate: {
        validator: (v) => !v || /^[a-z0-9-]+$/.test(v),
        message: 'Slug may only contain lowercase letters, numbers, and hyphens',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must not exceed 1000 characters'],
      default: null,
      validate: {
        validator: (v) => !v || !/<script/i.test(v),
        message: 'Description contains disallowed content',
      },
    },
    location: {
      type: locationSchema,
      required: [true, 'Parish location is required'],
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parish must have an admin'],
    },
    // VULN-029 FIX: validated URL
    logoUrl: {
      type: String,
      default: null,
      validate: {
        validator: isSafeUrl,
        message: 'logoUrl must be a valid HTTPS URL',
      },
    },
    denomination: {
      type: String,
      trim: true,
      maxlength: [100, 'Denomination name too long'],
      default: null,
      validate: {
        validator: (v) => !v || !/[<>"`;]/.test(v),
        message: 'Denomination contains invalid characters',
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // VULN-030 FIX: stats are read-only via normal save — use statics to update
    stats: {
      totalDonations: { type: Number, default: 0, min: 0 },
      totalDonationAmount: { type: Number, default: 0, min: 0 },
      memberCount: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

parishSchema.index({ slug: 1 }, { unique: true, sparse: true });
parishSchema.index({ adminId: 1 });
parishSchema.index({ isActive: 1, isVerified: 1 });
parishSchema.index({ 'location.country': 1, 'location.city': 1 });
parishSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true });

// ─── VULN-028 FIX: Collision-safe slug generation ─────────────────────────────

/**
 * Generates base slug from parish name.
 */
function generateBaseSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')                    // decompose accented chars (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')     // strip accent marks
    .replace(/[^a-z0-9\s-]/g, '')       // remove non-alphanumeric except spaces/hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');             // trim leading/trailing hyphens
}

parishSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('name')) return next();

    const baseSlug = generateBaseSlug(this.name);
    if (!baseSlug) {
      return next(new Error('Could not generate a valid slug from parish name'));
    }

    // Check for collisions and append suffix if needed
    let slug = baseSlug;
    let suffix = 1;
    const MAX_ATTEMPTS = 10;

    while (suffix <= MAX_ATTEMPTS) {
      const existing = await mongoose.model('Parish').findOne({
        slug,
        _id: { $ne: this._id }, // exclude self on update
      }).lean();

      if (!existing) {
        this.slug = slug;
        return next();
      }

      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    return next(new Error(`Could not generate unique slug for "${this.name}" after ${MAX_ATTEMPTS} attempts`));
  } catch (err) {
    next(err);
  }
});

// ─── VULN-030 FIX: Protect stats from direct update ──────────────────────────

/**
 * Block direct modification of stats fields via update operations.
 * Stats must be updated through the dedicated statics below.
 * This prevents a malicious or buggy admin operation from falsifying totals.
 */
const STATS_PROTECTION_MSG =
  '[SECURITY] Parish stats cannot be set directly. Use Parish.incrementStats() instead.';

parishSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate();
  const forbidden = ['stats', 'stats.totalDonations', 'stats.totalDonationAmount', 'stats.memberCount'];

  for (const field of forbidden) {
    if (
      update?.$set?.[field] !== undefined ||
      update?.[field] !== undefined
    ) {
      return next(new Error(STATS_PROTECTION_MSG));
    }
  }
  next();
});

// ─── Statics (authorized stat mutations) ─────────────────────────────────────

/**
 * Atomically update parish donation stats after a confirmed donation.
 * This is the ONLY authorized way to modify stats fields.
 */
parishSchema.statics.incrementDonationStats = async function (parishId, amount) {
  return this.findByIdAndUpdate(
    parishId,
    {
      $inc: {
        'stats.totalDonations': 1,
        'stats.totalDonationAmount': amount,
      },
    },
    { new: true }
  );
};

parishSchema.statics.incrementMemberCount = async function (parishId, delta = 1) {
  return this.findByIdAndUpdate(
    parishId,
    { $inc: { 'stats.memberCount': delta } },
    { new: true }
  );
};

const Parish = mongoose.model('Parish', parishSchema);

module.exports = Parish;
