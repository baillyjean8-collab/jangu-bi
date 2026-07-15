'use strict';

// ═══════════════════════════════════════════════
// LIVE DOMAIN
// ═══════════════════════════════════════════════

// ── Validation ─────────────────────────────────────────────────────────────────
const Joi = require('joi');
const { JoiFields } = require('../../middlewares/validate');

const liveSchemas = {
  start: Joi.object({
    parishId:    JoiFields.objectId().required(),
    title:       Joi.string().trim().max(150).optional(),
    description: Joi.string().trim().max(500).optional(),
    streamUrl:   Joi.string().uri({ scheme: ['https', 'http', 'rtmp', 'rtmps'] }).optional(),
    goal:        Joi.string().trim().max(200).allow(null, '').optional(),
    coverUrl:    Joi.string().allow(null, '').optional(),
  }),

  schedule: Joi.object({
    parishId:    JoiFields.objectId().required(),
    title:       Joi.string().trim().max(150).optional(),
    goal:        Joi.string().trim().max(200).allow(null, '').optional(),
    coverUrl:    Joi.string().allow(null, '').optional(),
    scheduledAt: Joi.date().iso().required(),
  }),

  end: Joi.object({
    liveId: JoiFields.objectId().required(),
  }),

  reaction: Joi.object({
    type: Joi.string().valid('amen', 'praise', 'heart', 'fire').required(),
  }),

  historyQuery: Joi.object({
    ...JoiFields.pagination(),
    parishId: JoiFields.objectId().optional(),
  }),
};

// ── Repository ─────────────────────────────────────────────────────────────────
const { Live, Parish } = require('../../models');
const { AccessToken } = require('livekit-server-sdk');
const config = require('../../config/env');
const guestRegistry = require('../../realtime/guestRegistry');

