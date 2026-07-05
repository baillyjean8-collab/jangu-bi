'use strict';

const { verifyAccessToken } = require('../shared/utils/jwt');
const { User } = require('../models');
const { AuthenticationError } = require('../shared/errors');

/**
 * authenticate — verifies JWT access token from Authorization header.
 * Attaches req.user = { userId, role, isVerified, parishId }
 *
 * Does NOT verify from cookie — access tokens are Bearer only.
 * Refresh tokens live in httpOnly cookie (handled by /auth/refresh).
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No access token provided');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AuthenticationError('Malformed authorization header');
    }

    const decoded = verifyAccessToken(token);

    // Minimal DB check — verify user still exists and is active
    // Use lean() for performance; re-select only what we need
    const user = await User.findById(decoded.sub)
      .select('_id role isVerified isActive parishId')
      .lean()
      .read('primary'); // always read from primary for auth

    if (!user) throw new AuthenticationError('User account not found');
    if (!user.isActive) throw new AuthenticationError('Account has been deactivated');

    // Attach minimal user context to request — never the full user object
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
      parishId: user.parishId ? user.parishId.toString() : null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireVerified — must be chained after authenticate.
 * Rejects requests from unverified accounts (OTP not completed).
 */
function requireVerified(req, res, next) {
  if (!req.user?.isVerified) {
    return next(new AuthenticationError('Email verification required. Please verify your OTP.'));
  }
  next();
}

module.exports = { authenticate, requireVerified };
