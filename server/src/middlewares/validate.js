'use strict';

const Joi = require('joi');
const { sendError } = require('../shared/utils/response');

/**
 * validate(schema, source?) — Joi validation middleware factory.
 *
 * @param {Joi.Schema} schema - Joi object schema
 * @param {'body'|'query'|'params'} source - which part of req to validate
 *
 * On validation failure: returns 400 with field-level error details.
 * On success: replaces req[source] with the validated (sanitized) value.
 *
 * Using the validated value (not raw req.body) prevents prototype pollution
 * and ensures all fields conform to expected types.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,     // collect ALL errors, not just first
      stripUnknown: true,    // silently remove undeclared fields (prevents mass assignment)
      convert: true,         // type coercion (string '123' → number 123)
    });

    if (error) {
      const fields = {};
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        fields[key] = detail.message.replace(/['"]/g, '');
      });

      return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', fields);
    }

    // Replace with validated/sanitized value
    req[source] = value;
    next();
  };
}

/**
 * Reusable Joi field definitions for consistency across schemas.
 */
const JoiFields = {
  objectId: () =>
    Joi.string()
      .pattern(/^[a-f\d]{24}$/i)
      .messages({ 'string.pattern.base': 'Invalid ID format' }),

  email: () =>
    Joi.string().email({ tlds: { allow: false } }).lowercase().trim().max(254),

  phone: () =>
    Joi.string()
      .pattern(/^\+[1-9]\d{7,14}$/)
      .messages({ 'string.pattern.base': 'Phone must be in E.164 format (e.g. +221771234567)' }),

  password: () =>
    Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      .messages({
        'string.pattern.base': 'Password must include uppercase, lowercase, and a number',
      }),

  otp: () =>
    Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .messages({ 'string.pattern.base': 'OTP must be exactly 6 digits' }),

    pagination: () => ({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(300).default(20),
  }),
};

module.exports = { validate, JoiFields };
