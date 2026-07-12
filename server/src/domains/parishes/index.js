'use strict';

// ═══════════════════════════════════════════════
// PARISHES DOMAIN
// ═══════════════════════════════════════════════

// ── Validation ─────────────────────────────────
const Joi = require('joi');
const { JoiFields } = require('../../middlewares/validate');

const parishSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(1000).optional(),
    denomination: Joi.string().trim().max(100).optional(),
    location: Joi.object({
      country: Joi.string().trim().max(100).required(),
      city: Joi.string().trim().max(100).required(),
      address: Joi.string().trim().max(200).optional(),
      coordinates: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array()
          .items(Joi.number())
          .length(2)
          .optional()
          .description('[longitude, latitude]'),
      }).optional(),
    }).required(),
  }),

  update: Joi.object({
    name: Joi.string().trim().min(3).max(100).optional(),
    description: Joi.string().trim().max(1000).allow(null).optional(),
    denomination: Joi.string().trim().max(100).allow(null).optional(),
    logoUrl: Joi.alternatives().try(
      Joi.string().uri({ scheme: ['https', 'http'] }),
      Joi.string().pattern(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/)
    ).allow(null).optional(),
    coverUrl: Joi.alternatives().try(
      Joi.string().uri({ scheme: ['https', 'http'] }),
      Joi.string().pattern(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/)
    ).allow(null).optional(),
    location: Joi.object({
      country: Joi.string().trim().max(100).optional(),
      city: Joi.string().trim().max(100).optional(),
      address: Joi.string().trim().max(200).allow(null).optional(),
    }).optional(),
  }).min(1), // at least one field required

  listQuery: Joi.object({
    ...JoiFields.pagination(),
    country: Joi.string().trim().max(100).optional(),
    city: Joi.string().trim().max(100).optional(),
    search: Joi.string().trim().max(100).optional(),
  }),
};

// ── Repository ─────────────────────────────────
const { Parish, User } = require('../../models');

const parishRepo = {
  async create(data) {
    return Parish.create(data);
  },

  async findById(id) {
    return Parish.findById(id).exec();
  },

  async findByIdLean(id) {
    return Parish.findById(id).lean().exec();
  },

  async findAll({ page, limit, country, city, search }) {
    const filter = { isActive: true, isVerified: true };
    if (country) filter['location.country'] = new RegExp(country, 'i');
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (search) filter.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [data, total] = await Promise.all([
      Parish.find(filter)
        .select('-__v')
        .sort({ 'stats.totalDonationAmount': -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Parish.countDocuments(filter),
    ]);
    return { data, total };
  },

  async updateById(id, updates) {
    return Parish.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).exec();
  },

  async assignAdmin(parishId, adminId) {
    return Parish.findByIdAndUpdate(parishId, { $set: { adminId } }, { new: true }).exec();
  },

  async setVerified(parishId, isVerified) {
    return Parish.findByIdAndUpdate(parishId, { $set: { isVerified } }, { new: true }).exec();
  },
};

// ── Cache (Redis, cache-aside, fails open) ──────────────────
const { getRedisClient } = require('../../config/redis');

const CACHE_PREFIX = 'parish:';
const LIST_CACHE_PREFIX = 'parishes:list:';
const ENTRY_TTL_SECONDS = 600;   // 10 min — single parish rarely changes
const LIST_TTL_SECONDS = 120;    // 2 min — listings should reflect new/verified parishes fairly soon

function buildListCacheKey(query) {
  // Stable key regardless of property order
  const { page, limit, country, city, search } = query;
  return `${LIST_CACHE_PREFIX}${JSON.stringify({ page, limit, country, city, search })}`;
}

async function cacheGet(key) {
  try {
    const client = getRedisClient();
    if (!client) return null;
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('[Cache] read failed, falling back to DB:', err.message);
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds) {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('[Cache] write failed (non-fatal):', err.message);
  }
}

async function cacheInvalidateParish(parishId) {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.del(`${CACHE_PREFIX}${parishId}`);
    // NOTE: KEYS is O(N) over the whole keyspace — fine at current cache
    // sizes (a few hundred list-page entries). If the keyspace grows large,
    // switch to SCAN with a cursor to avoid blocking Redis on a big keyspace.
    const listKeys = await client.keys(`${LIST_CACHE_PREFIX}*`);
    if (listKeys.length) await client.del(listKeys);
  } catch (err) {
    console.warn('[Cache] invalidation failed (non-fatal):', err.message);
  }
}

