'use strict';

const mongoose = require('mongoose');
const validator = require('validator');

function isSafeGroupPhoto(v) {
  if (!v) return true;
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(v)) return true;
  if (/^(javascript:|data:|vbscript:)/i.test(v)) return false;
  return validator.isURL(v, { protocols: ['https', 'http'], require_protocol: true });
}

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [100, 'Group name must not exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default: null,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: isSafeGroupPhoto,
        message: 'Photo URL must be a valid HTTPS URL or base64-encoded image',
      },
    },
    parishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
      required: true,
    },
    type: {
      type: String,
      enum: ['public', 'prive'],
      default: 'public',
    },
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

groupSchema.index({ parishId: 1 });
groupSchema.index({ parishId: 1, isActive: 1 });

module.exports = mongoose.model('Group', groupSchema);
