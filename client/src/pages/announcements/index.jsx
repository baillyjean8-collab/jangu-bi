import { useState } from 'react';
import { AppShell } from '../../components/layout';

const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';
const OR    = '#C8A84B';
const VERT  = '#1e2d14';
const IVOIRE = '#F5F0E8';

// ── Annonces ─────────────────────────────────────────────────────────────────
const ANNONCES = [
  {
    id: 1,
    categorie: 'Messe',
    icon: 'ti-building-church',
    titre: 'Messes dominicales et Horaires',
    texte: 'La messe des jeunes aura lieu ce dimanche à 09h00. La grande messe solennelle de la communauté suivra à 11h00. Venez nombreux en famille !',
    date: 'Dimanche 25 Mai',
    paroisse: 'Sacré-Cœur – Dakar',
  },
  {
    id: 2,
    categorie: 'Catéchèse',
    icon: 'ti-cross',
    titre: 'Inscriptions au Catéchisme 2026',
    texte: 'Les réinscriptions et nouvelles inscriptions pour le parcours de première communion et de confirmation sont ouvertes au secrétariat paroissial tous les après-midis.',
    date: 'Lundi 26 Mai',
    paroisse: 'St Joseph – Dakar',
  },
  {
    id: 3,
    categorie: 'Réunion',
    icon: 'ti-users',
    titre: 'Réunion des Conseils Paroissiaux',
    texte: 'Le conseil pastoral et le comité économique sont convoqués ce samedi à 16h00 dans la grande salle de réunion pour faire le bilan du trimestre.',
    date: 'Samedi 31 Mai',
    paroisse: 'St Pierre – Ziguinchor',
  },
  {
    id: 4,
    categorie: 'Événement',
    icon: 'ti-star',
    titre: 'Fête de la Pentecôte',
    texte: 'Célébration solennelle de la Pentecôte avec procession, chants liturgiques et agape fraternelle après la messe de 10h00.',
    date: 'Dimanche 24 Mai',
    paroisse: 'Cathédrale – Saint-Louis',
  },
];

// ── Calendrier liturgique 2026 – Sénégal ─────────────────────────────────────
// Sources : Vatican / Ordo 2025-2026 (liturgie.catholique.fr) + Archidiocèse de Dakar + APS
const TEMPS_COULEURS = {
  'Noël':      { bg: '#fff8e1', border: '#f9a825', dot: '#f9a825',  label: 'Temps de Noël'    },
  'Ordinaire': { bg: '#e8f5e9', border: '#388e3c', dot: '#388e3c',  label: 'Temps Ordinaire'  },
  'Carême':    { bg: '#f3e5f5', border: '#7b1fa2', dot: '#7b1fa2',  label: 'Carême'            },
  'Triduum':   { bg: '#fce4ec', border: '#c62828', dot: '#c62828',  label: 'Triduum Pascal'    },
  'Pâques':    { bg: '#fff8e1', border: '#f57f17', dot: '#f57f17',  label: 'Temps Pascal'      },
  'Avent':     { bg: '#ede7f6', border: '#4527a0', dot: '#4527a0',  label: 'Avent'             },
  'Sénégal':   { bg: '#e3f2fd', border: '#1565c0', dot: '#c8a84b',  label: 'Propre Sénégal'   },
};

