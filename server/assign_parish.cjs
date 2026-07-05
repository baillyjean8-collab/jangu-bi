require('./src/config/env');
const config = require('./src/config/env');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(config.db.uri);
  console.log('Connecté');

  const User   = require('./src/models/User');
  const Parish = require('./src/models/Parish');

  // Récupérer toutes les paroisses
  const paroisses = await Parish.find().select('name _id').lean();
  console.log('\nParoisses disponibles:');
  paroisses.forEach((p, i) => console.log(i + '. ' + p._id + ' | ' + p.name));

  // Assigner la première paroisse à tous les parish_admin sans parishId
  const admins = await User.find({ role: 'parish_admin' }).lean();
  console.log('\nAdmins parish_admin:');

  for (const admin of admins) {
    console.log('- ' + admin.email + ' | parishId: ' + (admin.parishId || 'MANQUANT'));
    if (!admin.parishId && paroisses.length > 0) {
      await User.findByIdAndUpdate(admin._id, {
        $set: { parishId: paroisses[0]._id }
      });
      console.log('  → Assigné à: ' + paroisses[0].name);
    }
  }

  // Vérifier
  const updated = await User.find({ role: 'parish_admin' }).select('email parishId').lean();
  console.log('\nAprès mise à jour:');
  updated.forEach(u => console.log('- ' + u.email + ' | parishId: ' + u.parishId));

  await mongoose.disconnect();
  console.log('\nTerminé — relancez le login admin.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
