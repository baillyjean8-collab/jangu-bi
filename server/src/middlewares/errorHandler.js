'use strict';

const config = require('../config/env');
const { sendError } = require('../shared/utils/response');
const { AppError } = require('../shared/errors');

/**
 * Global error handler — must be registered LAST in Express middleware chain.
 * Normalizes all errors into consistent API response format.
 * Never leaks stack traces or internal messages in production.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Already responded — pass through
  if (res.headersSent) return next(err);

  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let code = 'SERVER_ERROR';
  let errors = null;

  // ── Operational errors (our AppError subclasses) ───────────────────────────
  if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    if (err.fields) errors = err.fields;
  }

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = {};
    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });
  }

  // ── Mongoose Duplicate Key ─────────────────────────────────────────────────
  else if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} is already in use`;
  }

  // ── JWT errors (shouldn't reach here — caught in middleware, but safety net) ─
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'AUTHENTICATION_ERROR';
    message = 'Invalid or expired token';
  }

  // ── Mongoose Cast Error (invalid ObjectId) ─────────────────────────────────
  else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid value for field: ${err.path}`;
  }

  // ── Log unhandled/programmer errors ───────────────────────────────────────
  if (statusCode === 500) {
    console.error('[ErrorHandler] Unhandled error:', {
      name: err.name,
      message: err.message,
      path: req.path,
      method: req.method,
      // Stack in development only
      ...(config.isDevelopment && { stack: err.stack }),
    });
  }

  // ── In production, never expose internal error messages ────────────────────
  if (!err.isOperational && config.isProduction) {
    message = 'An unexpected error occurred';
  }

  return sendError(res, message, statusCode, code, errors);
}

/**
 * Catch-all for undefined routes.
 */
function notFoundHandler(req, res) {
  sendError(res, `Route not found: ${req.method} ${req.path}`, 404, 'ROUTE_NOT_FOUND');
}

/**
 * Async wrapper — eliminates try/catch boilerplate in controllers.
 * Usage: router.get('/path', asyncHandler(myController))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, notFoundHandler, asyncHandler };
