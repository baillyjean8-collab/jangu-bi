'use strict';

const router = require('express').Router();
const { Parish, User } = require('../../models');

const CLE_SECRETE = 'jangubi-seed-kaol-r5j9d3';
const MOT_DE_PASSE_TEMPORAIRE = 'JanguBi2026!';
const DIOCESE = 'Diocese de Kaolack';

const PAROISSES = [
  { nom: 'Cathedrale Saint-Theophile de Kaolack', ville: 'Kaolack', doyenne: 'Kaolack-Ville', type: 'paroisse' },
  { nom: 'Notre-Dame d Ayde de Maka-Kahone', ville: 'Maka-Kahone', doyenne: 'Kaolack-Ville', type: 'paroisse' },
  { nom: 'Saint Jean Apotre des Parcelles Assainies', ville: 'Kaolack', doyenne: 'Kaolack-Ville', type: 'paroisse' },
  { nom: 'Immaculee Conception de Guinguineo', ville: 'Guinguineo', doyenne: 'Centre', type: 'paroisse' },
  { nom: 'Sacre-Coeur de Gandiaye', ville: 'Gandiaye', doyenne: 'Centre', type: 'paroisse' },
  { nom: 'Saint Joseph Ouvrier de Sibassor', ville: 'Sibassor', doyenne: 'Centre', type: 'paroisse' },
  { nom: 'Saint Martin de Porres de Ndiebel', ville: 'Ndiebel', doyenne: 'Centre', type: 'paroisse' },
  { nom: 'Saint Paul de Foundiougne', ville: 'Foundiougne', doyenne: 'Sud', type: 'paroisse' },
  { nom: 'Notre-Dame du Laghem de Ndoffane', ville: 'Ndoffane', doyenne: 'Sud', type: 'paroisse' },
  { nom: 'Sainte Therese de l Enfant-Jesus de Sokone', ville: 'Sokone', doyenne: 'Sud', type: 'paroisse' },
  { nom: 'Notre-Dame des Anges de Nioro du Rip', ville: 'Nioro du Rip', doyenne: 'Sud', type: 'paroisse' },
  { nom: 'Sainte Famille de Ndiedieng', ville: 'Ndiedieng', doyenne: 'Sud', type: 'paroisse' },
  { nom: 'Bienheureux Jean XXIII de Karang', ville: 'Karang', doyenne: 'Sud', type: 'paroisse' },
  { nom: 'Christ Roi de l Univers de Passy', ville: 'Passy', doyenne: 'Sud', type: 'paroisse' },
  { nom: 'Notre-Dame de Lourdes de Kaffrine', ville: 'Kaffrine', doyenne: 'Nord-Est', type: 'paroisse' },
  { nom: 'Saint Pierre de Gossas', ville: 'Gossas', doyenne: 'Nord-Est', type: 'paroisse' },
  { nom: 'Notre-Dame des Pauvres de Mbar', ville: 'Mbar', doyenne: 'Nord-Est', type: 'paroisse' },
  { nom: 'Notre-Dame de Fatima de Koungheul', ville: 'Koungheul', doyenne: 'Nord-Est', type: 'paroisse' },
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
  const suffixe = String(730000 + index).padStart(6, '0');
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
          coordinates: { type: 'Point', coordinates: [-16.0726, 14.1652] },
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
