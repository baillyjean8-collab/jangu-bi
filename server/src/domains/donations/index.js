'use strict';

// ═══════════════════════════════════════════════
// DONATIONS DOMAIN — Single file for all layers
// ═══════════════════════════════════════════════

// ── validation.js ─────────────────────────────
const Joi = require('joi');
const { JoiFields } = require('../../middlewares/validate');

const donationSchemas = {
  create: Joi.object({
    parishId: JoiFields.objectId().required(),
    amount:   Joi.number().integer().min(100).max(10_000_000).required(),
    currency: Joi.string().valid('XOF', 'XAF', 'GNF', 'USD', 'EUR').default('XOF'),
    provider: Joi.string().valid('cinetpay', 'wave', 'orange_money', 'mtn_momo', 'free_money').required(),
    message:  Joi.string().max(200).pattern(/^[^<>]*$/).optional(),
    isAnonymous: Joi.boolean().default(false),
  }),

  listQuery: Joi.object({
    ...JoiFields.pagination(),
    status:   Joi.string().valid('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED').optional(),
    parishId: JoiFields.objectId().optional(),
  }),
};

// ── repository.js ──────────────────────────────
const { Donation, Parish } = require('../../models');

const donationRepo = {
  async create(data) {
    return Donation.create(data);
  },

  async findById(id) {
    return Donation.findById(id).read('primary').exec();
  },

  async findByIdempotencyKey(key) {
    return Donation.findOne({ idempotencyKey: key }).read('primary').exec();
  },

  async findByProviderTxId(provider, providerTransactionId) {
    return Donation.findOne({ provider, providerTransactionId })
      .select('+webhookPayloadHash')
      .read('primary')
      .exec();
  },

  async listForUser(userId, { page, limit, status }) {
    const filter = { userId, ...(status && { status }) };
    const [data, total] = await Promise.all([
      Donation.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Donation.countDocuments(filter),
    ]);
    return { data, total };
  },

  async listForParish(parishId, { page, limit, status }) {
    const filter = { parishId, ...(status && { status }) };
    const [data, total] = await Promise.all([
      Donation.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Donation.countDocuments(filter),
    ]);
    return { data, total };
  },

  async getParishStats(parishId) {
    return Donation.aggregate([
      { $match: { parishId: new (require('mongoose').Types.ObjectId)(parishId), status: 'SUCCESS' } },
      { $group: {
          _id: null,
          totalAmount: { $sum: '$netAmount' },
          totalCount: { $sum: 1 },
          avgAmount: { $avg: '$netAmount' },
      }},
    ]);
  },
};

// ── service.js ─────────────────────────────────
const crypto = require('crypto');
const config = require('../../config/env');
const { audit } = require('../../shared/utils/auditLogger');
const { AuditLog } = require('../../models');
const { NotFoundError, PaymentError, WebhookError, AuthorizationError } = require('../../shared/errors');

const donationService = {
  async initiate({ userId, parishId, amount, currency, provider, message, isAnonymous }, req) {
    // Verify parish exists and is active
    const parish = await Parish.findById(parishId).lean();
    if (!parish || !parish.isActive) throw new NotFoundError('Parish');

    const donation = await donationRepo.create({
      userId, parishId, amount, currency, provider, message, isAnonymous,
      // fees and idempotencyKey set by model (server-side)
    });

    await audit.donation(
      AuditLog.ACTIONS.DONATION_INITIATED, userId, donation._id,
      { amount, currency, provider, parishId }, req
    );

    // In production: call payment gateway here to get checkout URL
    // For MVP: return donation ID for provider redirect
    return {
      donationId: donation._id,
      idempotencyKey: donation.idempotencyKey,
      status: donation.status,
      message: 'Donation initiated. Complete payment with your provider.',
      // Production: paymentUrl: await paymentGateway.createCheckout(donation)
    };
  },

  async getMyDonation(donationId, userId) {
    const donation = await donationRepo.findById(donationId);
    if (!donation) throw new NotFoundError('Donation');
    // Users can only see their own donations
    if (donation.userId.toString() !== userId) throw new AuthorizationError();
    return donation;
  },

  async listMyDonations(userId, query) {
    return donationRepo.listForUser(userId, query);
  },

  /**
   * handleWebhook — called by /api/donations/webhook/:provider
   * Verifies HMAC signature, idempotency, then transitions status.
   */
  async handleWebhook(provider, rawBody, signature, payload) {
    // 1. Verify signature
    verifyWebhookSignature(provider, rawBody, signature);

    // 2. Extract provider transaction ID from payload
    const providerTxId = extractProviderTxId(provider, payload);
    if (!providerTxId) {
      await audit.webhook(AuditLog.ACTIONS.WEBHOOK_REJECTED, { provider, reason: 'missing_tx_id' }, 'failure');
      throw new WebhookError('Missing transaction ID in webhook payload');
    }

    // 3. Find donation — idempotency check
    const donation = await donationRepo.findByProviderTxId(provider, providerTxId);
    if (!donation) {
      // Unknown transaction — log and acknowledge (don't error — provider will retry)
      await audit.webhook(AuditLog.ACTIONS.WEBHOOK_RECEIVED, { provider, providerTxId, reason: 'unknown_tx' }, 'warning');
      return { acknowledged: true };
    }

    // 4. Idempotency: already in terminal state — acknowledge without re-processing
    if (['SUCCESS', 'FAILED', 'REFUNDED'].includes(donation.status)) {
      return { acknowledged: true, idempotent: true };
    }

    await audit.webhook(AuditLog.ACTIONS.WEBHOOK_RECEIVED, { provider, providerTxId, donationId: donation._id });

    // 5. Hash and store webhook payload for deduplication
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    if (donation.webhookPayloadHash === payloadHash) {
      return { acknowledged: true, duplicate: true };
    }
    donation.webhookPayloadHash = payloadHash;
    donation.webhookReceivedAt = new Date();
    donation.providerTransactionId = providerTxId;

    // 6. Transition status based on provider outcome
    const isSuccess = extractProviderSuccess(provider, payload);
    const newStatus = isSuccess ? 'SUCCESS' : 'FAILED';
    const fees = extractProviderFees(provider, payload);
    if (fees !== null) donation.fees = fees;

    await donation.transitionStatus(newStatus, 'webhook', `Provider: ${provider}`);

    // 7. Update parish stats on success
    if (newStatus === 'SUCCESS') {
      await Parish.incrementDonationStats(donation.parishId, donation.netAmount);
    }

    await audit.webhook(
      newStatus === 'SUCCESS' ? AuditLog.ACTIONS.DONATION_SUCCESS : AuditLog.ACTIONS.DONATION_FAILED,
      { provider, providerTxId, donationId: donation._id, amount: donation.amount }
    );

    return { acknowledged: true, status: newStatus };
  },
};

