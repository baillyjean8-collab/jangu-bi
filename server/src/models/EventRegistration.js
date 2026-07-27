'use strict';
const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  postId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nom:       { type: String, required: true, trim: true, maxlength: 120 },
  telephone: { type: String, required: true, trim: true, maxlength: 30 },
  statutPaiement: {
    type: String,
    enum: ['non_requis', 'en_attente', 'paye_ligne', 'paye_sur_place'],
    default: 'non_requis',
  },
}, { timestamps: true });

eventRegistrationSchema.index({ postId: 1, userId: 1 }, { unique: true });
eventRegistrationSchema.index({ postId: 1, createdAt: 1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);