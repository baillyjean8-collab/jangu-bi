'use strict';

const router = require('express').Router();
const { Parish, Post, Story } = require('../../models');
const mongoose = require('mongoose');

const CLE_SECRETE = 'jangubi-diag-h8t2w5';

router.get('/:cle', async (req, res) => {
  if (req.params.cle !== CLE_SECRETE) {
    return res.status(403).json({ error: 'Non autorise' });
  }
  try {
    const idsPostsUniques = await Post.distinct('parishId');
    const idsStoriesUniques = await Story.distinct('parishId');
    const tousLesIds = [...new Set([...idsPostsUniques, ...idsStoriesUniques].map(String))];

    const orphelins = [];
    for (const idStr of tousLesIds) {
      const existe = await Parish.findById(idStr).lean();
      if (!existe) {
        const nbPosts = await Post.countDocuments({ parishId: idStr });
        const nbStories = await Story.countDocuments({ parishId: idStr });
        orphelins.push({ ancienParishId: idStr, nbPosts: nbPosts, nbStories: nbStories });
      }
    }

        return res.json({ orphelins: orphelins });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/reparer/:cle', async (req, res) => {
  if (req.params.cle !== CLE_SECRETE) {
    return res.status(403).json({ error: 'Non autorise' });
  }
  try {
    const NOUVEAU_PARISH_ID = '6a5cb5bb0b6ebf687abf4693';
    const anciensIds = ['6a03545bb2c55faaf3b3523b', '6a4c292682a64ea5d9351dbd'];

    let postsMisAJour = 0;
    let storiesMisesAJour = 0;

    for (const ancienId of anciensIds) {
      const rPosts = await Post.updateMany({ parishId: ancienId }, { $set: { parishId: NOUVEAU_PARISH_ID } });
      postsMisAJour += rPosts.modifiedCount || 0;
      const rStories = await Story.updateMany({ parishId: ancienId }, { $set: { parishId: NOUVEAU_PARISH_ID } });
      storiesMisesAJour += rStories.modifiedCount || 0;
    }

    return res.json({ postsMisAJour: postsMisAJour, storiesMisesAJour: storiesMisesAJour });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

module.exports = router;
