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
const BIOS = {
  'sainte-marie-madeleine': "Mentionnee dans l'Evangile de Luc comme une femme liberee par Jesus de sept demons, elle devient l'une de ses disciples les plus fideles, l'accompagnant avec les Douze. Elle reste presente au pied de la croix quand la plupart des apotres ont fui, puis se rend au tombeau au matin de Paques. C'est a elle que le Christ ressuscite apparait en premier, ce qui lui vaut le titre d''apotre des apotres'. En 2016, le pape Francois a eleve sa memoire au rang de fete, reconnaissant ce role unique de premier temoin de la Resurrection.",
  'sainte-brigitte-de-suede': "Nee vers 1303 dans une famille noble de Suede, Brigitte fut epouse et mere de huit enfants avant de se consacrer entierement a Dieu apres la mort de son mari. Elle vecut ensuite a Rome, ou elle fonda un ordre religieux dedie au Saint-Sauveur et rapporta de nombreuses revelations spirituelles. Elle appela avec insistance les papes de son temps a revenir s'installer a Rome plutot qu'en Avignon. Canonisee en 1391, elle a ete proclamee co-patronne de l'Europe par Jean-Paul II en 1999.",
  'saint-jacques-apotre': "Fils de Zebedee et frere de l'apotre Jean, Jacques fut l'un des Douze choisis par Jesus, present avec Pierre et Jean lors de moments marquants comme la Transfiguration. Il fut le premier des apotres a mourir en martyr, decapite a Jerusalem sur l'ordre du roi Herode Agrippa Ier vers l'an 44. La tradition situe le lieu de sa sepulture a Saint-Jacques-de-Compostelle, en Espagne, devenu depuis des siecles l'un des plus grands lieux de pelerinage chretien.",
  'saints-anne-et-joachim': "Selon une tradition ancienne de l'Eglise, remontant a des ecrits des premiers siecles, Anne et Joachim etaient les parents de la Vierge Marie et donc les grands-parents de Jesus. Bien qu'ils ne soient pas mentionnes dans les Evangiles canoniques, leur memoire est celebree depuis tres longtemps en Orient comme en Occident. Ils sont venere comme des modeles de vie familiale et de fidelite, et Anne est invoquee comme patronne des mamans et des grands-parents.",
  'saintes-marthe-marie-et-lazare': "Marthe, Marie et Lazare etaient trois frere et soeurs de Bethanie, amis proches de Jesus qui aimait sejourner chez eux. L'Evangile raconte comment Marthe s'affairait au service pendant que Marie ecoutait Jesus a ses pieds, et comment Jesus rendit la vie a Lazare quatre jours apres sa mort, l'un de ses miracles les plus marquants. Depuis 2021, l'Eglise celebre les trois ensemble le meme jour, reconnaissant leur amitie commune avec le Christ.",
  'saint-ignace-de-loyola': "Ne en 1491 au Pays basque espagnol, Inigo de Loyola visait d'abord une carriere militaire avant d'etre grievement blesse lors d'un siege en 1521. Pendant sa longue convalescence, sa lecture de vies de saints le poussa a se consacrer entierement a Dieu. Devenu pretre sous le nom d'Ignace, il fonda a Rome en 1540 la Compagnie de Jesus (les Jesuites), approuvee par le pape Paul III, et rediga les celebres Exercices spirituels qui guident encore aujourd'hui la priere de nombreux chretiens.",
  'saint-jean-marie-vianney': "Ne en 1786 pres de Lyon dans une famille paysanne, Jean-Marie Vianney eut une jeunesse marquee par des etudes difficiles avant de devenir pretre. Envoye dans la petite paroisse d'Ars, il y passa 41 ans, se consacrant surtout au sacrement de la confession, parfois jusqu'a seize heures par jour, attirant des foules de penitents venus de toute la France. Canonise en 1925, il est proclame en 1929 patron de tous les cures de l'univers, puis reconnu par Benoit XVI comme patron de tous les pretres du monde.",
  'transfiguration-du-seigneur': "Selon les Evangiles de Matthieu, Marc et Luc, Jesus emmena un jour Pierre, Jacques et Jean sur une haute montagne, ou son visage et ses vetements devinrent resplendissants de lumiere devant eux. Moise et Elie lui apparurent, s'entretenant avec lui, et une voix venue du ciel proclama : 'Celui-ci est mon Fils bien-aime'. Cet evenement annonce par avance la gloire de la Resurrection et fortifie les disciples avant les souffrances de la Passion a venir.",
};

