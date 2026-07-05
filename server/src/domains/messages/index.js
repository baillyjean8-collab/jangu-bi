'use strict';
const router = require('express').Router();
const { Conversation, Message, User } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../shared/utils/response');

// GET /messages — liste des conversations
router.get('/', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const convs = await Conversation.find({
    participants: userId,
    isActive: true,
  }).sort({ updatedAt: -1 }).limit(20)
    .populate('participants', 'firstName lastName role parishId')
    .lean();
  return sendSuccess(res, convs);
}));

// GET /messages/:convId — messages d'une conversation
router.get('/:convId', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const msgs = await Message.find({ conversationId: req.params.convId })
    .sort({ createdAt: 1 }).limit(50)
    .populate('senderId', 'firstName lastName role').lean();
  return sendSuccess(res, msgs);
}));

// POST /messages — envoyer un message
router.post('/', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const { recipientId, text } = req.body;
  if (!text || !recipientId) throw new Error('Destinataire et message requis');

  let conv = await Conversation.findOne({
    participants: { $all: [req.user.userId, recipientId] }
  });

  if (!conv) {
    conv = await Conversation.create({
      participants: [req.user.userId, recipientId],
      isActive: true,
    });
  }

  const msg = await Message.create({
    conversationId: conv._id,
    senderId: req.user.userId,
    text,
  });

  conv.lastMessage = text;
  conv.updatedAt = new Date();
  await conv.save();

  return sendSuccess(res, { conversation: conv, message: msg }, 'Message envoyé');
}));

module.exports = router;
