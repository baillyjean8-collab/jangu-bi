'use strict';
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  parishId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  type:        { type: String, enum: ['messe', 'program'], required: true },
  title:       { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000, default: '' },
  date:        { type: Date, default: null },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);