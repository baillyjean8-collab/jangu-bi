'use strict';
const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  parishId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  imageUrl:  { type: String, required: true },
  caption:   { type: String, maxlength: 300, default: '' },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

// Auto-expire after 24h
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);