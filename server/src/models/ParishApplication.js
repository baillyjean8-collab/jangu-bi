'use strict';
const mongoose = require('mongoose');

function isSafeDoc(v) {
  if (!v) return true;
  return /^data:(image\/(jpeg|jpg|png|webp|gif)|application\/pdf);base64,/i.test(v);
}

const parishApplicationSchema = new mongoose.Schema({
  invitationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invitation', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  fonction: { type: String, trim: true, maxlength: 100, default: null },
  identityDocUrl: {
    type: String,
    default: null,
    validate: { validator: isSafeDoc, message: 'Document justificatif invalide' },
  },
  functionDocUrl: {
    type: String,
    default: null,
    validate: { validator: isSafeDoc, message: 'Document justificatif invalide' },
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null, maxlength: 500 },
}, { timestamps: true });

parishApplicationSchema.index({ status: 1 });

module.exports = mongoose.model('ParishApplication', parishApplicationSchema);
