'use strict';

// ═══════════════════════════════════════════════
// USERS DOMAIN
// ═══════════════════════════════════════════════

// ── Validation ─────────────────────────────────────────────────────────────────
const Joi = require('joi');
const { JoiFields } = require('../../middlewares/validate');

const userSchemas = {
  updateProfile: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).optional(),
    lastName:  Joi.string().trim().min(2).max(50).optional(),
    phone:     JoiFields.phone().optional(),
  }).min(1),

  changePassword: Joi.object({
    currentPassword: Joi.string().max(128).required(),
    newPassword:     JoiFields.password().required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  }),

  joinParish: Joi.object({
    parishId: JoiFields.objectId().required(),
  }),
};

// ── Repository ─────────────────────────────────────────────────────────────────
const { User, Parish, Donation } = require('../../models');
const bcrypt = require('bcryptjs');

const userRepo = {
  async findById(id) {
    return User.findById(id).exec();
  },

  async findByIdLean(id) {
    return User.findById(id).lean().exec();
  },

  async findByIdWithPassword(id) {
    return User.findById(id).select('+password').exec();
  },

  async updateProfile(userId, updates) {
    return User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean().exec();
  },

  async updatePassword(userId, hashedPassword) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { password: hashedPassword } },
      { new: true }
    ).exec();
  },

  async setParish(userId, parishId) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { parishId } },
      { new: true }
    ).lean().exec();
  },

  async updateAvatar(userId, avatarUrl) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl } },
      { new: true }
    ).lean().exec();
  },

  async getDonationSummary(userId) {
    return Donation.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), status: 'SUCCESS' } },
      {
        $group: {
          _id: '$parishId',
          totalAmount: { $sum: '$netAmount' },
          count:       { $sum: 1 },
          lastDonation:{ $max: '$createdAt' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);
  },
};

// ── Service ────────────────────────────────────────────────────────────────────
const { audit } = require('../../shared/utils/auditLogger');
const { AuditLog } = require('../../models');
const {
  NotFoundError,
  AuthenticationError,
  ConflictError,
  AuthorizationError,
  ValidationError,
} = require('../../shared/errors');