// ── Webhook helpers ────────────────────────────────────────────────────────────

function verifyWebhookSignature(provider, rawBody, signature) {
  const secrets = {
    cinetpay:     config.payment.cinetpaySecret,
    wave:         config.payment.waveSecretKey,
    orange_money: config.payment.orangeMoneySecret,
  };

  const secret = secrets[provider];
  if (!secret) throw new WebhookError(`Unknown provider: ${provider}`);
  if (!signature) throw new WebhookError('Missing webhook signature header');

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const sigBuffer = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new WebhookError('Webhook signature verification failed');
  }
}

function extractProviderTxId(provider, payload) {
  const map = { cinetpay: payload?.transaction_id, wave: payload?.id, orange_money: payload?.txnid };
  return map[provider] || null;
}

function extractProviderSuccess(provider, payload) {
  const map = { cinetpay: payload?.status === 'ACCEPTED', wave: payload?.status === 'succeeded', orange_money: payload?.status === 'SUCCESS' };
  return map[provider] ?? false;
}

function extractProviderFees(provider, payload) {
  const map = { cinetpay: payload?.fees, wave: payload?.fee, orange_money: null };
  const fee = map[provider];
  return typeof fee === 'number' ? Math.round(fee) : null;
}

// ── controller.js ──────────────────────────────
const { sendSuccess, sendCreated, sendPaginated } = require('../../shared/utils/response');

const donationController = {
  async initiate(req, res) {
    const result = await donationService.initiate({ ...req.body, userId: req.user.userId }, req);
    return sendCreated(res, result, 'Donation initiated');
  },

  async getMyDonation(req, res) {
    const donation = await donationService.getMyDonation(req.params.id, req.user.userId);
    return sendSuccess(res, { donation });
  },

  async listMyDonations(req, res) {
    const { data, total } = await donationService.listMyDonations(req.user.userId, req.query);
    return sendPaginated(res, data, { ...req.query, total });
  },

  // Raw body required for signature verification — must be string, not parsed JSON
  async webhook(req, res) {
    const { provider } = req.params;
    const rawBody = req.rawBody; // set by express.raw() in app.js for /webhook routes
    const signature = req.headers['x-webhook-signature'] || req.headers['x-cinetpay-signature'];

    const result = await donationService.handleWebhook(provider, rawBody, signature, req.body);
    return sendSuccess(res, result, 'Webhook acknowledged');
  },
};

// ── routes.js ──────────────────────────────────
const router = require('express').Router();
const { validate } = require('../../middlewares/validate');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { donationRateLimiter } = require('../../middlewares/rateLimiter');
const { asyncHandler } = require('../../middlewares/errorHandler');

router.post('/',
  authenticate,
  requireVerified,
  donationRateLimiter,
  validate(donationSchemas.create),
  asyncHandler(donationController.initiate)
);

router.get('/mine',
  authenticate,
  validate(donationSchemas.listQuery, 'query'),
  asyncHandler(donationController.listMyDonations)
);

router.get('/:id',
  authenticate,
  asyncHandler(donationController.getMyDonation)
);

// Webhook — no auth (provider calls this), raw body preserved
router.post('/webhook/:provider',
  asyncHandler(donationController.webhook)
);

module.exports = { router, donationService, donationRepo };
