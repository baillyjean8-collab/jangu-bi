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

module.exports = router;
