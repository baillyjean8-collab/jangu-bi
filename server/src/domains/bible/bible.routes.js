'use strict';

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');

// ── Chargement unique du fichier Bible en mémoire ────────────────────────────
let BIBLE_DATA = null;

function getBible() {
  if (!BIBLE_DATA) {
    const filePath = path.join(__dirname, '../../../bible-fr.json');
    const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
BIBLE_DATA = JSON.parse(raw);
  }
  return BIBLE_DATA;
}

// ── Table de correspondance : abréviation → index du livre ──────────────────
const LIVRE_MAP = {
  // Ancien Testament (ID 0 à 38)
  'Gn':  0,  'Ex':  1,  'Lv':  2,  'Nb':  3,  'Dt':  4,
  'Jos': 5,  'Jg':  6,  'Rt':  7,  '1S':  8,  '2S':  9,
  '1R':  10, '2R':  11, '1Ch': 12, '2Ch': 13, 'Esd': 14,
  'Ne':  15, 'Est': 16, 'Jb':  17, 'Ps':  18, 'Pr':  19,
  'Qo':  20, 'Ct':  21, 'Is':  22, 'Jr':  23, 'Lm':  24,
  'Ez':  25, 'Dn':  26, 'Os':  27, 'Jl':  28, 'Am':  29,
  'Ab':  30, 'Jon': 31, 'Mi':  32, 'Na':  33, 'Ha':  34,
  'So':  35, 'Ag':  36, 'Za':  37, 'Ml':  38,
  // Nouveau Testament (ID 39 à 65)
  'Mt':   39, 'Mc':  40, 'Lc':  41, 'Jn':   42, 'Ac':  43,
  'Rm':   44, '1Co': 45, '2Co': 46, 'Ga':   47, 'Ep':  48,
  'Ph':   49, 'Col': 50, '1Th': 51, '2Th':  52, '1Tm': 53,
  '2Tm':  54, 'Tt':  55, 'Phm': 56, 'He':   57, 'Jc':  58,
  '1P':   59, '2P':  60, '1Jn': 61, '2Jn':  62, '3Jn': 63,
  'Jude': 64, 'Ap':  65,
};

// ── GET /api/bible/local/:livre/:chapitre ────────────────────────────────────
router.get('/local/:livre/:chapitre', (req, res) => {
  try {
    const { livre, chapitre } = req.params;
    const chapNum = parseInt(chapitre, 10);

    if (isNaN(chapNum) || chapNum < 1) {
      return res.status(400).json({ error: 'Numéro de chapitre invalide' });
    }

    const bible    = getBible();
    const livrIdx  = LIVRE_MAP[livre];

    if (livrIdx === undefined) {
      return res.status(404).json({ error: `Livre "${livre}" non trouvé` });
    }

    // Trouver le testament et le livre
    const testamentIdx = livrIdx < 39 ? 0 : 1;
    const bookIdxInTestament = livrIdx < 39 ? livrIdx : livrIdx - 39;

    const testament = bible.Testaments[testamentIdx];
    if (!testament) {
      return res.status(404).json({ error: 'Testament non trouvé' });
    }

    const book = testament.Books[bookIdxInTestament];
    if (!book) {
      return res.status(404).json({ error: `Livre index ${bookIdxInTestament} non trouvé` });
    }

    const chapter = book.Chapters[chapNum - 1];
    if (!chapter) {
      return res.status(404).json({ error: `Chapitre ${chapNum} non trouvé` });
    }

    // Formater les versets
    const versets = (chapter.Verses || []).map((v, i) => ({
      num: i + 1,
      texte: v.Text || '',
    })).filter(v => v.texte);

    res.json({
      livre: book.Text,
      chapitre: chapNum,
      versets,
    });

  } catch (err) {
    console.error('[Bible] Erreur complète:', err.stack);
    res.status(500).json({ error: 'Erreur lecture Bible' });
  }
});

// ── Proxy AELF (gardé comme fallback) ───────────────────────────────────────
router.get('/aelf/:livre/:chapitre', async (req, res) => {
  const { livre, chapitre } = req.params;
  try {
    const response = await fetch(
      `https://api.aelf.org/v1/bible/${livre}/${chapitre}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: 'AELF non disponible' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur proxy AELF' });
  }
});

// ── Proxy AELF Messe du jour ─────────────────────────────────────────────────
router.get('/aelf/messe/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const response = await fetch(
      `https://api.aelf.org/v1/messes/${date}/messe`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: 'AELF non disponible' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur proxy AELF messe' });
  }
});

// ── Proxy Claude API ─────────────────────────────────────────────────────────
router.post('/claude', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur proxy Claude' });
  }
});

module.exports = router;