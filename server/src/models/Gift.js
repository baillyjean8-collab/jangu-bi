/**
 * Gift Model
 *
 * Un document par cadeau envoye pendant un direct. C'est la source de
 * verite pour le recap apres-live (montant total, liste des donateurs)
 * et pour la comptabilite paroisse (part 60/40).
 *
 * Tous les champs financiers/identite sont immutables et snapshotes au
 * moment de l'envoi : si le catalogue de cadeaux change de prix plus tard,
 * ou si l'expediteur change de nom, l'historique reste exact.
 */

'use strict';

const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema(
  {
    liveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Live',
      required: true,
      immutable: true,
    },
    parishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
      required: true,
      immutable: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    // Snapshot du nom au moment de l'envoi (l'admin voit le vrai nom sur le
    // recap ; les autres fideles ne voient jamais l'identite du donateur).
    senderNameSnapshot: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      immutable: true,
    },

    // ── Snapshot du cadeau (catalogue serveur, jamais le client) ──────────
    giftCode: { type: Number, required: true, immutable: true },
    giftName: { type: String, required: true, trim: true, maxlength: 60, immutable: true },
    emoji: { type: String, required: true, maxlength: 8, immutable: true },

    // ── Financier (francs CFA, entiers) ───────────────────────────────────
    amount: {
      type: Number,
      required: true,
      immutable: true,
      min: [1, 'Gift amount must be positive'],
      validate: { validator: Number.isInteger, message: 'amount must be an integer' },
    },
    parishShare: {
      type: Number,
      required: true,
      immutable: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'parishShare must be an integer' },
    },
    platformShare: {
      type: Number,
      required: true,
      immutable: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'platformShare must be an integer' },
    },
  },
  { timestamps: true }
);

giftSchema.index({ liveId: 1, createdAt: -1 });
giftSchema.index({ senderId: 1, createdAt: -1 });
giftSchema.index({ parishId: 1, createdAt: -1 });

const Gift = mongoose.model('Gift', giftSchema);

module.exports = Gift;
