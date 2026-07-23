/**
 * User Model — Security-hardened
 *
 * Fixes applied:
 * VULN-001: Replaced ReDoS-vulnerable email regex with validator.js isEmail()
 * VULN-002: Strengthened phone validation with E.164 format + uniqueness constraint
 * VULN-003: comparePassword() guard against undefined password field
 * VULN-004: incrementLoginAttempts() rewritten as single atomic DB operation
 * VULN-005: Removed redundant refreshTokenHash field (managed by RefreshToken collection)
 * VULN-006: Added toObject transform alongside toJSON
 * VULN-007: Added password complexity enforcement via custom validator
 */

'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const ROLES = Object.freeze({
  USER: 'user',
  PARISH_ADMIN: 'parish_admin',
  SUPER_ADMIN: 'super_admin',
});

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;

const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 0,
};

const SENSITIVE_FIELDS = ['password', 'loginAttempts', 'lockUntil', '__v'];

function sanitizeOutput(ret) {
  SENSITIVE_FIELDS.forEach((f) => delete ret[f]);
  return ret;
}

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name must not exceed 50 characters'],
      validate: {
        validator: (v) => !/[<>'"`;]/.test(v),
        message: 'First name contains invalid characters',
      },
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name must not exceed 50 characters'],
      validate: {
        validator: (v) => !/[<>'"`;]/.test(v),
        message: 'Last name contains invalid characters',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: 'Please provide a valid email address',
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: (v) => /^\+[1-9]\d{6,14}$/.test(v),
message: 'Phone must be in E.164 format (e.g. +221771234567)',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      validate: {
        validator: function (v) {
          if (v && v.startsWith('$2')) return true; // already hashed
          return validator.isStrongPassword(v, PASSWORD_RULES);
        },
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number',
      },
    },
        favoris: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: [] }],
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: 'Invalid role: {VALUE}',
      },
      default: ROLES.USER,
    },
    parishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatarUrl: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          // Autorise precisement les images encodees en base64 (photo de profil fidele),
          // meme principe de securite que Parish.logoUrl/coverUrl.
          if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(v)) return true;
          if (/^(javascript:|data:|vbscript:)/i.test(v)) return false;
          return validator.isURL(v, { protocols: ['https', 'http'], require_protocol: true });
        },
        message: 'Avatar URL must be a valid HTTPS URL or base64-encoded image',
      },
    },
    followedParishes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
    }],
    notificationsEnabled: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
    }],
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastFidelesViewAt: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      min: [0, 'Login attempts cannot be negative'],
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { transform: (doc, ret) => sanitizeOutput(ret) },
    toObject: { transform: (doc, ret) => sanitizeOutput(ret) },
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ parishId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lockUntil: 1 }, { sparse: true });

userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password field not loaded. Query must use .select("+password")');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return User.findByIdAndUpdate(
      this._id,
      { $set: { loginAttempts: 1 }, $unset: { lockUntil: '' } },
      { new: true }
    );
  }
  const update = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
    update.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }
  return User.findByIdAndUpdate(this._id, update, { new: true });
};

userSchema.methods.resetLoginAttempts = function () {
  return User.findByIdAndUpdate(
    this._id,
    { $set: { loginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: '' } },
    { new: true }
  );
};

userSchema.statics.ROLES = ROLES;
userSchema.statics.MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS;

const User = mongoose.model('User', userSchema);

module.exports = User;
