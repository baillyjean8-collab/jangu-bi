'use strict';

const router = require('express').Router();
const { Story } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError, AuthorizationError } = require('../../shared/errors');

// ── Repository ─────────────────────────────────
const storyRepo = {
  async create(data) {
    return Story.create(data);
  },

  async findActive({ parishId } = {}) {
    const filter = { isActive: true, expiresAt: { $gt: new Date() } };
    if (parishId) filter.parishId = parishId;
    return Story.find(filter)
      .populate('parishId', 'name logoUrl')
      .sort({ createdAt: -1 })
      .lean();
  },

  async toggleLike(storyId, userId) {
    const story = await Story.findById(storyId);
    if (!story) throw new NotFoundError('Story');
    const liked = story.likes.includes(userId);
    if (liked) {
      story.likes.pull(userId);
    } else {
      story.likes.push(userId);
    }
    await story.save();
    return story;
  },

  async addView(storyId, userId) {
    return Story.findByIdAndUpdate(
      storyId,
      { $addToSet: { views: userId } },
      { new: true }
    );
  },

  async deleteById(storyId, parishId) {
    return Story.findOneAndUpdate(
      { _id: storyId, parishId },
      { $set: { isActive: false } },
      { new: true }
    );
  },
};

// ── Controller ─────────────────────────────────
const storyController = {
  async create(req, res) {
    const { imageUrl, videoUrl, caption, type, bgColor } = req.body;
    const parishId = req.user.parishId;
    if (!parishId) throw new AuthorizationError('No parish assigned');
    const resolvedType = type || (videoUrl ? 'video' : (imageUrl ? 'image' : 'texte'));
    const story = await storyRepo.create({ parishId, imageUrl, videoUrl, caption, type: resolvedType, bgColor });
    return sendCreated(res, { story }, 'Story créée');
  },

  async list(req, res) {
    const { parishId } = req.query;
    const stories = await storyRepo.findActive({ parishId });
    return sendSuccess(res, { stories });
  },

  async like(req, res) {
    const story = await storyRepo.toggleLike(req.params.id, req.user.userId);
    return sendSuccess(res, { likes: story.likes.length });
  },

  async view(req, res) {
    await storyRepo.addView(req.params.id, req.user.userId);
    return sendSuccess(res, {});
  },

  async delete(req, res) {
    await storyRepo.deleteById(req.params.id, req.user.parishId);
    return sendSuccess(res, {}, 'Story supprimée');
  },
};

// ── Routes ──────────────────────────────────────
router.get('/', asyncHandler(storyController.list));

router.post('/',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(storyController.create)
);

router.post('/:id/like',
  authenticate,
  asyncHandler(storyController.like)
);

router.post('/:id/view',
  authenticate,
  asyncHandler(storyController.view)
);

router.delete('/:id',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(storyController.delete)
);

module.exports = { router, storyRepo };