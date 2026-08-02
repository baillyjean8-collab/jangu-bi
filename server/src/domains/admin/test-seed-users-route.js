'use strict';

// ═══════════════════════════════════════════════════════════════
// ROUTE TEMPORAIRE DE TEST — cree 5 comptes fideles avec un solde
// portefeuille preloade, pour tester l'envoi de cadeaux en direct.
// A SUPPRIMER une fois les tests termines (meme principe que
// _test-email : pratique pendant le developpement, jamais en prod).
// ═══════════════════════════════════════════════════════════════

const router = require('express').Router();
const { User } = require('../../models');

const NOMS_TEST = [
  { firstName: 'May',      lastName: 'Kan' },
  { firstName: 'Nana',     lastName: 'Iris Mambaye' },
  { firstName: 'Millinda', lastName: 'Mendy' },
  { firstName: 'Brandon',  lastName: 'Mendy' },
  { firstName: 'Martial',  lastName: 'Bailly' },
];

const SOLDE_INITIAL = 10000; // 10 000 F par compte de test, largement de quoi tester tous les cadeaux

router.get('/creer', async (req, res) => {
  try {
    const resultats = [];

    for (let i = 0; i < NOMS_TEST.length; i++) {
      const n = NOMS_TEST[i];
      const suffixe = Date.now().toString().slice(-6) + i; // evite les collisions si on relance
      const prenomSlug = n.firstName.toLowerCase().replace(/[^a-z]/g, '');
      const email = `test.${prenomSlug}.${suffixe}@jangubi-test.com`;
      const phone = `+22177${String(1000000 + i).slice(-7)}${suffixe.slice(-2)}`;

      const user = await User.create({
        firstName: n.firstName,
        lastName: n.lastName,
        email,
        phone,
        password: 'Test1234',
        isVerified: true,
        isActive: true,
        role: 'user',
      });

      await User.creditWallet(user._id, SOLDE_INITIAL);

      resultats.push({
        nom: `${n.firstName} ${n.lastName}`,
        email,
        phone,
        motDePasse: 'Test1234',
        soldeInitial: SOLDE_INITIAL,
      });
    }

    return res.json({ succes: true, comptes: resultats });
  } catch (err) {
    return res.json({ succes: false, erreur: err.message });
  }
});

module.exports = router;
