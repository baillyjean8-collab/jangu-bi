'use strict';

/**
 * Standardized API response envelope.
 * All responses follow: { success, data, message, meta? }
 * Errors follow:        { success, code, message, errors? }
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

const sendCreated = (res, data = null, message = 'Created successfully') =>
  sendSuccess(res, data, message, 201);

const sendError = (res, message = 'An error occurred', statusCode = 500, code = 'SERVER_ERROR', errors = null) => {
  const response = { success: false, code, message };
  if (errors) response.errors = errors;
  // Never include stack traces in production
  return res.status(statusCode).json(response);
};

const sendPaginated = (res, data, pagination) =>
  sendSuccess(res, data, 'Success', 200, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1,
    },
  });

module.exports = { sendSuccess, sendCreated, sendError, sendPaginated };
