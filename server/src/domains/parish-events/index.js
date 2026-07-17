'use strict';

const Joi = require('joi');
const router = require('express').Router();
const { ParishEvent } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { NotFoundError, AuthorizationError } = require('../../shared/errors');

const parishEventSchemas = {
  create: Joi.object({
    title: Joi.string().trim().max(150).required(),
    date: Joi.date().iso().required(),
    description: Joi.string().trim().max(500).allow(null, '').optional(),
  }),
};

const parishEventRepo = {
  async create(data) {
    return ParishEvent.create(data);
  },
  async findByParish(parishId) {
    return ParishEvent.find({ parishId }).sort({ date: 1 }).lean();
  },
  async findById(id) {
    return ParishEvent.findById(id);
  },
  async remove(id) {
    return ParishEvent.findByIdAndDelete(id);
  },
};

const parishEventController = {
  async create(req, res) {
    const parishId = req.user.parishId;
    if (!parishId) throw new AuthorizationError('No parish assigned');
    const event = await parishEventRepo.create({
      parishId,
      title: req.body.title,
      date: req.body.date,
      description: req.body.description || null,
      createdBy: req.user.userId,
    });
    return sendCreated(res, { event }, 'Evenement cree');
  },

  async getForParish(req, res) {
    const events = await parishEventRepo.findByParish(req.params.parishId);
    return sendSuccess(res, { events });
  },

  async remove(req, res) {
    const event = await parishEventRepo.findById(req.params.id);
    if (!event) throw new NotFoundError('Event');
    if (req.user.role !== 'super_admin' && String(event.parishId) !== String(req.user.parishId)) {
      throw new AuthorizationError('Not your parish event');
    }
    await parishEventRepo.remove(req.params.id);
    return sendSuccess(res, {}, 'Evenement supprime');
  },
};

router.get('/parish/:parishId',
  asyncHandler(parishEventController.getForParish)
);

router.post('/',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(parishEventController.create)
);

router.delete('/:id',
  authenticate, requireVerified,
  authorize('parish_admin', 'super_admin'),
  asyncHandler(parishEventController.remove)
);

module.exports = router;
