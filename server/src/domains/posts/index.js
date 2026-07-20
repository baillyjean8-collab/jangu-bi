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

async incrementShare(postId) {
const post = await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } }, { new: true });
if (!post) throw new NotFoundError('Post');
return post;
},

    async addComment(postId, userId, text) {

const post = await Post.findById(postId);

if (!post) throw new NotFoundError('Post');

post.comments.push({ userId, text });

await post.save();

return post;

},

async reportComment(postId, commentId, userId) {
  const post = await Post.findById(postId);
  if (!post) throw new NotFoundError('Post');
  const comment = post.comments.id(commentId);
  if (!comment) throw new NotFoundError('Comment');
  comment.reported = true;
  comment.reportStatus = 'pending';
  if (!comment.reportedBy.some(function(id) { return id.toString() === userId.toString(); })) {
    comment.reportedBy.push(userId);
  }
  await post.save();
  return comment;
},

async listReportedComments(parishId) {
  const filter = { 'comments.reported': true, 'comments.reportStatus': 'pending' };
  if (parishId) filter.parishId = parishId;
  const posts = await Post.find(filter)
    .populate('comments.userId', 'firstName lastName')
    .lean();
  const resultat = [];
  posts.forEach(function(p) {
    p.comments.forEach(function(c) {
      if (c.reported && c.reportStatus === 'pending') {
        resultat.push({
          postId: p._id,
          commentId: c._id,
          auteur: c.userId ? (c.userId.firstName + ' ' + c.userId.lastName) : 'Utilisateur',
          contenu: c.text,
          publication: p.content ? p.content.slice(0, 60) : '',
          date: c.createdAt,
        });
      }
    });
  });
  return resultat;
},

async resolveReportedComment(postId, commentId, action) {
  const post = await Post.findById(postId);
  if (!post) throw new NotFoundError('Post');
  const comment = post.comments.id(commentId);
  if (!comment) throw new NotFoundError('Comment');
  if (action === 'supprime') {
    comment.text = '[commentaire supprime par la moderation]';
    comment.reportStatus = 'supprime';
  } else {
    comment.reportStatus = 'ignore';
  }
  await post.save();
  return comment;
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
const { content, imageUrl, imageUrls, type } = req.body;
const parishId = req.user.parishId;
if (!parishId) throw new AuthorizationError('No parish assigned');
const post = await postRepo.create({ parishId, content, imageUrl, imageUrls, type });
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

async share(req, res) {
const post = await postRepo.incrementShare(req.params.id);
return sendSuccess(res, { sharesCount: post.sharesCount });
},

  async comment(req, res) {
const post = await postRepo.addComment(req.params.id, req.user.userId, req.body.text, req.body.parentId);
return sendSuccess(res, { comments: post.comments });
},

async getOne(req, res) {
const post = await postRepo.findById(req.params.id);
if (!post) throw new NotFoundError('Post');
return sendSuccess(res, { post });
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

router.get('/:id',
asyncHandler(postController.getOne)
);

router.post('/:id/like',
authenticate,
asyncHandler(postController.like)
);

router.post('/:id/share',
authenticate,
asyncHandler(postController.share)
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
