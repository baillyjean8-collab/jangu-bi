'use strict';

// ── Moteur du calendrier liturgique catholique ──────────────────────────────
// Calcul exact base sur l'algorithme de Meeus/Butcher (le meme que Rome utilise).

function calculerPaques(annee) {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois - 1, jour);
}

function ajouterJours(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function dimancheSuivant(date) {
  const d = new Date(date);
  const jourSemaine = d.getDay();
  const decalage = jourSemaine === 0 ? 0 : 7 - jourSemaine;
  return ajouterJours(d, decalage);
}

// Dernier dimanche avant l'Avent = Christ-Roi. L'Avent commence le 4e dimanche
// avant Noel (ou le dimanche le plus proche du 30 novembre, cote St Andre).
function calculerDebutAvent(annee) {
  const noel = new Date(annee, 11, 25);
  const jourSemaineNoel = noel.getDay();
  const joursAvant4Dimanches = jourSemaineNoel === 0 ? 28 : jourSemaineNoel + 21;
  return ajouterJours(noel, -joursAvant4Dimanches);
}

function calculerFetesMobiles(annee) {
  const paques = calculerPaques(annee);
  const debutAvent = calculerDebutAvent(annee);
  return {
    epiphanie: new Date(annee, 0, 6),
    bapteme_seigneur: dimancheSuivant(new Date(annee, 0, 6)),
    mercredi_cendres: ajouterJours(paques, -46),
    dimanche_rameaux: ajouterJours(paques, -7),
    jeudi_saint: ajouterJours(paques, -3),
    vendredi_saint: ajouterJours(paques, -2),
    samedi_saint: ajouterJours(paques, -1),
    paques: paques,
    lundi_paques: ajouterJours(paques, 1),
    ascension: ajouterJours(paques, 39),
    pentecote: ajouterJours(paques, 49),
    lundi_pentecote: ajouterJours(paques, 50),
    tres_sainte_trinite: ajouterJours(paques, 56),
    fete_dieu: ajouterJours(paques, 63),
    sacre_coeur: ajouterJours(paques, 68),
    coeur_immacule_marie: ajouterJours(paques, 69),
    christ_roi: ajouterJours(debutAvent, -7),
    debut_avent: debutAvent,
    dimanche_gaudete: ajouterJours(debutAvent, 14),
    dimanche_laetare: ajouterJours(paques, -21),
  };
}

// ── Couleurs liturgiques ─────────────────────────────────────────────────────
const COULEURS = {
  blanc: '#F5F0E8',
  or: '#C8A84B',
  rouge: '#B02020',
  vert: '#2e7d32',
  violet: '#6a1b9a',
  rose: '#e091b0',
};

// ── Grandes solennites et fetes universelles a date fixe ────────────────────
// (celebrations les plus stables et les plus connues ; la liste complete des
// ~180 saints sera ajoutee progressivement, mois par mois)
function fetesFixes(annee) {
  return [
    { mois: 0, jour: 1, titre: 'Sainte Marie, Mere de Dieu', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 1, jour: 2, titre: 'Presentation du Seigneur (Chandeleur)', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 2, jour: 19, titre: 'Saint Joseph, epoux de la Vierge Marie', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 2, jour: 25, titre: 'Annonciation du Seigneur', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 5, jour: 24, titre: 'Nativite de saint Jean-Baptiste', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 5, jour: 29, titre: 'Saints Pierre et Paul, apotres', type: 'Solennite', couleur: COULEURS.rouge },
    { mois: 7, jour: 6, titre: 'Transfiguration du Seigneur', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 7, jour: 15, titre: 'Assomption de la Vierge Marie', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 8, jour: 8, titre: 'Nativite de la Vierge Marie', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 8, jour: 14, titre: 'Exaltation de la Sainte Croix', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 9, jour: 1, titre: 'Sainte Therese de l Enfant-Jesus', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 9, jour: 4, titre: 'Saint Francois d Assise', type: 'Memoire', couleur: COULEURS.blanc },
    { mois: 10, jour: 1, titre: 'Toussaint', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 10, jour: 2, titre: 'Commemoration des fideles defunts', type: 'Commemoration', couleur: COULEURS.violet },
    { mois: 10, jour: 9, titre: 'Dedicace de la basilique du Latran', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 10, jour: 21, titre: 'Presentation de la Vierge Marie', type: 'Memoire', couleur: COULEURS.blanc },
    { mois: 11, jour: 8, titre: 'Immaculee Conception', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 11, jour: 12, titre: 'Notre-Dame de Guadalupe', type: 'Memoire', couleur: COULEURS.blanc },
    { mois: 11, jour: 25, titre: 'Nativite du Seigneur (Noel)', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 11, jour: 26, titre: 'Saint Etienne, premier martyr', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 11, jour: 28, titre: 'Saints Innocents, martyrs', type: 'Fete', couleur: COULEURS.rouge },
  ].map(function(f) { return { date: new Date(annee, f.mois, f.jour), titre: f.titre, type: f.type, couleur: f.couleur }; });
}

function determinerSaison(date, fetesMobiles) {
  const t = date.getTime();
  if (t >= fetesMobiles.debut_avent.getTime() && t < new Date(date.getFullYear(), 11, 25).getTime()) return { nom: 'Avent', couleur: COULEURS.violet };
  if (t >= fetesMobiles.mercredi_cendres.getTime() && t < fetesMobiles.dimanche_rameaux.getTime()) return { nom: 'Careme', couleur: COULEURS.violet };
  if (t >= fetesMobiles.dimanche_rameaux.getTime() && t < fetesMobiles.paques.getTime()) return { nom: 'Semaine Sainte', couleur: COULEURS.rouge };
  if (t >= fetesMobiles.paques.getTime() && t <= fetesMobiles.pentecote.getTime()) return { nom: 'Temps Pascal', couleur: COULEURS.blanc };
  return { nom: 'Temps Ordinaire', couleur: COULEURS.vert };
}

function genererAnneeLiturgique(annee) {
  const mobiles = calculerFetesMobiles(annee);
  const fixes = fetesFixes(annee);
  const evenements = [
    { date: mobiles.mercredi_cendres, titre: 'Mercredi des Cendres', type: 'Debut du Careme', couleur: COULEURS.violet },
    { date: mobiles.dimanche_rameaux, titre: 'Dimanche des Rameaux', type: 'Fete', couleur: COULEURS.rouge },
    { date: mobiles.jeudi_saint, titre: 'Jeudi Saint (Cene du Seigneur)', type: 'Triduum', couleur: COULEURS.blanc },
    { date: mobiles.vendredi_saint, titre: 'Vendredi Saint (Passion du Seigneur)', type: 'Triduum', couleur: COULEURS.rouge },
    { date: mobiles.paques, titre: 'Paques - Resurrection du Seigneur', type: 'Solennite', couleur: COULEURS.blanc },
    { date: mobiles.ascension, titre: 'Ascension du Seigneur', type: 'Solennite', couleur: COULEURS.blanc },
    { date: mobiles.pentecote, titre: 'Pentecote', type: 'Solennite', couleur: COULEURS.rouge },
    { date: mobiles.tres_sainte_trinite, titre: 'La Tres Sainte Trinite', type: 'Solennite', couleur: COULEURS.blanc },
    { date: mobiles.fete_dieu, titre: 'Fete-Dieu (Corpus Christi)', type: 'Solennite', couleur: COULEURS.blanc },
    { date: mobiles.sacre_coeur, titre: 'Sacre-Coeur de Jesus', type: 'Solennite', couleur: COULEURS.blanc },
    { date: mobiles.christ_roi, titre: 'Christ, Roi de l univers', type: 'Solennite', couleur: COULEURS.blanc },
    { date: mobiles.debut_avent, titre: '1er dimanche de l Avent', type: 'Debut de l annee liturgique', couleur: COULEURS.violet },
    { date: mobiles.dimanche_gaudete, titre: '3e dimanche de l Avent (Gaudete)', type: 'Dimanche', couleur: COULEURS.rose },
    { date: mobiles.dimanche_laetare, titre: '4e dimanche de Careme (Laetare)', type: 'Dimanche', couleur: COULEURS.rose },
  ].concat(fixes);

  evenements.sort(function(a, b) { return a.date.getTime() - b.date.getTime(); });
  return { annee: annee, mobiles: mobiles, evenements: evenements };
}

module.exports = { calculerPaques, calculerFetesMobiles, genererAnneeLiturgique, determinerSaison, COULEURS };
