'use strict';

/**
 * Payment Gateway Adapters
 *
 * Architecture:
 * - Each provider implements the same interface: { createCheckout, verifyWebhook, extractEvent }
 * - The PaymentGateway façade selects the right adapter by provider name
 * - Adding a new provider = adding one adapter object — nothing else changes
 * - All secrets come from config — never hardcoded
 * - HMAC-SHA256 verification uses crypto.timingSafeEqual() on every provider
 *
 * Provider quirks handled here (not leaked into business logic):
 * - CinetPay: SHA-256 hash built from sorted query params (not HMAC)
 * - Wave:     HMAC-SHA256 on raw body, sig in X-Wave-Signature header
 * - Orange:   HMAC-SHA256 on timestamp+body composite, sig in Authorization header
 */

const crypto = require('crypto');
const config  = require('../../config/env');

// ─── Interface contract ───────────────────────────────────────────────────────
//
// Every adapter must implement:
//   verifySignature(rawBody: Buffer, headers: object): void   — throws on failure
//   extractTxId(payload: object): string | null
//   extractSuccess(payload: object): boolean
//   extractFees(payload: object): number | null               — integer centimes
//   buildCheckoutPayload(donation: object): object
//   getCheckoutUrl(): string
//   getSignatureHeader(): string

// ─── Shared utilities ─────────────────────────────────────────────────────────

/**
 * Constant-time HMAC-SHA256 comparison.
 * Both sides are always the same length (hex digests), so no length leak.
 */
function verifyHmac(secret, rawBody, receivedSig) {
  if (!secret) throw new Error('Payment provider secret not configured');
  if (!receivedSig) throw new WebhookSignatureError('Missing signature header');

  // Strip provider-specific prefixes: "sha256=...", "HMAC ..."
  const cleanSig = receivedSig.replace(/^(sha256=|hmac\s+)/i, '');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  let sigBuf, expBuf;
  try {
    sigBuf = Buffer.from(cleanSig, 'hex');
    expBuf = Buffer.from(expected,  'hex');
  } catch {
    throw new WebhookSignatureError('Signature is not valid hex');
  }

  if (sigBuf.length !== expBuf.length) {
    throw new WebhookSignatureError('Signature length mismatch');
  }

  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new WebhookSignatureError('Signature verification failed');
  }
}

class WebhookSignatureError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WebhookSignatureError';
    this.statusCode = 401;
  }
}

// ─── CinetPay Adapter ─────────────────────────────────────────────────────────
//
// Docs: https://docs.cinetpay.com
// Webhook verification: SHA-256 hash of sorted POST params + apiKey
// Signature header:     X-Token (CinetPay uses a different model)
// Status field:         payload.status === 'ACCEPTED'

const cinetpayAdapter = {
  name: 'cinetpay',

  getSignatureHeader: () => 'x-cinetpay-signature',

  /**
   * CinetPay signs webhooks by SHA-256 hashing the concatenated
   * sorted key=value params + the API secret.
   * We verify by recomputing this hash from the parsed payload.
   */
  verifySignature(rawBody, headers) {
    const secret    = config.payment.cinetpaySecret;
    const apiKey    = config.payment.cinetpayApiKey;
    const received  = headers['x-cinetpay-signature'] || headers['x-token'];

    if (!secret || !apiKey) throw new Error('CinetPay secrets not configured');
    if (!received) throw new WebhookSignatureError('Missing CinetPay signature');

    // Parse the raw body as form-encoded or JSON
    let payload;
    try {
      payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
    } catch {
      throw new WebhookSignatureError('Cannot parse CinetPay webhook body');
    }

    // Build sorted param string (CinetPay convention)
    const sorted = Object.keys(payload)
      .filter(k => k !== 'signature')
      .sort()
      .map(k => `${k}=${payload[k]}`)
      .join('&');

    const expected = crypto
      .createHash('sha256')
      .update(sorted + apiKey)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(received,  'hex'),
      Buffer.from(expected,  'hex')
    )) {
      throw new WebhookSignatureError('CinetPay signature mismatch');
    }
  },

  extractTxId:     (p) => p?.transaction_id      || p?.cpm_trans_id || null,
  extractSuccess:  (p) => p?.status === 'ACCEPTED'|| p?.cpm_result === '00',
  extractFees:     (p) => typeof p?.fees  === 'number' ? Math.round(p.fees)  : null,

  buildCheckoutPayload(donation) {
    return {
      apikey:         config.payment.cinetpayApiKey,
      site_id:        config.payment.cinetpaySiteId,
      transaction_id: donation.idempotencyKey.slice(0, 24), // CinetPay max 24 chars
      amount:         donation.amount,
      currency:       donation.currency,
      description:    `Don JANGU BI — ${donation.parishId}`,
      return_url:     `${config.client.url}/donate?status=return`,
      notify_url:     `${config.server.url}/api/donations/webhook/cinetpay`,
      channels:       'ALL',
      lang:           'fr',
    };
  },

  getCheckoutUrl: () => 'https://api-checkout.cinetpay.com/v2/payment',
};

