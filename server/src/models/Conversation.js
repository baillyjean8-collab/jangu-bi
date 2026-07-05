'use strict';
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parishId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadUser:   { type: Number, default: 0 },
  unreadParish: { type: Number, default: 0 },
}, { timestamps: true });

// Une seule conversation par utilisateur/paroisse
conversationSchema.index({ userId: 1, parishId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);