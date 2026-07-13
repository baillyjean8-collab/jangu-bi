'use strict';
const router = require('express').Router();
const crypto = require('crypto');
const config = require('../../config/env');
const { Invitation, ParishApplication, User, Parish } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../shared/utils/response');
const { NotFoundError, ValidationError } = require('../../shared/errors');

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// POST /invitations - le super_admin genere un lien d'invitation
router.post('/', authenticate, requireVerified, authorize('super_admin'), asyncHandler(async (req, res) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await Invitation.create({
    tokenHash,
    createdBy: req.user.userId,
    email: req.body.email || null,
    expiresAt,
  });

  const clientUrl = config.client.url;
  return sendSuccess(res, { url: clientUrl + '/inscription-paroisse?token=' + rawToken, expiresAt }, 'Invitation creee');
}));

// GET /invitations/:token - verifie la validite du lien (public)
router.get('/:token', asyncHandler(async (req, res) => {
  const tokenHash = hashToken(req.params.token);
  const invitation = await Invitation.findOne({ tokenHash });
  if (!invitation) throw new NotFoundError('Invitation');
  if (invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
    throw new ValidationError('Ce lien a expire ou a deja ete utilise');
  }
  return sendSuccess(res, { valid: true });
}));

// POST /invitations/:token/complete - soumission du formulaire (public)
router.post('/:token/complete', asyncHandler(async (req, res) => {
  const tokenHash = hashToken(req.params.token);
  const invitation = await Invitation.findOne({ tokenHash });
  if (!invitation) throw new NotFoundError('Invitation');
  if (invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
    throw new ValidationError('Ce lien a expire ou a deja ete utilise');
  }

  const {
    firstName, lastName, phone, fonction, email, password,
    parishName, diocese, city, country, address,
    identityDocUrl, functionDocUrl,
  } = req.body;

  if (!firstName || !lastName || !phone || !password) {
    throw new ValidationError('Informations personnelles incompletes');
  }
  if (!parishName || !city || !country) {
    throw new ValidationError('Informations de la paroisse incompletes');
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) throw new ValidationError('Un compte existe deja avec ce numero de telephone');

  const user = await User.create({
    firstName,
    lastName,
    email: email || (phone.replace(/[^0-9]/g, '') + '@jangubi.local'),
    phone,
    password,
    role: 'parish_admin',
    isVerified: true,
  });

  const parish = await Parish.create({
    name: parishName,
    diocese: diocese || null,
    denomination: 'Catholique',
    location: { country, city, address: address || null },
    adminId: user._id,
    isVerified: false,
  });

  await User.findByIdAndUpdate(user._id, { $set: { parishId: parish._id } });

  await ParishApplication.create({
    invitationId: invitation._id,
    userId: user._id,
    parishId: parish._id,
    fonction: fonction || null,
    identityDocUrl: identityDocUrl || null,
    functionDocUrl: functionDocUrl || null,
  });

  invitation.status = 'used';
  invitation.usedAt = new Date();
  await invitation.save();

  return sendSuccess(res, {
    message: 'Compte cree. Vous pouvez vous connecter des maintenant ; votre paroisse sera visible publiquement une fois verifiee.',
  }, 'Inscription reussie');
}));

module.exports = { router };