const liveRepo = {
  async create(data) {
    return Live.create(data);
  },

  async findById(id) {
    return Live.findById(id).exec();
  },

  async findByIdPopulated(id) {
    return Live.findById(id).populate('parishId', 'name logoUrl').lean().exec();
  },

  async findActiveByParish(parishId) {
    return Live.findOne({ parishId, isActive: true }).exec();
  },

  async findScheduledByParish(parishId) {
    return Live.findOne({ parishId, isScheduled: true }).lean().exec();
  },

  async findUpcoming() {
    return Live.find({ isScheduled: true, scheduledAt: { $gte: new Date() } })
      .populate('parishId', 'name logoUrl location')
      .sort({ scheduledAt: 1 })
      .lean()
      .exec();
  },

  async findAllActive() {
    return Live.find({ isActive: true })
      .populate('parishId', 'name logoUrl location')
      .sort({ 'currentViewerCount': -1 })
      .lean()
      .exec();
  },

  async history({ page, limit, parishId }) {
    const filter = { isActive: false };
    if (parishId) filter.parishId = parishId;
    const [data, total] = await Promise.all([
      Live.find(filter)
        .sort({ startedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Live.countDocuments(filter),
    ]);
    return { data, total };
  },

  async atomicViewerJoin(liveId) {
    return Live.atomicViewerUpdate(liveId, +1);
  },

  async atomicViewerLeave(liveId) {
    return Live.atomicViewerUpdate(liveId, -1);
  },

  async atomicReaction(liveId, type) {
    const field = `reactionCounts.${type}`;
    return Live.findByIdAndUpdate(
      liveId,
      { $inc: { [field]: 1 } },
      { new: true, select: 'reactionCounts' }
    ).exec();
  },
};

// ── Service ────────────────────────────────────────────────────────────────────
const { audit } = require('../../shared/utils/auditLogger');
const { AuditLog } = require('../../models');
const {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  AppError,
} = require('../../shared/errors');

const liveService = {
  async startSession({ parishId, title, description, streamUrl, goal, coverUrl }, adminId, req) {
    // Verify parish belongs to this admin (or super_admin bypasses)
    const parish = await Parish.findById(parishId).lean();
    if (!parish || !parish.isActive) throw new NotFoundError('Parish');

    // Check no active session already exists (enforced by DB unique partial index too)
    const existing = await liveRepo.findActiveByParish(parishId);
    if (existing) {
      throw new ConflictError('A live session is already active for this parish');
    }

    const session = await liveRepo.create({
      parishId,
      startedBy: adminId,
      title: title || `Service en direct — ${parish.name}`,
      description,
      streamUrl,
      goal: goal || null,
      coverUrl: coverUrl || null,
    });

    await audit.live(AuditLog.ACTIONS.LIVE_STARTED, adminId, session._id, req);

    return session;
  },

  async scheduleSession({ parishId, title, goal, coverUrl, scheduledAt }, adminId, req) {
    const parish = await Parish.findById(parishId).lean();
    if (!parish || !parish.isActive) throw new NotFoundError('Parish');

    const existingScheduled = await liveRepo.findScheduledByParish(parishId);
    if (existingScheduled) {
      throw new ConflictError('A live session is already scheduled for this parish');
    }

    const session = await liveRepo.create({
      parishId,
      startedBy: adminId,
      title: title || `Service en direct — ${parish.name}`,
      goal: goal || null,
      coverUrl: coverUrl || null,
      scheduledAt,
      isScheduled: true,
      isActive: false,
    });

    await audit.live(AuditLog.ACTIONS.LIVE_STARTED, adminId, session._id, req);

    return session;
  },

  async activateScheduled(liveId, adminId, adminRole, req) {
    const session = await liveRepo.findById(liveId);
    if (!session) throw new NotFoundError('Live session');
    if (adminRole !== 'super_admin' && String(session.startedBy) !== String(adminId)) {
      throw new AuthorizationError('Only the admin who scheduled this live can start it');
    }

    const existing = await liveRepo.findActiveByParish(session.parishId);
    if (existing) {
      throw new ConflictError('A live session is already active for this parish');
    }

    session.isScheduled = false;
    session.isActive = true;
    session.startedAt = new Date();
    await session.save();

    await audit.live(AuditLog.ACTIONS.LIVE_STARTED, adminId, session._id, req);

    return session;
  },

  async getScheduledForParish(parishId) {
    return liveRepo.findScheduledByParish(parishId);
  },

  async getUpcoming() {
    return liveRepo.findUpcoming();
  },

  async endSession(liveId, adminId, adminRole, req) {
    const session = await liveRepo.findById(liveId);
    if (!session) throw new NotFoundError('Live session');
    if (!session.isActive) throw new AppError('Session is already ended', 400, 'ALREADY_ENDED');

    // Only the admin who started it (or super_admin) can end it
    if (adminRole !== 'super_admin' && session.startedBy.toString() !== adminId) {
      throw new AuthorizationError('Only the admin who started this session can end it');
    }

    await session.endSession(); // saves internally

    await audit.live(AuditLog.ACTIONS.LIVE_ENDED, adminId, session._id, req);

    return session;
  },

  async getActiveSession(parishId) {
    const session = await liveRepo.findActiveByParish(parishId);
    if (!session) throw new NotFoundError('Active live session');
    return session;
  },

  async getAllActive() {
    return liveRepo.findAllActive();
  },

  async getById(liveId) {
    const session = await liveRepo.findByIdPopulated(liveId);
    if (!session) throw new NotFoundError('Live session');
    return session;
  },

  async setPaused(liveId, userId, userRole, valeur) {
    const session = await liveRepo.findById(liveId);
    if (!session) throw new NotFoundError('Live session');
    if (!session.isActive) throw new AppError('Cette session est terminee', 400, 'SESSION_ENDED');
    if (userRole !== 'super_admin' && String(session.startedBy) !== String(userId)) {
      throw new AuthorizationError('Seul l administrateur qui a lance ce direct peut le mettre en pause');
    }
    session.isPaused = valeur;
    await session.save();
    return session;
  },

  async generateToken(liveId, userId, userRole) {
    const session = await liveRepo.findById(liveId);
    if (!session) throw new NotFoundError('Live session');
    if (!session.isActive) throw new AppError('Cette session est terminee', 400, 'SESSION_ENDED');

    const isBroadcaster = (userRole === 'parish_admin' || userRole === 'super_admin') &&
      String(session.startedBy) === String(userId);
    const isApprovedGuest = guestRegistry.isApproved(String(session._id), userId);

    const at = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
      identity: String(userId),
      ttl: '4h',
    });
    at.addGrant({
      room: String(session._id),
      roomJoin: true,
      canPublish: isBroadcaster || isApprovedGuest,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return { token, url: config.livekit.url, isBroadcaster };
  },

  async getHistory(query) {
    return liveRepo.history(query);
  },

  // Called from Socket.io layer when user joins a room
  async viewerJoined(liveId) {
    return liveRepo.atomicViewerJoin(liveId);
  },

  // Called from Socket.io layer when user leaves
  async viewerLeft(liveId) {
    return liveRepo.atomicViewerLeave(liveId);
  },

  // Called from Socket.io layer for reactions — returns safe display string
  async addReaction(liveId, type) {
    const DISPLAY_MESSAGES = {
      amen:   'A faithful sent Amen 🙏',
      praise: 'A faithful sent Praise 🎉',
      heart:  'A faithful sent Love ❤️',
      fire:   'A faithful sent Fire 🔥',
    };

    const allowed = ['amen', 'praise', 'heart', 'fire'];
    if (!allowed.includes(type)) {
      throw new AppError(`Invalid reaction type: ${type}`, 400, 'INVALID_REACTION');
    }

    await liveRepo.atomicReaction(liveId, type);

    // NEVER return user identity — only the anonymous display string
    return { display: DISPLAY_MESSAGES[type], type };
  },
};

// ── Controller ─────────────────────────────────────────────────────────────────
const { sendSuccess, sendCreated, sendPaginated } = require('../../shared/utils/response');

const liveController = {
  async start(req, res) {
    const session = await liveService.startSession(req.body, req.user.userId, req);
    return sendCreated(res, { session }, 'Live session started');
  },

  async end(req, res) {
    const session = await liveService.endSession(
      req.params.id,
      req.user.userId,
      req.user.role,
      req
    );
    return sendSuccess(res, { session }, 'Live session ended');
  },

  async getActive(req, res) {
    const session = await liveService.getActiveSession(req.params.parishId);
    return sendSuccess(res, { session });
  },

  async getAllActive(req, res) {
    const sessions = await liveService.getAllActive();
    return sendSuccess(res, { sessions, count: sessions.length });
  },

  async getUpcoming(req, res) {
    const sessions = await liveService.getUpcoming();
    return sendSuccess(res, { sessions, count: sessions.length });
  },

  async schedule(req, res) {
    const session = await liveService.scheduleSession(req.body, req.user.userId, req);
    return sendCreated(res, { session }, 'Live schedule');
  },

  async activate(req, res) {
    const session = await liveService.activateScheduled(req.params.id, req.user.userId, req.user.role, req);
    return sendSuccess(res, { session }, 'Live active');
  },

  async getScheduledForParish(req, res) {
    const session = await liveService.getScheduledForParish(req.params.parishId);
    return sendSuccess(res, { session });
  },

  async getById(req, res) {
    const session = await liveService.getById(req.params.id);
    return sendSuccess(res, { session });
  },

  async getToken(req, res) {
    const result = await liveService.generateToken(req.params.id, req.user.userId, req.user.role);
    return sendSuccess(res, result);
  },

  async pause(req, res) {
    const session = await liveService.setPaused(req.params.id, req.user.userId, req.user.role, true);
    return sendSuccess(res, { session }, 'Live mis en pause');
  },

  async resume(req, res) {
    const session = await liveService.setPaused(req.params.id, req.user.userId, req.user.role, false);
    return sendSuccess(res, { session }, 'Live repris');
  },

  async getHistory(req, res) {
    const { data, total } = await liveService.getHistory(req.query);
    return sendPaginated(res, data, { ...req.query, total });
  },
};

// ── Routes ──────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const { validate } = require('../../middlewares/validate');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');

// Public — anyone can see active sessions
router.get('/active', asyncHandler(liveController.getAllActive));
router.get('/parish/:parishId/active', asyncHandler(liveController.getActive));
router.get('/history',
  validate(liveSchemas.historyQuery, 'query'),
  asyncHandler(liveController.getHistory)
);

router.get('/:id', asyncHandler(liveController.getById));

router.post('/:id/token',
  authenticate, requireVerified,
  asyncHandler(liveController.getToken)
);

router.post('/:id/pause',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(liveController.pause)
);

router.post('/:id/resume',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(liveController.resume)
);

// Parish admin or super_admin — manage sessions
router.get('/upcoming', asyncHandler(liveController.getUpcoming));

router.get('/parish/:parishId/scheduled',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(liveController.getScheduledForParish)
);

router.post('/start',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  validate(liveSchemas.start),
  asyncHandler(liveController.start)
);

router.post('/schedule',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  validate(liveSchemas.schedule),
  asyncHandler(liveController.schedule)
);

router.post('/:id/activate',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(liveController.activate)
);

router.post('/:id/end',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(liveController.end)
);

module.exports = { router, liveService, liveRepo };
