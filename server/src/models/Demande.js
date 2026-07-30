'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const demandeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  parishId: { type: Schema.Types.ObjectId, ref: 'Parish', required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: ['messe', 'bapteme', 'mariage', 'confirm', 'communion', 'sepulture', 'parrain', 'transfert', 'rdv'],
  },
  titre: { type: String, required: true },
  statut: { type: String, enum: ['en_attente', 'validee', 'rejetee'], default: 'en_attente' },
  montant: { type: Number, default: 0 },
  reference: { type: String, required: true, unique: true },
  pourQui: { type: String, enum: ['moi', 'autre'], default: 'moi' },
  nomBeneficiaire: { type: String, default: '' },
  lienParente: { type: String, default: '' },
  telephoneContact: { type: String, default: '' },
  paroisseConcernee: { type: String, default: '' },
  pretreOfficiant: { type: String, default: '' },
  dateEvenement: { type: Date, default: null },
  intentionMesse: { type: String, default: '' },
  momentMesse: { type: String, default: '' },
  rdvMotif: { type: String, default: '' },
  rdvMessage: { type: String, default: '' },
  dateTraitement: { type: Date, default: null },
  noteAdmin: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Demande', demandeSchema);
