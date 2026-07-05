'use strict';

const crypto = require('crypto');

/**
 * OTP Generator — cryptographically secure
 * Uses crypto.randomInt() (Node 14.10+) — uniform distribution, no modulo bias.
 */

function generateOTP(digits = 6) {
  // crypto.randomInt(min, max) — max is exclusive
  const min = Math.pow(10, digits - 1);  // 100000 for 6 digits
  const max = Math.pow(10, digits);       // 1000000
  const otp = crypto.randomInt(min, max);
  return otp.toString();
}

/**
 * Format OTP for display/SMS: "123 456"
 */
function formatOTP(otp, digits = 6) {
  const half = Math.floor(digits / 2);
  return `${otp.slice(0, half)} ${otp.slice(half)}`;
}

module.exports = { generateOTP, formatOTP };