const userService = {
  async getProfile(userId) {
    const user = await userRepo.findByIdLean(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async updateProfile(userId, updates, req) {
    // If phone is being updated, check for conflicts
    if (updates.phone) {
      const existing = await User.findOne({ phone: updates.phone, _id: { $ne: userId } }).lean();
      if (existing) throw new ConflictError('Phone number is already in use');
    }

    const user = await userRepo.updateProfile(userId, updates);
    if (!user) throw new NotFoundError('User');

    await audit.admin(
      AuditLog.ACTIONS.ADMIN_USER_UPDATED,
      userId, userId, 'User',
      { fields: Object.keys(updates) }, req
    );

    return user;
  },

  async updateAvatar(userId, avatarUrl, req) {
    const user = await userRepo.updateAvatar(userId, avatarUrl);
    if (!user) throw new NotFoundError('User');

    await audit.admin(
      AuditLog.ACTIONS.ADMIN_USER_UPDATED,
      userId, userId, 'User',
      { fields: ['avatarUrl'] }, req
    );

    return user;
  },

  async changePassword(userId, { currentPassword, newPassword }, req) {
    const user = await userRepo.findByIdWithPassword(userId);
    if (!user) throw new NotFoundError('User');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);
    await userRepo.updatePassword(userId, hashed);

    // Revoke all refresh tokens — force re-login everywhere
    const { RefreshToken } = require('../../models');
    await RefreshToken.revokeAllForUser(userId, 'logout');

    await audit.auth(AuditLog.ACTIONS.AUTH_PASSWORD_RESET, userId, req, { selfService: true });

    return { message: 'Password changed. Please log in again on all devices.' };
  },

  async joinParish(userId, parishId, req) {
    const user = await userRepo.findByIdLean(userId);
    if (!user) throw new NotFoundError('User');

    if (user.parishId?.toString() === parishId) {
      throw new ConflictError('You are already a member of this parish');
    }

    const parish = await Parish.findById(parishId).lean();
    if (!parish || !parish.isActive || !parish.isVerified) {
      throw new NotFoundError('Parish');
    }

    // Decrement old parish member count if switching
    if (user.parishId) {
      await Parish.incrementMemberCount(user.parishId, -1);
    }

    const updated = await userRepo.setParish(userId, parishId);
    await Parish.incrementMemberCount(parishId, +1);

    return updated;
  },

  async getDonationHistory(userId) {
    return userRepo.getDonationSummary(userId);
  },
};

// ── Controller ─────────────────────────────────────────────────────────────────
const { sendSuccess } = require('../../shared/utils/response');

const userController = {
  async getProfile(req, res) {
    const user = await userService.getProfile(req.user.userId);
    return sendSuccess(res, { user });
  },

  async updateProfile(req, res) {
    const user = await userService.updateProfile(req.user.userId, req.body, req);
    return sendSuccess(res, { user }, 'Profile updated successfully');
  },

  async uploadAvatar(req, res) {
    if (!req.file) {
      throw new ValidationError('No file uploaded. Field name must be "avatar".');
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await userService.updateAvatar(req.user.userId, avatarUrl, req);
    return sendSuccess(res, { user, avatarUrl }, 'Avatar updated successfully');
  },

  async changePassword(req, res) {
    const result = await userService.changePassword(req.user.userId, req.body, req);
    return sendSuccess(res, result);
  },

  async joinParish(req, res) {
    const user = await userService.joinParish(req.user.userId, req.body.parishId, req);
    return sendSuccess(res, { user }, 'Successfully joined parish');
  },

  async getDonationHistory(req, res) {
    const summary = await userService.getDonationHistory(req.user.userId);
    return sendSuccess(res, { summary });
  },
};

// ── Routes ──────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const { validate } = require('../../middlewares/validate');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { uploadAvatar } = require('../../middlewares/uploadAvatar');
const multer = require('multer');
const { asyncHandler } = require('../../middlewares/errorHandler');

// All user routes require authentication
router.use(authenticate);

router.get('/me',             asyncHandler(userController.getProfile));
router.patch('/me',           validate(userSchemas.updateProfile), asyncHandler(userController.updateProfile));
router.post('/me/avatar', (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      if (err.message === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type. Only JPEG, PNG, and WebP images are allowed.',
        });
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 3 MB.',
          });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      return next(err);
    }
    next();
  });
}, asyncHandler(userController.uploadAvatar));
router.post('/me/password',   validate(userSchemas.changePassword), asyncHandler(userController.changePassword));
router.post('/me/join-parish',requireVerified, validate(userSchemas.joinParish), asyncHandler(userController.joinParish));
router.get('/me/donations',   asyncHandler(userController.getDonationHistory));
// ── Follow / Notifications ──────────────────────────────────────────────────
router.post('/me/follow/:parishId', asyncHandler(async (req, res) => {
  const { parishId } = req.params;
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { $addToSet: { followedParishes: parishId } },
    { new: true }
  ).lean();
  return sendSuccess(res, { followedParishes: user.followedParishes }, 'Paroisse suivie');
}));

router.post('/me/unfollow/:parishId', asyncHandler(async (req, res) => {
  const { parishId } = req.params;
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { $pull: { followedParishes: parishId, notificationsEnabled: parishId } },
    { new: true }
  ).lean();
  return sendSuccess(res, { followedParishes: user.followedParishes }, 'Paroisse retirée');
}));

router.post('/me/notify/:parishId', asyncHandler(async (req, res) => {
  const { parishId } = req.params;
  const user = await User.findById(req.user.userId).lean();
  const hasNotif = user.notificationsEnabled?.map(id => id.toString()).includes(parishId);
  const updated = await User.findByIdAndUpdate(
    req.user.userId,
    hasNotif
      ? { $pull: { notificationsEnabled: parishId } }
      : { $addToSet: { notificationsEnabled: parishId } },
    { new: true }
  ).lean();
  return sendSuccess(res, {
    notificationsEnabled: updated.notificationsEnabled,
    active: !hasNotif,
  }, hasNotif ? 'Notifications désactivées' : 'Notifications activées');
}));


// ── Mes demandes ─────────────────────────────────────────────
router.get('/me/demandes', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const Post = require('../../models/Post');
  const demandes = await Post.find({
    userId: req.user.userId,
    type: 'INSCRIPTION'
  }).sort({ createdAt: -1 }).lean();
  return sendSuccess(res, demandes);
}));

module.exports = { router, userService, userRepo };
