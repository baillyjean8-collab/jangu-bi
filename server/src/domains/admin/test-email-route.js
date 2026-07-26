'use strict';

const router = require('express').Router();
const { envoyerEmail } = require('../../shared/utils/emailService');

router.get('/:destinataire', async (req, res) => {
  try {
        const succes = await envoyerEmail({
      destinataire: req.params.destinataire,
      sujet: 'Test Jangu Bi',
      texte: 'Ceci est un test d\'envoi d\'email via Brevo.',
      laisserRemonterErreur: true,
    });
    return res.json({ succes });
  } catch (err) {
    return res.json({ succes: false, erreur: err.message, detail: err.detailBrevo || null });
  }
});

module.exports = router;
