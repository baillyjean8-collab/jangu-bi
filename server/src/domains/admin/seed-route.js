'use strict';

const router = require('express').Router();
const { Parish, User } = require('../../models');

const CLE_SECRETE = 'jangubi-seed-tamb-w3f7n2';
const MOT_DE_PASSE_TEMPORAIRE = 'JanguBi2026!';
const DIOCESE = 'Diocese de Tambacounda';

const PAROISSES = [
  { nom: 'Cathedrale Marie Reine de l Univers de Tambacounda', ville: 'Tambacounda', doyenne: 'Centre', type: 'paroisse' },
  { nom: 'Saint Joseph de Kedougou', ville: 'Kedougou', doyenne: 'Sud-Est', type: 'paroisse' },
  { nom: 'Notre-Dame de l Esperance de Koumpentoum', ville: 'Koumpentoum', doyenne: 'Ouest', type: 'paroisse' },
  { nom: 'Saint Augustin de Goudiry', ville: 'Goudiry', doyenne: 'Ouest', type: 'paroisse' },
  { nom: 'Saint Jean-Baptiste de Salemata', ville: 'Salemata', doyenne: 'Sud-Est', type: 'paroisse' },
  { nom: 'Saint Pierre Claver de Tambacounda', ville: 'Tambacounda', doyenne: 'Centre', type: 'paroisse' },
  { nom: 'Saint Francois Xavier de Nguenn', ville: 'Nguenn', doyenne: 'Sud-Est', type: 'paroisse' },
  { nom: 'Saint Clement de Tambacounda', ville: 'Tambacounda', doyenne: 'Centre', type: 'paroisse' },
  { nom: 'Saint Andre de Koussanar', ville: 'Koussanar', doyenne: 'Ouest', type: 'paroisse' },
];

function genererEmail(nom, index) {
  const base = nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 30);
  return 'admin.' + base + index + '@jangubi.temp';
}

function genererTelephone(index) {
  const suffixe = String(750000 + index).padStart(6, '0');
  return '+221' + suffixe;
}

router.get('/:cle', async (req, res) => {
  if (req.params.cle !== CLE_SECRETE) {
    return res.status(403).json({ error: 'Non autorise' });
  }

  const identifiants = [];
  let creees = 0;
  let ignorees = 0;

  try {
    for (let i = 0; i < PAROISSES.length; i++) {
      const p = PAROISSES[i];

      const existante = await Parish.findOne({ name: p.nom });
      if (existante) {
        ignorees++;
        continue;
      }

      const email = genererEmail(p.nom, i);
      const phone = genererTelephone(i);

      await User.deleteOne({ email: email });

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
        location: {
          country: 'Senegal',
          city: p.ville,
          coordinates: { type: 'Point', coordinates: [-13.6673, 13.7707] },
        },
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
    }

    return res.json({ creees: creees, ignorees: ignorees, identifiants: identifiants });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/liste/:cle', async (req, res) => {
  if (req.params.cle !== CLE_SECRETE) {
    return res.status(403).json({ error: 'Non autorise' });
  }
  try {
    const parishes = await Parish.find({ diocese: DIOCESE }).populate('adminId', 'email').lean();
    const liste = parishes.map(function(p) {
      return {
        paroisse: p.name,
        email: p.adminId ? p.adminId.email : null,
        motDePasse: 'JanguBi2026!',
        verifiee: p.isVerified,
      };
    });
    return res.json({ total: liste.length, liste: liste });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
