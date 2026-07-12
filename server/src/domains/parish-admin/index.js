'use strict';
const router = require('express').Router();
const mongoose = require('mongoose');
const { User, Post, Donation, Conversation, Message } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendPaginated } = require('../../shared/utils/response');
const { NotFoundError, ValidationError } = require('../../shared/errors');

const guard = [authenticate, requireVerified, authorize('parish_admin', 'super_admin')];

// Helper: récupérer parishId depuis req.user ou DB
async function getParishId(req) {
  if (req.user.parishId) return req.user.parishId.toString();
  const u = await User.findById(req.user.userId).select('parishId').lean();
  return u && u.parishId ? u.parishId.toString() : null;
}

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);

  if (!parishId) {
    // Retourner des zéros si pas de paroisse associée (pas de blocage)
    return sendSuccess(res, {
      paroissiens: 0, abonnes: 0,
      posts: 0, dons: { total: 0, count: 0 },
      demandesEnAttente: 0,
      warning: 'Aucune paroisse associée à ce compte admin'
    });
  }

  const oid = new mongoose.Types.ObjectId(parishId);

  const [paroissiens, abonnes, posts, donsData, demandesEnAttente] = await Promise.all([
    User.countDocuments({ parishId: oid, isActive: true }),
    User.countDocuments({ followedParishes: oid, isActive: true }),
    Post.countDocuments({ parishId: oid }),
    Donation.aggregate([
      { $match: { parishId: oid, status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } },
    ]),
    Post.countDocuments({ parishId: oid, type: 'INSCRIPTION', 'metadata.status': 'pending' }),
  ]);

  const dons = donsData[0] || { total: 0, count: 0 };
  return sendSuccess(res, { paroissiens, abonnes, posts, dons, demandesEnAttente });
}));

// ── Activité récente ──────────────────────────────────────────
router.get('/activite', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);
  if (!parishId) return sendSuccess(res, []);

  const oid = new mongoose.Types.ObjectId(parishId);
  const [recentDons, recentDemandes] = await Promise.all([
    Donation.find({ parishId: oid, status: 'SUCCESS' }).sort({ createdAt: -1 }).limit(5)
      .populate('userId', 'firstName lastName').lean(),
    Post.find({ parishId: oid, type: 'INSCRIPTION' }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const activite = [
    ...recentDons.map(function(d) {
      return { type: 'don', icon: '💰', msg: 'Un fidèle a fait un don', montant: d.netAmount, temps: d.createdAt, urgent: false };
    }),
    ...recentDemandes.map(function(p) {
      return { type: 'demande', icon: '📄', msg: 'Nouvelle demande reçue', temps: p.createdAt, urgent: true };
    }),
  ].sort(function(a, b) { return new Date(b.temps) - new Date(a.temps); }).slice(0, 10);

  return sendSuccess(res, activite);
}));

// ── Demandes ──────────────────────────────────────────────────
router.get('/demandes', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;

  const filter = {};
  if (parishId) filter.parishId = new mongoose.Types.ObjectId(parishId);
  if (req.query.statut) filter['metadata.status'] = req.query.statut;

  const [data, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('userId', 'firstName lastName phone').lean(),
    Post.countDocuments(filter),
  ]);
  return sendPaginated(res, data, { page, limit, total });
}));

router.patch('/demandes/:id/valider', ...guard, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new NotFoundError('Demande');
  post.metadata = Object.assign({}, post.metadata, { status: 'validee', validatedAt: new Date() });
  await post.save();
  return sendSuccess(res, { post }, 'Demande validée');
}));

router.patch('/demandes/:id/rejeter', ...guard, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new NotFoundError('Demande');
  post.metadata = Object.assign({}, post.metadata, { status: 'rejetee', rejectedAt: new Date(), motifRejet: req.body.motif || '' });
  await post.save();
  return sendSuccess(res, { post }, 'Demande rejetée');
}));

