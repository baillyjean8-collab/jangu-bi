'use strict';

const router = require('express').Router();
const Joi = require('joi');
const { User, Parish, Donation, AuditLog, Live } = require('../../models');
const { validate, JoiFields } = require('../../middlewares/validate');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendPaginated } = require('../../shared/utils/response');
const { audit } = require('../../shared/utils/auditLogger');
const { NotFoundError, ValidationError } = require('../../shared/errors');

// All admin routes require authentication + super_admin role
const adminGuard = [authenticate, requireVerified, authorize('super_admin')];
const parishAdminGuard = [authenticate, requireVerified, authorize('parish_admin', 'super_admin')];

// ── Validation schemas ─────────────────────────────────────────────────────────

const paginationSchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
});

const auditLogQuerySchema = Joi.object({
  page:    Joi.number().integer().min(1).default(1),
  limit:   Joi.number().integer().min(1).max(100).default(50),
  action:  Joi.string().max(50).optional(),
  userId:  JoiFields.objectId().optional(),
  status:  Joi.string().valid('success', 'failure', 'warning').optional(),
  from:    Joi.date().iso().optional(),
  to:      Joi.date().iso().optional(),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'parish_admin').required(), // super_admin not assignable via API
});

// ── Dashboard Stats ────────────────────────────────────────────────────────────

router.get('/dashboard',
  ...adminGuard,
  asyncHandler(async (req, res) => {
    const [
      totalUsers,
      verifiedUsers,
      totalParishes,
      activeParishes,
      donationStats,
      activeLives,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isVerified: true, isActive: true }),
      Parish.countDocuments({ isActive: true }),
      Parish.countDocuments({ isActive: true, isVerified: true }),
      Donation.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: {
          _id: null,
          total: { $sum: '$netAmount' },
          count: { $sum: 1 },
          avg: { $avg: '$netAmount' },
        }},
      ]),
      Live.countDocuments({ isActive: true }),
    ]);

    const stats = donationStats[0] || { total: 0, count: 0, avg: 0 };

    return sendSuccess(res, {
      users: { total: totalUsers, verified: verifiedUsers },
      parishes: { total: totalParishes, verified: activeParishes },
      donations: { total: Math.round(stats.total), count: stats.count, average: Math.round(stats.avg) },
      live: { activeSessions: activeLives },
    });
  })
);

// ── Users Management ───────────────────────────────────────────────────────────

router.get('/users',
  ...adminGuard,
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search } = req.query;
    const filter = search
      ? { $or: [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ]}
      : {};

    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return sendPaginated(res, data, { page, limit, total });
  })
);

router.patch('/users/:id/role',
  ...adminGuard,
  validate(updateRoleSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User');
    if (user.role === 'super_admin') throw new ValidationError('Cannot change role of a super admin');

    const oldRole = user.role;
    user.role = req.body.role;
    await user.save();

    await audit.admin(
      AuditLog.ACTIONS.ADMIN_USER_ROLE_CHANGED,
      req.user.userId,
      user._id, 'User',
      { from: oldRole, to: req.body.role },
      req
    );

    return sendSuccess(res, { user }, 'User role updated');
  })
);

router.patch('/users/:id/deactivate',
  ...adminGuard,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User');
    if (user.role === 'super_admin') throw new ValidationError('Cannot deactivate a super admin');

    user.isActive = false;
    await user.save();

    await audit.admin(AuditLog.ACTIONS.ADMIN_USER_DEACTIVATED, req.user.userId, user._id, 'User', {}, req);

    return sendSuccess(res, null, 'User deactivated');
  })
);

// ── Parish Management ─────────────────────────────────────────────────────────

router.get('/parishes',
  ...adminGuard,
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const [data, total] = await Promise.all([
      Parish.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('adminId', 'firstName lastName email').lean(),
      Parish.countDocuments(),
    ]);
    return sendPaginated(res, data, { page, limit, total });
  })
);

router.patch('/parishes/:id/verify',
  ...adminGuard,
  asyncHandler(async (req, res) => {
    const parish = await Parish.findByIdAndUpdate(
      req.params.id,
      { $set: { isVerified: true } },
      { new: true }
    );
    if (!parish) throw new NotFoundError('Parish');

    await audit.admin(AuditLog.ACTIONS.ADMIN_PARISH_VERIFIED, req.user.userId, parish._id, 'Parish', {}, req);

    return sendSuccess(res, { parish }, 'Parish verified');
  })
);

// ── Donation Management ───────────────────────────────────────────────────────

router.get('/donations',
  ...parishAdminGuard,
  validate(Joi.object({
    ...JoiFields.pagination(),
    parishId: JoiFields.objectId().optional(),
    status: Joi.string().valid('INITIATED','PENDING','SUCCESS','FAILED','REFUNDED','CANCELLED').optional(),
    from: Joi.date().iso().optional(),
    to:   Joi.date().iso().optional(),
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, status, parishId, from, to } = req.query;

    const filter = {};
    // parish_admin can only see their own parish
    if (req.user.role === 'parish_admin') {
      filter.parishId = req.user.parishId;
    } else if (parishId) {
      filter.parishId = parishId;
    }
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      Donation.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('userId', 'firstName lastName').lean(),
      Donation.countDocuments(filter),
    ]);

    return sendPaginated(res, data, { page, limit, total });
  })
);

// ── Audit Logs ────────────────────────────────────────────────────────────────

router.get('/audit-logs',
  ...adminGuard,
  validate(auditLogQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, action, userId, status, from, to } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 })
        .skip((page - 1) * limit).limit(limit)
        .populate('userId', 'firstName lastName email').lean(),
      AuditLog.countDocuments(filter),
    ]);

    await audit.admin(AuditLog.ACTIONS.ADMIN_DATA_EXPORTED, req.user.userId, null, null, { type: 'audit_logs', filter }, req);

    return sendPaginated(res, data, { page, limit, total });
  })
);

module.exports = router;
