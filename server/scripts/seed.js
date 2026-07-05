require('dotenv').config();
'use strict';

/**
 * Script de seed — JANGU BI
 *
 * Crée:
 * 1. Un super administrateur
 * 2. Un admin paroisse
 * 3. 3 paroisses de démonstration (Sénégal, Côte d'Ivoire, Cameroun)
 * 4. Des dons de démonstration (statut SUCCESS)
 *
 * Usage:
 *   node scripts/seed.js
 *   node scripts/seed.js --reset   (efface tout avant de recréer)
 */

require('../src/config/env');

const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const connectDB = require('../src/config/database');
const { User, Parish, Donation, OTP, RefreshToken } = require('../src/models');

// ── Configuration ──────────────────────────────────────────────────────────────

const RESET = process.argv.includes('--reset');

const SEED_DATA = {
  superAdmin: {
    firstName: 'Super',
    lastName:  'Admin',
    email:     'admin@jangubi.com',
    phone: '+221771234567',
    password:  'Admin@2024!',
    role:      'super_admin',
    isVerified: true,
    isActive:   true,
  },

  parishAdmin: {
    firstName: 'Pierre',
    lastName:  'Diallo',
    email:     'pierre@jangubi.com',
    phone: '+221781112233',
    password:  'Admin@2024!',
    role:      'parish_admin',
    isVerified: true,
    isActive:   true,
  },

  regularUser: {
    firstName: 'Marie',
    lastName:  'Ndiaye',
    email:     'marie@jangubi.com',
    phone: '+221773333333',
    password:  'User@2024!',
    role:      'user',
    isVerified: true,
    isActive:   true,
  },

  parishes: [
    {
      name:         'Cathédrale du Souvenir Africain',
      description:  'La plus grande cathédrale de Dakar, fondée en 1929. Un symbole fort de la foi catholique en Afrique de l\'Ouest.',
      denomination: 'Catholique',
      location:     { country: 'Sénégal', city: 'Dakar', address: 'Plateau, Dakar', coordinates: { type: 'Point', coordinates: [-17.4441, 14.6928] } },
      isVerified:   true,
      isActive:     true,
    },
    {
      name:         'Église Évangélique de la Grâce',
      description:  'Une communauté évangélique dynamique au cœur d\'Abidjan, ouverte à tous.',
      denomination: 'Évangélique',
      location:     { country: 'Côte d\'Ivoire', city: 'Abidjan', address: 'Plateau, Abidjan', coordinates: { type: 'Point', coordinates: [-4.0305, 5.3600] } },
      isVerified:   true,
      isActive:     true,
    },
    {
      name:         'Église Protestante de Yaoundé',
      description:  'Paroisse protestante historique au Cameroun, engagée dans l\'éducation et la santé communautaire.',
      denomination: 'Protestante',
      location:     { country: 'Cameroun', city: 'Yaoundé', address: 'Centre-ville, Yaoundé', coordinates: { type: 'Point', coordinates: [11.5021, 3.8480] } },
      isVerified:   false, // En attente de vérification — utile pour tester l'interface admin
      isActive:     true,
    },
  ],
};

// ── Utilitaires ────────────────────────────────────────────────────────────────

