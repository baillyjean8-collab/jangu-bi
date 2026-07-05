require('./src/config/env');
const config = require('./src/config/env');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(config.db.uri);

  const User = require('./src/models/User');

  // Chercher le compte admin
  const admin = await User.findOne({ email: 'admin@paroisse-sacre-coeur.sn' }).lean();
  console.log('Document complet:');
  console.log(JSON.stringify(admin, null, 2));

  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
