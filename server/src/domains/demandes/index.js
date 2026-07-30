'use strict';

const router = require('express').Router();
const { Demande } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError, ValidationError } = require('../../shared/errors');

function genererReference() {
  return 'DEM-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

const demandeRepo = {
  async create(data) {
    return Demande.create(Object.assign({ reference: genererReference() }, data));
  },
  async listMine(userId) {
    return Demande.find({ userId }).sort({ createdAt: -1 }).lean();
  },
  async findById(id) {
    return Demande.findById(id);
  },
};

const demandeController = {
  async create(req, res) {
    const {
      type, titre, montant, pourQui, nomBeneficiaire, lienParente, telephoneContact,
      paroisseConcernee, pretreOfficiant, dateEvenement, intentionMesse, momentMesse,
      rdvMotif, rdvMessage,
    } = req.body;

    if (!type || !titre) {
      throw new ValidationError('Type et titre de la demande requis');
    }

    const demande = await demandeRepo.create({
      userId: req.user.userId,
      type, titre,
      montant: montant != null ? Number(montant) : 0,
      pourQui: pourQui || 'moi',
      nomBeneficiaire: nomBeneficiaire || '',
      lienParente: lienParente || '',
      telephoneContact: telephoneContact || '',
      paroisseConcernee: paroisseConcernee || '',
      pretreOfficiant: pretreOfficiant || '',
      dateEvenement: dateEvenement ? new Date(dateEvenement) : null,
      intentionMesse: intentionMesse || '',
      momentMesse: momentMesse || '',
      rdvMotif: rdvMotif || '',
      rdvMessage: rdvMessage || '',
    });

    return sendCreated(res, { demande }, 'Demande envoyee');
  },

  async listMine(req, res) {
    const demandes = await demandeRepo.listMine(req.user.userId);
    return sendSuccess(res, { demandes });
  },

    async updateStatut(req, res) {
    const demande = await demandeRepo.findById(req.params.id);
    if (!demande) throw new NotFoundError('Demande');
    const statutsValides = ['en_attente', 'validee', 'rejetee'];
    if (!statutsValides.includes(req.body.statut)) {
      throw new ValidationError('Statut invalide');
    }
    if (req.body.statut === 'rejetee' && (!req.body.noteAdmin || !String(req.body.noteAdmin).trim())) {
      throw new ValidationError('Le motif du rejet est requis');
    }
    demande.statut = req.body.statut;
    demande.dateTraitement = req.body.statut !== 'en_attente' ? new Date() : null;
    if (req.body.noteAdmin !== undefined) demande.noteAdmin = req.body.noteAdmin;
    await demande.save();
    return sendSuccess(res, { demande }, 'Statut mis a jour');
  },
};

router.post('/',
  authenticate, requireVerified,
  asyncHandler(demandeController.create)
);

router.get('/mes-demandes',
  authenticate, requireVerified,
  asyncHandler(demandeController.listMine)
);

router.patch('/:id/statut',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(demandeController.updateStatut)
);

module.exports = { router, demandeRepo };
