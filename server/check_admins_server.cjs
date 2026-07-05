require('./src/config/env');
const config = require('./src/config/env');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(config.db.uri);
  console.log('Connecté à MongoDB');

  const User = require('./src/models/User');
  const Parish = require('./src/models/Parish');

  const admins = await User.find({ role: { $in: ['parish_admin', 'super_admin'] } })
    .select('email role firstName lastName parishId').lean();

  console.log('\n=== ADMINS EXISTANTS ===');
  if (admins.length === 0) {
    console.log('Aucun admin trouvé.');
  } else {
    admins.forEach(a => console.log('- ' + a.email + ' | ' + a.role + ' | ' + a.firstName + ' ' + a.lastName));
  }

  const paroisses = await Parish.find().select('name isVerified').limit(5).lean();
  console.log('\n=== PAROISSES EXISTANTES ===');
  if (paroisses.length === 0) {
    console.log('Aucune paroisse trouvée.');
  } else {
    paroisses.forEach(p => console.log('- ' + p._id + ' | ' + p.name));
  }

  const existingAdmin = await User.findOne({ email: 'admin@paroisse-sacre-coeur.sn' });
  if (!existingAdmin) {
    const paroisse = paroisses[0];
    const newAdmin = new User({
      firstName: 'Admin',
      lastName: 'SacreCoeur',
      email: 'admin@paroisse-sacre-coeur.sn',
      phone: '+221770000001',
      password: 'Admin2026!',
      role: 'parish_admin',
      isVerified: true,
      isActive: true,
      parishId: paroisse ? paroisse._id : null,
    });
    await newAdmin.save();
    console.log('\n=== COMPTE ADMIN CRÉÉ ===');
    console.log('Email:    admin@paroisse-sacre-coeur.sn');
    console.log('Password: Admin2026!');
  } else {
    console.log('\n=== COMPTE ADMIN DÉJÀ EXISTANT ===');
    console.log('Email:    admin@paroisse-sacre-coeur.sn');
    console.log('Password: Admin2026!');
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error('Erreur:', e.message); process.exit(1); });
