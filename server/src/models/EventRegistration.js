'use strict';
const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  postId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nom:       { type: String, required: true, trim: true, maxlength: 120 },
  telephone: { type: String, required: true, trim: true, maxlength: 30 },
}, { timestamps: true });

// Une seule inscription par personne et par evenement.
eventRegistrationSchema.index({ postId: 1, userId: 1 }, { unique: true });
eventRegistrationSchema.index({ postId: 1, createdAt: 1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
