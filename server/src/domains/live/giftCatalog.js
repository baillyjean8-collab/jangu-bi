'use strict';

// ═══════════════════════════════════════════════════════════════
// CATALOGUE DES CADEAUX — source de verite server-side
// ═══════════════════════════════════════════════════════════════
// Le client (LiveScreen.jsx) affiche ce meme catalogue pour l'UI,
// mais n'envoie jamais que le "code" du cadeau choisi (giftCode).
// Le PRIX est TOUJOURS relu ici, jamais accepte depuis le client —
// sinon n'importe qui pourrait envoyer un cadeau a prix modifie
// via les devtools ou un client maison.
//
// IMPORTANT : si ce catalogue change un jour (prix, ajout, retrait),
// les cadeaux DEJA envoyes gardent leur prix historique car il est
// snapshote dans le document Gift au moment de l'envoi.

const GIFT_CATALOG = Object.freeze([
  { code: 1,  emoji: '🌹', nom: 'Rose',           prix: 10   },
  { code: 2,  emoji: '🕯️', nom: 'Bougie',         prix: 25   },
  { code: 3,  emoji: '✝️', nom: 'Croix',           prix: 50   },
  { code: 4,  emoji: '📿', nom: 'Chapelet',        prix: 75   },
  { code: 5,  emoji: '⛪', nom: 'Église',          prix: 100  },
  { code: 6,  emoji: '👑', nom: 'Couronne',        prix: 200  },
  { code: 7,  emoji: '🙏', nom: 'Amen',            prix: 100  },
  { code: 8,  emoji: '✨', nom: 'Alléluia',        prix: 300  },
  { code: 9,  emoji: '🌟', nom: 'Hosanna',         prix: 400  },
  { code: 10, emoji: '☮️', nom: 'Paix du Christ',  prix: 250  },
  { code: 11, emoji: '🕯️', nom: 'Cierge',          prix: 200  },
  { code: 12, emoji: '🌸', nom: 'Rosaire',         prix: 600  },
  { code: 13, emoji: '🪔', nom: 'Encens',          prix: 750  },
  { code: 14, emoji: '😇', nom: 'Ange gardien',    prix: 800  },
  { code: 15, emoji: '👸', nom: 'Vierge Marie',    prix: 1200 },
  { code: 16, emoji: '❤️', nom: 'Coeur Immaculé',  prix: 1500 },
  { code: 17, emoji: '📖', nom: 'Bible',           prix: 1500 },
  { code: 18, emoji: '🏆', nom: 'Calice',          prix: 2000 },
  { code: 19, emoji: '🕊️', nom: 'Colombe',         prix: 3000 },
  { code: 20, emoji: '⚜️', nom: 'Hostie',          prix: 5000 },
]);

const GIFT_BY_CODE = new Map(GIFT_CATALOG.map((g) => [g.code, g]));

function findGiftByCode(code) {
  return GIFT_BY_CODE.get(Number(code)) || null;
}

// Repartition du prix : 60% paroisse / 40% plateforme.
// Le platformShare recoit l'arrondi pour que parishShare + platformShare === prix pile.
const PARISH_SHARE_RATIO = 0.6;

function splitGiftAmount(prix) {
  const parishShare = Math.round(prix * PARISH_SHARE_RATIO);
  const platformShare = prix - parishShare;
  return { parishShare, platformShare };
}

module.exports = { GIFT_CATALOG, findGiftByCode, splitGiftAmount, PARISH_SHARE_RATIO };
