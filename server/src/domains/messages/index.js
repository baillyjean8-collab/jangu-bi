'use strict';
const router = require('express').Router();
const mongoose = require('mongoose');
const { Conversation, Message } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../shared/utils/response');
const { NotFoundError, ValidationError } = require('../../shared/errors');

// GET /messages - liste des conversations du fidele (toutes paroisses confondues)
router.get('/', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ userId: req.user.userId })
    .sort({ lastMessageAt: -1 })
    .populate('parishId', 'name logoUrl')
    .lean();
  return sendSuccess(res, conversations);
}));

// GET /messages/unread-count - nombre total de messages non lus (badge)
router.get('/unread-count', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const agg = await Conversation.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.user.userId), unreadUser: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$unreadUser' } } },
  ]);
  const total = (agg[0] && agg[0].total) || 0;
  return sendSuccess(res, { total });
}));

// POST /messages/start - recuperer ou creer une conversation avec une paroisse
router.post('/start', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const parishId = req.body.parishId;
  if (!parishId) throw new ValidationError('parishId requis');
  let conversation = await Conversation.findOne({ userId: req.user.userId, parishId });
  if (!conversation) {
    conversation = await Conversation.create({ userId: req.user.userId, parishId });
  }
  return sendSuccess(res, { conversation });
}));

// GET /messages/:conversationId - messages d'une conversation (marque comme lu)
router.get('/:conversationId', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.conversationId).populate('parishId', 'name logoUrl');
  if (!conversation) throw new NotFoundError('Conversation');
  if (String(conversation.userId) !== String(req.user.userId)) throw new NotFoundError('Conversation');

  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
  await Conversation.findByIdAndUpdate(conversation._id, { $set: { unreadUser: 0 } });

  return sendSuccess(res, { conversation, messages });
}));

// POST /messages/:conversationId - envoyer un message (cote fidele)
router.post('/:conversationId', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) throw new NotFoundError('Conversation');
  if (String(conversation.userId) !== String(req.user.userId)) throw new NotFoundError('Conversation');

  const text = (req.body.text || '').trim();
  if (!text) throw new ValidationError('Message vide');

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user.userId,
    senderType: 'user',
    text,
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: { lastMessage: text, lastMessageAt: new Date() },
    $inc: { unreadParish: 1 },
  });

  return sendSuccess(res, { message }, 'Message envoye');
}));

module.exports = router;
