require('./src/config/env');
const config = require('./src/config/env');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(config.db.uri);
  const User   = require('./src/models/User');
  const Parish = require('./src/models/Parish');

  const paroisse = await Parish.findOne().lean();
  console.log('Paroisse:', paroisse.name, paroisse._id);

  // Récupérer les users sans parishId (sauf les admins)
  const users = await User.find({
    role: 'user',
    defaultParishId: { $exists: false }
  }).limit(10).lean();

  console.log('Users sans paroisse:', users.length);

  // Assigner la paroisse aux 3 premiers comme paroissiens
  // et les 2 suivants comme abonnés
  for (let i = 0; i < users.length; i++) {
    if (i < 3) {
      await User.findByIdAndUpdate(users[i]._id, {
        $set: { defaultParishId: paroisse._id }
      });
      console.log('Paroissien:', users[i].firstName, users[i].lastName);
    } else if (i < 5) {
      await User.findByIdAndUpdate(users[i]._id, {
        $addToSet: { followedParishes: paroisse._id }
      });
      console.log('Abonné:', users[i].firstName, users[i].lastName);
    }
  }

  // Si pas assez d'users, prendre n'importe quels users
  if (users.length === 0) {
    const anyUsers = await User.find({ role: 'user' }).limit(5).lean();
    console.log('Users disponibles:', anyUsers.length);
    for (let i = 0; i < anyUsers.length; i++) {
      if (i < 3) {
        await User.findByIdAndUpdate(anyUsers[i]._id, { $set: { defaultParishId: paroisse._id } });
        console.log('Paroissien:', anyUsers[i].firstName, anyUsers[i].lastName);
      } else {
        await User.findByIdAndUpdate(anyUsers[i]._id, { $addToSet: { followedParishes: paroisse._id } });
        console.log('Abonné:', anyUsers[i].firstName, anyUsers[i].lastName);
      }
    }
  }

  const count = await User.countDocuments({
    $or: [{ defaultParishId: paroisse._id }, { followedParishes: paroisse._id }]
  });
  console.log('\nTotal fidèles liés:', count);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
