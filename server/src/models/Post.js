'use strict';
const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});
const postSchema = new mongoose.Schema({
  parishId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  groupId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  visibility:{ type: String, enum: ['public', 'prive'], default: 'public' },
  content:   { type: String, required: true, maxlength: 2000 },
  imageUrl: { type: String, default: null },
imageUrls: { type: [String], default: [] },
  type:      { type: String, enum: ['NORMAL', 'ANNONCE', 'INSCRIPTION', 'COLLECTE', 'EVENEMENT', 'MEDIA'], default: 'NORMAL' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
sharesCount: { type: Number, default: 0, min: 0 },
  comments:  [commentSchema],
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('Post', postSchema);