// ── Service ────────────────────────────────────
const { audit } = require('../../shared/utils/auditLogger');
const { AuditLog } = require('../../models');
const {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} = require('../../shared/errors');

const parishService = {
  async create(data, adminId, req) {
    // Ensure the admin user exists
    const admin = await User.findById(adminId).lean();
    if (!admin) throw new NotFoundError('Admin user');

    const parish = await parishRepo.create({ ...data, adminId });

    // Update the admin user's parishId
    await User.findByIdAndUpdate(adminId, { $set: { parishId: parish._id } });

    await audit.admin(
      AuditLog.ACTIONS.ADMIN_PARISH_CREATED,
      adminId, parish._id, 'Parish',
      { name: parish.name }, req
    );

    await cacheInvalidateParish(parish._id);

    return parish;
  },

  async getById(parishId) {
    const cacheKey = `${CACHE_PREFIX}${parishId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const parish = await parishRepo.findByIdLean(parishId);
    if (!parish || !parish.isActive) throw new NotFoundError('Parish');

    await cacheSet(cacheKey, parish, ENTRY_TTL_SECONDS);
    return parish;
  },

  async list(query) {
    const cacheKey = buildListCacheKey(query);
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await parishRepo.findAll(query);
    await cacheSet(cacheKey, result, LIST_TTL_SECONDS);
    return result;
  },

  async update(parishId, updates, actorId, actorRole, req) {
    const parish = await parishRepo.findByIdLean(parishId);
    if (!parish) throw new NotFoundError('Parish');

    // Parish admin can only update their own parish
    if (actorRole === 'parish_admin' && parish.adminId.toString() !== actorId) {
      throw new AuthorizationError('You can only update your own parish');
    }

    const updated = await parishRepo.updateById(parishId, updates);

    await audit.admin(
      AuditLog.ACTIONS.ADMIN_PARISH_UPDATED,
      actorId, parishId, 'Parish',
      { fields: Object.keys(updates) }, req
    );

    await cacheInvalidateParish(parishId);

    return updated;
  },

  async verify(parishId, superAdminId, req) {
    const parish = await parishRepo.findByIdLean(parishId);
    if (!parish) throw new NotFoundError('Parish');

    const verified = await parishRepo.setVerified(parishId, true);

    await audit.admin(
      AuditLog.ACTIONS.ADMIN_PARISH_VERIFIED,
      superAdminId, parishId, 'Parish',
      { name: parish.name }, req
    );

    await cacheInvalidateParish(parishId);

    return verified;
  },
};

// ── Controller ─────────────────────────────────
const { sendSuccess, sendCreated, sendPaginated } = require('../../shared/utils/response');

const parishController = {
  async create(req, res) {
    const parish = await parishService.create(req.body, req.user.userId, req);
    return sendCreated(res, { parish }, 'Parish created successfully');
  },

  async getById(req, res) {
    const parish = await parishService.getById(req.params.id);
    return sendSuccess(res, { parish });
  },

  async list(req, res) {
    const { data, total } = await parishService.list(req.query);
    return sendPaginated(res, data, { ...req.query, total });
  },

  async update(req, res) {
    const parish = await parishService.update(
      req.params.id, req.body,
      req.user.userId, req.user.role, req
    );
    return sendSuccess(res, { parish }, 'Parish updated successfully');
  },

  async verify(req, res) {
    const parish = await parishService.verify(req.params.id, req.user.userId, req);
    return sendSuccess(res, { parish }, 'Parish verified');
  },
};

// ── Routes ──────────────────────────────────────
const router = require('express').Router();
const { validate } = require('../../middlewares/validate');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize, authorizeParishAccess } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');

// Public
router.get('/', validate(parishSchemas.listQuery, 'query'), asyncHandler(parishController.list));
router.get('/:id', asyncHandler(parishController.getById));

// Parish admin or super admin — create
router.post('/',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  validate(parishSchemas.create),
  asyncHandler(parishController.create)
);

// Update — parish_admin (own) or super_admin
router.patch('/:id',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  validate(parishSchemas.update),
  asyncHandler(parishController.update)
);

// Verify — super_admin only
router.post('/:id/verify',
  authenticate, requireVerified,
  authorize('super_admin'),
  asyncHandler(parishController.verify)
);

module.exports = { router, parishService, parishRepo };
