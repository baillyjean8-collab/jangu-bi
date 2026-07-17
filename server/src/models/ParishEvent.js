'use strict';
const mongoose = require('mongoose');

const parishEventSchema = new mongoose.Schema({
  parishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  date: { type: Date, required: true },
  description: { type: String, trim: true, maxlength: 500, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('ParishEvent', parishEventSchema);
