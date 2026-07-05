// ═══════════════════════════════════════════════════════════════════
// JANGU BI — Module filtre universel multilingue
// Détecte insultes/injures en Français, Anglais, Wolof, Arabe, Pulaar
// Résistant aux variantes phonétiques, chiffres, espaces, tirets
// ═══════════════════════════════════════════════════════════════════

// ── Normalisation phonétique ─────────────────────────────────────────────────
function normaliser(texte) {
  return texte
    .toLowerCase()
    // Accents et diacritiques
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Substitutions chiffres → lettres
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/8/g, 'b')
    .replace(/9/g, 'g').replace(/@/g, 'a').replace(/\$/g, 's')
    .replace(/!/g, 'i').replace(/\|/g, 'i').replace(/7/g, 't')
    .replace(/6/g, 'g').replace(/2/g, 'z')
    // Suppressions de séparateurs entre lettres (p-u-t-a-i-n, p.u.t.a.i.n)
    .replace(/([a-z])[-_.\s*]+(?=[a-z])/g, '$1')
    // Lettres répétées (puuttaain → putain)
    .replace(/(.)\1{2,}/g, '$1')
    // Espaces multiples
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Liste des racines interdites ─────────────────────────────────────────────
const RACINES = [

  // ══ FRANÇAIS ══════════════════════════════════════════════════════
  // Insultes classiques
  'putain', 'putin', 'putn', 'ptain', 'pta1n',
  'merde', 'merd', 'mrde', 'm3rd',
  'connard', 'connasse', 'conna', 'konnard',
  'salope', 'salop', 'sal0p',
  'enculer', 'encule', 'enkule',
  'foutre', 'va te faire foutr',
  'batard', 'fils de pute', 'fdp',
  'pute', 'prostitue',
  'ntm', 'nique ta mer', 'nique', 'niquer', 'niqu',
  'ta gueule', 'ferme la', 'tg',
  'abruti', 'degenere', 'attarde', 'attard',
  'idiot', 'cretin', 'imbecile', 'imbe',
  'debile', 'con', 'conne',
  'couillon', 'couilo',
  'chier', 'chiott', 'merd',
  'baise', 'baiser',
  'casse toi', 'va chier', 'va mourir', 'va crever',
  'ordure', 'porc', 'cochon',
  'degage', 'va ten',
  'je vais te tuer', 'je te tue', 'je vais te frapper',
  'crever', 'mort a', 'assassin',
  'pd', 'pede', 'tapette',
  'race de merde', 'sale race',

  // ══ ANGLAIS ═══════════════════════════════════════════════════════
  'fuck', 'fuk', 'fck', 'f u c k', 'phuck',
  'shit', 'sht', 'sh1t',
  'bitch', 'btch', 'b1tch',
  'asshole', 'ashole', 'azzhole',
  'bastard', 'bastad',
  'damn', 'dam',
  'crap',
  'dick', 'dik',
  'pussy', 'pus5y',
  'motherfucker', 'mofo',
  'nigger', 'nigga', 'niger',
  'cunt', 'kunt',
  'whore', 'whor',
  'retard', 'retrd',
  'stupid', 'stoopid',
  'idiot', 'moron',
  'loser',
  'wtf', 'stfu',
  'go to hell', 'go die',
  'i will kill', 'kill yourself',

  // ══ WOLOF ═════════════════════════════════════════════════════════
  'kata sandey', 'kata sande', 'katasande',   // insulte grave
  'dof', 'nit ku dof',                         // fou
  'doff', 'doffe',
  'bokk', 'mbokk',                             // selon contexte
  'goor jigeen', 'gorjigeen',                  // homosexuel (péjoratif)
  'jaay ndey', 'jayandey',                     // insulte mère
  'ndox ak', 'wakh dara',
  'xale bu bon', 'xalebonn',                   // enfant sans éducation
  'nit ku metti', 'nitkumetti',
  'dem fey', 'dem feye',                       // va-t'en (grossier)
  'mbeur', 'mbeuri',                           // grossier
  'la honte', 'yow la hont',
  'dafa dof', 'dafadof',
  'sunu reew', 'dog',                          // selon contexte offensant

  // ══ PULAAR ════════════════════════════════════════════════════════
  'baasal', 'basal',         // insulte
  'daneejo', 'jom yimbe',    // selon contexte
  'ko woni',                 // selon contexte irrespectueux
  'gorko debbo',             // homosexuel (péjoratif)

  // ══ ARABE / CONTEXTE SÉNÉGALAIS ═══════════════════════════════════
  'kelb', 'klb',             // chien (insulte)
  'ibn el',                  // fils de (insulte)
  'ya kalb', 'yakalb',
  'sharmouta', 'charmout',   // prostituée
  'ibn haram', 'ibnharam',
  'yela', 'yella',           // maudit (selon contexte)

  // ══ INJURES RELIGIEUSES ═══════════════════════════════════════════
  'faux prophete', 'imposteur',
  'sorcier', 'marabout maudit',
  'diable', 'satan', 'demon',
  'fuck god', 'fuck jesus', 'fuck allah', 'fuck eglise',
  'va au diable', 'fils du diable',
  'religion de merde', 'fausse religion',

  // ══ VIOLENCE / MENACES ════════════════════════════════════════════
  'je vais te', 'on va te',
  'tu vas mourir', 'tu vas crever',
  'je te retrouverai', 'je sais ou tu',
  'mort a toi', 'a mort',
];

// ── Fonction principale de détection ────────────────────────────────────────
export function contientMotInterdit(texte) {
  if (!texte || texte.trim().length === 0) return false;
  const normalise = normaliser(texte);
  return RACINES.some(racine => normalise.includes(normaliser(racine)));
}

// ── Sauvegarder un avertissement ────────────────────────────────────────────
export function sauvegarderAvertissement(texte) {
  try {
    const stored = JSON.parse(localStorage.getItem('jb_avertissements') || '[]');
    const compteur = (stored[0]?.compteur || 0) + 1;
    stored.unshift({
      compteur,
      texte: texte.substring(0, 200),
      temps: 'Il y a quelques instants',
      date: new Date().toISOString(),
    });
    localStorage.setItem('jb_avertissements', JSON.stringify(stored.slice(0, 20)));
    return compteur;
  } catch(e) {
    return 1;
  }
}

// ── Vérifier si compte restreint ─────────────────────────────────────────────
export function compteRestreint() {
  try {
    const stored = JSON.parse(localStorage.getItem('jb_avertissements') || '[]');
    if (stored.length === 0) return false;
    if (stored[0].compteur >= 3) {
      const dateAvert = new Date(stored[0].date || 0);
      const joursEcoules = (new Date() - dateAvert) / (1000 * 60 * 60 * 24);
      return joursEcoules < 30;
    }
    return false;
  } catch(e) {
    return false;
  }
}

// ── Message d'avertissement ──────────────────────────────────────────────────
export function messageRestriction(compteur) {
  if (compteur >= 3) {
    return '🚫 Compte restreint — Suite à plusieurs manquements, vos commentaires sont suspendus 30 jours.';
  }
  return '⚠️ Commentaire non publié — Ce message enfreint les règles de la communauté Jangu Bi. Avertissement ' + compteur + '/3.';
}
