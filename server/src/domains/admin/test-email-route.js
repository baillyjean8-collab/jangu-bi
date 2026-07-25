'use strict';

const router = require('express').Router();
const { envoyerEmail } = require('../../shared/utils/emailService');

router.get('/:destinataire', async (req, res) => {
  try {
    const succes = await envoyerEmail({
      destinataire: req.params.destinataire,
      sujet: 'Test Jangu Bi',
      texte: 'Ceci est un test d\'envoi d\'email.',
    });
    return res.json({ succes });
  } catch (err) {
    return res.json({ erreur: err.message, details: err.toString() });
  }
});

module.exports = router;
