'use strict';

const { AuthorizationError } = require('../shared/errors');

/**
 * Role hierarchy — higher roles include all lower role permissions.
 */
const ROLE_HIERARCHY = {
  user: 0,
  parish_admin: 1,
  super_admin: 2,
};

/**
 * authorize(...roles) — RBAC middleware factory.
 * Usage: router.get('/admin', authenticate, authorize('super_admin'), handler)
 *        router.get('/parish', authenticate, authorize('parish_admin', 'super_admin'), handler)
 *
 * Must be used AFTER authenticate middleware.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required before authorization check'));
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return next(
        new AuthorizationError(
          `Role "${userRole}" is not authorized. Required: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
}

/**
 * authorizeMinRole(minRole) — allows the given role AND any higher role.
 * E.g. authorizeMinRole('parish_admin') allows parish_admin AND super_admin.
 */
function authorizeMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 999;

    if (userLevel < requiredLevel) {
      return next(new AuthorizationError(`Minimum role required: ${minRole}`));
    }

    next();
  };
}

/**
 * authorizeParishAccess — ensures a parish_admin only accesses their own parish.
 * super_admin bypasses this check.
 * Requires req.user and req.params.parishId (or req.body.parishId).
 */
function authorizeParishAccess(req, res, next) {
  if (!req.user) return next(new AuthorizationError('Authentication required'));

  if (req.user.role === 'super_admin') return next();

  const targetParishId = req.params.parishId || req.body.parishId;
  if (!targetParishId) return next(new AuthorizationError('Parish ID required'));

  if (req.user.parishId !== targetParishId.toString()) {
    return next(new AuthorizationError('You can only access your own parish'));
  }

  next();
}

module.exports = { authorize, authorizeMinRole, authorizeParishAccess };
