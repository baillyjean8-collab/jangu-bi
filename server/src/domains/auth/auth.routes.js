'use strict';

const router = require('express').Router();
const controller = require('./auth.controller');
const schemas = require('./auth.validation');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const { authRateLimiter, otpRateLimiter } = require('../../middlewares/rateLimiter');
const { asyncHandler } = require('../../middlewares/errorHandler');

/**
 * Auth Routes
 * POST /api/auth/register       — public
 * POST /api/auth/login          — public
 * POST /api/auth/verify-otp     — public
 * POST /api/auth/resend-otp     — public + OTP rate limit
 * POST /api/auth/refresh        — public (uses httpOnly cookie)
 * POST /api/auth/logout         — authenticated
 * POST /api/auth/logout-all     — authenticated
 * POST /api/auth/forgot-password— public
 * POST /api/auth/reset-password — public
 * GET  /api/auth/me             — authenticated
 */

router.post('/register',
  authRateLimiter,
  validate(schemas.register),
  asyncHandler(controller.register)
);

router.post('/login',
  authRateLimiter,
  validate(schemas.login),
  asyncHandler(controller.login)
);

router.post('/verify-otp',
  authRateLimiter,
  validate(schemas.verifyOtp),
  asyncHandler(controller.verifyOtp)
);

router.post('/resend-otp',
  otpRateLimiter,
  validate(schemas.resendOtp),
  asyncHandler(controller.resendOtp)
);

// httpOnly cookie read — no body needed
router.post('/refresh',
  asyncHandler(controller.refreshTokens)
);

router.post('/logout',
  authenticate,
  asyncHandler(controller.logout)
);

router.post('/logout-all',
  authenticate,
  asyncHandler(controller.logoutAll)
);

router.post('/forgot-password',
  authRateLimiter,
  validate(schemas.forgotPassword),
  asyncHandler(controller.forgotPassword)
);

router.post('/reset-password',
  authRateLimiter,
  validate(schemas.resetPassword),
  asyncHandler(controller.resetPassword)
);

router.get('/me',
  authenticate,
  asyncHandler(controller.me)
);

router.put('/me',
  authenticate,
  asyncHandler(controller.updateMe)
);

router.get('/users/:id',
  authenticate,
  asyncHandler(controller.getUserById)
);

module.exports = router;
