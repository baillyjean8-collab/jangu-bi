'use strict';
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderType:     { type: String, enum: ['user', 'parish'], required: true },
  text:           { type: String, maxlength: 2000, default: '' },
  fileUrl:        { type: String, default: null },
  fileType:       { type: String, enum: ['image', 'document', null], default: null },
  fileName:       { type: String, default: null },
  readAt:         { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);