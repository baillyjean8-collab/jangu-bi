'use strict';

const authService = require('./auth.service');
const { sendSuccess, sendCreated } = require('../../shared/utils/response');
const { getRefreshCookieOptions, clearRefreshCookieOptions } = require('../../shared/utils/jwt');

/**
 * Auth Controller — thin HTTP layer.
 * Extracts HTTP concerns (cookies, headers, status codes).
 * Delegates all logic to authService.
 */

async function register(req, res) {
  const result = await authService.register(req.body, req);
  return sendCreated(res, result, 'Account created. Please verify with the OTP sent.');
}

async function verifyOtp(req, res) {
  const result = await authService.verifyOtp(req.body, req);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());

  return sendSuccess(res, {
    accessToken: result.accessToken,
    user: result.user,
  }, 'Account verified and logged in successfully');
}

async function login(req, res) {
  const result = await authService.login(req.body, req);
  res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());
  return sendSuccess(res, {
    accessToken: result.accessToken,
    user: result.user,
  }, 'Logged in successfully');
}

async function refreshTokens(req, res) {
  const rawRefreshToken = req.cookies?.refreshToken;
  if (!rawRefreshToken) {
    return res.status(401).json({
      success: false,
      code: 'MISSING_REFRESH_TOKEN',
      message: 'No refresh token provided',
    });
  }

  const result = await authService.refreshTokens(rawRefreshToken, req);

  res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());

  return sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
}

async function logout(req, res) {
  const rawRefreshToken = req.cookies?.refreshToken;
  await authService.logout(rawRefreshToken, req.user?.userId, req);

  res.cookie('refreshToken', '', clearRefreshCookieOptions());

  return sendSuccess(res, null, 'Logged out successfully');
}

async function logoutAll(req, res) {
  await authService.logoutAll(req.user.userId, req);

  res.cookie('refreshToken', '', clearRefreshCookieOptions());

  return sendSuccess(res, null, 'Logged out from all devices');
}

async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.body, req);
  return sendSuccess(res, result);
}

async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body, req);
  return sendSuccess(res, result);
}

async function resendOtp(req, res) {
  const result = await authService.resendOtp(req.body, req);
  return sendSuccess(res, result);
}

async function me(req, res) {
  const { User } = require('../../models');
  const user = await User.findById(req.user.userId).lean();
  return sendSuccess(res, { user });
}

async function getUserById(req, res) {
  const { User } = require("../../models");
  const { id } = req.params;
  const demandeur = req.user;

  const cible = await User.findById(id).lean();
  if (!cible) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });

  const estMoi = demandeur.userId === id || demandeur.userId === cible._id?.toString();
  const estParoisse = demandeur.role === "parish_admin" || demandeur.role === "super_admin";

  if (estMoi || estParoisse) {
    return sendSuccess(res, { user: cible });
  }

  const profil_public = {
    _id: cible._id,
    firstName: cible.firstName,
    lastName: cible.lastName,
    parishId: cible.parishId,
    photo: cible.photo || null,
  };
  return sendSuccess(res, { user: profil_public });
}

async function updateMe(req, res) {
  const { User } = require("../../models");
  const champs_autorises = ["firstName","lastName","phone","parishId","photo"];
  const updates = {};
  champs_autorises.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).lean();
  return sendSuccess(res, { user }, "Profil mis à jour");
}

module.exports = {
  register,
  verifyOtp,
  login,
  refreshTokens,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  resendOtp,
  me,
  getUserById,
  updateMe,
};
