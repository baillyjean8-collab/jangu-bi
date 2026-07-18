'use strict';

const router = require('express').Router();
const { Parish, User } = require('../../models');

const CLE_SECRETE = 'jangubi-seed-zig-m3n8v2';
const MOT_DE_PASSE_TEMPORAIRE = 'JanguBi2026!';
const DIOCESE = 'Diocese de Ziguinchor';

const PAROISSES = [
  { nom: 'Cathedrale Saint-Antoine de Padoue de Ziguinchor', ville: 'Ziguinchor', doyenne: 'Ziguinchor', type: 'paroisse' },
  { nom: 'Notre-Dame des Pauvres de Tilene', ville: 'Ziguinchor', doyenne: 'Ziguinchor', type: 'paroisse' },
  { nom: 'Saint-Benoit de Nema', ville: 'Ziguinchor', doyenne: 'Ziguinchor', type: 'paroisse' },
  { nom: 'Notre-Dame de l Annonciation de Niaguis', ville: 'Niaguis', doyenne: 'Ziguinchor', type: 'paroisse' },
  { nom: 'Saint-Augustin de Lyndiane', ville: 'Ziguinchor', doyenne: 'Ziguinchor', type: 'paroisse' },
  { nom: 'Fondation Saint-Thomas d Aquin de Kenia', ville: 'Kenia', doyenne: 'Ziguinchor', type: 'paroisse' },
  { nom: 'Fondation Saint-Joseph de Djifanghor', ville: 'Djifanghor', doyenne: 'Ziguinchor', type: 'paroisse' },
  { nom: 'Fondation Saint-Paul de Mandina', ville: 'Mandina', doyenne: 'Ziguinchor', type: 'paroisse' },
  { nom: 'Fondation Sainte-Paula de Djibock', ville: 'Djibock', doyenne: 'Ziguinchor', type: 'paroisse' },

  { nom: 'Notre-Dame de la Chandeleur de Brin', ville: 'Brin', doyenne: 'Brin', type: 'paroisse' },
  { nom: 'Marie Reine du Monde de Nyassia', ville: 'Nyassia', doyenne: 'Brin', type: 'paroisse' },
  { nom: 'Bon Pasteur d Enampore', ville: 'Enampore', doyenne: 'Brin', type: 'paroisse' },
  { nom: 'Saints Martyrs de l Ouganda de Colobane', ville: 'Colobane', doyenne: 'Brin', type: 'paroisse' },

  { nom: 'Notre-Dame de Lourdes de Bignona', ville: 'Bignona', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Saint-Francois d Assise d Elana', ville: 'Elana', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Sainte-Therese de l Enfant Jesus de Balandine', ville: 'Balandine', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Saint-Martin de Pores de Diouloulou', ville: 'Diouloulou', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Notre-Dame de la Joie de Kafountine', ville: 'Kafountine', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Saint-Joseph de Soutou', ville: 'Soutou', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Saint-Joseph Ouvrier de Coubalan', ville: 'Coubalan', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Sainte-Trinite de Kadiamor', ville: 'Kadiamor', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Sainte-Therese de l Enfant Jesus d Affiniam', ville: 'Affiniam', doyenne: 'Bignona', type: 'paroisse' },
  { nom: 'Sainte-Anne de Thionck-Essyl', ville: 'Thionck-Essyl', doyenne: 'Bignona', type: 'paroisse' },

  { nom: 'Sainte-Therese de l Enfant Jesus d Oussouye', ville: 'Oussouye', doyenne: 'Oussouye', type: 'paroisse' },
  { nom: 'Sacre-Coeur de Mlomp', ville: 'Mlomp', doyenne: 'Oussouye', type: 'paroisse' },
  { nom: 'Saint-Joseph Calasanz de Diembering', ville: 'Diembering', doyenne: 'Oussouye', type: 'paroisse' },
  { nom: 'Notre-Dame des Pauvres de Niomoune', ville: 'Niomoune', doyenne: 'Oussouye', type: 'paroisse' },
  { nom: 'Notre-Dame du Saint-Rosaire de Youtou', ville: 'Youtou', doyenne: 'Oussouye', type: 'paroisse' },
  { nom: 'Saint-Jean-Baptiste de Cabrousse (Cap Skirring)', ville: 'Cap Skirring', doyenne: 'Oussouye', type: 'paroisse' },
  { nom: 'Sainte-Claire d Elinkine', ville: 'Elinkine', doyenne: 'Oussouye', type: 'paroisse' },
  { nom: 'Fondation Saint-Laurent d Eyoune', ville: 'Eyoune', doyenne: 'Oussouye', type: 'paroisse' },
  { nom: 'Fondation de Diakene Diola', ville: 'Diakene Diola', doyenne: 'Oussouye', type: 'paroisse' },
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
  const suffixe = String(710000 + index).padStart(6, '0');
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
          coordinates: { type: 'Point', coordinates: [-16.2719, 12.5665] },
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
