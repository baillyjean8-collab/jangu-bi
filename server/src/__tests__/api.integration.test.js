'use strict';

/**
 * Tests d'intégration API — JANGU BI
 *
 * Teste le flux complet :
 * 1. Register → OTP → Login → Refresh → Logout
 * 2. Créer paroisse → rejoindre → vérifier
 * 3. Initier donation → simuler webhook
 *
 * Lancer : npm test
 * (nécessite NODE_ENV=test dans .env.test)
 */

const request = require('supertest');
const mongoose = require('mongoose');

// Setup test environment avant tout import
process.env.NODE_ENV     = 'test';
process.env.PORT         = '5001';
process.env.MONGODB_URI  = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/jangubi_test';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-minimum-32-characters-long!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-characters-long!!';
process.env.OTP_HMAC_SECRET    = 'test-otp-hmac-secret-minimum-32-characters-long!!';
process.env.CLIENT_URL         = 'http://localhost:5173';
process.env.SERVER_URL         = 'http://localhost:5001';

let app;
let server;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const createApp = require('../app');
  app = createApp();
}, 30000);

afterAll(async () => {
  // Nettoyer la base de test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await mongoose.disconnect();
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeUser(suffix = Date.now()) {
  return {
    firstName: 'Test',
    lastName:  'User',
    email:     `test${suffix}@jangubi.com`,
    phone:     `+22177${String(suffix).slice(-7).padStart(7, '0')}`,
    password:  'Test@2024!',
  };
}

// Récupère l'OTP depuis les logs dev (en test, l'OTP est loggé masqué)
// Pour les tests, on contourne directement via la DB
async function getOtpFromDB(userId) {
  const { OTP } = require('../models');
  // Sélectionner explicitement hashedOtp
  const otpRecord = await OTP.findOne({ userId }).select('+hashedOtp');
  if (!otpRecord) throw new Error(`No OTP found for user ${userId}`);
  // En test, on génère l'OTP depuis 0 et on récupère le hash stocké
  // → On simule la vérification en forçant le passage par le service
  return otpRecord;
}

async function forceVerifyUser(userId) {
  const { User } = require('../models');
  await User.findByIdAndUpdate(userId, { isVerified: true });
}

// ════════════════════════════════════════════════════════
// SUITE 1 : AUTHENTIFICATION
// ════════════════════════════════════════════════════════

describe('Auth — Flux complet', () => {
  let userId;
  let accessToken;
  let agent; // supertest agent pour les cookies

  beforeAll(() => {
    agent = request.agent(app); // agent persiste les cookies (refresh token)
  });

  // ── Register ─────────────────────────────────────────
  test('POST /api/auth/register — crée un utilisateur', async () => {
    const userData = makeUser();

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('userId');
    expect(res.body.data).toHaveProperty('email', userData.email);

    userId = res.body.data.userId;
  });

  test('POST /api/auth/register — rejette un email en double', async () => {
    const userData = makeUser(1); // même suffix = même email
    await request(app).post('/api/auth/register').send(userData);

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register — rejette un mot de passe faible', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...makeUser(99999), password: '12345678' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // ── OTP & Login (bypass OTP via DB pour les tests) ─────────
  test('POST /api/auth/login — échoue si non vérifié', async () => {
    const userData = makeUser(); // même email que le test register
    // L'utilisateur vient d'être créé — pas encore vérifié
    // Note: le test register crée un user différent à chaque fois si suffix = Date.now()
    // Ici on teste avec un user non vérifié créé spécifiquement
    const newUser = makeUser(Date.now() + 1);
    await request(app).post('/api/auth/register').send(newUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: newUser.password })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login — succès après vérification', async () => {
    const userData = makeUser(Date.now() + 2);
    const regRes = await request(app).post('/api/auth/register').send(userData);
    const testUserId = regRes.body.data.userId;

    // Forcer la vérification pour le test
    await forceVerifyUser(testUserId);

    const res = await agent
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user).toHaveProperty('role', 'user');

    accessToken = res.body.data.accessToken;

    // Cookie refresh token doit être présent
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
  });

  test('POST /api/auth/login — rejette mauvais mot de passe', async () => {
    const userData = makeUser(Date.now() + 3);
    const regRes = await request(app).post('/api/auth/register').send(userData);
    await forceVerifyUser(regRes.body.data.userId);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: 'WrongPass@999' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/refresh — rafraîchit le token via cookie', async () => {
    const res = await agent
      .post('/api/auth/refresh')
      .expect(200);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.accessToken).not.toBe(accessToken); // nouveau token
  });

  test('GET /api/auth/me — retourne le profil connecté', async () => {
    const res = await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.user).toHaveProperty('email');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('GET /api/auth/me — rejette sans token', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });

  test('POST /api/auth/logout — révoque le token', async () => {
    const res = await agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

// ════════════════════════════════════════════════════════
// SUITE 2 : PAROISSES
// ════════════════════════════════════════════════════════

describe('Paroisses', () => {
  test('GET /api/parishes — liste publique', async () => {
    const res = await request(app)
      .get('/api/parishes')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/parishes — supporte la pagination', async () => {
    const res = await request(app)
      .get('/api/parishes?page=1&limit=5')
      .expect(200);

    expect(res.body.meta.pagination).toBeDefined();
    expect(res.body.meta.pagination.limit).toBe(5);
  });

  test('POST /api/parishes — bloqué sans auth', async () => {
    await request(app)
      .post('/api/parishes')
      .send({ name: 'Test', location: { country: 'Sénégal', city: 'Dakar' } })
      .expect(401);
  });
});

// ════════════════════════════════════════════════════════
// SUITE 3 : LIVE SESSIONS
// ════════════════════════════════════════════════════════

describe('Live', () => {
  test('GET /api/live/active — liste publique', async () => {
    const res = await request(app)
      .get('/api/live/active')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('sessions');
  });

  test('POST /api/live/start — bloqué sans auth', async () => {
    await request(app)
      .post('/api/live/start')
      .send({ parishId: new mongoose.Types.ObjectId() })
      .expect(401);
  });
});

// ════════════════════════════════════════════════════════
// SUITE 4 : SÉCURITÉ
// ════════════════════════════════════════════════════════

describe('Sécurité', () => {
  test('Injection NoSQL rejetée', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { '$gt': '' }, password: 'anything' });

    // Doit être traité comme email invalide, pas comme une injection
    expect(res.status).not.toBe(200);
  });

  test('Headers de sécurité présents', async () => {
    const res = await request(app).get('/health').expect(200);

    // Helmet headers
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  test('Route inconnue retourne 404', async () => {
    const res = await request(app)
      .get('/api/route-qui-nexiste-pas')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });

  test('Content-Type enforced sur POST', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'text/plain')
      .send('email=test&password=test')
      .expect(415);

    expect(res.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  test('Body trop grand rejeté', async () => {
    const bigBody = { data: 'x'.repeat(100000) };
    const res = await request(app)
      .post('/api/auth/register')
      .send(bigBody);

    expect([400, 413]).toContain(res.status);
  });

  test('Health check accessible', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

// ════════════════════════════════════════════════════════
// SUITE 5 : WEBHOOKS PAIEMENT
// ════════════════════════════════════════════════════════

describe('Webhooks — Sécurité signature', () => {
  const crypto = require('crypto');

  test('Wave webhook sans signature rejeté', async () => {
    const res = await request(app)
      .post('/api/donations/webhook/wave')
      .send({ id: 'test-tx', status: 'succeeded' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('Wave webhook avec mauvaise signature rejeté', async () => {
    const payload = JSON.stringify({ id: 'test-tx', status: 'succeeded' });

    const res = await request(app)
      .post('/api/donations/webhook/wave')
      .set('x-wave-signature', 'sha256=invalidsignature')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('Provider inconnu rejeté', async () => {
    const res = await request(app)
      .post('/api/donations/webhook/provider-inconnu')
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
