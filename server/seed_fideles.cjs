require('./src/config/env');
const config = require('./src/config/env');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(config.db.uri);
  const User   = require('./src/models/User');
  const Parish = require('./src/models/Parish');

  // Récupérer la paroisse
  const paroisse = await Parish.findOne().lean();
  if (!paroisse) { console.log('Aucune paroisse'); return; }
  console.log('Paroisse:', paroisse.name, paroisse._id);

  const FIDELES = [
    { firstName: 'Marie',    lastName: 'Diallo',  email: 'marie.diallo@test.sn',  phone: '+221771234567', defaultParishId: paroisse._id },
    { firstName: 'Amadou',   lastName: 'Sow',     email: 'amadou.sow@test.sn',    phone: '+221764567890', defaultParishId: paroisse._id },
    { firstName: 'Fatou',    lastName: 'Mbaye',   email: 'fatou.mbaye@test.sn',   phone: '+221707890123', followedParishes: [paroisse._id] },
    { firstName: 'Joseph',   lastName: 'Mendy',   email: 'joseph.mendy@test.sn',  phone: '+221775678901', defaultParishId: paroisse._id },
    { firstName: 'Therese',  lastName: 'Ndiaye',  email: 'therese.ndiaye@test.sn',phone: '+221763456789', followedParishes: [paroisse._id] },
  ];

  for (const f of FIDELES) {
    const existing = await User.findOne({ email: f.email });
    if (!existing) {
      const user = new User({
        ...f,
        password: 'Test2026!',
        role: 'user',
        isVerified: true,
        isActive: true,
      });
      await user.save();
      console.log('Créé:', f.firstName, f.lastName);
    } else {
      // Mettre à jour le parishId si manquant
      if (f.defaultParishId && !existing.defaultParishId) {
        await User.findByIdAndUpdate(existing._id, { $set: { defaultParishId: paroisse._id } });
        console.log('Mis à jour:', f.firstName, f.lastName);
      } else {
        console.log('Existe déjà:', f.firstName, f.lastName);
      }
    }
  }

  // Vérifier
  const count = await User.countDocuments({
    $or: [{ defaultParishId: paroisse._id }, { followedParishes: paroisse._id }]
  });
  console.log('\nTotal fidèles liés à la paroisse:', count);

  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
