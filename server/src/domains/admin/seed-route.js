'use strict';

const router = require('express').Router();
const { User } = require('../../models');

const CLE_SECRETE = 'jangubi-superadmin-k7m3p9';

router.get('/:cle', async (req, res) => {
  if (req.params.cle !== CLE_SECRETE) {
    return res.status(403).json({ error: 'Non autorise' });
  }
  try {
    const dejaLa = await User.findOne({ email: 'adminjangubi@jangubi.com' });
    if (dejaLa) {
      return res.json({ message: 'Le compte existe deja.', email: dejaLa.email });
    }

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'JanguBi',
      email: 'adminjangubi@jangubi.com',
      phone: '+221990000099',
      password: 'JanguBiSuper2026!',
      role: 'super_admin',
      isVerified: true,
    });

    return res.json({
      cree: true,
      email: admin.email,
      motDePasse: 'JanguBiSuper2026!',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
