'use strict';

const Joi = require('joi');
const { JoiFields } = require('../../middlewares/validate');

const register = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName:  Joi.string().trim().min(2).max(50).required(),
  email:     JoiFields.email().required(),
  phone:     JoiFields.phone().required(),
  password:  JoiFields.password().required(),
});

const login = Joi.object({
  email:    JoiFields.email().required(),
  password: Joi.string().max(128).required(), // Don't apply complexity rules on login
});

const verifyOtp = Joi.object({
  userId:  JoiFields.objectId().required(),
  otp:     JoiFields.otp().required(),
  purpose: Joi.string()
    .valid('email_verification', 'password_reset', 'phone_verification')
    .default('email_verification'),
});

const resendOtp = Joi.object({
  userId:  JoiFields.objectId().required(),
  purpose: Joi.string()
    .valid('email_verification', 'password_reset', 'phone_verification')
    .default('email_verification'),
});

const forgotPassword = Joi.object({
  email: JoiFields.email().required(),
});

const resetPassword = Joi.object({
  userId:      JoiFields.objectId().required(),
  otp:         JoiFields.otp().required(),
  newPassword: JoiFields.password().required(),
});

module.exports = { register, login, verifyOtp, resendOtp, forgotPassword, resetPassword };
