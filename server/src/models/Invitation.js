'use strict';
const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, default: null },
  status: { type: String, enum: ['pending', 'used', 'expired'], default: 'pending' },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
}, { timestamps: true });

invitationSchema.index({ tokenHash: 1 }, { unique: true });

module.exports = mongoose.model('Invitation', invitationSchema);
