'use strict';
const router = require('express').Router();
const mongoose = require('mongoose');
const { User, Post, Donation } = require('../../models');
const { authenticate, requireVerified } = require('../../middlewares/authenticate');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../shared/utils/response');

router.get('/', authenticate, requireVerified, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId).select('parishId followedParishes').lean();
  const parishes = [...(user.followedParishes || [])];
  if (user.parishId) parishes.push(user.parishId);

  const [recentPosts, recentDons] = await Promise.all([
    Post.find({ parishId: { $in: parishes } }).sort({ createdAt: -1 }).limit(10)
      .populate('parishId', 'name').lean(),
    Donation.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const notifs = [
    ...recentPosts.map(function(p) {
      return {
        _id: p._id,
        type: 'publication',
        icon: 'speakerphone',
        titre: p.parishId && p.parishId.name ? p.parishId.name : 'Paroisse',
        message: (p.content || '').substring(0, 80),
        date: p.createdAt,
        lu: false,
      };
    }),
    ...recentDons.map(function(d) {
      return {
        _id: d._id,
        type: 'don',
        icon: 'coin',
        titre: 'Confirmation de don',
        message: 'Votre don de ' + (d.netAmount || 0).toLocaleString('fr-SN') + ' FCFA a été reçu.',
        date: d.createdAt,
        lu: true,
      };
    }),
  ].sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

  return sendSuccess(res, notifs);
}));

module.exports = router;
