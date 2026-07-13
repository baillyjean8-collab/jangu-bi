'use strict';
const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  groupId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, maxlength: 2000, default: '' },
  fileUrl:  { type: String, default: null },
  fileType: { type: String, enum: ['image', 'video', 'document', null], default: null },
  fileName: { type: String, default: null, maxlength: 200 },
}, { timestamps: true });

groupMessageSchema.index({ groupId: 1, createdAt: 1 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
