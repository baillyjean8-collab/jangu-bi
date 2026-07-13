'use strict';

const Joi = require('joi');
const router = require('express').Router();
const { Post } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError, AuthorizationError } = require('../../shared/errors');

// -- Repository --------------------------------------------------
const postRepo = {
  async create(data) {
    return Post.create(data);
  },

  async findAll({ page = 1, limit = 10, parishId } = {}) {
    const filter = { isActive: true, $or: [{ groupId: null }, { visibility: 'public' }] };
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

  // Comme findAll mais inclut aussi les publications masquees (isActive:false).
  // Reserve a la gestion admin (page paroisse geree par l'admin, page Publications).
  async findAllIncludingHidden({ page = 1, limit = 10, parishId } = {}) {
    const filter = {};
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

  async updateById(postId, parishId, updates, allowAnyParish) {
    const filter = allowAnyParish ? { _id: postId } : { _id: postId, parishId };
    return Post.findOneAndUpdate(filter, { $set: updates }, { new: true })
      .populate('parishId', 'name logoUrl');
  },

  async deleteById(postId, parishId, allowAnyParish) {
    const filter = allowAnyParish ? { _id: postId } : { _id: postId, parishId };
    return Post.findOneAndUpdate(
      filter,
      { $set: { isActive: false } },
      { new: true }
    );
  },
};

// -- Controller ---------------------------------------------------
const postController = {
  async create(req, res) {
    const { content, imageUrl, type } = req.body;
    const parishId = req.user.parishId;
    if (!parishId) throw new AuthorizationError('No parish assigned');
    const post = await postRepo.create({ parishId, content, imageUrl, type });
    return sendCreated(res, { post }, 'Publication creee');
  },

  async list(req, res) {
    const { page = 1, limit = 10, parishId } = req.query;
    const result = await postRepo.findAll({ page: +page, limit: +limit, parishId });
    return sendSuccess(res, result);
  },

  // Utilise par l'admin (sa propre page de gestion) : inclut aussi les publications masquees
  async listMine(req, res) {
    const { page = 1, limit = 30 } = req.query;
    const parishId = req.user.parishId;
    if (!parishId) throw new AuthorizationError('No parish assigned');
    const result = await postRepo.findAllIncludingHidden({ page: +page, limit: +limit, parishId });
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

  async update(req, res) {
    const allowAny = req.user.role === 'super_admin';
    const updates = {};
    if (req.body.content !== undefined) updates.content = req.body.content;
    if (req.body.imageUrl !== undefined) updates.imageUrl = req.body.imageUrl;
    if (req.body.type !== undefined) updates.type = req.body.type;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    const post = await postRepo.updateById(req.params.id, req.user.parishId, updates, allowAny);
    if (!post) throw new NotFoundError('Post');
    return sendSuccess(res, { post }, 'Publication mise a jour');
  },

  async delete(req, res) {
    const allowAny = req.user.role === 'super_admin';
    const post = await postRepo.deleteById(req.params.id, req.user.parishId, allowAny);
    if (!post) throw new NotFoundError('Post');
    return sendSuccess(res, {}, 'Publication masquee');
  },
};

// -- Routes ---------------------------------------------------------
router.get('/', asyncHandler(postController.list));

router.get('/mine',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(postController.listMine)
);

router.post('/',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(postController.create)
);

router.patch('/:id',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(postController.update)
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
