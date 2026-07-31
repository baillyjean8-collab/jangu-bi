'use strict';

const router = require('express').Router();
const { Demande, Parish } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../../shared/errors');

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
  async listForParish(parishId) {
    return Demande.find({ parishId }).populate('userId', 'firstName lastName phone').sort({ createdAt: -1 }).lean();
  },
  async listAll() {
    return Demande.find({}).populate('userId', 'firstName lastName phone').sort({ createdAt: -1 }).lean();
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
    if (!req.user.parishId) {
      throw new ValidationError('Vous devez être rattaché à une paroisse pour faire une demande');
    }

    // La demande doit etre visible par la paroisse SELECTIONNEE dans le
    // formulaire (ex : la paroisse de son bapteme), pas forcement par la
    // paroisse d'appartenance actuelle du fidele. On resout donc d'abord
    // le nom saisi/choisi vers la vraie paroisse en base ; si aucune
    // correspondance exacte n'est trouvee (texte libre, faute de frappe),
    // on retombe sur la paroisse d'appartenance du fidele par securite.
    let parishIdCible = req.user.parishId;
    if (paroisseConcernee && String(paroisseConcernee).trim()) {
      const paroisseTrouvee = await Parish.findOne({ name: String(paroisseConcernee).trim() }).select('_id').lean();
      if (paroisseTrouvee) parishIdCible = paroisseTrouvee._id;
    }

        const demande = await demandeRepo.create({
      userId: req.user.userId,
      parishId: parishIdCible,
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

    try {
      const io = req.app.get('io');
      if (io && io.broadcastAdminNotif) {
        io.broadcastAdminNotif(String(parishIdCible), {
          type: 'demande',
          titre: 'Nouvelle demande reçue',
          message: titre,
          demandeId: demande._id,
        });
      }
    } catch (e) { /* une notification ratee ne doit jamais bloquer la demande */ }

    return sendCreated(res, { demande }, 'Demande envoyee');
  },

  async listMine(req, res) {
    const demandes = await demandeRepo.listMine(req.user.userId);
    return sendSuccess(res, { demandes });
  },

  async listForAdmin(req, res) {
    const demandes = req.user.role === 'super_admin'
      ? await demandeRepo.listAll()
      : await demandeRepo.listForParish(req.user.parishId);
    return sendSuccess(res, { demandes });
  },

  async updateStatut(req, res) {
    const demande = await demandeRepo.findById(req.params.id);
    if (!demande) throw new NotFoundError('Demande');
    if (req.user.role !== 'super_admin' && String(demande.parishId) !== String(req.user.parishId)) {
      throw new AuthorizationError('Not your parish request');
    }
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

    async remove(req, res) {
    const demande = await demandeRepo.findById(req.params.id);
    if (!demande) throw new NotFoundError('Demande');

    const estProprietaire = String(demande.userId) === String(req.user.userId);
    const estAdminDeSaParoisse = req.user.role !== 'super_admin' && String(demande.parishId) === String(req.user.parishId);
    const estSuperAdmin = req.user.role === 'super_admin';

    if (estProprietaire) {
      if (demande.statut === 'validee') {
        throw new AuthorizationError('Impossible de supprimer une demande deja validee');
      }
    } else if (!estAdminDeSaParoisse && !estSuperAdmin) {
      throw new AuthorizationError('Not your parish request');
    }

    await demande.deleteOne();
    return sendSuccess(res, {}, 'Demande supprimee');
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

router.get('/',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(demandeController.listForAdmin)
);

router.patch('/:id/statut',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(demandeController.updateStatut)
);

router.delete('/:id',
  authenticate, requireVerified,
  asyncHandler(demandeController.remove)
);

module.exports = { router, demandeRepo };