const CALENDRIER = [
  // ── JANVIER ──────────────────────────────────────────────────────────────
  {
    mois: 'Janvier 2026', events: [
      { date: '1 jan',  jour: 'Jeu', titre: 'Solennité de Marie, Mère de Dieu', detail: 'Journée mondiale de la Paix. Obligation dominicale.', temps: 'Noël',      rang: 'Solennité', couleur: 'blanc' },
      { date: '6 jan',  jour: 'Mar', titre: 'Épiphanie du Seigneur', detail: 'Manifestation de Jésus aux Mages. Solennité d\'obligation.', temps: 'Noël',       rang: 'Solennité', couleur: 'blanc' },
      { date: '11 jan', jour: 'Dim', titre: 'Baptême du Seigneur', detail: 'Clôture du temps de Noël. Début du Temps Ordinaire.', temps: 'Noël',                  rang: 'Fête',      couleur: 'blanc' },
    ],
  },
  // ── FÉVRIER ──────────────────────────────────────────────────────────────
  {
    mois: 'Février 2026', events: [
      { date: '2 fév',  jour: 'Lun', titre: 'Présentation du Seigneur (Chandeleur)', detail: 'Fête de la lumière. Bénédiction des cierges. 40 jours après Noël.', temps: 'Ordinaire', rang: 'Fête', couleur: 'blanc' },
      { date: '11 fév', jour: 'Mer', titre: 'N.-D. de Lourdes – Journée des malades', detail: 'Journée mondiale du malade instituée par Jean-Paul II.', temps: 'Ordinaire',             rang: 'Mémoire', couleur: 'blanc' },
      { date: '17 fév', jour: 'Mar', titre: 'Mardi Gras', detail: 'Dernier jour avant le Carême. Dernier repas festif.', temps: 'Ordinaire',                      rang: 'Férie',     couleur: 'vert' },
      { date: '18 fév', jour: 'Mer', titre: 'Mercredi des Cendres', detail: 'Entrée en Carême. Jeûne et abstinence obligatoires. Imposition des cendres.', temps: 'Carême',            rang: 'Férie majeure', couleur: 'violet' },
    ],
  },
  // ── MARS ─────────────────────────────────────────────────────────────────
  {
    mois: 'Mars 2026', events: [
      { date: '1 mar',  jour: 'Dim', titre: '1er Dimanche de Carême', detail: 'Tentation de Jésus au désert. Évangile de l\'année A.', temps: 'Carême',           rang: 'Dimanche',  couleur: 'violet' },
      { date: '8 mar',  jour: 'Dim', titre: '2e Dimanche de Carême', detail: 'Transfiguration du Seigneur.', temps: 'Carême',                                     rang: 'Dimanche',  couleur: 'violet' },
      { date: '19 mar', jour: 'Jeu', titre: 'Solennité de Saint Joseph', detail: 'Patron de l\'Église universelle, des travailleurs et des pères de famille.', temps: 'Carême',         rang: 'Solennité', couleur: 'blanc' },
      { date: '22 mar', jour: 'Dim', titre: '3e Dimanche de Carême – Scrutin', detail: 'La Samaritaine (Jn 4). Premier scrutin pour les catéchumènes.', temps: 'Carême',               rang: 'Dimanche',  couleur: 'violet' },
      { date: '25 mar', jour: 'Mer', titre: 'Annonciation du Seigneur', detail: 'L\'ange Gabriel annonce à Marie la naissance de Jésus.', temps: 'Carême',         rang: 'Solennité', couleur: 'blanc' },
      { date: '29 mar', jour: 'Dim', titre: '4e Dimanche de Carême – Lætare', detail: 'L\'aveugle-né (Jn 9). Couleur rose. Deuxième scrutin.', temps: 'Carême',    rang: 'Dimanche',  couleur: 'rose' },
    ],
  },
  // ── AVRIL ────────────────────────────────────────────────────────────────
  {
    mois: 'Avril 2026', events: [
      { date: '5 avr',  jour: 'Dim', titre: '5e Dimanche de Carême', detail: 'Résurrection de Lazare (Jn 11). Troisième scrutin pour les catéchumènes.', temps: 'Carême',             rang: 'Dimanche',  couleur: 'violet' },
      { date: '12 avr', jour: 'Dim', titre: 'Dimanche des Rameaux', detail: 'Entrée de Jésus à Jérusalem. Procession avec les palmes. Semaine Sainte.', temps: 'Carême',               rang: 'Dimanche',  couleur: 'rouge' },
      { date: '2 avr',  jour: 'Jeu', titre: 'Jeudi Saint – Cène du Seigneur', detail: 'Institution de l\'Eucharistie et du sacerdoce. Messe du soir. Reposoir.', temps: 'Triduum',     rang: 'Solennité', couleur: 'blanc' },
      { date: '3 avr',  jour: 'Ven', titre: 'Vendredi Saint – Passion du Seigneur', detail: 'Jeûne et abstinence stricts. Chemin de Croix. Célébration de la Passion à 15h.', temps: 'Triduum',          rang: 'Solennité', couleur: 'rouge' },
      { date: '4 avr',  jour: 'Sam', titre: 'Samedi Saint – Vigile Pascale', detail: 'Grande Vigile dans la nuit. Baptêmes des catéchumènes. Nuit la plus sainte de l\'année.', temps: 'Triduum',          rang: 'Solennité', couleur: 'blanc' },
      { date: '5 avr',  jour: 'Dim', titre: '🌅 PÂQUES – Résurrection du Seigneur', detail: 'Solennité des solennités. Alléluia ! Messes festives. Octave de Pâques toute la semaine.', temps: 'Pâques',  rang: 'Solennité', couleur: 'blanc' },
    ],
  },
  // ── MAI ──────────────────────────────────────────────────────────────────
  {
    mois: 'Mai 2026', events: [
      { date: '3 mai',  jour: 'Dim', titre: '2e Dimanche de Pâques – Miséricorde Divine', detail: 'Apparition à Thomas. Instituée par Jean-Paul II. Jubilé de la Miséricorde.', temps: 'Pâques', rang: 'Solennité', couleur: 'blanc' },
      { date: '14 mai', jour: 'Jeu', titre: 'Ascension du Seigneur', detail: 'Jésus monte au Ciel 40 jours après Pâques. Solennité d\'obligation en Afrique.', temps: 'Pâques',          rang: 'Solennité', couleur: 'blanc' },
      { date: '23 mai', jour: 'Sam', titre: '🇸🇳 Début Pèlerinage de Popenguine', detail: '138e édition – Thème : "Sois sans crainte Marie, car tu as trouvé grâce auprès de Dieu". Chapelet à la Grotte à 17h.', temps: 'Sénégal', rang: 'Propre Sénégal', couleur: 'blanc' },
      { date: '24 mai', jour: 'Dim', titre: '🇸🇳 Pentecôte – Pèlerinage Popenguine', detail: 'Solennité de la Pentecôte. 24 000 marcheurs au sanctuaire Notre-Dame de la Délivrande. Fin du Temps Pascal.', temps: 'Pâques', rang: 'Solennité', couleur: 'rouge' },
      { date: '25 mai', jour: 'Lun', titre: '🇸🇳 Clôture Pèlerinage Popenguine', detail: 'Messe solennelle présidée par Mgr Jean-Baptiste Valter MANGA, évêque de Ziguinchor. Chorales de Casamance.', temps: 'Sénégal', rang: 'Propre Sénégal', couleur: 'blanc' },
    ],
  },
  // ── JUIN ─────────────────────────────────────────────────────────────────
  {
    mois: 'Juin 2026', events: [
      { date: '31 mai', jour: 'Dim', titre: 'Fête de la Trinité', detail: '1er dimanche après la Pentecôte. Solennité du Dieu Un et Trine.', temps: 'Ordinaire',  rang: 'Solennité', couleur: 'blanc' },
      { date: '7 juin', jour: 'Dim', titre: 'Fête-Dieu – Corpus Christi', detail: 'Solennité du Saint-Sacrement. Procession eucharistique dans les paroisses.', temps: 'Ordinaire',  rang: 'Solennité', couleur: 'blanc' },
      { date: '19 juin',jour: 'Ven', titre: 'Sacré-Cœur de Jésus', detail: 'Solennité du Cœur de Jésus. Consécration de la famille.', temps: 'Ordinaire',         rang: 'Solennité', couleur: 'blanc' },
      { date: '24 juin',jour: 'Mer', titre: 'Nativité de Saint Jean-Baptiste', detail: 'Solennité. Fête du précurseur du Christ.', temps: 'Ordinaire',             rang: 'Solennité', couleur: 'blanc' },
      { date: '29 juin',jour: 'Lun', titre: 'Saints Pierre et Paul, Apôtres', detail: 'Solennité. Fondements de l\'Église. Journée de prière pour le Pape.', temps: 'Ordinaire',       rang: 'Solennité', couleur: 'rouge' },
    ],
  },
  // ── AOÛT ─────────────────────────────────────────────────────────────────
  {
    mois: 'Août 2026', events: [
      { date: '6 aoû',  jour: 'Jeu', titre: 'Transfiguration du Seigneur', detail: 'Fête du Seigneur. Jésus transfiguré devant Pierre, Jacques et Jean.', temps: 'Ordinaire',          rang: 'Fête',      couleur: 'blanc' },
      { date: '15 aoû', jour: 'Sam', titre: 'Assomption de la Vierge Marie', detail: 'Solennité d\'obligation. Marie élevée corps et âme au Ciel. Grande fête mariale.', temps: 'Ordinaire', rang: 'Solennité', couleur: 'blanc' },
      { date: '22 aoû', jour: 'Sam', titre: 'Marie Reine', detail: 'Mémoire obligatoire. Marie couronnée Reine du Ciel et de la terre.', temps: 'Ordinaire',      rang: 'Mémoire',   couleur: 'blanc' },
    ],
  },
  // ── SEPTEMBRE ────────────────────────────────────────────────────────────
  {
    mois: 'Septembre 2026', events: [
      { date: '8 sep',  jour: 'Mar', titre: 'Nativité de la Vierge Marie', detail: 'Fête de la naissance de Notre-Dame.', temps: 'Ordinaire',                    rang: 'Fête',      couleur: 'blanc' },
      { date: '14 sep', jour: 'Lun', titre: 'Exaltation de la Sainte Croix', detail: 'Fête du signe de la Rédemption. Vénération de la Croix.', temps: 'Ordinaire', rang: 'Fête',   couleur: 'rouge' },
    ],
  },
  // ── OCTOBRE ──────────────────────────────────────────────────────────────
  {
    mois: 'Octobre 2026', events: [
      { date: '1 oct',  jour: 'Jeu', titre: 'Sainte Thérèse de l\'Enfant-Jésus', detail: 'Mémoire obligatoire. Patronne des missions. Docteur de l\'Église.', temps: 'Ordinaire',   rang: 'Mémoire',   couleur: 'blanc' },
      { date: '4 oct',  jour: 'Dim', titre: 'Saint François d\'Assise', detail: 'Mémoire obligatoire. Patron de l\'écologie. Journée mondiale des animaux.', temps: 'Ordinaire',     rang: 'Mémoire',   couleur: 'blanc' },
      { date: '7 oct',  jour: 'Mer', titre: 'Notre-Dame du Rosaire', detail: 'Mémoire obligatoire. Mois du Rosaire. Récitation communautaire dans les paroisses.', temps: 'Ordinaire', rang: 'Mémoire', couleur: 'blanc' },
      { date: '18 oct', jour: 'Dim', titre: 'Saint Luc, Évangéliste', detail: 'Fête de l\'évangéliste. Patron des médecins et artistes.', temps: 'Ordinaire',     rang: 'Fête',      couleur: 'rouge' },
    ],
  },
  // ── NOVEMBRE ─────────────────────────────────────────────────────────────
  {
    mois: 'Novembre 2026', events: [
      { date: '1 nov',  jour: 'Dim', titre: 'Toussaint', detail: 'Solennité de tous les saints. Jour férié et d\'obligation.', temps: 'Ordinaire',                rang: 'Solennité', couleur: 'blanc' },
      { date: '2 nov',  jour: 'Lun', titre: 'Commémoration des fidèles défunts', detail: 'Prières pour les âmes du purgatoire. Visite des cimetières.', temps: 'Ordinaire',           rang: 'Commémoration', couleur: 'violet' },
      { date: '22 nov', jour: 'Dim', titre: 'Christ Roi de l\'Univers', detail: 'Dernière solennité de l\'année liturgique. Fin du Temps Ordinaire.', temps: 'Ordinaire',             rang: 'Solennité', couleur: 'blanc' },
      { date: '29 nov', jour: 'Dim', titre: '1er Dimanche de l\'Avent', detail: 'Début de la nouvelle année liturgique 2026-2027. Couleur violet. Semaine B.', temps: 'Avent',         rang: 'Dimanche',  couleur: 'violet' },
    ],
  },
  // ── DÉCEMBRE ─────────────────────────────────────────────────────────────
  {
    mois: 'Décembre 2026', events: [
      { date: '6 déc',  jour: 'Dim', titre: '2e Dimanche de l\'Avent', detail: 'Jean-Baptiste, voix qui crie dans le désert. Préparez le chemin du Seigneur.', temps: 'Avent',        rang: 'Dimanche',  couleur: 'violet' },
      { date: '8 déc',  jour: 'Mar', titre: 'Immaculée Conception de Marie', detail: 'Solennité d\'obligation. Marie conçue sans péché originel. Fête très populaire au Sénégal.', temps: 'Avent', rang: 'Solennité', couleur: 'blanc' },
      { date: '13 déc', jour: 'Dim', titre: '3e Dimanche de l\'Avent – Gaudete', detail: 'Couleur rose. Joie de l\'Avent. Jean-Baptiste témoigne de la Lumière.', temps: 'Avent',      rang: 'Dimanche',  couleur: 'rose' },
      { date: '20 déc', jour: 'Dim', titre: '4e Dimanche de l\'Avent', detail: 'L\'Annonciation (Lc 1). Dernier dimanche avant Noël.', temps: 'Avent',            rang: 'Dimanche',  couleur: 'violet' },
      { date: '25 déc', jour: 'Ven', titre: '🎄 NOËL – Nativité du Seigneur', detail: 'Solennité d\'obligation. Trois messes : minuit, aurore, du jour. "Gloire à Dieu au plus haut des cieux."', temps: 'Noël', rang: 'Solennité', couleur: 'blanc' },
      { date: '26 déc', jour: 'Sam', titre: 'Saint Étienne, premier martyr', detail: 'Fête du premier martyr chrétien.', temps: 'Noël',                           rang: 'Fête',      couleur: 'rouge' },
      { date: '27 déc', jour: 'Dim', titre: 'Sainte Famille', detail: 'Fête de Jésus, Marie et Joseph. Modèle pour toutes les familles.', temps: 'Noël',          rang: 'Fête',      couleur: 'blanc' },
    ],
  },
];

