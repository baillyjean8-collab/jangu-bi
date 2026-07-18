'use strict';

const router = require('express').Router();
const { Parish, User } = require('../../models');

const CLE_SECRETE = 'jangubi-seed-thies-p8w4t1';
const MOT_DE_PASSE_TEMPORAIRE = 'JanguBi2026!';
const DIOCESE = 'Diocese de Thies';

const PAROISSES = [
  { nom: 'Cathedrale Sainte-Anne de Thies', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Saint Jean-Marie Vianney de Randoulene', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Sainte Croix de Thies', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Saint Joseph Ouvrier de Thionakh', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Sainte Marthe de Thies', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Marie Reine de l Univers de Thies', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Saint Jean-Baptiste de Thies', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Saint Joseph de Peykouck', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Marie Auxiliatrice de Medina Fall', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },
  { nom: 'Jesus Bon Pasteur de Thies', ville: 'Thies', doyenne: 'Urbain', type: 'paroisse' },

  { nom: 'Notre-Dame de Lourdes de Tivaouane', ville: 'Tivaouane', doyenne: 'Nord', type: 'paroisse' },
  { nom: 'Sainte Bernadette de Mekhe', ville: 'Mekhe', doyenne: 'Nord', type: 'paroisse' },
  { nom: 'Saint Joseph de Pambal', ville: 'Pambal', doyenne: 'Nord', type: 'paroisse' },
  { nom: 'Sainte Famille de Keur Moussa', ville: 'Keur Moussa', doyenne: 'Nord', type: 'paroisse' },
  { nom: 'Notre-Dame de l Assomption de Mont-Roland', ville: 'Mont-Roland', doyenne: 'Nord', type: 'paroisse' },

  { nom: 'Saint Antoine de Padoue de Pout-Diack', ville: 'Pout', doyenne: 'Diobass', type: 'paroisse' },
  { nom: 'Saint Pierre de Notto', ville: 'Notto', doyenne: 'Diobass', type: 'paroisse' },
  { nom: 'Sainte Marie de Fandene', ville: 'Fandene', doyenne: 'Diobass', type: 'paroisse' },
  { nom: 'Sainte Monique de Tassette', ville: 'Tassette', doyenne: 'Diobass', type: 'paroisse' },
  { nom: 'Saint Francois Xavier de Pout', ville: 'Pout', doyenne: 'Diobass', type: 'paroisse' },

  { nom: 'Saint Francois Xavier de Bambey', ville: 'Bambey', doyenne: 'Baol', type: 'paroisse' },
  { nom: 'Notre-Dame de la Visitation de Khombole', ville: 'Khombole', doyenne: 'Baol', type: 'paroisse' },
  { nom: 'Sainte Therese de Ndondol', ville: 'Ndondol', doyenne: 'Baol', type: 'paroisse' },
  { nom: 'Sacre-Coeur de Koudiadiene', ville: 'Koudiadiene', doyenne: 'Baol', type: 'paroisse' },
  { nom: 'Sainte Famille de Khombole Baol', ville: 'Khombole', doyenne: 'Baol', type: 'paroisse' },
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
  const suffixe = String(720000 + index).padStart(6, '0');
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
          coordinates: { type: 'Point', coordinates: [-16.9359, 14.7910] },
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
