'use strict';

const router = require('express').Router();
const { Parish, User } = require('../../models');

const CLE_SECRETE = 'jangubi-clean-x4b8k2';

router.get('/:cle', async (req, res) => {
  if (req.params.cle !== CLE_SECRETE) {
    return res.status(403).json({ error: 'Non autorise' });
  }
  try {
    const aSupprimer = await Parish.find({
      $or: [
        { 'location.country': { $ne: 'Senegal' } },
        { denomination: { $in: ['Protestante', 'Evangelique', 'Évangélique'] } },
      ],
    }).lean();

    const noms = [];
    for (const p of aSupprimer) {
      await Parish.deleteOne({ _id: p._id });
      if (p.adminId) await User.deleteOne({ _id: p.adminId });
      noms.push(p.name + ' (' + (p.location && p.location.country) + ')');
    }

    return res.json({ supprimees: noms.length, noms: noms });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;