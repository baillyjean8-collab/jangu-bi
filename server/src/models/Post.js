'use strict';
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  parishId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  content:   { type: String, required: true, maxlength: 2000 },
  imageUrl:  { type: String, default: null },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:  [commentSchema],
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);