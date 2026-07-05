'use strict';

const router = require('express').Router();
const { Message, Conversation } = require('../../models');
const { authenticate } = require('../../middlewares/authenticate');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError } = require('../../shared/errors');

// ── Repository ─────────────────────────────────
const chatRepo = {
  async getOrCreateConversation(userId, parishId) {
    let conv = await Conversation.findOne({ userId, parishId });
    if (!conv) conv = await Conversation.create({ userId, parishId });
    return conv;
  },

  async getConversations(userId) {
    return Conversation.find({ userId })
      .populate('parishId', 'name logoUrl')
      .sort({ lastMessageAt: -1 })
      .lean();
  },

  async getParishConversations(parishId) {
    return Conversation.find({ parishId })
      .populate('userId', 'firstName lastName')
      .sort({ lastMessageAt: -1 })
      .lean();
  },

  async getMessages(conversationId) {
    return Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();
  },

  async sendMessage({ conversationId, senderId, senderType, text, fileUrl, fileType, fileName }) {
    const message = await Message.create({
      conversationId, senderId, senderType, text, fileUrl, fileType, fileName,
    });
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text || fileName || 'Fichier',
      lastMessageAt: new Date(),
      $inc: senderType === 'user' ? { unreadParish: 1 } : { unreadUser: 1 },
    });
    return message;
  },

  async markRead(conversationId, readerType) {
    const field = readerType === 'user' ? { unreadUser: 0 } : { unreadParish: 0 };
    await Conversation.findByIdAndUpdate(conversationId, { $set: field });
    await Message.updateMany(
      { conversationId, senderType: readerType === 'user' ? 'parish' : 'user', readAt: null },
      { $set: { readAt: new Date() } }
    );
  },
};

// ── Controller ─────────────────────────────────
const chatController = {
  // Obtenir ou créer une conversation avec une paroisse
  async startConversation(req, res) {
    const { parishId } = req.body;
    const conv = await chatRepo.getOrCreateConversation(req.user.userId, parishId);
    return sendSuccess(res, { conversation: conv });
  },

  // Liste des conversations de l'utilisateur
  async myConversations(req, res) {
    const convs = await chatRepo.getConversations(req.user.userId);
    return sendSuccess(res, { conversations: convs });
  },

  // Liste des conversations de la paroisse
  async parishConversations(req, res) {
    const convs = await chatRepo.getParishConversations(req.user.parishId);
    return sendSuccess(res, { conversations: convs });
  },

  // Messages d'une conversation
  async getMessages(req, res) {
    const messages = await chatRepo.getMessages(req.params.conversationId);
    return sendSuccess(res, { messages });
  },

  // Envoyer un message
  async sendMessage(req, res) {
    const { conversationId, text, fileUrl, fileType, fileName } = req.body;
    const senderType = req.user.parishId ? 'parish' : 'user';
    const message = await chatRepo.sendMessage({
      conversationId,
      senderId: req.user.userId,
      senderType,
      text,
      fileUrl,
      fileType,
      fileName,
    });
    return sendCreated(res, { message });
  },

  // Marquer comme lu
  async markRead(req, res) {
    const readerType = req.user.parishId ? 'parish' : 'user';
    await chatRepo.markRead(req.params.conversationId, readerType);
    return sendSuccess(res, {});
  },
};

// ── Routes ──────────────────────────────────────
router.use(authenticate);

router.post('/start',                          asyncHandler(chatController.startConversation));
router.get('/my',                              asyncHandler(chatController.myConversations));
router.get('/parish',                          asyncHandler(chatController.parishConversations));
router.get('/:conversationId/messages',        asyncHandler(chatController.getMessages));
router.post('/message',                        asyncHandler(chatController.sendMessage));
router.post('/:conversationId/read',           asyncHandler(chatController.markRead));

module.exports = { router, chatRepo };