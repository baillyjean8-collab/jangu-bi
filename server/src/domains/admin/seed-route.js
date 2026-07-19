'use strict';

const router = require('express').Router();
const { Parish, User } = require('../../models');

const CLE_SECRETE = 'jangubi-seed-kolda-v9m4z1';
const MOT_DE_PASSE_TEMPORAIRE = 'JanguBi2026!';
const DIOCESE = 'Diocese de Kolda';

const PAROISSES = [
  { nom: 'Cathedrale Notre-Dame des Victoires de Kolda', ville: 'Kolda', doyenne: 'Kolda', type: 'paroisse' },
  { nom: 'Sainte Claire de Mampatim', ville: 'Mampatim', doyenne: 'Kolda', type: 'paroisse' },
  { nom: 'Saint Pierre et Saint Paul de Diannah-Malary', ville: 'Diannah-Malary', doyenne: 'Kolda', type: 'paroisse' },
  { nom: 'Saint Augustin de Medina Cherif', ville: 'Medina Cherif', doyenne: 'Kolda', type: 'paroisse' },
  { nom: 'Sainte Therese de l Enfant-Jesus de Medina Yoro Foula', ville: 'Medina Yoro Foula', doyenne: 'Kolda', type: 'paroisse' },
  { nom: 'Saint Francois d Assise de Dabo', ville: 'Dabo', doyenne: 'Kolda', type: 'paroisse' },
  { nom: 'Saint Joseph de Velingara', ville: 'Velingara', doyenne: 'Velingara', type: 'paroisse' },
  { nom: 'Notre-Dame de la Misericorde de Pakour', ville: 'Pakour', doyenne: 'Velingara', type: 'paroisse' },
  { nom: 'Saint Paul de Kounkane', ville: 'Kounkane', doyenne: 'Velingara', type: 'paroisse' },
  { nom: 'Saint Jean l Evangeliste de Sedhiou', ville: 'Sedhiou', doyenne: 'Sedhiou', type: 'paroisse' },
  { nom: 'Saint Christophe de Medina Wandifa', ville: 'Medina Wandifa', doyenne: 'Sedhiou', type: 'paroisse' },
  { nom: 'Sainte Germaine de Marsassoum', ville: 'Marsassoum', doyenne: 'Sedhiou', type: 'paroisse' },
  { nom: 'Saint Michel Archange de Kintchingourou', ville: 'Kintchingourou', doyenne: 'Sedhiou', type: 'paroisse' },
  { nom: 'Saint Charles Lwanga et ses Compagnons Martyrs de Simbandi Balante', ville: 'Simbandi Balante', doyenne: 'Temento', type: 'paroisse' },
  { nom: 'Sainte Bernadette de Temento', ville: 'Temento', doyenne: 'Temento', type: 'paroisse' },
  { nom: 'Sainte Croix de Tanaff', ville: 'Tanaff', doyenne: 'Temento', type: 'paroisse' },
  { nom: 'Saint Remi de Goudomp', ville: 'Goudomp', doyenne: 'Temento', type: 'paroisse' },
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
  const suffixe = String(760000 + index).padStart(6, '0');
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
          coordinates: { type: 'Point', coordinates: [-14.9500, 12.8833] },
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
