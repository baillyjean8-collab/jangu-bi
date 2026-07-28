'use strict';
const config = require('../../config/env');

// ── Integration CinetPay (agregateur Wave / Orange Money / carte pour l'Afrique
// de l'Ouest, un seul point d'integration) ──────────────────────────────────────
//
// IMPORTANT : ce module ne peut fonctionner qu'une fois un vrai compte marchand
// CinetPay cree, avec CINETPAY_API_KEY et CINETPAY_SITE_ID configures comme
// variables d'environnement sur Render. Tant que ce n'est pas fait, les appels
// ci-dessous echoueront (reponse d'erreur de CinetPay, ou timeout).

const BASE_URL = 'https://api-checkout.cinetpay.com/v2';

// Cree une demande de paiement et renvoie l'URL de paiement hebergee par CinetPay
// (le fidele y est redirige pour choisir Wave / Orange Money / carte et payer).
async function creerPaiement({ transactionId, montant, description, retourUrl, notifyUrl, nomClient, telephoneClient }) {
  if (!config.payment.cinetpayApiKey || !config.payment.cinetpaySiteId) {
    throw new Error("CinetPay n'est pas encore configure (cle API ou identifiant de site manquant).");
  }

  const body = {
    apikey: config.payment.cinetpayApiKey,
    site_id: config.payment.cinetpaySiteId,
    transaction_id: transactionId,
    amount: montant,
    currency: 'XOF',
    description: (description || '').slice(0, 255),
    return_url: retourUrl,
    notify_url: notifyUrl,
    channels: 'ALL',
    customer_name: (nomClient || 'Fidele').slice(0, 60),
    customer_surname: '.',
    customer_phone_number: telephoneClient || '',
  };

  const res = await fetch(BASE_URL + '/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!data || data.code !== '201' || !data.data || !data.data.payment_url) {
    const raison = (data && data.message) || 'reponse inattendue de CinetPay';
    throw new Error('Impossible de creer le paiement : ' + raison);
  }

  return { paymentUrl: data.data.payment_url, paymentToken: data.data.payment_token };
}

// Interroge directement CinetPay (avec notre propre cle API) pour connaitre le
// vrai statut d'une transaction. C'est la methode recommandee par CinetPay pour
// confirmer un paiement de facon fiable, plutot que de faire confiance au seul
// contenu de la notification recue (qui peut varier ou etre imitee).
async function verifierPaiement(transactionId) {
  if (!config.payment.cinetpayApiKey || !config.payment.cinetpaySiteId) {
    throw new Error("CinetPay n'est pas encore configure.");
  }

  const body = {
    apikey: config.payment.cinetpayApiKey,
    site_id: config.payment.cinetpaySiteId,
    transaction_id: transactionId,
  };

  const res = await fetch(BASE_URL + '/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  const reussi = !!(data && data.code === '00' && data.data && data.data.status === 'ACCEPTED');
  return { reussi: reussi, brut: data };
}

module.exports = { creerPaiement, verifierPaiement };
