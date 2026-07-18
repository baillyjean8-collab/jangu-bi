'use strict';

const router = require('express').Router();
const { Announcement } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError } = require('../../shared/errors');

// ── Repository ─────────────────────────────────
const announcementRepo = {
  async create(data) {
    return Announcement.create(data);
  },

  async findAll({ parishId } = {}) {
    const filter = { isActive: true };
    if (parishId) filter.parishId = parishId;
    return Announcement.find(filter)
      .populate('parishId', 'name logoUrl')
      .sort({ createdAt: -1 })
      .lean();
  },

  async deleteById(id, parishId) {
    return Announcement.findOneAndUpdate(
      { _id: id, parishId },
      { $set: { isActive: false } },
      { new: true }
    );
  },
};

// ── Controller ─────────────────────────────────
const announcementController = {
  async create(req, res) {
    const { type, title, description, date, lieu, places } = req.body;
    const parishId = req.user.parishId;
    if (!parishId) throw new NotFoundError('Parish');
    const announcement = await announcementRepo.create({
      parishId, type, title, description, date, lieu, places,
    });
    return sendCreated(res, { announcement }, 'Annonce créée');
  },

  async list(req, res) {
    const { parishId } = req.query;
    const announcements = await announcementRepo.findAll({ parishId });
    const formatted = announcements.map(a => ({
      ...a,
      parishName: a.parishId?.name,
    }));
    return sendSuccess(res, { announcements: formatted });
  },

  async delete(req, res) {
    await announcementRepo.deleteById(req.params.id, req.user.parishId);
    return sendSuccess(res, {}, 'Annonce supprimée');
  },
};

// ── Routes ──────────────────────────────────────
router.get('/', asyncHandler(announcementController.list));

router.post('/',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(announcementController.create)
);

router.delete('/:id',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(announcementController.delete)
);

module.exports = { router, announcementRepo };