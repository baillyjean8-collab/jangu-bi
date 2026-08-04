/**
 * client/src/data/giftsCatalog.js
 *
 * Catalogue des cadeaux côté client — miroir de server/src/domains/live/giftCatalog.js.
 * Les prix ici sont UNIQUEMENT pour l'affichage : le serveur revalide toujours
 * le prix réel à partir du code avant de débiter le portefeuille.
 *
 * Place les images fournies dans :
 *   client/src/assets/gifts/
 * et les lettres AMEN / ALLELUIA / HOSANNA dans :
 *   client/src/assets/gifts/letters/
 */

// --- Images individuelles ---
import cathedraleVivante from '../assets/gifts/cathedrale-vivante.png';
import flammeDeLaFoi from '../assets/gifts/flamme-de-la-foi.png';
import paixDuChrist from '../assets/gifts/paix-du-christ.png';
import croixDeGloire from '../assets/gifts/croix-de-gloire.png';
import rosaireRoyal from '../assets/gifts/rosaire-royal.png';
import chapeletDeGrace from '../assets/gifts/chapelet-de-grace.png';
import angeProtecteur from '../assets/gifts/ange-protecteur.png';
import couronneDesSaints from '../assets/gifts/couronne-des-saints.png';
import ciergePascal from '../assets/gifts/cierge-pascal.png';
import notreDame from '../assets/gifts/notre-dame.png';
import coeurImmacule from '../assets/gifts/coeur-immacule-de-marie.png';
import paroleVivante from '../assets/gifts/parole-vivante.png';
import caliceSacre from '../assets/gifts/calice-sacre.png';
import espritSaint from '../assets/gifts/esprit-saint.png';
import painDeVie from '../assets/gifts/pain-de-vie.png';
import tresSaintSacrement from '../assets/gifts/tres-saint-sacrement.png';
import princeDesArmees from '../assets/gifts/prince-des-armees-celestes.png';
import christRoi from '../assets/gifts/christ-roi.png';
import leBonBerger from '../assets/gifts/le-bon-berger.png';

// --- Lettres detachables (Amen / Alleluia / Hosanna) ---
const amenLetters = [0, 1, 2, 3].map(
  (i) => new URL(`../assets/gifts/letters/amen-${i}.png`, import.meta.url).href
);
const alleluiaLetters = [0, 1, 2, 3, 4, 5, 6, 7].map(
  (i) => new URL(`../assets/gifts/letters/alleluia-${i}.png`, import.meta.url).href
);
const hosannaLetters = [0, 1, 2, 3, 4, 5, 6].map(
  (i) => new URL(`../assets/gifts/letters/hosanna-${i}.png`, import.meta.url).href
);

/**
 * fx possibles : 'flame' | 'beam' | 'orbit' | 'mistpulse' | 'crownshine' | 'fly' |
 *   'swayglow' | 'wingsdesc' | 'halo' | 'heartflame' | 'fillglow' | 'bookopen' |
 *   'sunburst' | 'emerge' | 'confrontSingle' | 'heartbeatRays' | 'riseGentle' |
 *   'lettersAmen' | 'lettersAlleluia' | 'lettersHosanna'
 * tier possibles : 'simple' | 'mid' | 'high' | 'legend' | 'mythic'
 *   (calculé automatiquement par tierFromPrice, voir GiftSendAnimation.jsx)
 */
export const GIFTS_CATALOG = [
  { code: 1,  slug: 'cathedrale-vivante',        nom: 'Cathédrale Vivante',        prix: 100,   image: cathedraleVivante,   fx: 'mistpulse' },
  { code: 2,  slug: 'amen-eternel',              nom: 'Amen Éternel',              prix: 100,   image: null,                fx: 'lettersAmen', letters: amenLetters },
  { code: 3,  slug: 'flamme-de-la-foi',          nom: 'Flamme de la Foi',          prix: 250,   image: flammeDeLaFoi,       fx: 'flame' },
  { code: 4,  slug: 'paix-du-christ',            nom: 'Paix du Christ',            prix: 250,   image: paixDuChrist,        fx: 'fly' },
  { code: 5,  slug: 'alleluia-glorieux',         nom: 'Alléluia Glorieux',         prix: 300,   image: null,                fx: 'lettersAlleluia', letters: alleluiaLetters },
  { code: 6,  slug: 'hosanna-au-plus-haut',      nom: 'Hosanna au plus haut',      prix: 400,   image: null,                fx: 'lettersHosanna', letters: hosannaLetters },
  { code: 7,  slug: 'croix-de-gloire',           nom: 'Croix de Gloire',           prix: 500,   image: croixDeGloire,       fx: 'beam' },
  { code: 8,  slug: 'rosaire-royal',             nom: 'Rosaire Royal',             prix: 600,   image: rosaireRoyal,        fx: 'orbit' },
  { code: 9,  slug: 'chapelet-de-grace',         nom: 'Chapelet de Grâce',         prix: 750,   image: chapeletDeGrace,     fx: 'orbit' },
  { code: 10, slug: 'ange-protecteur',           nom: 'Ange Protecteur',           prix: 800,   image: angeProtecteur,      fx: 'wingsdesc' },
  { code: 11, slug: 'couronne-des-saints',       nom: 'Couronne des Saints',       prix: 1000,  image: couronneDesSaints,   fx: 'crownshine' },
  { code: 12, slug: 'cierge-pascal',             nom: 'Cierge Pascal',             prix: 1000,  image: ciergePascal,        fx: 'flame' },
  { code: 13, slug: 'notre-dame',                nom: 'Notre-Dame',                prix: 1200,  image: notreDame,           fx: 'halo' },
  { code: 14, slug: 'coeur-immacule-de-marie',   nom: 'Cœur Immaculé de Marie',    prix: 1500,  image: coeurImmacule,       fx: 'heartflame' },
  { code: 15, slug: 'parole-vivante',            nom: 'Parole Vivante',            prix: 1500,  image: paroleVivante,       fx: 'bookopen' },
  { code: 16, slug: 'calice-sacre',              nom: 'Calice Sacré',              prix: 2000,  image: caliceSacre,         fx: 'fillglow' },
  { code: 17, slug: 'esprit-saint',              nom: 'Esprit Saint',              prix: 3000,  image: espritSaint,         fx: 'fly' },
  { code: 18, slug: 'pain-de-vie',               nom: 'Pain de Vie',               prix: 5000,  image: painDeVie,           fx: 'sunburst' },
  { code: 19, slug: 'tres-saint-sacrement',      nom: 'Très Saint Sacrement',      prix: 7500,  image: tresSaintSacrement,  fx: 'emerge' },
  { code: 20, slug: 'prince-des-armees-celestes',nom: 'Prince des Armées Célestes',prix: 8500,  image: princeDesArmees,     fx: 'confrontSingle' },
  { code: 21, slug: 'christ-roi',                nom: 'Christ Roi',                prix: 10000, image: christRoi,           fx: 'heartbeatRays' },
  { code: 22, slug: 'le-bon-berger',             nom: 'Le Bon Berger',             prix: 12000, image: leBonBerger,         fx: 'riseGentle' },
];

export function findGiftByCode(code) {
  return GIFTS_CATALOG.find((g) => g.code === code);
}