function fetesFixes(annee) {
  return [
    { mois: 0, jour: 1, titre: 'Sainte Marie, Mere de Dieu', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 0, jour: 2, titre: 'Saints Basile le Grand et Gregoire de Nazianze', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 0, jour: 17, titre: 'Saint Antoine, abbe', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 0, jour: 21, titre: 'Sainte Agnes, vierge et martyre', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 0, jour: 24, titre: 'Saint Francois de Sales, eveque et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 0, jour: 25, titre: 'Conversion de saint Paul, apotre', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 0, jour: 26, titre: 'Saints Timothee et Tite, eveques', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 0, jour: 28, titre: 'Saint Thomas d Aquin, pretre et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 0, jour: 31, titre: 'Saint Jean Bosco, pretre', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 1, jour: 2, titre: 'Presentation du Seigneur (Chandeleur)', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 1, jour: 11, titre: 'Notre-Dame de Lourdes', type: 'Memoire facultative', couleur: COULEURS.blanc },
    { mois: 1, jour: 22, titre: 'La Chaire de saint Pierre, apotre', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 1, jour: 23, titre: 'Saint Polycarpe, eveque et martyr', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 2, jour: 7, titre: 'Saintes Perpetue et Felicite, martyres', type: 'Memoire facultative', couleur: COULEURS.rouge },
    { mois: 2, jour: 17, titre: 'Saint Patrick, eveque', type: 'Memoire facultative', couleur: COULEURS.blanc },
    { mois: 2, jour: 19, titre: 'Saint Joseph, epoux de la Vierge Marie', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 2, jour: 25, titre: 'Annonciation du Seigneur', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 3, jour: 21, titre: 'Saint Anselme, eveque et docteur de l Eglise', type: 'Memoire facultative', couleur: COULEURS.blanc },
    { mois: 3, jour: 23, titre: 'Saint Georges, martyr', type: 'Memoire facultative', couleur: COULEURS.rouge },
    { mois: 3, jour: 25, titre: 'Saint Marc, evangeliste', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 3, jour: 29, titre: 'Sainte Catherine de Sienne, vierge et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 4, jour: 1, titre: 'Saint Joseph, travailleur', type: 'Memoire facultative', couleur: COULEURS.blanc },
    { mois: 4, jour: 14, titre: 'Saint Matthias, apotre', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 4, jour: 26, titre: 'Saint Philippe Neri, pretre', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 4, jour: 31, titre: 'Visitation de la Vierge Marie', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 5, jour: 24, titre: 'Nativite de saint Jean-Baptiste', type: 'Solennite', couleur: COULEURS.blanc },
    { mois: 5, jour: 1, titre: 'Saint Justin, philosophe et martyr', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 5, jour: 3, titre: 'Saint Charles Lwanga et ses compagnons, martyrs', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 5, jour: 5, titre: 'Saint Boniface, eveque et martyr', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 5, jour: 11, titre: 'Saint Barnabe, apotre', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 5, jour: 13, titre: 'Saint Antoine de Padoue, pretre et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 5, jour: 21, titre: 'Saint Louis de Gonzague', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 5, jour: 28, titre: 'Saint Irenee de Lyon, eveque et martyr, docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 5, jour: 29, titre: 'Saints Pierre et Paul, apotres', type: 'Solennite', couleur: COULEURS.rouge },
    { mois: 6, jour: 3, titre: 'Saint Thomas, apotre', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 6, jour: 11, titre: 'Saint Benoit, abbe, patron de l Europe', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 6, jour: 15, titre: 'Saint Bonaventure, eveque et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 6, jour: 22, titre: 'Sainte Marie-Madeleine', type: 'Fete', couleur: COULEURS.blanc, bio: BIOS['sainte-marie-madeleine'] },
    { mois: 6, jour: 23, titre: 'Sainte Brigitte de Suede, copatronne de l Europe', type: 'Fete', couleur: COULEURS.blanc, bio: BIOS['sainte-brigitte-de-suede'] },
    { mois: 6, jour: 25, titre: 'Saint Jacques, apotre', type: 'Fete', couleur: COULEURS.rouge, bio: BIOS['saint-jacques-apotre'] },
    { mois: 6, jour: 26, titre: 'Saints Anne et Joachim, parents de la Vierge Marie', type: 'Memoire obligatoire', couleur: COULEURS.blanc, bio: BIOS['saints-anne-et-joachim'] },
    { mois: 6, jour: 29, titre: 'Saintes Marthe, Marie et Lazare', type: 'Memoire obligatoire', couleur: COULEURS.blanc, bio: BIOS['saintes-marthe-marie-et-lazare'] },
    { mois: 6, jour: 31, titre: 'Saint Ignace de Loyola, pretre', type: 'Memoire obligatoire', couleur: COULEURS.blanc, bio: BIOS['saint-ignace-de-loyola'] },
    { mois: 7, jour: 4, titre: 'Saint Jean-Marie Vianney, pretre (cure d Ars), patron des pretres', type: 'Memoire obligatoire', couleur: COULEURS.blanc, bio: BIOS['saint-jean-marie-vianney'] },
    { mois: 7, jour: 8, titre: 'Saint Dominique, pretre, fondateur des Precheurs', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 7, jour: 10, titre: 'Saint Laurent, diacre et martyr', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 7, jour: 11, titre: 'Sainte Claire, vierge', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 7, jour: 14, titre: 'Saint Maximilien Marie Kolbe, pretre et martyr', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 7, jour: 20, titre: 'Saint Bernard, abbe et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 7, jour: 22, titre: 'Bienheureuse Vierge Marie Reine', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 7, jour: 24, titre: 'Saint Barthelemy, apotre', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 7, jour: 27, titre: 'Sainte Monique', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 7, jour: 28, titre: 'Saint Augustin, eveque et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 7, jour: 29, titre: 'Passion de saint Jean-Baptiste', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 8, jour: 13, titre: 'Saint Jean Chrysostome, eveque et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 8, jour: 15, titre: 'Notre-Dame des Douleurs', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 8, jour: 16, titre: 'Saints Corneille et Cyprien, martyrs', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 8, jour: 20, titre: 'Saints Andre Kim Taegon, Paul Chong Hasang et compagnons, martyrs', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 8, jour: 21, titre: 'Saint Matthieu, apotre et evangeliste', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 8, jour: 27, titre: 'Saint Vincent de Paul, pretre', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 8, jour: 29, titre: 'Saints Michel, Gabriel et Raphael, archanges', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 8, jour: 30, titre: 'Saint Jerome, pretre et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 9, jour: 2, titre: 'Saints Anges gardiens', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 9, jour: 7, titre: 'Notre-Dame du Rosaire', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 9, jour: 15, titre: 'Sainte Therese d Avila, vierge et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 9, jour: 17, titre: 'Saint Ignace d Antioche, eveque et martyr', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 9, jour: 18, titre: 'Saint Luc, evangeliste', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 9, jour: 28, titre: 'Saints Simon et Jude, apotres', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 10, jour: 4, titre: 'Saint Charles Borromee, eveque', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 10, jour: 11, titre: 'Saint Martin de Tours, eveque', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 10, jour: 22, titre: 'Sainte Cecile, vierge et martyre', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 10, jour: 24, titre: 'Saint Andre Dung-Lac et compagnons, martyrs', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 10, jour: 30, titre: 'Saint Andre, apotre', type: 'Fete', couleur: COULEURS.rouge },
    { mois: 11, jour: 3, titre: 'Saint Francois Xavier, pretre', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 11, jour: 6, titre: 'Saint Nicolas, eveque', type: 'Memoire facultative', couleur: COULEURS.blanc },
    { mois: 11, jour: 7, titre: 'Saint Ambroise, eveque et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 11, jour: 13, titre: 'Sainte Lucie, vierge et martyre', type: 'Memoire obligatoire', couleur: COULEURS.rouge },
    { mois: 11, jour: 14, titre: 'Saint Jean de la Croix, pretre et docteur de l Eglise', type: 'Memoire obligatoire', couleur: COULEURS.blanc },
    { mois: 11, jour: 27, titre: 'Saint Jean, apotre et evangeliste', type: 'Fete', couleur: COULEURS.blanc },
    { mois: 7, jour: 6, titre: 'Transfiguration du Seigneur', type: 'Fete', couleur: COULEURS.blanc, bio: BIOS['transfiguration-du-seigneur'] },
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

export { calculerPaques, calculerFetesMobiles, genererAnneeLiturgique, determinerSaison, COULEURS };

