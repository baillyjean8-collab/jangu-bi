'use strict';

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [100, 'Group name must not exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default: null,
    },
    parishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
      required: true,
    },
    type: {
      type: String,
      enum: ['public', 'prive'],
      default: 'public',
    },
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

groupSchema.index({ parishId: 1 });
groupSchema.index({ parishId: 1, isActive: 1 });

module.exports = mongoose.model('Group', groupSchema);
