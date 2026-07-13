'use strict';
const router = require('express').Router();
const { Group, Post, GroupMessage } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../shared/utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../../shared/errors');

async function chargerGroupeOuErreur(id) {
  const group = await Group.findById(id);
  if (!group) throw new NotFoundError('Groupe');
  return group;
}

function peutGerer(req, group) {
  const isAdmin = (req.user.role === 'parish_admin' || req.user.role === 'super_admin') &&
    String(req.user.parishId) === String(group.parishId);
  const isModerateur = group.moderatorId && String(group.moderatorId) === String(req.user.userId);
  return isAdmin || isModerateur;
}

function estMembreDuGroupe(req, group) {
  if (peutGerer(req, group)) return true;
  return (group.members || []).some(function(m) { return String(m) === String(req.user.userId); });
}

// GET /groups/:id - infos du groupe + droits de l'utilisateur courant
router.get('/:id', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('moderatorId', 'firstName lastName')
    .lean();
  if (!group) throw new NotFoundError('Groupe');

  const isModerateur = group.moderatorId && String(group.moderatorId._id) === String(req.user.userId);
  const isAdmin = (req.user.role === 'parish_admin' || req.user.role === 'super_admin') &&
    String(req.user.parishId) === String(group.parishId);
  const isMembre = (group.members || []).some(function(m) { return String(m) === String(req.user.userId); });

  return sendSuccess(res, {
    group: Object.assign({}, group, { memberCount: (group.members || []).length }),
    peutGerer: isModerateur || isAdmin,
    estMembre: isMembre || isModerateur || isAdmin,
  });
}));

// GET /groups/:id/posts - fil du groupe
router.get('/:id/posts', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const group = await chargerGroupeOuErreur(req.params.id);
  const gestionnaire = peutGerer(req, group);
  const filter = { groupId: group._id, isActive: true };
  if (!gestionnaire) filter.visibility = 'public';
  const posts = await Post.find(filter)
    .populate('comments.userId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();
  return sendSuccess(res, posts);
}));

// POST /groups/:id/posts - publier dans le groupe (moderateur ou admin uniquement)
router.post('/:id/posts', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const group = await chargerGroupeOuErreur(req.params.id);
  if (!peutGerer(req, group)) throw new AuthorizationError('Seul le moderateur ou l administrateur peut publier dans ce groupe');

  const content = (req.body.content || '').trim();
  if (!content) throw new ValidationError('Contenu requis');

  const visibility = group.type === 'prive'
    ? (req.body.visibility === 'public' ? 'public' : 'prive')
    : 'public';

  const post = await Post.create({
    parishId: group.parishId,
    groupId: group._id,
    content,
    imageUrl: req.body.imageUrl || null,
    visibility,
  });

  return sendSuccess(res, { post }, 'Publication du groupe creee');
}));

// PATCH /groups/:id/posts/:postId - modifier/masquer une publication du groupe
router.patch('/:id/posts/:postId', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const group = await chargerGroupeOuErreur(req.params.id);
  if (!peutGerer(req, group)) throw new AuthorizationError('Non autorise');

  const updates = {};
  if (req.body.content !== undefined) updates.content = req.body.content;
  if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
  if (req.body.visibility !== undefined && group.type === 'prive') {
    updates.visibility = req.body.visibility === 'public' ? 'public' : 'prive';
  }

  const post = await Post.findOneAndUpdate(
    { _id: req.params.postId, groupId: group._id },
    { $set: updates },
    { new: true }
  );
  if (!post) throw new NotFoundError('Publication');

  return sendSuccess(res, { post }, 'Publication mise a jour');
}));

// ── Messagerie interne du groupe (reservee aux membres) ──────────
router.get('/:id/messages', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const group = await chargerGroupeOuErreur(req.params.id);
  if (!estMembreDuGroupe(req, group)) throw new AuthorizationError('Reserve aux membres du groupe');

  const messages = await GroupMessage.find({ groupId: group._id })
    .sort({ createdAt: 1 })
    .populate('senderId', 'firstName lastName avatarUrl')
    .lean();

  return sendSuccess(res, messages);
}));

router.post('/:id/messages', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const group = await chargerGroupeOuErreur(req.params.id);
  if (!estMembreDuGroupe(req, group)) throw new AuthorizationError('Reserve aux membres du groupe');

  const text = (req.body.text || '').trim();
  const fileUrl = req.body.fileUrl || null;
  const fileType = ['image', 'video', 'document', 'audio'].includes(req.body.fileType) ? req.body.fileType : null;
  const fileName = req.body.fileName || null;

  if (!text && !fileUrl) throw new ValidationError('Message vide');

  const message = await GroupMessage.create({
    groupId: group._id,
    senderId: req.user.userId,
    text,
    fileUrl,
    fileType,
    fileName,
  });

  const populated = await GroupMessage.findById(message._id).populate('senderId', 'firstName lastName avatarUrl').lean();
  return sendSuccess(res, { message: populated }, 'Message envoye');
}));

module.exports = { router };