// ── Fidèles ───────────────────────────────────────────────────
router.get('/notifications-count', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);
  if (!parishId) return sendSuccess(res, { nouveauxFideles: 0, messagesNonRepondus: 0 });

  const oid = new mongoose.Types.ObjectId(parishId);
  const adminUser = await User.findById(req.user.userId).select('lastFidelesViewAt').lean();
  const depuis = (adminUser && adminUser.lastFidelesViewAt) || new Date(0);

  const [nouveauxFideles, conversationsAgg] = await Promise.all([
    User.countDocuments({
      isActive: true,
      createdAt: { $gt: depuis },
      $or: [{ parishId: oid }, { followedParishes: oid }],
    }),
    Conversation.aggregate([
      { $match: { parishId: oid, unreadParish: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$unreadParish' } } },
    ]),
  ]);

  const messagesNonRepondus = (conversationsAgg[0] && conversationsAgg[0].total) || 0;
  return sendSuccess(res, { nouveauxFideles, messagesNonRepondus });
}));

router.post('/fideles/vu', ...guard, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.userId, { $set: { lastFidelesViewAt: new Date() } });
  return sendSuccess(res, null, 'Marque comme vu');
}));

router.get('/fideles/counts', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);
  if (!parishId) return sendSuccess(res, { paroissiens: 0, abonnes: 0 });
  const oid = new mongoose.Types.ObjectId(parishId);
  const [paroissiens, abonnes] = await Promise.all([
    User.countDocuments({ parishId: oid, isActive: true }),
    User.countDocuments({ followedParishes: oid, isActive: true }),
  ]);
  return sendSuccess(res, { paroissiens, abonnes });
}));

router.get('/fideles', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 50;

  const filter = { isActive: true };
  if (parishId) {
    const oid = new mongoose.Types.ObjectId(parishId);
    if (req.query.type === 'paroissiens') filter.parishId = oid;
    else if (req.query.type === 'abonnes') filter.followedParishes = oid;
    else filter['$or'] = [{ parishId: oid }, { followedParishes: oid }];
  }

  const [data, total] = await Promise.all([
    User.find(filter).select('firstName lastName phone address parishId isSuspended createdAt')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return sendPaginated(res, data, { page, limit, total });
}));

router.patch('/fideles/:id/suspendre', ...guard, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError('Fidèle');
  const dureeMap = { '24h': 1, '3j': 3, '7j': 7, '30j': 30 };
  const jours = dureeMap[req.body.duree] || 1;
  user.isSuspended = true;
  user.suspendedUntil = new Date(Date.now() + jours * 24 * 60 * 60 * 1000);
  await user.save();
  return sendSuccess(res, null, 'Fidèle suspendu');
}));

router.post('/fideles/:id/signaler', ...guard, asyncHandler(async (req, res) => {
  return sendSuccess(res, null, 'Signalement envoyé');
}));

// ── Messages ──────────────────────────────────────────────────
router.get('/conversations', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);
  if (!parishId) return sendSuccess(res, []);
  const oid = new mongoose.Types.ObjectId(parishId);
  const conversations = await Conversation.find({ parishId: oid })
    .sort({ lastMessageAt: -1 })
    .populate('userId', 'firstName lastName')
    .lean();
  return sendSuccess(res, conversations);
}));

router.post('/conversations', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);
  if (!parishId) throw new ValidationError('Aucune paroisse associee a ce compte admin');
  const userId = req.body.userId;
  if (!userId) throw new ValidationError('userId requis');
  const oid = new mongoose.Types.ObjectId(parishId);
  let conversation = await Conversation.findOne({ userId, parishId: oid });
  if (!conversation) {
    conversation = await Conversation.create({ userId, parishId: oid });
  }
  return sendSuccess(res, { conversation });
}));

router.get('/conversations/:id/messages', ...guard, asyncHandler(async (req, res) => {
  const parishId = await getParishId(req);
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new NotFoundError('Conversation');
  if (parishId && String(conversation.parishId) !== parishId) throw new NotFoundError('Conversation');

  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
  await Conversation.findByIdAndUpdate(conversation._id, { $set: { unreadParish: 0 } });

  return sendSuccess(res, { conversation, messages });
}));

router.post('/conversations/:id/messages', ...guard, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new NotFoundError('Conversation');
  const text = (req.body.text || '').trim();
  if (!text) throw new ValidationError('Message vide');

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user.userId,
    senderType: 'parish',
    text,
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: { lastMessage: text, lastMessageAt: new Date() },
    $inc: { unreadUser: 1 },
  });

  return sendSuccess(res, { message }, 'Message envoye');
}));
router.post('/messages', ...guard, asyncHandler(async (req, res) => {
  return sendSuccess(res, null, 'Message envoyé');
}));

module.exports = router;
