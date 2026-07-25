'use strict';

const nodemailer = require('nodemailer');
const config = require('../../config/env');

let transporteur = null;

function getTransporteur() {
  if (!transporteur) {
    transporteur = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }
  return transporteur;
}

async function envoyerEmail({ destinataire, sujet, texte, html }) {
  try {
    await getTransporteur().sendMail({
      from: config.email.from,
      to: destinataire,
      subject: sujet,
      text: texte,
      html: html || texte,
    });
    return true;
  } catch (err) {
    console.log('Erreur envoi email:', err.message);
    return false;
  }
}

async function envoyerCodeReinitialisation(destinataire, code) {
  return envoyerEmail({
    destinataire,
    sujet: 'Jangu Bi — Réinitialisation de votre mot de passe',
    texte: 'Votre code de réinitialisation est : ' + code + '\n\nCe code est valable 15 minutes. Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email.',
    html: '<div style="font-family:Georgia,serif;padding:20px;background:#f5f0e8;"><h2 style="color:#1e2d14;">Jangu Bi</h2><p>Votre code de réinitialisation est :</p><p style="font-size:28px;font-weight:800;color:#8B6020;letter-spacing:4px;">' + code + '</p><p style="color:#666;font-size:13px;">Ce code est valable 15 minutes. Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email.</p></div>',
  });
}

module.exports = { envoyerEmail, envoyerCodeReinitialisation };