// ── Résumé des temps liturgiques 2026 ────────────────────────────────────────
const TEMPS_RESUME = [
  { nom: 'Temps de Noël',    periode: '25 déc 2025 → 11 jan 2026', couleur: '#f9a825', icon: '⭐' },
  { nom: 'Temps Ordinaire I', periode: '12 jan → 17 fév 2026',      couleur: '#388e3c', icon: '🌿' },
  { nom: 'Carême',           periode: '18 fév → 4 avr 2026',        couleur: '#7b1fa2', icon: '✝️' },
  { nom: 'Triduum Pascal',   periode: '2 avr (soir) → 4 avr 2026',  couleur: '#c62828', icon: '🕯️' },
  { nom: 'Temps Pascal',     periode: '5 avr → 24 mai 2026',        couleur: '#f57f17', icon: '🌅' },
  { nom: 'Temps Ordinaire II',periode: '25 mai → 28 nov 2026',      couleur: '#388e3c', icon: '🌿' },
  { nom: 'Avent',            periode: '29 nov → 24 déc 2026',       couleur: '#4527a0', icon: '🕯️' },
];

// ── Badge couleurs annonces ───────────────────────────────────────────────────
const BADGE_COLORS = {
  'Messe':      { bg: '#e8f5e9', color: '#2e7d32' },
  'Catéchèse':  { bg: '#fff8e1', color: '#f57f17' },
  'Réunion':    { bg: '#e3f2fd', color: '#1565c0' },
  'Événement':  { bg: '#fce4ec', color: '#c62828' },
};