// ─── Wave Adapter ─────────────────────────────────────────────────────────────
//
// Docs: https://developer.wave.com/docs/webhooks
// Webhook verification: HMAC-SHA256 on raw body
// Signature header:     X-Wave-Signature: sha256=<hex>
// Status field:         payload.status === 'succeeded' | 'failed'

const waveAdapter = {
  name: 'wave',

  getSignatureHeader: () => 'x-wave-signature',

  verifySignature(rawBody, headers) {
    const sig = headers['x-wave-signature'];
    verifyHmac(config.payment.waveSecretKey, rawBody, sig);
  },

  extractTxId:     (p) => p?.id || p?.wave_id || null,
  extractSuccess:  (p) => p?.status === 'succeeded',
  extractFees:     (p) => typeof p?.fee === 'number' ? Math.round(p.fee) : null,

  buildCheckoutPayload(donation) {
    return {
      amount:       String(donation.amount),
      currency:     donation.currency,
      error_url:    `${config.client.url}/donate?status=error`,
      success_url:  `${config.client.url}/donate?status=success`,
      client_reference: donation.idempotencyKey,
    };
  },

  getCheckoutUrl: () => 'https://api.wave.com/v1/checkout/sessions',
};

// ─── Orange Money Adapter ─────────────────────────────────────────────────────
//
// Docs: https://developer.orange.com/apis/om-webpay
// Webhook verification: HMAC-SHA256 on (timestamp + '.' + rawBody)
// Signature header:     Authorization: HMAC <hex>
// Timestamp header:     X-Orange-Timestamp
// Status field:         payload.status === 'SUCCESSFULL' (sic — Orange typo)

const orangeMoneyAdapter = {
  name: 'orange_money',

  getSignatureHeader: () => 'authorization',

  verifySignature(rawBody, headers) {
    const sig       = headers['authorization'];
    const timestamp = headers['x-orange-timestamp'];

    if (!timestamp) throw new WebhookSignatureError('Missing X-Orange-Timestamp header');

    // Orange signs: HMAC-SHA256(secret, timestamp + "." + rawBody)
    const composite = Buffer.concat([
      Buffer.from(timestamp + '.'),
      Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody),
    ]);

    verifyHmac(config.payment.orangeMoneySecret, composite, sig);
  },

  extractTxId:     (p) => p?.txnid || p?.transaction_id || null,
  // Orange has a typo in their API — 'SUCCESSFULL' with double L
  extractSuccess:  (p) => p?.status === 'SUCCESSFULL' || p?.status === 'SUCCESS',
  extractFees:     (_) => null, // Orange doesn't report fees in webhook

  buildCheckoutPayload(donation) {
    return {
      merchant_key:     config.payment.orangeMoneyMerchantKey,
      currency:         donation.currency,
      order_id:         donation.idempotencyKey,
      amount:           donation.amount,
      return_url:       `${config.client.url}/donate?status=success`,
      cancel_url:       `${config.client.url}/donate?status=cancel`,
      notif_url:        `${config.server.url}/api/donations/webhook/orange_money`,
      lang:             'fr',
      reference:        `JANGUBI-${donation._id}`,
    };
  },

  getCheckoutUrl: () => 'https://api.orange.com/orange-money-webpay/dev/v1/webpayment',
};