const colors = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  blue:   (s) => `\x1b[34m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

function log(msg, color = 'green') {
  console.log(colors[color](`  ${msg}`));
}

function logSection(title) {
  console.log('\n' + colors.blue(`── ${title} ──`));
}

// ── Seed Functions ─────────────────────────────────────────────────────────────

async function createUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    log(`User already exists: ${data.email}`, 'yellow');
    return existing;
  }

  // Hash password manuellement (pas de pre-save hook dans le seed pour la vitesse)
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const user = await User.create({ ...data, password: hashedPassword });
  log(`Created user: ${data.email} (${data.role})`);
  return user;
}

async function createParish(data, adminId) {
  const existing = await Parish.findOne({ name: data.name });
  if (existing) {
    log(`Parish already exists: ${data.name}`, 'yellow');
    return existing;
  }

  const parish = await Parish.create({ ...data, adminId });
  log(`Created parish: ${data.name} (${data.location.city})`);
  return parish;
}

async function createDemoDonation(userId, parishId, amount, provider = 'wave') {
  const { Donation } = require('../src/models');
  const crypto = require('crypto');

  const donation = await Donation.create({
    userId,
    parishId,
    amount,
    currency: 'XOF',
    provider,
    isAnonymous: false,
    message: 'Don de démonstration 🙏',
  });

  // Simuler webhook SUCCESS
  await donation.transitionStatus('PENDING', 'system', 'Demo seed');
  donation.fees = Math.round(amount * 0.015); // 1.5% frais
  await donation.transitionStatus('SUCCESS', 'webhook', 'Demo payment confirmed');

  return donation;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(colors.bold('\n🕊️  JANGU BI — Script de seed\n'));

  await connectDB();

  if (RESET) {
    logSection('Reset de la base de données');
    await User.deleteMany({ email: { $in: [
      SEED_DATA.superAdmin.email,
      SEED_DATA.parishAdmin.email,
      SEED_DATA.regularUser.email,
    ]}});
    const parishNames = SEED_DATA.parishes.map(p => p.name);
    await Parish.deleteMany({ name: { $in: parishNames } });
    log('Données existantes supprimées', 'yellow');
  }

  // ── Créer les utilisateurs ─────────────────────────────────────────────────
  logSection('Utilisateurs');
  const superAdmin   = await createUser(SEED_DATA.superAdmin);
  const parishAdmin  = await createUser(SEED_DATA.parishAdmin);
  const regularUser  = await createUser(SEED_DATA.regularUser);

  // ── Créer les paroisses ────────────────────────────────────────────────────
  logSection('Paroisses');
  const parish1 = await createParish(SEED_DATA.parishes[0], parishAdmin._id);
  const parish2 = await createParish(SEED_DATA.parishes[1], superAdmin._id);
  const parish3 = await createParish(SEED_DATA.parishes[2], superAdmin._id);

  // Assigner la paroisse 1 à l'admin paroisse
  await User.findByIdAndUpdate(parishAdmin._id, { parishId: parish1._id });
  await User.findByIdAndUpdate(regularUser._id,  { parishId: parish1._id });
  log(`Paroisse assignée à ${SEED_DATA.parishAdmin.email}`);

  // Mettre à jour le nombre de membres
  await Parish.incrementMemberCount(parish1._id, 2); // admin + user

  // ── Créer des dons de démonstration ───────────────────────────────────────
  logSection('Dons de démonstration');
  const DEMO_DONATIONS = [
    { userId: regularUser._id, parishId: parish1._id, amount: 5000,  provider: 'wave' },
    { userId: regularUser._id, parishId: parish1._id, amount: 10000, provider: 'orange_money' },
    { userId: regularUser._id, parishId: parish2._id, amount: 2500,  provider: 'cinetpay' },
    { userId: parishAdmin._id, parishId: parish1._id, amount: 25000, provider: 'wave' },
  ];

  for (const don of DEMO_DONATIONS) {
    try {
      await createDemoDonation(don.userId, don.parishId, don.amount, don.provider);
      log(`Don créé: ${don.amount} XOF via ${don.provider}`);
    } catch (err) {
      log(`Don ignoré (probablement idempotent): ${err.message}`, 'yellow');
    }
  }

  // ── Résumé ─────────────────────────────────────────────────────────────────
  console.log('\n' + colors.bold('═══════════════════════════════════════'));
  console.log(colors.green(colors.bold('  ✅ Seed terminé avec succès !')));
  console.log(colors.bold('═══════════════════════════════════════\n'));

  console.log(colors.bold('  Comptes de test :'));
  console.log('');
  console.log(colors.blue('  Super Admin:'));
  console.log(`    Email:     ${colors.yellow(SEED_DATA.superAdmin.email)}`);
  console.log(`    Password:  ${colors.yellow(SEED_DATA.superAdmin.password)}`);
  console.log(`    Role:      super_admin → /admin`);
  console.log('');
  console.log(colors.blue('  Admin Paroisse:'));
  console.log(`    Email:     ${colors.yellow(SEED_DATA.parishAdmin.email)}`);
  console.log(`    Password:  ${colors.yellow(SEED_DATA.parishAdmin.password)}`);
  console.log(`    Role:      parish_admin → /my-parish`);
  console.log('');
  console.log(colors.blue('  Utilisateur:'));
  console.log(`    Email:     ${colors.yellow(SEED_DATA.regularUser.email)}`);
  console.log(`    Password:  ${colors.yellow(SEED_DATA.regularUser.password)}`);
  console.log(`    Role:      user → /`);
  console.log('');
  console.log(colors.blue('  Paroisses créées:'));
  console.log(`    1. Cathédrale du Souvenir Africain — Dakar (✅ Vérifiée)`);
  console.log(`    2. Église Évangélique de la Grâce  — Abidjan (✅ Vérifiée)`);
  console.log(`    3. Église Protestante de Yaoundé   — Yaoundé (⏳ En attente)`);
  console.log('');
  console.log(colors.blue('  Démarrer l\'app:'));
  console.log(`    cd server && npm run dev`);
  console.log(`    cd client && npm run dev`);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed échoué:', err.message);
  console.error(err.stack);
  process.exit(1);
});
