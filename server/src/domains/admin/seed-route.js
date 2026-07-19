'use strict';

const router = require('express').Router();
const { Parish, User } = require('../../models');

const CLE_SECRETE = 'jangubi-restore-p9q3m7';

router.get('/:cle', async (req, res) => {
  if (req.params.cle !== CLE_SECRETE) {
    return res.status(403).json({ error: 'Non autorise' });
  }
  try {
        let admin = await User.findOne({ email: 'pierre@jangubi.com' });

    if (admin && admin.parishId) {
      const parishExiste = await Parish.findById(admin.parishId);
      if (parishExiste) {
        return res.json({ message: 'Tout est deja en place, rien a faire.', parishId: parishExiste._id });
      }
    }

    if (!admin) {
      admin = await User.create({
        firstName: 'Pierre',
        lastName: 'Diallo',
        email: 'pierre@jangubi.com',
        phone: '+221990000001',
        password: 'Admin@2024!',
        role: 'parish_admin',
        isVerified: true,
      });
    }

    const parish = await Parish.create({
      name: 'Cathedrale du Souvenir Africain',
      denomination: 'Catholique',
      location: {
        country: 'Senegal',
        city: 'Dakar',
        coordinates: { type: 'Point', coordinates: [-17.4467, 14.6928] },
      },
      adminId: admin._id,
      diocese: 'Archidiocese de Dakar',
      type: 'paroisse',
      isVerified: true,
    });

    admin.parishId = parish._id;
    await admin.save();

    return res.json({ recree: true, parishId: parish._id, adminId: admin._id, email: admin.email });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
