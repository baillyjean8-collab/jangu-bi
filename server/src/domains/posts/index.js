'use strict';

const Joi = require('joi');
const router = require('express').Router();
const { Post } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError, AuthorizationError } = require('../../shared/errors');

// ── Repository ─────────────────────────────────
const postRepo = {
  async create(data) {
    return Post.create(data);
  },

  async findAll({ page = 1, limit = 10, parishId } = {}) {
    const filter = { isActive: true };
    if (parishId) filter.parishId = parishId;
    const [data, total] = await Promise.all([
      Post.find(filter)
        .populate('parishId', 'name logoUrl')
        .populate('comments.userId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);
    return { data, total };
  },

  async findById(id) {
    return Post.findById(id)
      .populate('parishId', 'name logoUrl')
      .populate('comments.userId', 'firstName lastName')
      .lean();
  },

  async toggleLike(postId, userId) {
    const post = await Post.findById(postId);
    if (!post) throw new NotFoundError('Post');
    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    return post;
  },

  async addComment(postId, userId, text) {
    const post = await Post.findById(postId);
    if (!post) throw new NotFoundError('Post');
    post.comments.push({ userId, text });
    await post.save();
    return post;
  },

  async deleteById(postId, parishId) {
    return Post.findOneAndUpdate(
      { _id: postId, parishId },
      { $set: { isActive: false } },
      { new: true }
    );
  },
};

// ── Controller ─────────────────────────────────
const postController = {
  async create(req, res) {
    const { content, imageUrl } = req.body;
    const parishId = req.user.parishId;
    if (!parishId) throw new AuthorizationError('No parish assigned');
    const post = await postRepo.create({ parishId, content, imageUrl });
    return sendCreated(res, { post }, 'Publication créée');
  },

  async list(req, res) {
    const { page = 1, limit = 10, parishId } = req.query;
    const result = await postRepo.findAll({ page: +page, limit: +limit, parishId });
    return sendSuccess(res, result);
  },

  async like(req, res) {
    const post = await postRepo.toggleLike(req.params.id, req.user.userId);
    return sendSuccess(res, { likes: post.likes.length });
  },

  async comment(req, res) {
    const post = await postRepo.addComment(req.params.id, req.user.userId, req.body.text);
    return sendSuccess(res, { comments: post.comments });
  },

  async delete(req, res) {
    await postRepo.deleteById(req.params.id, req.user.parishId);
    return sendSuccess(res, {}, 'Publication supprimée');
  },
};

// ── Routes ──────────────────────────────────────
router.get('/', asyncHandler(postController.list));

router.post('/',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(postController.create)
);

router.post('/:id/like',
  authenticate,
  asyncHandler(postController.like)
);

router.post('/:id/comment',
  authenticate,
  asyncHandler(postController.comment)
);

router.delete('/:id',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(postController.delete)
);

module.exports = { router, postRepo };