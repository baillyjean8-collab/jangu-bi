'use strict';

const { AuditLog } = require('../../models');

/**
 * Audit Logger — fire-and-forget with error isolation.
 * Audit failures NEVER propagate to the caller.
 * Financial and security events are always logged.
 */

/**
 * Extract safe client info from Express request.
 * Handles proxy trust for X-Forwarded-For.
 */
function extractRequestContext(req) {
  // req.ip respects 'trust proxy' Express setting
  const ip = req?.ip || req?.connection?.remoteAddress || null;
  const rawUA = req?.headers?.['user-agent'] || null;
  // Truncate to match schema maxlength
  const userAgent = rawUA ? rawUA.slice(0, 500) : null;
  return { ipAddress: ip, userAgent };
}

/**
 * Log an audit event.
 * @param {Object} params
 * @param {string} params.action       - AuditLog.ACTIONS constant
 * @param {string|null} params.userId  - ObjectId of actor (null for system/anonymous)
 * @param {string|null} params.targetId
 * @param {string|null} params.targetModel
 * @param {'success'|'failure'|'warning'} params.status
 * @param {Object} params.metadata     - Context (sanitized before DB insert by schema)
 * @param {Object|null} params.req     - Express request (for IP + UA extraction)
 */
async function auditLog({
  action,
  userId = null,
  targetId = null,
  targetModel = null,
  status = 'success',
  metadata = {},
  req = null,
}) {
  try {
    const { ipAddress, userAgent } = extractRequestContext(req);

    await AuditLog.create({
      action,
      userId,
      targetId,
      targetModel,
      status,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    // NEVER throw from audit logger — log to stderr but don't break the request
    console.error('[AuditLog] Failed to write audit record:', err.message, { action, userId });
  }
}

/**
 * Convenience wrappers for common patterns.
 */
const audit = {
  auth: (action, userId, req, metadata = {}, status = 'success') =>
    auditLog({ action, userId, req, metadata, status }),

  donation: (action, userId, donationId, metadata = {}, req = null) =>
    auditLog({
      action,
      userId,
      targetId: donationId,
      targetModel: 'Donation',
      metadata,
      req,
    }),

  webhook: (action, metadata, status = 'success') =>
    auditLog({ action, metadata, status }),

  admin: (action, adminId, targetId, targetModel, metadata = {}, req = null) =>
    auditLog({ action, userId: adminId, targetId, targetModel, metadata, req }),

  live: (action, userId, liveId, req = null) =>
    auditLog({ action, userId, targetId: liveId, targetModel: 'Live', req }),
};

module.exports = { auditLog, audit };
