'use strict';

const Joi = require('joi');
const router = require('express').Router();
const { Post, EventRegistration } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError, AuthorizationError, ValidationError, ConflictError } = require('../../shared/errors');

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

async toggleFavori(postId, userId) {
  const { User } = require('../../models');
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User');
  const dejaFavori = user.favoris.some(function(id) { return id.toString() === postId.toString(); });
  if (dejaFavori) {
    user.favoris = user.favoris.filter(function(id) { return id.toString() !== postId.toString(); });
  } else {
    user.favoris.push(postId);
  }
  await user.save();
  return { favori: !dejaFavori };
},

async listFavoris(userId) {
  const { User } = require('../../models');
  const user = await User.findById(userId).populate({
    path: 'favoris',
    populate: { path: 'parishId', select: 'name logoUrl' },
  });
  if (!user) throw new NotFoundError('User');
  return user.favoris;
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

  async countRegistrations(postId) {
    return EventRegistration.countDocuments({ postId });
  },

  async createRegistration(postId, userId, nom, telephone) {
    const post = await Post.findById(postId);
    if (!post) throw new NotFoundError('Post');
    if (post.type !== 'EVENEMENT') {
      throw new ValidationError("Cette publication n'est pas un evenement");
    }
    if (post.eventCapacity != null) {
      const count = await EventRegistration.countDocuments({ postId });
      if (count >= post.eventCapacity) {
        throw new ConflictError('Il n\'y a plus de places disponibles pour cet evenement');
      }
    }
    try {
      return await EventRegistration.create({ postId, userId, nom, telephone });
    } catch (e) {
      if (e.code === 11000) {
        throw new ConflictError('Vous etes deja inscrit(e) a cet evenement');
      }
      throw e;
    }
  },

  async listRegistrations(postId) {
    return EventRegistration.find({ postId })
      .sort({ createdAt: 1 })
      .lean();
  },

  async findRegistration(postId, userId) {
    return EventRegistration.findOne({ postId, userId }).lean();
  },
};

const postController = {
async create(req, res) {
const { content, imageUrl, imageUrls, videoUrl, type, eventCapacity } = req.body;
const parishId = req.user.parishId;
if (!parishId) throw new AuthorizationError('No parish assigned');
const post = await postRepo.create({
  parishId, content, imageUrl, imageUrls, videoUrl, type,
  eventCapacity: (eventCapacity != null && eventCapacity !== '') ? Number(eventCapacity) : null,
});
return sendCreated(res, { post }, 'Publication creee');
},

  async list(req, res) {
    const { page = 1, limit = 10, parishId } = req.query;
    const result = await postRepo.findAll({ page: +page, limit: +limit, parishId });
    return sendSuccess(res, result);
  },

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
    if (req.body.eventCapacity !== undefined) {
      updates.eventCapacity = (req.body.eventCapacity != null && req.body.eventCapacity !== '') ? Number(req.body.eventCapacity) : null;
    }
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

async toggleFavori(req, res) {
  const resultat = await postRepo.toggleFavori(req.params.id, req.user.userId);
  return sendSuccess(res, resultat, resultat.favori ? 'Ajoute aux favoris' : 'Retire des favoris');
},

async listFavoris(req, res) {
  const favoris = await postRepo.listFavoris(req.user.userId);
  return sendSuccess(res, { favoris });
},

async reportComment(req, res) {
  const comment = await postRepo.reportComment(req.params.id, req.params.commentId, req.user.userId);
  return sendSuccess(res, { comment }, 'Commentaire signale');
},

async listReported(req, res) {
  const parishId = req.user.role === 'super_admin' ? undefined : req.user.parishId;
  const signalements = await postRepo.listReportedComments(parishId);
  return sendSuccess(res, { signalements });
},

async resolveReported(req, res) {
  const comment = await postRepo.resolveReportedComment(req.params.id, req.params.commentId, req.body.action);
  return sendSuccess(res, { comment }, 'Signalement traite');
},

  async registerForEvent(req, res) {
    const { nom, telephone } = req.body;
    if (!nom || !String(nom).trim() || !telephone || !String(telephone).trim()) {
      throw new ValidationError('Nom et telephone requis');
    }
    const inscription = await postRepo.createRegistration(
      req.params.id, req.user.userId, String(nom).trim(), String(telephone).trim()
    );
    return sendCreated(res, { inscription }, 'Inscription confirmee');
  },

  async listEventRegistrations(req, res) {
    const post = await Post.findById(req.params.id);
    if (!post) throw new NotFoundError('Post');
    if (req.user.role !== 'super_admin' && String(post.parishId) !== String(req.user.parishId)) {
      throw new AuthorizationError('Not your parish event');
    }
    const inscriptions = await postRepo.listRegistrations(req.params.id);
    const placesRestantes = post.eventCapacity != null ? Math.max(0, post.eventCapacity - inscriptions.length) : null;
    return sendSuccess(res, {
      inscriptions,
      total: inscriptions.length,
      capacite: post.eventCapacity,
      placesRestantes,
    });
  },

  async monInscription(req, res) {
    const post = await Post.findById(req.params.id).lean();
    if (!post) throw new NotFoundError('Post');
    const [inscription, count] = await Promise.all([
      postRepo.findRegistration(req.params.id, req.user.userId),
      postRepo.countRegistrations(req.params.id),
    ]);
    const placesRestantes = post.eventCapacity != null ? Math.max(0, post.eventCapacity - count) : null;
    return sendSuccess(res, {
      inscrit: !!inscription,
      capacite: post.eventCapacity,
      placesRestantes,
    });
  },

};

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

router.get('/moderation/signales',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(postController.listReported)
);

router.get('/:id',
asyncHandler(postController.getOne)
);

router.post('/:id/like',
authenticate,
asyncHandler(postController.like)
);

router.get('/favoris/mes-favoris',
authenticate,
asyncHandler(postController.listFavoris)
);

router.post('/:id/favori',
authenticate,
asyncHandler(postController.toggleFavori)
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

router.post('/:id/comment/:commentId/report',
  authenticate,
  asyncHandler(postController.reportComment)
);

router.post('/:id/comment/:commentId/resolve',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(postController.resolveReported)
);

router.post('/:id/inscription',
  authenticate, requireVerified,
  asyncHandler(postController.registerForEvent)
);

router.get('/:id/inscriptions',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(postController.listEventRegistrations)
);

router.get('/:id/inscriptions/moi',
  authenticate, requireVerified,
  asyncHandler(postController.monInscription)
);

module.exports = { router, postRepo };