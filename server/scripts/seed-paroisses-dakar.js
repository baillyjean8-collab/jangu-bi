'use strict';

/**
 * Script de remplissage en masse : paroisses et chapelles de l'Archidiocese
 * de Dakar, avec un compte admin temporaire genere pour chacune.
 *
 * Chaque paroisse est creee avec isVerified: false ("en attente de
 * verification"). Elle passera a true le jour ou la vraie paroisse se
 * connecte et confirme ses informations.
 *
 * Sans danger a relancer plusieurs fois : une paroisse deja presente
 * (meme nom) est ignoree, jamais dupliquee.
 */

const mongoose = require('mongoose');
const { Parish, User } = require('../src/models');

const MOT_DE_PASSE_TEMPORAIRE = 'JanguBi2026!';

const DIOCESE = 'Archidiocese de Dakar';

const PAROISSES = [
  { nom: 'Saint-Pierre des Baobabs', ville: 'Dakar', doyenne: 'Plateau-Medina', type: 'paroisse' },
  { nom: 'Saint-Pierre-du-Port', ville: 'Dakar', doyenne: 'Plateau-Medina', type: 'paroisse' },
  { nom: 'Sacre-Coeur de Malenfant', ville: 'Dakar', doyenne: 'Plateau-Medina', type: 'paroisse' },
  { nom: 'Saint-Charles Borromee de Goree', ville: 'Goree', doyenne: 'Plateau-Medina', type: 'paroisse' },
  { nom: 'Saint-Joseph de Medina', ville: 'Dakar', doyenne: 'Plateau-Medina', type: 'paroisse' },
  { nom: 'Notre-Dame des Anges', ville: 'Dakar', doyenne: 'Plateau-Medina', type: 'paroisse' },
  { nom: 'Paroisse Universitaire Saint-Dominique', ville: 'Dakar', doyenne: 'Fann-Point E-UCAD', type: 'paroisse' },
  { nom: 'Sainte-Therese de Grand-Dakar', ville: 'Dakar', doyenne: 'Grand-Dakar', type: 'paroisse' },
  { nom: 'Paroisse des Martyrs de l Ouganda', ville: 'Dakar', doyenne: 'Grand-Dakar', type: 'paroisse' },
  { nom: 'Saint-Maurice d Angers', ville: 'Dakar', doyenne: 'Grand-Dakar', type: 'paroisse' },
  { nom: 'Saint-Paul de Grand-Yoff', ville: 'Dakar', doyenne: 'Grand-Yoff', type: 'paroisse' },
  { nom: 'Saint-Christophe de Yoff', ville: 'Dakar', doyenne: 'Yoff', type: 'paroisse' },
  { nom: 'Paroisse des Parcelles Assainies (Unite 10)', ville: 'Dakar', doyenne: 'Parcelles Assainies', type: 'paroisse' },
  { nom: 'Sainte Josephine Bakhita de Hann', ville: 'Dakar', doyenne: 'Hann-Maristes', type: 'paroisse' },
  { nom: 'Eglise des Peres Maristes', ville: 'Dakar', doyenne: 'Hann-Maristes', type: 'paroisse' },
  { nom: 'Sainte Marie-Madeleine de Mbao', ville: 'Mbao', doyenne: 'Mbao', type: 'paroisse' },
  { nom: 'Eglise Saint-Jean de Guediawaye', ville: 'Guediawaye', doyenne: 'Guediawaye', type: 'paroisse' },
  { nom: 'Paroisse Saint-Abraham de Guediawaye', ville: 'Guediawaye', doyenne: 'Guediawaye', type: 'paroisse' },
  { nom: 'Fondation de Thiaroye', ville: 'Thiaroye', doyenne: 'Autres fondations', type: 'paroisse' },
  { nom: 'Fondation de Kounoune-Bambilor-Sangalkam', ville: 'Sangalkam', doyenne: 'Autres fondations', type: 'paroisse' },
  { nom: 'Fondation Saint Jude (Cite Gendarmerie)', ville: 'Dakar', doyenne: 'Autres fondations', type: 'paroisse' },
  { nom: 'Fondation Saint Charbel Makhlouf (Diamniadio)', ville: 'Diamniadio', doyenne: 'Autres fondations', type: 'paroisse' },
  { nom: 'Chapelle Notre-Dame d Afrique (Peres Piaristes)', ville: 'Dakar', doyenne: null, type: 'chapelle' },
  { nom: 'Chapelle Saint-Laurent', ville: 'Dakar', doyenne: null, type: 'chapelle' },
];

function genererEmail(nom, index) {
  const base = nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 30);
  return 'admin.' + base + index + '@janguBi.temp';
}

function genererTelephone(index) {
  const suffixe = String(700000 + index).padStart(6, '0');
  return '+221' + suffixe;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connecte a MongoDB.');

  const identifiants = [];
  let creees = 0;
  let ignorees = 0;

  for (let i = 0; i < PAROISSES.length; i++) {
    const p = PAROISSES[i];

    const existante = await Parish.findOne({ name: p.nom });
    if (existante) {
      console.log('Deja presente, ignoree : ' + p.nom);
      ignorees++;
      continue;
    }

    const email = genererEmail(p.nom, i);
    const phone = genererTelephone(i);

    const admin = await User.create({
      firstName: 'Admin',
      lastName: p.nom.slice(0, 45),
      email: email,
      phone: phone,
      password: MOT_DE_PASSE_TEMPORAIRE,
      role: 'parish_admin',
      isVerified: true,
    });

    const parish = await Parish.create({
      name: p.nom,
      location: { country: 'Senegal', city: p.ville },
      adminId: admin._id,
      diocese: DIOCESE,
      doyenne: p.doyenne,
      type: p.type,
      isVerified: false,
    });

    admin.parishId = parish._id;
    await admin.save();

    identifiants.push({ paroisse: p.nom, email: email, motDePasse: MOT_DE_PASSE_TEMPORAIRE });
    creees++;
    console.log('Creee : ' + p.nom);
  }

  console.log('');
  console.log('=== RESUME ===');
  console.log(creees + ' paroisse(s)/chapelle(s) creee(s), ' + ignorees + ' deja presente(s) ignoree(s).');
  console.log('');
  console.log('=== IDENTIFIANTS TEMPORAIRES A CONSERVER ===');
  identifiants.forEach(function(id) {
    console.log(id.paroisse + ' -> ' + id.email + ' / ' + id.motDePasse);
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(function(err) {
  console.error('Erreur:', err.message);
  process.exit(1);
});
