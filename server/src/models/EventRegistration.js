'use strict';
const mongoose = require('mongoose');

// Une inscription peut couvrir plusieurs personnes (ex: une famille qui
// s'inscrit ensemble a un pelerinage). Chaque participant a son propre nom,
// sa paroisse et sa tranche d'age.
const participantSchema = new mongoose.Schema({
  nom:       { type: String, required: true, trim: true, maxlength: 120 },
  parishId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', default: null },
  parishNom: { type: String, trim: true, maxlength: 120, default: '' },
  sexe: {
    type: String,
    enum: ['homme', 'femme'],
    required: true,
  },
  trancheAge: {
    type: String,
    enum: ['enfant', 'adolescent', 'adulte', 'senior'],
    required: true,
  },
}, { _id: false });

const eventRegistrationSchema = new mongoose.Schema({
  postId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  telephone: { type: String, required: true, trim: true, maxlength: 30 },
  participants: {
    type: [participantSchema],
    required: true,
    validate: {
      validator: function(v) { return Array.isArray(v) && v.length > 0 && v.length <= 20; },
      message: 'Il faut entre 1 et 20 participants par inscription.',
    },
  },
    statutPaiement: {
    type: String,
    enum: ['non_requis', 'en_attente', 'paye_ligne', 'paye_sur_place'],
    default: 'non_requis',
  },
  montantTotal: { type: Number, default: 0, min: 0 },
  provider: { type: String, default: null },
  providerTransactionId: { type: String, default: null, index: true },
}, { timestamps: true });

eventRegistrationSchema.index({ postId: 1, userId: 1 }, { unique: true });
eventRegistrationSchema.index({ postId: 1, createdAt: 1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
