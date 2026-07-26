'use strict';

const router = require('express').Router();
const { envoyerEmail } = require('../../shared/utils/emailService');

router.get('/:destinataire', async (req, res) => {
  const nodemailer = require('nodemailer');
  const config = require('../../config/env');
  try {
        const transporteur = nodemailer.createTransport({
      host: config.email.host,
      port: 465,
      secure: true,
      auth: { user: config.email.user, pass: config.email.password },
      connectionTimeout: 10000,
    });
    const info = await transporteur.sendMail({
      from: config.email.from,
      to: req.params.destinataire,
      subject: 'Test Jangu Bi',
      text: 'Ceci est un test.',
    });
    return res.json({ succes: true, info: info.response });
  } catch (err) {
    return res.json({ succes: false, erreur: err.message, code: err.code, config: { host: config.email.host, port: config.email.port, user: config.email.user ? 'defini' : 'MANQUANT', password: config.email.password ? 'defini' : 'MANQUANT' } });
  }
});

module.exports = router;