// ─── MTN MoMo Adapter (stub — OAuth2 flow, more complex) ─────────────────────

const mtnMomoAdapter = {
  name: 'mtn_momo',

  getSignatureHeader: () => 'x-callback-signature',

  verifySignature(rawBody, headers) {
    const sig = headers['x-callback-signature'];
    verifyHmac(config.payment.mtnMomoSecret, rawBody, sig);
  },

  extractTxId:    (p) => p?.referenceId || p?.financialTransactionId || null,
  extractSuccess: (p) => p?.status === 'SUCCESSFUL',
  extractFees:    (_) => null,

  buildCheckoutPayload(donation) {
    // MTN MoMo uses a request-to-pay API (push notification to user's phone)
    // Full OAuth2 + API user creation flow required — documented in MTN docs
    return {
      amount:   String(donation.amount),
      currency: donation.currency,
      externalId: donation.idempotencyKey,
      payer: { partyIdType: 'MSISDN', partyId: null }, // set from user.phone
      payerMessage: `Don JANGU BI`,
      payeeNote:    `Donation ref: ${donation._id}`,
    };
  },

  getCheckoutUrl: () => 'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
};

// ─── PaymentGateway Façade ────────────────────────────────────────────────────

const ADAPTERS = {
  cinetpay:     cinetpayAdapter,
  wave:         waveAdapter,
  orange_money: orangeMoneyAdapter,
  mtn_momo:     mtnMomoAdapter,
};

const PaymentGateway = {
  /**
   * Get the adapter for a specific provider.
   * Throws if provider is unknown — prevents untested code paths.
   */
  getAdapter(provider) {
    const adapter = ADAPTERS[provider];
    if (!adapter) throw new Error(`Unknown payment provider: "${provider}"`);
    return adapter;
  },

  /**
   * Verify a webhook signature using the correct adapter.
   * Called FIRST in the webhook handler before any DB operations.
   */
  verifyWebhookSignature(provider, rawBody, headers) {
    const adapter = this.getAdapter(provider);
    adapter.verifySignature(rawBody, headers);
    // If we reach here, signature is valid
  },

  /**
   * Extract the provider's transaction ID from a webhook payload.
   */
  extractTxId(provider, payload) {
    return this.getAdapter(provider).extractTxId(payload);
  },

  /**
   * Determine if the webhook indicates a successful payment.
   */
  extractSuccess(provider, payload) {
    return this.getAdapter(provider).extractSuccess(payload);
  },

  /**
   * Extract provider fees (integer, smallest currency unit).
   */
  extractFees(provider, payload) {
    return this.getAdapter(provider).extractFees(payload);
  },

  /**
   * Build the checkout payload for initiating a payment with a provider.
   * Returns { checkoutUrl, payload } — caller POSTs payload to checkoutUrl.
   *
   * In production, this would make an HTTP call to the provider API
   * and return a redirect URL. For MVP, it returns the payload for
   * the client to initiate the payment directly.
   */
  async buildCheckout(provider, donation) {
    const adapter = this.getAdapter(provider);
    const payload = adapter.buildCheckoutPayload(donation);
    const checkoutUrl = adapter.getCheckoutUrl();

    // TODO Production: make HTTP call to provider API, return paymentUrl
    // const response = await axios.post(checkoutUrl, payload, { headers: ... });
    // return { paymentUrl: response.data.payment_url };

    // MVP: return payload for manual/client-side initiation
    return {
      provider,
      checkoutUrl,
      payload,
      // Client will redirect user to provider's payment page
    };
  },

  listProviders() {
    return Object.keys(ADAPTERS);
  },
};

module.exports = { PaymentGateway, WebhookSignatureError };