const ONGLETS = [
  { label: 'Annonces',   icon: 'ti-speakerphone' },
  { label: 'Calendrier', icon: 'ti-calendar' },
  { label: 'Loisirs',    icon: 'ti-confetti' },
];

const RANG_COLORS = {
  'Solennité':     { bg: '#fff3e0', color: '#e65100' },
  'Fête':          { bg: '#e8f5e9', color: '#2e7d32' },
  'Mémoire':       { bg: '#e3f2fd', color: '#1565c0' },
  'Dimanche':      { bg: '#ede7f6', color: '#4527a0' },
  'Férie majeure': { bg: '#fce4ec', color: '#c62828' },
  'Propre Sénégal':{ bg: '#e1f0fa', color: '#0d47a1' },
  'Commémoration': { bg: '#f3e5f5', color: '#6a1b9a' },
  'Férie':         { bg: '#f5f5f5', color: '#616161' },
};

export default function AnnouncementsPage() {
  const [onglet, setOnglet] = useState('Annonces');
  const [moisOuvert, setMoisOuvert] = useState('Mai 2026');
  const [eventOuvert, setEventOuvert] = useState(null);

  return (
    <AppShell>
      <div style={{ background: IVOIRE, backgroundImage: BOGOLAN, minHeight: '100vh' }}>
        <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 16px 16px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>

          {/* TITRE */}
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#F5F0E8', fontFamily: 'Georgia,serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-speakerphone" style={{ fontSize: 24, color: '#C8A84B' }} />
              Annonces
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#71717A' }}>
              Messes, événements et calendrier liturgique
            </p>
          </div>

          {/* ONGLETS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#ffffff', borderRadius: '14px', padding: '6px', border: '1px solid #e4e4e7' }}>
            {ONGLETS.map(o => (
              <button key={o.label} onClick={() => setOnglet(o.label)} style={{
                flex: 1, background: onglet === o.label ? '#1e2d14' : 'transparent',
                color: onglet === o.label ? '#c8a84b' : '#71717A',
                border: 'none', borderRadius: '10px', padding: '8px 4px',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                transition: 'all 0.2s ease'
              }}>
                <i className={`ti ${o.icon}`} style={{ fontSize: 15 }} />
                {o.label}
              </button>
            ))}
          </div>

          {/* ── ANNONCES ── */}
          {onglet === 'Annonces' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ANNONCES.map(a => {
                const badge = BADGE_COLORS[a.categorie] || { bg: '#f3e5f5', color: '#6a1b9a' };
                return (
                  <div key={a.id} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e4e4e7', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ background: '#1e2d14', borderRadius: '12px', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`ti ${a.icon}`} style={{ fontSize: 20, color: '#c8a84b' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#1e2d14' }}>{a.titre}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#71717A' }}>{a.paroisse}</p>
                      </div>
                      <span style={{ background: badge.bg, color: badge.color, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', flexShrink: 0 }}>
                        {a.categorie}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{a.texte}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f4f4f5', paddingTop: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#71717A' }}>
                        <i className="ti ti-calendar" style={{ fontSize: 14, color: '#c8a84b' }} />{a.date}
                      </span>
                      <button style={{ background: '#1e2d14', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#c8a84b', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="ti ti-bell" style={{ fontSize: 13 }} /> Rappel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── CALENDRIER ── */}
          {onglet === 'Calendrier' && (
            <div>
              {/* En-tête */}
              <div style={{ background: '#1e2d14', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <i className="ti ti-calendar-event" style={{ fontSize: 22, color: '#c8a84b' }} />
                  <div>
                    <p style={{ margin: 0, color: '#ffffff', fontWeight: '800', fontSize: '15px' }}>Calendrier Liturgique 2026</p>
                    <p style={{ margin: 0, color: '#c8a84b', fontSize: '11px' }}>Année A · Archidiocèse de Dakar · Rite romain</p>
                  </div>
                </div>
                {/* Résumé des temps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {TEMPS_RESUME.map(t => (
                    <div key={t.nom} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: 14 }}>{t.icon}</span>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.couleur, flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: '#e0e0e0', fontWeight: '600', flex: 1 }}>{t.nom}</span>
                      <span style={{ fontSize: '10px', color: '#c8a84b' }}>{t.periode}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badge Sénégal */}
              <div style={{ background: '#e3f2fd', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #90caf9' }}>
                <span style={{ fontSize: 18 }}>🇸🇳</span>
                <p style={{ margin: 0, fontSize: '12px', color: '#1565c0', fontWeight: '700' }}>
                  Les événements marqués 🇸🇳 sont propres à l'Église catholique du Sénégal
                </p>
              </div>

              {/* Liste par mois */}
              {CALENDRIER.map(({ mois, events }) => (
                <div key={mois} style={{ marginBottom: '10px' }}>
                  {/* Accordéon mois */}
                  <button
                    onClick={() => setMoisOuvert(moisOuvert === mois ? null : mois)}
                    style={{
                      width: '100%', background: moisOuvert === mois ? '#1e2d14' : '#ffffff',
                      border: '1px solid #e4e4e7', borderRadius: moisOuvert === mois ? '14px 14px 0 0' : '14px',
                      padding: '12px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: moisOuvert === mois ? '#c8a84b' : '#1e2d14' }}>
                      {mois}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: moisOuvert === mois ? '#c8a84b88' : '#71717A' }}>
                        {events.length} célébration{events.length > 1 ? 's' : ''}
                      </span>
                      <i className={`ti ti-chevron-${moisOuvert === mois ? 'up' : 'down'}`}
                        style={{ fontSize: 16, color: moisOuvert === mois ? '#c8a84b' : '#71717A' }} />
                    </div>
                  </button>

                  {moisOuvert === mois && (
                    <div style={{ background: '#ffffff', borderRadius: '0 0 14px 14px', border: '1px solid #e4e4e7', borderTop: 'none', overflow: 'hidden' }}>
                      {events.map((ev, i) => {
                        const tc = TEMPS_COULEURS[ev.temps] || TEMPS_COULEURS['Ordinaire'];
                        const rc = RANG_COLORS[ev.rang] || RANG_COLORS['Férie'];
                        const isOpen = eventOuvert === `${mois}-${i}`;
                        return (
                          <div key={i}>
                            <button
                              onClick={() => setEventOuvert(isOpen ? null : `${mois}-${i}`)}
                              style={{
                                width: '100%', background: isOpen ? '#f9f9f6' : 'transparent',
                                border: 'none', borderBottom: i < events.length - 1 || isOpen ? '1px solid #f4f4f5' : 'none',
                                padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                                display: 'flex', alignItems: 'center', gap: '10px'
                              }}>
                              {/* Date */}
                              <div style={{ width: 42, flexShrink: 0, textAlign: 'center' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc.dot, margin: '0 auto 4px' }} />
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#71717A' }}>{ev.date}</span>
                              </div>
                              {/* Contenu */}
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#1e2d14', lineHeight: '1.3' }}>{ev.titre}</p>
                                <span style={{ background: rc.bg, color: rc.color, fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '20px', display: 'inline-block', marginTop: '3px' }}>
                                  {ev.rang}
                                </span>
                              </div>
                              <i className={`ti ti-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 14, color: '#c8a84b', flexShrink: 0 }} />
                            </button>
                            {/* Détail dépliable */}
                            {isOpen && (
                              <div style={{ background: tc.bg, borderLeft: `3px solid ${tc.border}`, padding: '10px 14px 10px 18px', borderBottom: i < events.length - 1 ? '1px solid #f4f4f5' : 'none' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>{ev.detail}</p>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ background: '#1e2d14', color: '#c8a84b', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
                                    {tc.label}
                                  </span>
                                  <span style={{ background: '#f5f5f5', color: '#555', fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>
                                    Couleur : {ev.couleur}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Source */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', padding: '12px', marginTop: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#71717A' }}>
                  Sources : Ordo 2025-2026 (liturgie.catholique.fr) · Archidiocèse de Dakar · APS Sénégal
                </p>
              </div>
            </div>
          )}

          {/* ── LOISIRS ── */}
          {onglet === 'Loisirs' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e4e4e7', padding: '20px', textAlign: 'center' }}>
              <i className="ti ti-confetti" style={{ fontSize: 48, color: '#c8a84b' }} />
              <p style={{ color: '#1e2d14', fontWeight: '700', marginTop: '10px' }}>Loisirs & Activités</p>
              <p style={{ color: '#71717A', fontSize: '13px' }}>Bientôt disponible</p>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
