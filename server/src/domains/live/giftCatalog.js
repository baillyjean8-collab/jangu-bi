/**
 * Catalogue des cadeaux virtuels Jangu Bi.
 * Source de vérité des prix — jamais confiée au client.
 * Répartition à l'envoi : 60% paroisse / 40% plateforme (cf. splitGiftAmount).
 */

const GIFTS = [
  { code: 1,  slug: 'cathedrale-vivante',           nom: 'Cathédrale Vivante',           prix: 100   },
  { code: 2,  slug: 'amen-eternel',                 nom: 'Amen Éternel',                 prix: 100   },
  { code: 3,  slug: 'flamme-de-la-foi',              nom: 'Flamme de la Foi',              prix: 250   },
  { code: 4,  slug: 'paix-du-christ',                nom: 'Paix du Christ',                prix: 250   },
  { code: 5,  slug: 'alleluia-glorieux',             nom: 'Alléluia Glorieux',             prix: 300   },
  { code: 6,  slug: 'hosanna-au-plus-haut',          nom: 'Hosanna au plus haut',          prix: 400   },
  { code: 7,  slug: 'croix-de-gloire',               nom: 'Croix de Gloire',               prix: 500   },
  { code: 8,  slug: 'rosaire-royal',                 nom: 'Rosaire Royal',                 prix: 600   },
  { code: 9,  slug: 'chapelet-de-grace',             nom: 'Chapelet de Grâce',             prix: 750   },
  { code: 10, slug: 'ange-protecteur',               nom: 'Ange Protecteur',               prix: 800   },
  { code: 11, slug: 'couronne-des-saints',           nom: 'Couronne des Saints',           prix: 1000  },
  { code: 12, slug: 'cierge-pascal',                 nom: 'Cierge Pascal',                 prix: 1000  },
  { code: 13, slug: 'notre-dame',                    nom: 'Notre-Dame',                    prix: 1200  },
  { code: 14, slug: 'coeur-immacule-de-marie',       nom: 'Cœur Immaculé de Marie',        prix: 1500  },
  { code: 15, slug: 'parole-vivante',                nom: 'Parole Vivante',                prix: 1500  },
  { code: 16, slug: 'calice-sacre',                  nom: 'Calice Sacré',                  prix: 2000  },
  { code: 17, slug: 'esprit-saint',                  nom: 'Esprit Saint',                  prix: 3000  },
  { code: 18, slug: 'pain-de-vie',                   nom: 'Pain de Vie',                   prix: 5000  },
  { code: 19, slug: 'tres-saint-sacrement',          nom: 'Très Saint Sacrement',          prix: 7500  },
  { code: 20, slug: 'prince-des-armees-celestes',    nom: 'Prince des Armées Célestes',    prix: 8500  },
  { code: 21, slug: 'christ-roi',                    nom: 'Christ Roi',                    prix: 10000 },
  { code: 22, slug: 'le-bon-berger',                 nom: 'Le Bon Berger',                 prix: 12000 },
];

const PARISH_SHARE_RATIO = 0.6; // 60% paroisse
const PLATFORM_SHARE_RATIO = 0.4; // 40% plateforme

/**
 * Retrouve un cadeau à partir de son code numérique.
 * @param {number} code
 * @returns {object|undefined}
 */
function findGiftByCode(code) {
  return GIFTS.find((g) => g.code === code);
}

/**
 * Calcule la répartition paroisse/plateforme pour un montant de cadeau.
 * Utilise des entiers (arrondi) pour éviter les problèmes de centimes flottants.
 * @param {number} prix
 * @returns {{ parishShare: number, platformShare: number }}
 */
function splitGiftAmount(prix) {
  const parishShare = Math.round(prix * PARISH_SHARE_RATIO);
  const platformShare = prix - parishShare; // le reste, pour garantir parishShare + platformShare === prix
  return { parishShare, platformShare };
}

module.exports = {
  GIFTS,
  findGiftByCode,
  splitGiftAmount,
};
