'use strict';
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  parishId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  type: { type: String, enum: ['messe', 'catechese', 'reunion', 'evenement', 'don', 'loisir'], required: true },
lieu: { type: String, maxlength: 200, default: null },
places: { type: String, maxlength: 100, default: null },
  title:       { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000, default: '' },
  date:        { type: Date, default: null },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);