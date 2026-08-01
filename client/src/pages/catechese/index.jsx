import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout';

const VERT    = "#1e2d14";
const OR      = "#c8a84b";
const CREME   = "#f5f3ee";
const DARK    = "#0C0A06";
const IVOIRE  = "#F5F0E8";
const BOGOLAN = "repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.045) 8px,rgba(200,168,75,0.045) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.045) 8px,rgba(200,168,75,0.045) 9px)";
const DBOG    = "repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)";

// ══════════════════════════════════════════════════════════════
// DONNÉES — Dévotions (prières classiques, litanies, neuvaines)
// ══════════════════════════════════════════════════════════════
const CATEGORIES_PRIERES = [
  {
    id: 'fondamentales', titre: 'Prières fondamentales', icon: '🙏', count: 4,
    prieres: [
      { id: 'notre-pere', titre: 'Notre Père', duree: '1min', contenu: `Notre Père, qui es aux cieux,\nque ton nom soit sanctifié,\nque ton règne vienne,\nque ta volonté soit faite\nsur la terre comme au ciel.\nDonne-nous aujourd'hui notre pain de ce jour.\nPardonne-nous nos offenses,\ncomme nous pardonnons aussi\nà ceux qui nous ont offensés.\nEt ne nous soumets pas à la tentation,\nmais délivre-nous du Mal.\nAmen.` },
      { id: 'je-vous-salue', titre: 'Je vous salue Marie', duree: '45s', contenu: `Je vous salue, Marie pleine de grâces ;\nle Seigneur est avec vous.\nVous êtes bénie entre toutes les femmes\net Jésus, le fruit de vos entrailles, est béni.\nSainte Marie, Mère de Dieu,\npriez pour nous pauvres pécheurs,\nmaintenant et à l'heure de notre mort.\nAmen.` },
      { id: 'gloire', titre: 'Gloire au Père', duree: '20s', contenu: `Gloire au Père, et au Fils, et au Saint-Esprit,\ncomme il était au commencement,\nmaintenant et toujours,\ndans les siècles des siècles.\nAmen.` },
      { id: 'credo', titre: 'Je crois en Dieu (Credo)', duree: '2min', contenu: `Je crois en Dieu, le Père tout-puissant,\nCréateur du ciel et de la terre.\nEt en Jésus-Christ, son Fils unique, notre Seigneur,\nqui a été conçu du Saint-Esprit,\nest né de la Vierge Marie,\na souffert sous Ponce Pilate,\na été crucifié, est mort, a été enseveli,\nest descendu aux enfers,\nle troisième jour est ressuscité des morts,\nest monté aux cieux,\nest assis à la droite de Dieu le Père tout-puissant,\nd'où il viendra juger les vivants et les morts.\nJe crois au Saint-Esprit,\nà la sainte Église catholique,\nà la communion des saints,\nà la rémission des péchés,\nà la résurrection de la chair,\nà la vie éternelle.\nAmen.` },
    ]
  },
  {
    id: 'chapelet', titre: 'Chapelet & Rosaire', icon: '📿', count: 2,
    prieres: [
      { id: 'salve', titre: 'Salve Regina', duree: '1min', contenu: `Salve Regina, Mater misericordiae,\nvita dulcedo et spes nostra, salve.\nAd te clamamus exsules filii Evae.\nAd te suspiramus gementes et flentes\nin hac lacrimarum valle.\nEia ergo advocata nostra,\nillos tuos misericordes oculos ad nos converte.\nEt Jesum benedictum fructum ventris tui,\nnobis post hoc exsilium ostende.\nO clemens, o pia, o dulcis Virgo Maria.\nAmen.` },
      { id: 'angelus', titre: "L'Angélus", duree: '2min', contenu: `V. L'ange du Seigneur apporta l'annonce à Marie.\nR. Et elle conçut du Saint-Esprit.\nJe vous salue Marie...\n\nV. Voici la servante du Seigneur.\nR. Qu'il me soit fait selon votre parole.\nJe vous salue Marie...\n\nV. Et le Verbe s'est fait chair.\nR. Et il a habité parmi nous.\nJe vous salue Marie...\nAmen.` },
    ]
  },
  {
    id: 'autres', titre: 'Autres prières', icon: '✿', count: 4,
    prieres: [
      { id: 'contrition', titre: 'Acte de contrition', duree: '1min', contenu: `Mon Dieu, j'ai un très grand regret de vous avoir offensé,\nparce que vous êtes infiniment bon,\ninfiniment aimable,\net que le péché vous déplaît.\nJe prends la ferme résolution,\navec le secours de votre sainte grâce,\nde ne plus vous offenser\net de faire pénitence.\nAmen.` },
      { id: 'matin', titre: 'Prière du matin', duree: '45s', contenu: `Mon Dieu, je vous offre cette journée.\nQue tout ce que je ferai, dirai ou penserai\nsoit pour votre gloire.\nBénissez mes proches et tous ceux que je rencontrerai.\nGuidez mes pas et éclairez mon cœur.\nAmen.` },
      { id: 'soir', titre: 'Prière du soir', duree: '45s', contenu: `Seigneur, je vous remercie pour cette journée.\nPardonnez-moi mes fautes et mes manquements.\nProtégez-moi cette nuit et accordez-moi le repos.\nAmen.` },
      { id: 'magnificat', titre: 'Magnificat', duree: '1min30', contenu: `Mon âme exalte le Seigneur,\nmon esprit exulte en Dieu mon Sauveur.\nIl s'est penché sur son humble servante ;\ndésormais tous les âges me diront bienheureuse.\nLe Tout-Puissant fit pour moi des merveilles ;\nSaint est son nom !\nAmen.` },
]
},
{
id: 'litanies', titre: 'Litanies', icon: '📜', count: 6,
prieres: [
{
  id: 'litanies-lorette',
  titre: 'Litanies de la Vierge Marie (Lorette)',
  duree: '6 min',
  contenu: `Seigneur, ayez pitié de nous.
Christ, ayez pitié de nous.
Seigneur, ayez pitié de nous.
Christ, écoutez-nous.
Christ, exaucez-nous.

Père céleste, qui êtes Dieu, ayez pitié de nous.
Fils, Rédempteur du monde, qui êtes Dieu, ayez pitié de nous.
Esprit-Saint, qui êtes Dieu, ayez pitié de nous.
Trinité Sainte, qui êtes un seul Dieu, ayez pitié de nous.

Sainte Marie, priez pour nous.
Sainte Mère de Dieu, priez pour nous.
Sainte Vierge des vierges, priez pour nous.
Mère du Christ, priez pour nous.
Mère de l'Église, priez pour nous.
Mère de miséricorde, priez pour nous.
Mère de la divine grâce, priez pour nous.
Mère de l'espérance, priez pour nous.
Mère très pure, priez pour nous.
Mère très chaste, priez pour nous.
Mère toujours vierge, priez pour nous.
Mère sans tache, priez pour nous.
Mère aimable, priez pour nous.
Mère admirable, priez pour nous.
Mère du bon conseil, priez pour nous.
Mère du Créateur, priez pour nous.
Mère du Sauveur, priez pour nous.
Vierge très prudente, priez pour nous.
Vierge digne de vénération, priez pour nous.
Vierge digne de louange, priez pour nous.
Vierge puissante, priez pour nous.
Vierge clémente, priez pour nous.
Vierge fidèle, priez pour nous.
Miroir de justice, priez pour nous.
Siège de la sagesse, priez pour nous.
Cause de notre joie, priez pour nous.
Vase spirituel, priez pour nous.
Vase d'honneur, priez pour nous.
Vase insigne de dévotion, priez pour nous.
Rose mystique, priez pour nous.
Tour de David, priez pour nous.
Tour d'ivoire, priez pour nous.
Maison d'or, priez pour nous.
Arche d'alliance, priez pour nous.
Porte du ciel, priez pour nous.
Étoile du matin, priez pour nous.
Salut des infirmes, priez pour nous.
Refuge des pécheurs, priez pour nous.
Réconfort des migrants, priez pour nous.
Consolatrice des affligés, priez pour nous.
Secours des chrétiens, priez pour nous.

Reine des Anges, priez pour nous.
Reine des Patriarches, priez pour nous.
Reine des Prophètes, priez pour nous.
Reine des Apôtres, priez pour nous.
Reine des Martyrs, priez pour nous.
Reine des Confesseurs, priez pour nous.
Reine des Vierges, priez pour nous.
Reine de tous les Saints, priez pour nous.
Reine conçue sans le péché originel, priez pour nous.
Reine élevée au ciel, priez pour nous.
Reine du très saint Rosaire, priez pour nous.
Reine de la famille, priez pour nous.
Reine de la paix, priez pour nous.

Agneau de Dieu, qui effacez les péchés du monde, pardonnez-nous, Seigneur.
Agneau de Dieu, qui effacez les péchés du monde, exaucez-nous, Seigneur.
Agneau de Dieu, qui effacez les péchés du monde, ayez pitié de nous.

Prions : Accordez-nous, Seigneur notre Dieu, nous vous en supplions, de jouir constamment de la santé de l'âme et du corps, et, par la glorieuse intercession de la bienheureuse Marie toujours Vierge, d'être délivrés des tristesses de cette vie et de parvenir à l'éternelle joie. Par le Christ notre Seigneur.
Amen.`,
  histoire: `L'origine exacte de cette litanie reste incertaine, mais son nom vient du sanctuaire de la Santa Casa de Lorette, en Italie, où sa récitation publique est attestée dès 1531. Devant la multiplication de litanies mariales locales très diverses à travers l'Europe, le pape Sixte Quint en fixa officiellement le texte pour toute l'Église par la bulle Reddituri en 1587 — elle demeure aujourd'hui encore la seule litanie à la Vierge Marie approuvée pour un usage public universel.

Depuis, seuls les papes ont le pouvoir d'y ajouter de nouvelles invocations, à des moments choisis avec soin. « Reine conçue sans le péché originel » fut ajoutée à l'approche de la proclamation du dogme de l'Immaculée Conception (1854) ; « Reine élevée au ciel » après la définition du dogme de l'Assomption par Pie XII en 1950 ; « Reine de la paix » en 1917, en pleine Première Guerre mondiale, par Benoît XV ; « Mère de l'Église », titre proclamé par Paul VI à la clôture du Concile Vatican II, fut insérée dans la litanie par Jean-Paul II en 1980, qui ajouta aussi « Reine de la famille » en 1995. Les trois dernières invocations en date, « Mère de miséricorde », « Mère de l'espérance » et « Réconfort des migrants », ont été ajoutées par le pape François le 20 juin 2020, en pleine pandémie mondiale.`,
},
{
  id: 'litanies-sacre-coeur',
  titre: 'Litanies du Sacré-Cœur de Jésus',
  duree: '5 min',
  contenu: `Seigneur, ayez pitié de nous.
Jésus-Christ, ayez pitié de nous.
Seigneur, ayez pitié de nous.
Jésus-Christ, écoutez-nous.
Jésus-Christ, exaucez-nous.

Père céleste, qui êtes Dieu, ayez pitié de nous.
Fils, Rédempteur du monde, qui êtes Dieu, ayez pitié de nous.
Esprit-Saint, qui êtes Dieu, ayez pitié de nous.
Trinité Sainte, qui êtes un seul Dieu, ayez pitié de nous.

Cœur de Jésus, Fils du Père éternel, ayez pitié de nous.
Cœur de Jésus, formé par le Saint-Esprit dans le sein de la Vierge Mère, ayez pitié de nous.
Cœur de Jésus, uni substantiellement au Verbe de Dieu, ayez pitié de nous.
Cœur de Jésus, d'une majesté infinie, ayez pitié de nous.
Cœur de Jésus, temple saint de Dieu, ayez pitié de nous.
Cœur de Jésus, tabernacle du Très-Haut, ayez pitié de nous.
Cœur de Jésus, maison de Dieu et porte du ciel, ayez pitié de nous.
Cœur de Jésus, fournaise ardente de charité, ayez pitié de nous.
Cœur de Jésus, sanctuaire de la justice et de l'amour, ayez pitié de nous.
Cœur de Jésus, plein de bonté et d'amour, ayez pitié de nous.
Cœur de Jésus, abîme de toutes les vertus, ayez pitié de nous.
Cœur de Jésus, digne de toute louange, ayez pitié de nous.
Cœur de Jésus, roi et centre de tous les cœurs, ayez pitié de nous.
Cœur de Jésus, en qui se trouvent toutes les richesses de la sagesse et de la science, ayez pitié de nous.
Cœur de Jésus, en qui habite toute la plénitude de la divinité, ayez pitié de nous.
Cœur de Jésus, dans lequel le Père s'est complu, ayez pitié de nous.
Cœur de Jésus, de la plénitude duquel nous avons tous reçu, ayez pitié de nous.
Cœur de Jésus, désir des collines éternelles, ayez pitié de nous.
Cœur de Jésus, patient et riche en miséricorde, ayez pitié de nous.
Cœur de Jésus, riche envers tous ceux qui vous invoquent, ayez pitié de nous.
Cœur de Jésus, source de vie et de sainteté, ayez pitié de nous.
Cœur de Jésus, propitiation pour nos péchés, ayez pitié de nous.
Cœur de Jésus, chargé d'opprobres, ayez pitié de nous.
Cœur de Jésus, brisé à cause de nos crimes, ayez pitié de nous.
Cœur de Jésus, fait obéissant jusqu'à la mort, ayez pitié de nous.
Cœur de Jésus, percé par la lance, ayez pitié de nous.
Cœur de Jésus, source de toute consolation, ayez pitié de nous.
Cœur de Jésus, notre vie et notre résurrection, ayez pitié de nous.
Cœur de Jésus, notre paix et notre réconciliation, ayez pitié de nous.
Cœur de Jésus, victime pour les pécheurs, ayez pitié de nous.
Cœur de Jésus, salut de ceux qui espèrent en vous, ayez pitié de nous.
Cœur de Jésus, espérance de ceux qui meurent en vous, ayez pitié de nous.
Cœur de Jésus, délices de tous les saints, ayez pitié de nous.

Agneau de Dieu, qui effacez les péchés du monde, pardonnez-nous, Seigneur.
Agneau de Dieu, qui effacez les péchés du monde, exaucez-nous, Seigneur.
Agneau de Dieu, qui effacez les péchés du monde, ayez pitié de nous.

V/. Jésus, doux et humble de cœur.
R/. Rendez notre cœur semblable au vôtre.

Prions : Dieu tout-puissant et éternel, jetez les yeux sur le Cœur de votre Fils bien-aimé et sur les louanges et satisfactions qu'il vous offre au nom des pécheurs ; apaisé par elles, accordez le pardon à ceux qui implorent votre miséricorde, au nom de ce même Fils, Jésus-Christ, qui vit et règne avec vous dans les siècles des siècles.
Amen.`,
  histoire: `Cette litanie est le fruit d'une lente maturation. Les toutes premières remontent au père jésuite polonais Gaspar Druzbicki (1590-1662) et à saint Jean Eudes, qui en publia une version dès 1668. Ces textes portent la marque profonde de sainte Marguerite-Marie Alacoque, à qui le Christ était apparu à Paray-le-Monial en révélant son Sacré-Cœur. En 1686, six invocations furent composées par une religieuse de Dijon, sœur Madeleine Joly. En 1718, la vénérable Anne-Madeleine Rémuzat, visitandine de Marseille, publia à son tour une litanie de vingt-sept invocations, reprenant dix-sept d'entre elles d'un texte antérieur du père Croiset datant de 1691 : ce sont ces « Litanies de Marseille » qui devinrent la base du texte définitif.

Le pape Léon XIII les approuva d'abord pour les diocèses de Marseille et d'Autun ainsi que pour l'ordre de la Visitation et la Compagnie de Jésus en 1898, avant de les reconnaître comme prière officielle et liturgique pour l'Église universelle tout entière le 2 avril 1899, en y ajoutant les six invocations de sœur Madeleine Joly. Le total de trente-trois invocations au Cœur de Jésus, volontairement choisi, symbolise les trente-trois années de la vie terrestre du Christ. Cette litanie est aujourd'hui l'une des six seules litanies officiellement reconnues par l'Église pour un usage public et liturgique, traditionnellement récitée chaque premier vendredi du mois, jour consacré au Sacré-Cœur.`,
},
{
  id: 'litanies-saint-joseph',
  titre: 'Litanies de Saint Joseph',
  duree: '4 min',
  contenu: `Seigneur, ayez pitié de nous.
Jésus-Christ, ayez pitié de nous.
Seigneur, ayez pitié de nous.
Jésus-Christ, écoutez-nous.
Jésus-Christ, exaucez-nous.

Père céleste, qui êtes Dieu, ayez pitié de nous.
Fils, Rédempteur du monde, qui êtes Dieu, ayez pitié de nous.
Esprit Saint, qui êtes Dieu, ayez pitié de nous.
Trinité Sainte, qui êtes un seul Dieu, ayez pitié de nous.

Sainte Marie, priez pour nous.
Saint Joseph, priez pour nous.
Illustre descendant de David, priez pour nous.
Lumière des Patriarches, priez pour nous.
Époux de la Mère de Dieu, priez pour nous.
Chaste gardien de la Vierge, priez pour nous.
Nourricier du Fils de Dieu, priez pour nous.
Zélé défenseur de Jésus-Christ, priez pour nous.
Chef de la Sainte Famille, priez pour nous.
Joseph très juste, priez pour nous.
Joseph très chaste, priez pour nous.
Joseph très prudent, priez pour nous.
Joseph très fort, priez pour nous.
Joseph très fidèle, priez pour nous.
Miroir de patience, priez pour nous.
Ami de la pauvreté, priez pour nous.
Modèle des travailleurs, priez pour nous.
Gloire de la vie de famille, priez pour nous.
Gardien des vierges, priez pour nous.
Soutien des familles, priez pour nous.
Consolation des malheureux, priez pour nous.
Espérance des malades, priez pour nous.
Patron des mourants, priez pour nous.
Terreur des démons, priez pour nous.
Protecteur de la Sainte Église, priez pour nous.

Agneau de Dieu, qui effacez les péchés du monde, pardonnez-nous, Seigneur.
Agneau de Dieu, qui effacez les péchés du monde, exaucez-nous, Seigneur.
Agneau de Dieu, qui effacez les péchés du monde, ayez pitié de nous.

V/. Il l'a établi le chef de sa maison.
R/. Et l'intendant de tous ses biens.

Prions : Ô Dieu, qui par une providence ineffable avez daigné choisir le bienheureux Joseph pour être l'époux de votre sainte Mère, faites, nous vous en prions, qu'honorant ici-bas en lui notre protecteur, nous méritions de l'avoir pour intercesseur dans le ciel. Vous qui vivez et régnez dans les siècles des siècles.
Amen.`,
  histoire: `La dévotion publique à saint Joseph a mis longtemps à s'épanouir pleinement dans l'Église. Dès le début du XVIIe siècle, les papes Grégoire XV puis Urbain VIII rendirent obligatoire, dans toute la chrétienté, la célébration de sa fête le 19 mars. Le pape Léon XIII lui consacra ensuite une encyclique entière, Quamquam Pluries, l'associant à l'intercession de la Vierge Marie ; puis, le 8 décembre 1870, Pie IX le proclama solennellement patron de l'Église universelle tout entière.

C'est finalement le 18 mars 1909, veille de sa fête, que le pape saint Pie X, lui-même prénommé Joseph de baptême, approuva par décret apostolique cette litanie pour un usage public dans toute l'Église, quelques décennies après la proclamation de son patronage universel par Pie IX. Comme celle du Sacré-Cœur déjà présentée dans cette bibliothèque, elle fait partie des six seules litanies officiellement reconnues pour un usage liturgique et public par l'Église catholique. Plus récemment encore, à l'occasion de l'Année Saint-Joseph proclamée en 2020 par la lettre apostolique Patris Corde, le pape François a approuvé l'ajout de sept nouvelles invocations à cette même litanie, tirées des réflexions de plusieurs de ses prédécesseurs sur la figure de ce père silencieux et fidèle.`,
},
{
  id: 'litanies-saints',
  titre: 'Litanies des Saints',
  duree: '5 min',
  contenu: `Seigneur, prends pitié. Seigneur, prends pitié.
Ô Christ, prends pitié. Ô Christ, prends pitié.
Seigneur, prends pitié. Seigneur, prends pitié.

Sainte Marie, priez pour nous.
Sainte Mère de Dieu, priez pour nous.
Sainte Vierge des vierges, priez pour nous.

Saint Michel, priez pour nous.
Saint Gabriel, priez pour nous.
Saint Raphaël, priez pour nous.
Saints Anges de Dieu, priez pour nous.

Saint Jean-Baptiste, priez pour nous.
Saint Joseph, priez pour nous.
Saint Abraham et saint Moïse, priez pour nous.

Saint Pierre et saint Paul, priez pour nous.
Saint André, priez pour nous.
Saint Jacques et saint Jean, priez pour nous.
Saint Thomas, priez pour nous.
Saint Matthieu, priez pour nous.
Tous les saints Apôtres, priez pour nous.
Saint Luc, priez pour nous.
Saint Marc, priez pour nous.
Sainte Marie-Madeleine, priez pour nous.

Saint Étienne, priez pour nous.
Saint Ignace d'Antioche, priez pour nous.
Saint Polycarpe, priez pour nous.
Saint Laurent, priez pour nous.
Sainte Perpétue et sainte Félicité, priez pour nous.
Sainte Agnès, priez pour nous.
Tous les saints Martyrs, priez pour nous.

Saint Léon et saint Grégoire, priez pour nous.
Saint Ambroise, priez pour nous.
Saint Jérôme, priez pour nous.
Saint Augustin, priez pour nous.
Saint Athanase, priez pour nous.
Saint Basile et saint Grégoire de Nazianze, priez pour nous.
Saint Jean Chrysostome, priez pour nous.
Saint Martin de Tours, priez pour nous.
Saint Patrick, priez pour nous.
Saint Cyrille et saint Méthode, priez pour nous.

Saint Antoine, priez pour nous.
Saint Benoît, priez pour nous.
Saint Bernard, priez pour nous.
Saint François et saint Dominique, priez pour nous.
Saint Thomas d'Aquin, priez pour nous.
Saint Ignace de Loyola et saint François Xavier, priez pour nous.
Saint Jean-Marie Vianney, priez pour nous.
Sainte Catherine de Sienne, priez pour nous.
Sainte Thérèse d'Avila, priez pour nous.
Sainte Thérèse de l'Enfant-Jésus, priez pour nous.

Tous les saints et toutes les saintes de Dieu, priez pour nous.

Toi qui es miséricordieux, pardonne-nous, Seigneur.
Toi qui es miséricordieux, exauce-nous, Seigneur.
De tout mal, délivre-nous, Seigneur.
Par ton incarnation, délivre-nous, Seigneur.
Par ta mort et ta résurrection, délivre-nous, Seigneur.
Par le don de l'Esprit Saint, délivre-nous, Seigneur.

Nous qui sommes pécheurs, nous te supplions, écoute-nous.
Toi qui es venu dans le monde, nous te supplions, écoute-nous.
Toi qui as vaincu la mort, nous te supplions, écoute-nous.

Jésus, Fils du Dieu vivant, nous te supplions, écoute-nous.
Ô Christ, écoute-nous. Ô Christ, exauce-nous.

Prions : Ô Dieu, qui te réjouis de voir se multiplier les membres de ta famille, dans ta bonté, écoute nos prières et accorde à tous ceux qui t'invoquent d'être fortifiés par l'intercession de tous tes saints. Par le Christ notre Seigneur.
Amen.`,
  histoire: `La litanie des saints est l'une des plus anciennes prières encore utilisées aujourd'hui par l'Église. Ses éléments les plus anciens remonteraient au IVᵉ siècle, dans la ville d'Antioche. Elle fut récitée pour la première fois, dans la forme que nous lui connaissons, en l'an 590, sur l'ordre exprès du pape saint Grégoire le Grand, lors d'une grande procession d'action de grâce organisée à Rome. L'ordre précis dans lequel les Apôtres y sont nommés correspond d'ailleurs à celui du Canon romain de la messe, preuve supplémentaire de son ancienneté remarquable.

Cette litanie occupe une place unique dans la liturgie catholique : elle est chantée lors de la veillée pascale avant la bénédiction de l'eau baptismale, pendant la célébration du baptême lui-même, lors des ordinations d'évêques, de prêtres et de diacres, ainsi qu'à la fête de la Toussaint. Elle accompagne aussi la dédicace d'une église, la profession religieuse, et peut être récitée en temps de grande épreuve collective : famine, guerre ou catastrophe. Elle fut notamment chantée lors des obsèques du pape Jean-Paul II en 2005, puis à celles du pape François en 2025, et retentit en latin à chaque conclave, pendant la procession qui conduit les cardinaux électeurs jusqu'à la chapelle Sixtine. Une règle précise encadre son usage : on ne peut y invoquer que des saints officiellement inscrits aux calendriers liturgiques de l'Église, jamais des personnes dont le culte n'a pas été formellement reconnu par elle.`,
},
{
  id: 'litanies-saint-nom-jesus',
  titre: 'Litanies du Saint Nom de Jésus',
  duree: '4 min',
  contenu: `Seigneur, ayez pitié de nous.
Ô Christ, ayez pitié de nous.
Seigneur, ayez pitié de nous.
Jésus, écoutez-nous. Jésus, écoutez-nous.
Jésus, exaucez-nous. Jésus, exaucez-nous.

Père céleste, qui êtes Dieu, ayez pitié de nous.
Fils, Rédempteur du monde, qui êtes Dieu, ayez pitié de nous.
Esprit-Saint, qui êtes Dieu, ayez pitié de nous.
Trinité Sainte, qui êtes un seul Dieu, ayez pitié de nous.

Jésus, Fils du Dieu vivant, ayez pitié de nous.
Jésus, splendeur du Père, ayez pitié de nous.
Jésus, splendeur de la lumière éternelle, ayez pitié de nous.
Jésus, Roi de gloire, ayez pitié de nous.
Jésus, Soleil de justice, ayez pitié de nous.
Jésus, Fils de la Vierge Marie, ayez pitié de nous.
Jésus aimable, ayez pitié de nous.
Jésus admirable, ayez pitié de nous.
Jésus, Dieu fort, ayez pitié de nous.
Jésus, Père des siècles à venir, ayez pitié de nous.
Jésus, Ange du grand conseil, ayez pitié de nous.
Jésus très puissant, ayez pitié de nous.
Jésus très patient, ayez pitié de nous.
Jésus très obéissant, ayez pitié de nous.
Jésus, doux et humble de cœur, ayez pitié de nous.
Jésus, qui aimez la chasteté, ayez pitié de nous.
Jésus, qui nous aimez, ayez pitié de nous.
Jésus, Dieu de paix, ayez pitié de nous.
Jésus, auteur de la vie, ayez pitié de nous.
Jésus, modèle des vertus, ayez pitié de nous.
Jésus, zélateur des âmes, ayez pitié de nous.
Jésus, notre Dieu, ayez pitié de nous.

Agneau de Dieu, qui effacez les péchés du monde, pardonnez-nous, Jésus.
Agneau de Dieu, qui effacez les péchés du monde, exaucez-nous, Jésus.
Agneau de Dieu, qui effacez les péchés du monde, ayez pitié de nous, Jésus.

Jésus, écoutez-nous. Jésus, écoutez-nous.
Jésus, exaucez-nous. Jésus, exaucez-nous.

Prions : Seigneur Jésus-Christ, qui avez dit : « Demandez et vous recevrez, cherchez et vous trouverez, frappez et l'on vous ouvrira », donnez-nous, nous vous en supplions, un tel attrait de votre amour tout divin, que nous vous aimions de tout cœur, de bouche et d'action, et que nous ne cessions jamais de vous louer. Vous qui vivez et régnez dans les siècles des siècles.
Amen.`,
  histoire: `Ce serait saint Bernardin de Sienne et saint Jean de Capistran, deux grands prédicateurs franciscains du XVᵉ siècle, qui rédigèrent la toute première ébauche de cette litanie, dans le prolongement direct de leur prédication inlassable en faveur de la dévotion au saint Nom de Jésus, qu'ils contribuèrent à répandre dans toute l'Europe à une époque où ce nom était parfois invoqué avec une piété presque superstitieuse. Une tradition rapporte qu'en 1432, lors d'une terrible épidémie de peste à Lisbonne, l'invocation confiante du seul nom de Jésus par la population aurait permis d'enrayer le fléau, popularisant encore davantage cette dévotion dans toute la péninsule ibérique.

Approuvée pour un usage privé par le pape Sixte Quint en 1585, cette litanie ne fut autorisée pour la récitation publique dans toute l'Église que trois siècles plus tard, par le pape Léon XIII en 1886. Le pape Pie XI, en 1933, y attacha une indulgence plénière pour les fidèles qui la réciteraient chaque jour durant un mois complet. Chaque invocation de cette litanie est directement tirée des Saintes Écritures elles-mêmes, en particulier des titres messianiques annoncés par les prophètes de l'Ancien Testament et repris par les évangélistes, ce qui en fait une prière de louange biblique avant d'être une simple prière de demande.`,
},
{
  id: 'litanies-precieux-sang',
  titre: 'Litanies du Précieux Sang',
  duree: '3 min',
  contenu: `Seigneur, ayez pitié de nous.
Ô Christ, ayez pitié de nous.
Seigneur, ayez pitié de nous.

Père céleste, qui êtes Dieu, ayez pitié de nous.
Fils, Rédempteur du monde, qui êtes Dieu, ayez pitié de nous.
Esprit Saint, qui êtes Dieu, ayez pitié de nous.
Trinité Sainte, qui êtes un seul Dieu, ayez pitié de nous.

Sang du Christ, Fils unique du Père éternel, sauvez-nous.
Sang du Christ, Verbe de Dieu incarné, sauvez-nous.
Sang du Christ, de la Nouvelle et Éternelle Alliance, sauvez-nous.
Sang du Christ, ruisselant à terre lors de l'agonie, sauvez-nous.
Sang du Christ, jailli sous la flagellation, sauvez-nous.
Sang du Christ, jailli sous le couronnement d'épines, sauvez-nous.
Sang du Christ, répandu sur la Croix, sauvez-nous.
Sang du Christ, prix de notre salut, sauvez-nous.
Sang du Christ, sans lequel il n'est pas de rémission, sauvez-nous.
Sang du Christ, breuvage et purification des âmes dans l'Eucharistie, sauvez-nous.

Agneau de Dieu, qui effacez les péchés du monde, exaucez-nous, Seigneur.
Agneau de Dieu, qui effacez les péchés du monde, ayez pitié de nous.

V/. Vous nous avez rachetés, Seigneur, par votre sang.
R/. Et vous avez fait de nous, pour notre Dieu, un royaume.

Prions : Dieu tout-puissant et éternel, vous qui avez établi votre Fils unique comme Rédempteur du monde et avez voulu être apaisé par son sang, accordez-nous, nous vous en supplions, de vénérer ainsi le prix de notre salut et d'être défendus par sa vertu contre les maux de la vie présente sur cette terre, afin que nous nous réjouissions éternellement de son fruit dans les cieux. Par le même Christ notre Seigneur.
Amen.`,
  histoire: `La dévotion au Précieux Sang du Christ remonte aux tout premiers temps de l'Église elle-même : saint Pierre rappelle déjà aux premiers chrétiens qu'ils n'ont pas été rachetés par des biens périssables, mais par le sang précieux du Christ, l'Agneau sans défaut ni tache (1 P 1, 19). En 1849, le pape Pie IX institua une fête liturgique dédiée au Précieux Sang, célébrée chaque premier dimanche de juillet.

C'est le pape saint Jean XXIII qui donna à cette dévotion sa forme la plus aboutie : le 24 février 1960, il promulgua officiellement le texte définitif de ces litanies, puis publia, le 30 juin de la même année, une lettre apostolique consacrée tout entière à la dévotion au Précieux Sang, demandant que tout le mois de juillet lui soit spécialement dédié dans l'Église universelle. Le pape voyait dans cette dévotion un moyen particulièrement efficace de conjurer les dangers qui menaçaient alors l'Église et les nations, en plein cœur de la guerre froide.`,
},
]
},
{
id: 'neuvaines', titre: 'Neuvaines', icon: '🕯️', count: 5,
prieres: [
{
  id: 'neuvaine-esprit-saint',
  titre: "Neuvaine à l'Esprit Saint",
  duree: '9 jours',
  contenu: `PRIÈRE QUOTIDIENNE (à répéter chaque jour) :
Esprit Saint, envoyé par le Père au nom de Jésus, vous qui êtes appelé le Consolateur, donnez-moi l'intelligence spirituelle par laquelle je puisse connaître les choses de Dieu. Enseignez-moi la vérité tout entière et faites qu'avec vous j'aime toujours ce qui est bon et juste. Consolez-moi dans mes peines et assistez-moi dans mes épreuves. Éloignez de moi les mauvais esprits, guidez-moi dans le chemin de la justice et de la vertu, afin que je sois trouvé digne d'entrer dans la vie éternelle. Amen.

Jour 1 — Le don de Sagesse : Esprit Saint, donnez-moi de goûter les choses de Dieu par-dessus toute chose créée.
Jour 2 — Le don d'Intelligence : Esprit Saint, éclairez mon esprit pour que je comprenne plus profondément les vérités de la foi.
Jour 3 — Le don de Conseil : Esprit Saint, guidez mes choix et mes décisions selon la volonté de Dieu.
Jour 4 — Le don de Force : Esprit Saint, donnez-moi le courage de vivre ma foi sans crainte, même dans l'épreuve.
Jour 5 — Le don de Science : Esprit Saint, apprenez-moi à voir la trace de Dieu dans toute chose créée.
Jour 6 — Le don de Piété : Esprit Saint, faites grandir en moi un amour filial et confiant envers Dieu.
Jour 7 — Le don de Crainte de Dieu : Esprit Saint, donnez-moi un profond respect devant la sainteté de Dieu, qui éloigne du péché.
Jour 8 — Pour l'Église : Esprit Saint, renouvelez la face de l'Église et de notre paroisse par votre souffle.
Jour 9 — Pour ma propre conversion : Esprit Saint, achevez en moi l'œuvre commencée à mon baptême et ma confirmation.

(Le neuvième jour, veille de Pentecôte selon la tradition, on conclut par un Notre Père, un Je vous salue Marie et un Gloire au Père.)`,
    histoire: `Cette neuvaine est, selon la tradition de l'Église, la toute première de l'histoire chrétienne — celle qui a donné son nom et sa durée de neuf jours à toutes les neuvaines qui suivront. Après l'Ascension, Jésus avait demandé à ses disciples de ne pas quitter Jérusalem mais d'y attendre l'accomplissement de la promesse du Père. Les Actes des Apôtres rapportent qu'ils se retirèrent alors dans la chambre haute du Cénacle, unanimes et assidus à la prière, avec Marie mère de Jésus (Ac 1, 12-14), pendant les neuf jours qui séparèrent l'Ascension de la Pentecôte, jour où l'Esprit Saint descendit sur eux sous forme de langues de feu.

C'est le pape Léon XIII qui, par son encyclique Divinum Illud Munus en 1897, exhorta solennellement toute l'Église catholique à renouveler chaque année, entre l'Ascension et la Pentecôte, cette neuvaine primitive vécue par les Apôtres et la Vierge Marie, lui donnant ainsi un caractère universel et officiel qu'elle conserve aujourd'hui encore.`,
},
{
  id: 'neuvaine-sainte-therese-rose',
  titre: "Neuvaine à la Rose — Sainte Thérèse de l'Enfant-Jésus",
  duree: '9 jours',
  contenu: `PRIÈRE D'OUVERTURE (à dire chaque jour avant de formuler sa demande) :
Très Sainte Trinité, Père, Fils et Saint-Esprit, je vous remercie pour toutes les grâces et faveurs dont vous avez enrichi votre servante sainte Thérèse de l'Enfant-Jésus pendant les vingt-quatre années qu'elle passa sur cette terre. Par les mérites de cette sainte, je vous demande de m'accorder la grâce que je désire ardemment (formuler ici sa demande), si elle est conforme à votre sainte volonté et pour le bien de mon âme.

Récitez ensuite, chaque jour de la neuvaine, vingt-quatre fois de suite (une pour chacune des vingt-quatre années de sa vie) :
Gloire au Père, et au Fils, et au Saint-Esprit, comme il était au commencement, maintenant et toujours, dans les siècles des siècles. Amen.
— Sainte Thérèse de l'Enfant-Jésus, priez pour nous.

PRIÈRE DE CLÔTURE (à dire chaque jour après les vingt-quatre Gloire au Père) :
Ô sainte Thérèse, réalisez une fois encore votre promesse de passer votre Ciel à faire du bien sur la terre. Faites-moi connaître, si cela est possible et selon la volonté de Dieu, par le signe d'une rose, que vous intercédez pour moi auprès de lui.`,
  histoire: `Cette neuvaine, la plus connue de toutes celles adressées à sainte Thérèse, est née d'un geste de reconnaissance personnelle. Le 3 décembre 1925, le père Anton Puntigam, jésuite autrichien, entreprit une neuvaine en récitant chaque jour vingt-quatre « Gloire au Père », un pour chacune des vingt-quatre années de la vie de la petite carmélite, morte de la tuberculose au Carmel de Lisieux le 30 septembre 1897. Elle venait tout juste d'être canonisée par le pape Pie XI, le 17 mai de cette même année 1925. Cette pratique se répandit rapidement à travers le monde entier sous le nom de neuvaine miraculeuse ou neuvaine à la rose.

Le nom de rose renvoie directement à une confidence que Thérèse fit, quelques mois avant sa mort, à sa sœur aînée devenue religieuse au même Carmel sous le nom de sœur Marie du Sacré-Cœur. Comme celle-ci s'inquiétait de la peine que sa mort proche allait causer à la communauté, Thérèse lui répondit avec simplicité : « Oh non, vous verrez, ce sera comme une pluie de roses. » Cette promesse rejoint sa conviction la plus célèbre, exprimée dans ses tout derniers entretiens : « Je veux passer mon Ciel à faire du bien sur la terre. » Sainte Thérèse de l'Enfant-Jésus et de la Sainte-Face fut déclarée docteur de l'Église par Jean-Paul II en 1997, l'une des quatre seules femmes à recevoir ce titre, et demeure, avec saint François Xavier, patronne principale des missions.`,
},
{
  id: 'neuvaine-notre-dame-perpetuel-secours',
  titre: 'Neuvaine à Notre-Dame du Perpétuel Secours',
  duree: '9 jours',
  contenu: `PRIÈRE QUOTIDIENNE (à répéter chaque jour) :
Ô Très Sainte Vierge Marie, qui, pour nous inspirer une confiance sans bornes, avez voulu prendre le très doux nom de Mère du Perpétuel Secours, je vous supplie de me secourir en tout temps et en tout lieu, dans mes tentations, après mes chutes, dans mes difficultés et dans toutes les misères de la vie, et surtout à l'heure de ma mort. Accordez-moi, ô Mère aimante, la pensée et l'habitude de recourir toujours à vous, avec la confiance d'un enfant, afin que par ma prière constante j'obtienne votre perpétuel secours et la persévérance finale. Amen.

Jour 1 — La confiance : Mère du Perpétuel Secours, apprenez-moi à tout vous confier, comme un enfant remet sa main dans celle de sa mère.
Jour 2 — La Croix et l'épreuve : Sur votre icône, les Anges Gabriel et Michel présentent à Jésus les instruments de sa Passion ; aidez-moi à ne jamais fuir ma propre croix.
Jour 3 — La protection maternelle : Vous qui tenez fermement la main de l'Enfant Jésus, ne cessez de tenir la mienne dans les incertitudes de ma vie.
Jour 4 — Les tentations : Mère du Perpétuel Secours, secourez-moi particulièrement aux heures où je suis le plus exposé à céder au mal.
Jour 5 — Les malades et les souffrants : Souvenez-vous aujourd'hui de tous ceux qui portent une maladie du corps ou de l'âme, et obtenez-leur soulagement.
Jour 6 — Les familles : Veillez sur nos foyers comme vous avez veillé sur la Sainte Famille de Nazareth.
Jour 7 — Les défunts : Accueillez auprès de vous ceux qui nous ont quittés, et consolez ceux qui pleurent leur absence.
Jour 8 — L'Église et les prêtres : Soutenez le Pape, les évêques et tous les prêtres qui servent votre Fils au milieu du monde.
Jour 9 — L'heure de la mort : Ô Mère du Perpétuel Secours, qu'en sera-t-il de moi lorsque je serai sur le point de remettre mon âme à Dieu ? Obtenez-moi la grâce de vous invoquer alors plus souvent que jamais, afin que je meure en aimant Dieu et en vous aimant, pour aller ensuite vous aimer éternellement dans le Paradis.`,
    histoire: `L'icône elle-même, de type byzantin, daterait du XIIIᵉ ou XIVᵉ siècle. Selon la tradition, elle aurait été rapportée à Rome vers la fin du XVᵉ siècle par un marchand crétois, avant d'être finalement déposée, à la demande de la Vierge elle-même selon le récit transmis, dans l'église Saint-Matthieu de Rome, confiée aux pères Augustins. Elle y fut vénérée durant plus de trois siècles, jusqu'à la destruction de cette église en 1798 par les troupes révolutionnaires françaises occupant alors Rome. Juste avant cette destruction, les Augustins parvinrent à sauver l'icône en la plaçant dans la chapelle d'un couvent voisin, où elle tomba peu à peu dans l'oubli.

Redécouverte en 1863, elle fut confiée en 1866 par le pape Pie IX aux pères Rédemptoristes, avec la mission explicite de « la faire connaître au monde entier », précisément parce que leur nouvelle église Sant'Alfonso all'Esquilino se trouvait bâtie sur le site même de l'ancienne église Saint-Matthieu — signe, pour beaucoup, que Marie elle-même avait choisi ce lieu et cette famille religieuse, fondée par saint Alphonse de Liguori, pour répandre sa dévotion. Les Rédemptoristes tinrent cette mission avec un tel succès que Notre-Dame du Perpétuel Secours est aujourd'hui l'une des images mariales les plus reproduites et les plus vénérées de toute l'Église catholique, particulièrement répandue en Asie, notamment aux Philippines, où des foules considérables se rassemblent chaque mercredi pour cette même neuvaine, introduite dans le pays au début du XXᵉ siècle par des missionnaires rédemptoristes irlandais.`,
},
{
  id: 'neuvaine-saint-michel',
  titre: 'Neuvaine à Saint Michel Archange',
  duree: '9 jours',
  contenu: `PRIÈRE QUOTIDIENNE (à répéter chaque jour) :
Saint Michel Archange, défendez-nous dans le combat ; soyez notre protecteur contre la perfidie et les embûches du démon. Que Dieu lui commande, nous le supplions humblement ; et vous, prince de la milice céleste, refoulez en enfer par la puissance divine Satan et les autres esprits mauvais qui rôdent dans le monde pour la perte des âmes. Amen.

Jour 1 — Michel, chef de la milice céleste : Aidez-moi à demeurer ferme et loyal au service de Dieu, quelles que soient les épreuves.
Jour 2 — Michel, vainqueur du dragon : Donnez-moi la force de résister au mal partout où je le rencontre.
Jour 3 — Michel, protecteur du peuple de Dieu : Veillez sur mon foyer, ma famille et tous ceux que j'aime.
Jour 4 — Michel, gardien de l'Église : Défendez l'Église tout entière contre toutes les attaques qui la menacent.
Jour 5 — Michel, ange de la justice : Apprenez-moi à agir toujours selon la vérité et la droiture.
Jour 6 — Michel, consolateur des affligés : Intercédez pour tous ceux qui traversent aujourd'hui une épreuve.
Jour 7 — Michel, ange de la prière d'Israël : Accompagnez ma prière et présentez-la devant le trône de Dieu.
Jour 8 — Michel, patron des mourants : Assistez tous ceux qui, aujourd'hui, quittent ce monde, et conduisez leur âme vers Dieu.
Jour 9 — Michel, prince de la milice céleste : Obtenez-moi la grâce particulière que je demande en cette neuvaine, si elle est conforme à la volonté de Dieu.`,
    histoire: `Le nom de Michel, qui signifie en hébreu « Qui est comme Dieu ? », apparaît dans le livre de Daniel puis dans l'Apocalypse, où il combat le dragon à la tête des armées célestes. La tradition chrétienne en a fait le chef de la milice angélique, protecteur du peuple de Dieu et gardien de l'Église.

La prière quotidienne de cette neuvaine, aujourd'hui la plus répandue au monde parmi celles adressées à saint Michel, fut composée par le pape Léon XIII en 1886, à la suite d'une expérience personnelle restée célèbre : selon le récit transmis par son entourage, le pape, après avoir célébré la messe le 13 octobre 1884, serait resté immobile un long moment, comme plongé dans une vision effrayante, avant de se rendre directement dans son bureau pour rédiger cette prière, qu'il ordonna aussitôt de réciter à la fin de chaque messe basse dans toute l'Église catholique, une pratique observée jusqu'à la réforme liturgique de 1964. Retirée un temps de l'usage courant, cette prière connaît depuis plusieurs décennies un regain de popularité considérable, à tel point que le pape Jean-Paul II lui-même encouragea publiquement les fidèles, en 1994, à la reprendre largement dans leur prière personnelle face aux défis de l'époque contemporaine. Saint Michel est aujourd'hui le saint patron des policiers, des militaires et de tous ceux dont la mission est de protéger autrui.`,
},
{
  id: 'neuvaine-saint-antoine-padoue',
  titre: 'Neuvaine à Saint Antoine de Padoue',
  duree: '9 jours',
  contenu: `PRIÈRE QUOTIDIENNE (à répéter chaque jour) :
Ô glorieux saint Antoine, lumière de la sainte Écriture et secours des désespérés, je vous prie, exaucez mes humbles prières, en m'obtenant de Dieu sa divine miséricorde et son assistance. Accordez-moi la grâce que je vous demande avec confiance en cette neuvaine, si elle est conforme à sa sainte volonté.
(Ajouter : 3 Notre Père, 3 Je vous salue Marie, 3 Gloire au Père.)

Jour 1 — Le prédicateur inspiré : Saint Antoine, docteur de l'Église, obtenez-moi de mieux comprendre et d'aimer la Parole de Dieu.
Jour 2 — Le pauvre volontaire : Vous qui avez tout quitté pour suivre le Christ dans la pauvreté franciscaine, détachez mon cœur des biens de ce monde.
Jour 3 — Le protecteur des objets et des causes perdues : Aidez-moi à retrouver ce que j'ai perdu, et surtout à ne jamais perdre espoir dans les situations les plus difficiles.
Jour 4 — L'ami des pauvres : Rendez-moi attentif aux besoins de ceux qui manquent du nécessaire autour de moi.
Jour 5 — Le gardien des familles : Veillez sur mon foyer et sur l'unité de ceux que j'aime.
Jour 6 — Le consolateur des malades : Intercédez pour tous ceux qui souffrent aujourd'hui dans leur corps ou leur âme.
Jour 7 — L'ami des enfants : Vous qui avez tenu l'Enfant Jésus dans vos bras, protégez tous les enfants du monde.
Jour 8 — Le patron des marins et des voyageurs : Gardez tous ceux qui sont en chemin, sur terre comme sur mer.
Jour 9 — Le thaumaturge de Padoue : Obtenez-moi, par votre intercession si puissante auprès de Dieu, la grâce particulière que je demande en cette neuvaine.`,
  histoire: `Né en 1195 à Lisbonne sous le nom de Fernando Martins de Bulhões, il entra d'abord chez les chanoines réguliers de Saint-Augustin avant de rejoindre l'ordre franciscain naissant, bouleversé par le témoignage de frères franciscains martyrisés au Maroc dont les reliques venaient d'être rapportées au Portugal. Devenu l'un des plus grands prédicateurs de son temps, il fut chargé par l'évêque de Padoue de prêcher chaque jour du Carême 1231 devant la ville entière. Sa maîtrise exceptionnelle des Écritures lui valut d'être déclaré docteur de l'Église en 1946 par le pape Pie XII, l'un des rares saints de l'histoire à recevoir ce titre.

Sa réputation de faiseur de miracles se répandit très vite après sa mort, survenue le 13 juin 1231 près de Padoue à l'âge d'environ trente-six ans seulement : il fut canonisé moins d'un an plus tard, le 30 mai 1232, par le pape Grégoire IX, l'une des canonisations les plus rapides de toute l'histoire de l'Église. Sa dévotion comme protecteur des objets perdus, aujourd'hui la plus populaire, remonterait au XVIIᵉ siècle et à l'anecdote d'un novice qui, après avoir dérobé son livre de psaumes annoté, se serait senti contraint de le lui rendre après une prière insistante. Le mardi, jour de sa mort, reste traditionnellement considéré comme son jour privilégié, donnant lieu à une dévotion particulière appelée la Treizaine, priée durant les treize mardis précédant sa fête du 13 juin.`,
},
]
},
];

const CATEGORIES_CATECHISME = [
  {
    id: 'dieu', titre: 'Dieu et la Trinité', icon: '✝️', count: 3,
    articles: [
      { id: 'trinite', titre: 'La Sainte Trinité', ref: 'CEC §232–267', temps: '5min',
        contenu: `La Trinité est le mystère central de la foi chrétienne. Dieu est Un en nature, mais Trois en Personnes : le Père, le Fils et le Saint-Esprit.\n\n🔹 Le Père est l'origine sans origine, source de toute vie.\n🔹 Le Fils (Jésus-Christ) est engendré éternellement par le Père, Dieu fait homme pour notre salut.\n🔹 Le Saint-Esprit procède du Père et du Fils. Il est le don de l'amour divin.\n\nCes trois Personnes sont distinctes mais ne font qu'un seul Dieu. Elles sont coégales, coéternelles et consubstantielles.\n\n« Le mystère de la Très Sainte Trinité est le mystère central de la foi et de la vie chrétienne. » (CEC §234)` },
      { id: 'saint-esprit', titre: 'Le Saint-Esprit', ref: 'CEC §683–747', temps: '4min',
        contenu: `Le Saint-Esprit est la troisième Personne de la Trinité.\n\nSes 7 dons (Is 11,2-3) :\nSagesse – Intelligence – Conseil – Force – Science – Piété – Crainte de Dieu\n\nSes fruits (Ga 5,22) :\nAmour, joie, paix, patience, bonté, bénignité, fidélité, douceur, maîtrise de soi.` },
      { id: 'jesus', titre: 'Jésus-Christ : vrai Dieu et vrai homme', ref: 'CEC §422–682', temps: '6min',
        contenu: `Jésus-Christ est à la fois pleinement Dieu et pleinement homme. C'est le mystère de l'Incarnation.\n\n🔹 Il est Dieu : engendré, non créé, de même nature que le Père\n🔹 Il est homme : né de la Vierge Marie, a souffert, est mort et est ressuscité\n\n« Le Verbe s'est fait chair et il a habité parmi nous. » (Jn 1,14)` },
    ]
  },
  {
    id: 'sacrements', titre: 'Les 7 Sacrements', icon: '🕊️', count: 8,
    articles: [
      { id: 'intro-sacrements', titre: "Qu'est-ce qu'un sacrement ?", ref: 'CEC §1113–1134', temps: '3min',
        contenu: `Les sacrements sont des signes efficaces de la grâce, institués par le Christ et confiés à l'Église.\n\nIl y a 7 sacrements :\n1. 🌊 Le Baptême\n2. 🕊️ La Confirmation\n3. 🍞 L'Eucharistie\n4. 🙏 La Pénitence\n5. 🏥 L'Onction des malades\n6. ✝️ L'Ordre sacré\n7. 💍 Le Mariage` },
      { id: 'bapteme', titre: '🌊 Le Baptême', ref: 'CEC §1213–1284', temps: '4min',
        contenu: `Le Baptême est le premier et le plus fondamental des sacrements.\n\n🔹 Il efface le péché originel\n🔹 Fait naître à la vie divine\n🔹 Incorpore à l'Église Corps du Christ\n\n« À moins de naître d'eau et d'Esprit, nul ne peut entrer dans le Royaume de Dieu. » (Jn 3,5)` },
      { id: 'eucharistie', titre: "🍞 L'Eucharistie", ref: 'CEC §1322–1419', temps: '5min',
        contenu: `L'Eucharistie est « la source et le sommet de toute la vie chrétienne » (CEC §1324).\n\nConditions pour communier :\n• Être baptisé catholique\n• Être en état de grâce\n• Observer le jeûne eucharistique (1h avant)\n\n« Je suis le pain vivant, descendu du ciel. » (Jn 6,51)` },
      { id: 'penitence', titre: '🙏 La Pénitence', ref: 'CEC §1422–1498', temps: '4min',
        contenu: `Le sacrement de Pénitence remet les péchés commis après le Baptême.\n\nLes 5 éléments nécessaires :\n1. Examen de conscience\n2. Contrition sincère\n3. Ferme propos\n4. Confession orale au prêtre\n5. Satisfaction (pénitence)\n\nLe prêtre est tenu au secret absolu (sceau sacramentel).` },
      { id: 'confirmation', titre: '🕊️ La Confirmation', ref: 'CEC §1285–1321', temps: '3min', contenu: `La Confirmation complète le Baptême et donne les 7 dons du Saint-Esprit.\n\nL'évêque oint le front du confirmé avec le Saint-Chrême en disant :\n« Sois marqué de l'Esprit Saint, le Don de Dieu. »` },
      { id: 'onction', titre: "🏥 L'Onction des malades", ref: 'CEC §1499–1532', temps: '3min', contenu: `L'Onction des malades est destinée aux chrétiens gravement malades.\n\n🔹 Réconfort dans la souffrance\n🔹 Union à la Passion du Christ\n🔹 Parfois la guérison corporelle\n\n« Que l'un de vous est-il malade ? Qu'il appelle les presbytres de l'Église. » (Jc 5,14)` },
      { id: 'ordre', titre: "✝️ L'Ordre sacré", ref: 'CEC §1536–1600', temps: '4min', contenu: `L'Ordre consacre des hommes au service de l'Église.\n\n3 degrés :\n1. Diaconat\n2. Presbytérat (Prêtrise)\n3. Épiscopat (Évêque)` },
      { id: 'mariage', titre: '💍 Le Mariage', ref: 'CEC §1601–1666', temps: '4min', contenu: `Le Mariage chrétien est une alliance entre un homme et une femme.\n\nPropriétés essentielles :\n• Unité : entre un homme et une femme\n• Indissolubilité\n• Ouverture à la vie\n\n« Ce que Dieu a uni, que l'homme ne le sépare pas » (Mt 19,6)` },
    ]
  },
  {
    id: 'foi', titre: 'Vie chrétienne & Foi', icon: '📖', count: 5,
    articles: [
      { id: 'commandements', titre: 'Les 10 Commandements', ref: 'CEC §2052–2557', temps: '3min',
        contenu: `Source : Exode 20,1-17\n\n1️⃣ Je suis le Seigneur ton Dieu\n2️⃣ Tu ne prendras pas le nom du Seigneur en vain\n3️⃣ Tu sanctifieras le jour du Seigneur\n4️⃣ Honore ton père et ta mère\n5️⃣ Tu ne tueras pas\n6️⃣ Tu ne commettras pas d'adultère\n7️⃣ Tu ne voleras pas\n8️⃣ Tu ne porteras pas de faux témoignage\n9️⃣ Tu ne convoiteras pas la femme de ton prochain\n🔟 Tu ne convoiteras pas les biens de ton prochain` },
      { id: 'peche', titre: 'Le Péché : nature et types', ref: 'CEC §1846–1876', temps: '4min',
        contenu: `Les 7 péchés capitaux :\nOrgueil – Avarice – Luxure – Envie – Gourmandise – Colère – Paresse\n\nPéché mortel : matière grave + pleine connaissance + plein consentement\nPéché véniel : offense moins grave, affaiblit la charité` },
      { id: 'grace', titre: 'La Grâce et le Salut', ref: 'CEC §1987–2029', temps: '4min',
        contenu: `La grâce est le secours gratuit que Dieu nous donne pour participer à la vie divine.\n\nTypes de grâce :\n• Grâce sanctifiante\n• Grâce actuelle\n• Grâce sacramentelle\n\n« La foi sans les œuvres est morte » (Jc 2,26)` },
      { id: 'eglise', titre: "L'Église : nature et mission", ref: 'CEC §748–975', temps: '5min',
        contenu: `Les 4 marques de l'Église :\n• Une\n• Sainte\n• Catholique\n• Apostolique\n\nSa mission : Évangéliser, Sanctifier, Servir` },
      { id: 'vie-eternelle', titre: 'La Vie éternelle & les Dernières Fins', ref: 'CEC §1020–1060', temps: '4min',
        contenu: `Après la mort :\n• Jugement particulier\n• Le Ciel : union parfaite avec Dieu\n• Le Purgatoire : purification\n• L'Enfer : séparation définitive\n• Le Jugement dernier : résurrection des corps` },
    ]
  },
];

const VERSETS_CLES = [
  { ref: 'Jean 3:16', livre: 'Nouveau Testament · Évangile de Jean', texte: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais ait la vie éternelle.", contexte: "Ce verset est souvent présenté comme un résumé du cœur de l'Évangile : l'amour de Dieu qui se donne pour le salut du monde." },
  { ref: 'Psaume 23:1', livre: 'Ancien Testament · Psaumes', texte: "Le Seigneur est mon berger ; je ne manque de rien.", contexte: "L'un des psaumes les plus connus au monde, traditionnellement attribué au roi David, sur la confiance en la providence de Dieu." },
  { ref: 'Matthieu 5:3', livre: 'Nouveau Testament · Évangile de Matthieu', texte: "Heureux les pauvres en esprit, car le Royaume des cieux est à eux.", contexte: "Première des Béatitudes, prononcée par Jésus dans le Sermon sur la montagne." },
  { ref: 'Romains 8:28', livre: 'Nouveau Testament · Épître aux Romains', texte: "Nous savons en effet que tout concourt au bien de ceux qui aiment Dieu.", contexte: "Écrite par saint Paul, cette parole invite à la confiance dans la providence divine au milieu des épreuves." },
  { ref: 'Philippiens 4:13', livre: 'Nouveau Testament · Épître aux Philippiens', texte: "Je puis tout en celui qui me fortifie.", contexte: "Écrite par saint Paul depuis sa prison, cette parole est un appel à la confiance dans la force donnée par le Christ." },
  { ref: 'Matthieu 11:28', livre: 'Nouveau Testament · Évangile de Matthieu', texte: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", contexte: "Une invitation de Jésus au repos intérieur, souvent citée dans les moments d'épreuve." },
  { ref: 'Jean 14:6', livre: 'Nouveau Testament · Évangile de Jean', texte: "Je suis le chemin, la vérité et la vie. Nul ne vient au Père que par moi.", contexte: "Parole de Jésus lors de la Dernière Cène, centrale dans la christologie catholique." },
  { ref: '1 Corinthiens 13:4', livre: 'Nouveau Testament · 1ère épître aux Corinthiens', texte: "La charité est patiente, elle est pleine de bonté ; la charité n'est point envieuse.", contexte: "Extrait de « l'hymne à l'amour » de saint Paul, l'un des textes les plus lus lors des mariages chrétiens." },
];

const QUIZ_QUESTIONS = [
  { question: "Combien de sacrements l'Église catholique reconnaît-elle ?", options: ["5","6","7","8"], correct: 2 },
  { question: "Quel est le premier sacrement reçu par un chrétien ?", options: ["La Confirmation","L'Eucharistie","Le Baptême","Le Mariage"], correct: 2 },
  { question: "Combien y a-t-il de commandements dans la loi de Moïse ?", options: ["7","8","10","12"], correct: 2 },
  { question: "Qui a écrit les épîtres aux Romains ?", options: ["Pierre","Jean","Paul","Jacques"], correct: 2 },
  { question: "Quel est le dernier livre de la Bible ?", options: ["Jude","Hébreux","Actes","Apocalypse"], correct: 3 },
];

const HEURES = [
  { id:"vigiles", label:"Vigiles", debut:0, fin:6, icon:"🌙", duree:10, desc:"Office de nuit",
    sections:[
      { titre:"Introduction", contenu:"℣ Dieu, viens a mon aide,\n℟ Seigneur, a notre secours.\n\nGloire au Pere, et au Fils et au Saint-Esprit, au Dieu qui est, qui etait et qui vient, pour les siecles des siecles.\nAmen. (Alleluia.)" },
      { titre:"Hymne", contenu:"Dans le silence de la nuit profonde,\nnous veillons avec le Christ.\nQue ta parole illumine nos coeurs\net guide nos pas dans les tenebres.\n\nSeigneur, garde nos yeux ouverts\nsur ta presence dans le monde.\nQue cette veille soit offrande\net notre priere, pure et fervente.\n\nAmen." },
      { titre:"Psaume 63", antienne:"Mon ame a soif de toi, Seigneur.", ref:"Ps 63", contenu:"¹ Mon Dieu, tu es mon Dieu, je te cherche des l'aube.\nMon ame a soif de toi,\nma chair languit apres toi,\ncomme une terre assoiffee, sans eau.\n\n² Je t'ai contemple au sanctuaire,\nvoyant ta force et ta gloire.\n\n³ Ton amour vaut mieux que la vie ;\nmes levres chanteront ta louange.\n\n⁵ Je te benirai tant que je vivrai,\nen ton nom j'eleverai les mains.\n\nAntienne : Mon ame a soif de toi, Seigneur." },
      { titre:"Parole de Dieu", ref:"1 Th 5, 1-6", contenu:"Freres, vous le savez vous-memes parfaitement : le jour du Seigneur vient comme un voleur dans la nuit. Vous, vous n'etes pas dans les tenebres. Vous etes tous des fils de la lumiere, des fils du jour.\n\n℟ En tes mains, Seigneur, je remets mon esprit.\n℣ Tu es le Dieu fidele qui garde son Alliance. ℟\nGloire au Pere et au Fils et au Saint-Esprit. ℟" },
      { titre:"Oraison", contenu:"Seigneur notre Dieu, sanctifie nos veilles nocturnes. Que cette priere monte vers toi comme l'encens du soir, et que ton Esprit garde nos coeurs dans la paix jusqu'a l'aurore. Par Jesus le Christ, notre Seigneur, qui regne avec toi et le Saint-Esprit, maintenant et pour les siecles des siecles.\n\nAmen." }
    ]
  },
  { id:"laudes", label:"Laudes", debut:6, fin:9, icon:"🌅", duree:15, desc:"Priere du matin",
    sections:[
      { titre:"Introduction", contenu:"℣ Dieu, viens a mon aide,\n℟ Seigneur, a notre secours.\n\nGloire au Pere, et au Fils et au Saint-Esprit, au Dieu qui est, qui etait et qui vient, pour les siecles des siecles.\nAmen." },
      { titre:"Hymne", contenu:"Nouveau soleil de justice,\ntu dissipes les ombres de la nuit.\nAllume dans cette aurore\nune clarte nouvelle pour nos coeurs.\n\nQue la lumiere du Christ victorieux\nchasse les ombres de nos vies.\nBrille sur nos chemins de ce jour,\nguide chacun de nos pas.\n\nAmen." },
      { titre:"Psaume 63", antienne:"Des le matin, je t'en supplie.", ref:"Ps 63", contenu:"¹ O Dieu, tu es mon Dieu, je te cherche des l'aube.\nMon ame a soif de toi,\nma chair languit apres toi,\ncomme une terre assoiffee, sans eau.\n\n² Je te contemple au sanctuaire,\npour voir ta puissance et ta gloire.\n\n³ Ton amour vaut mieux que la vie.\nMes levres diront ta louange.\n\n⁵ Je te benirai tant que je vivrai,\nen ton nom j'eleverai les mains.\n\nGloire au Pere et au Fils et au Saint-Esprit,\ncomme il etait au commencement,\nmaintenant et toujours.\n\nAntienne : Des le matin, je t'en supplie." },
      { titre:"Cantique", antienne:"Beni soit le Seigneur.", ref:"Lc 1, 68-79", contenu:"⁶⁸ Beni soit le Seigneur, le Dieu d'Israel,\nqui visite et rachete son peuple.\n\n⁶⁹ Il nous a suscite une force qui nous sauve\ndans la maison de David, son serviteur.\n\n⁷⁸ Par la tendresse, la bonte de notre Dieu,\nnous vient d'en haut une aurore nouvelle,\n\n⁷⁹ pour illuminer ceux qui habitent les tenebres\net l'ombre de la mort,\npour conduire nos pas\nau chemin de la paix.\n\nAntienne : Beni soit le Seigneur." },
      { titre:"Parole de Dieu", ref:"Rm 13, 11-12", contenu:"Freres, vous le savez : c'est le moment d'etre tires du sommeil. Car maintenant le salut est plus proche de nous qu'au moment ou nous avons embrasse la foi. La nuit est avancee, le jour approche. Rejetons les oeuvres des tenebres, revettons les armes de la lumiere.\n\n℟ Grace a toi, Seigneur, la nuit s'acheve.\n℣ Que ta lumiere brille sur nos chemins. ℟" },
      { titre:"Oraison", contenu:"Seigneur Dieu, tu dissipes les tenebres de la nuit et tu nous accordes la lumiere du jour nouveau. Permets que nos actes soient conformes a ta volonte, afin que nous arrivions a la lumiere de la vie eternelle. Par Jesus le Christ, notre Seigneur, qui regne avec toi et le Saint-Esprit, maintenant et pour les siecles des siecles.\n\nAmen." }
    ]
  },
  { id:"tierce", label:"Tierce", debut:9, fin:12, icon:"☀️", duree:8, desc:"Milieu de matinee",
    sections:[
      { titre:"Introduction", contenu:"℣ Dieu, viens a mon aide,\n℟ Seigneur, a notre secours.\n\nGloire au Pere, et au Fils et au Saint-Esprit. Amen." },
      { titre:"Hymne", contenu:"Viens, Esprit de Dieu,\nenflammer nos coeurs !\nToi qui brules comme le feu,\nqui souffles comme le vent.\n\nViens eclairer cette heure,\nau milieu de la matinee.\nQue notre travail soit offrande\net service de la verite.\n\nAmen." },
      { titre:"Psaume 119", antienne:"Enseigne-moi tes lois, Seigneur.", ref:"Ps 119", contenu:"⁸⁹ Pour toujours, Seigneur,\nta parole se tient dans les cieux.\n\n⁹⁰ Ta fidelite dure d'age en age ;\ntu as fonde la terre et elle tient.\n\n⁹¹ Tout subsiste selon tes jugements,\ncar tout t'est soumis.\n\n⁹² Si ta loi n'avait fait mes delices,\nje perissais dans ma misere.\n\n⁹³ Jamais je n'oublierai tes preceptes,\ncar c'est par eux que tu me fais vivre.\n\nAntienne : Enseigne-moi tes lois, Seigneur." },
      { titre:"Parole de Dieu", ref:"Ac 2, 1-4", contenu:"Quand arriva le jour de la Pentecote, ils se trouvaient reunis tous ensemble. Soudain il vint du ciel un bruit pareil a celui d'un violent coup de vent. La maison ou ils se tenaient en fut toute remplie. Ils virent apparaitre des langues qu'on eut dit de feu ; elles se partageaient, et il s'en posa une sur chacun d'eux.\n\n℟ Envoie ton Esprit, et tout sera cree.\n℣ Et tu renouveleras la face de la terre. ℟" },
      { titre:"Oraison", contenu:"Dieu de bonte, en ce milieu de la matinee, benis notre travail et garde-nous fideles a ta parole. Que tout ce que nous accomplissons soit fait pour ta gloire et le service de nos freres. Par Jesus le Christ, notre Seigneur.\n\nAmen." }
    ]
  },
  { id:"sexte", label:"Sexte", debut:12, fin:15, icon:"🌞", duree:8, desc:"Priere de midi",
    sections:[
      { titre:"Introduction", contenu:"℣ Dieu, viens a mon aide,\n℟ Seigneur, a notre secours.\n\nGloire au Pere, et au Fils et au Saint-Esprit. Amen." },
      { titre:"Hymne", contenu:"En ce milieu du jour qui passe,\nnous faisons une pause pour prier.\nSeigneur, benis cette heure de grace\net tout ce que nous allons partager.\n\nPain de vie, Pain de la table,\nnourris nos corps et nos esprits.\nQue ce repas soit venerable\noffert a toi, pere et ami.\n\nAmen." },
      { titre:"Psaume 23", antienne:"Le Seigneur est mon berger.", ref:"Ps 23", contenu:"¹ Le Seigneur est mon berger :\nje ne manque de rien.\n\n² Sur des pres d'herbe fraiche,\nil me fait reposer.\nIl me mene vers les eaux tranquilles\net restaure mon ame.\n\n³ Il me conduit par le juste chemin\npour l'honneur de son nom.\n\n⁴ Si je traverse un ravin d'ombre et de mort,\nje ne crains pas le mal,\ncar tu es avec moi :\nton baton, ta houlette,\nils me rassurent.\n\n⁵ Tu prepares la table pour moi\ndevant mes ennemis.\n\n⁶ Grace et bonheur m'accompagnent\ntous les jours de ma vie.\n\nAntienne : Le Seigneur est mon berger." },
      { titre:"Parole de Dieu", ref:"Jn 6, 35", contenu:"Jesus leur dit : C'est moi qui suis le pain de la vie. Celui qui vient a moi n'aura jamais faim ; celui qui croit en moi n'aura jamais soif. Tout ce que le Pere me donne viendra a moi, et celui qui vient a moi, je ne le rejetterai pas.\n\n℟ Seigneur, donne-nous toujours de ce pain-la.\n℣ Donne-nous ce pain en tout temps. ℟" },
      { titre:"Oraison", contenu:"Seigneur, benis ce repas et ceux qui l'ont prepare. Fais-nous souvenir de tous ceux qui ont faim dans le monde. Nourris-nous de ton pain de vie pour que nous ayons la force de te servir et de servir nos freres. Par Jesus le Christ, notre Seigneur.\n\nAmen." }
    ]
  },
  { id:"none", label:"None", debut:15, fin:18, icon:"🌤️", duree:8, desc:"Heure de la mort du Christ",
    sections:[
      { titre:"Introduction", contenu:"℣ Dieu, viens a mon aide,\n℟ Seigneur, a notre secours.\n\nGloire au Pere, et au Fils et au Saint-Esprit. Amen." },
      { titre:"Hymne", contenu:"A la neuvieme heure, Seigneur,\ntu as expire sur la Croix.\nNous meditons avec ferveur\nce mystere de ton amour.\n\nTa mort nous a rachetes,\nton sacrifice nous a liberes.\nQue cette heure soit consacree\na ta Passion, a ta misericorde.\n\nAmen." },
      { titre:"Psaume 116", antienne:"Je marcherai en presence du Seigneur.", ref:"Ps 116", contenu:"¹⁵ Elle est precieuse aux yeux du Seigneur,\nla mort de ses fideles.\n\n¹⁶ Oui, moi, ton serviteur, ton serviteur,\nle fils de ta servante,\ntu as brise mes chaines.\n\n¹⁷ Je t'offrirai le sacrifice d'action de grace,\nj'invoquerai le nom du Seigneur.\n\n¹⁸ Je tiendrai mes voeux envers le Seigneur\ndevant tout son peuple.\n\nAntienne : Je marcherai en presence du Seigneur." },
      { titre:"Parole de Dieu", ref:"He 9, 27-28", contenu:"De meme que les hommes meurent une seule fois — apres quoi vient le jugement — de meme le Christ s'est offert une seule fois pour porter les peches de la multitude. Il apparaitra une seconde fois — non plus pour le peche — mais pour le salut de ceux qui l'attendent.\n\n℟ Seigneur, souviens-toi de nous dans ton Royaume.\n℣ Quand tu viendras dans ta gloire. ℟" },
      { titre:"Oraison", contenu:"Dieu tout-puissant, en cette heure ou ton Fils a livre son esprit sur la Croix, accueille notre priere du milieu de la journee. Que sa Passion soit notre force dans les epreuves et notre esperance dans la mort. Par Jesus le Christ, notre Seigneur.\n\nAmen." }
    ]
  },
  { id:"vepres", label:"Vêpres", debut:18, fin:21, icon:"🌇", duree:15, desc:"Priere du soir",
    sections:[
      { titre:"Introduction", contenu:"℣ Dieu, viens a mon aide,\n℟ Seigneur, a notre secours.\n\nGloire au Pere, et au Fils et au Saint-Esprit, au Dieu qui est, qui etait et qui vient, pour les siecles des siecles.\nAmen." },
      { titre:"Hymne", contenu:"O lumiere joyeuse,\nsainte gloire du Pere immortel,\nJesus-Christ bienheureux !\n\nArrive au coucher du soleil,\nvoyant la lumiere du soir,\nnous chantons Dieu : Pere, Fils, Saint-Esprit.\n\nTu es digne en tout temps\nd'etre chante par des voix saintes.\nFils de Dieu qui donnes la vie,\nc'est pourquoi le monde te glorifie.\n\nAmen." },
      { titre:"Psaume 141", antienne:"Que ma priere monte vers toi.", ref:"Ps 141", contenu:"² Que ma priere devant toi s'eleve comme un encens,\net mes mains levees,\ncomme le sacrifice du soir.\n\n³ Seigneur, mets une garde a ma bouche,\nun poste de surveillance devant mes levres.\n\n⁴ N'incline pas mon coeur vers le mal,\na commettre des actions mauvaises\navec ceux qui font le crime.\n\n⁵ Que le juste me reprenne et me corrige,\nc'est une grace pour moi.\n\nAntienne : Que ma priere monte vers toi." },
      { titre:"Cantique de Marie", antienne:"Le Seigneur a regarde son humble servante.", ref:"Lc 1, 46-55", contenu:"⁴⁶ Mon ame exalte le Seigneur,\n⁴⁷ exulte mon esprit en Dieu mon Sauveur !\n\n⁴⁸ Il s'est penche sur son humble servante ;\ndesormais tous les ages me diront bienheureuse.\n\n⁴⁹ Le Tout-Puissant fit pour moi des merveilles ;\nSaint est son nom !\n\n⁵⁰ Il etend son bras de siecle en siecle,\nil disperse les superbes.\n\n⁵¹ Il renverse les puissants de leurs trones,\nil eleve les humbles.\n\n⁵² Il comble de biens les affames,\nrenvoie les riches les mains vides.\n\nAntienne : Le Seigneur a regarde son humble servante." },
      { titre:"Parole de Dieu", ref:"1 P 5, 8-9", contenu:"Freres, soyez sobres et veillez. Votre adversaire, le diable, comme un lion rugissant, rode, cherchant qui devorer. Resistez-lui, forts dans la foi, sachant que vos freres repandus dans le monde entier connaissent les memes souffrances.\n\n℟ Seigneur, garde-nous dans ta paix ce soir.\n℣ Que tes anges veillent sur nous cette nuit. ℟" },
      { titre:"Oraison", contenu:"Seigneur, ecoute notre priere du soir. Que le sacrifice de louange que nous t'offrons ce soir soit agreable a tes yeux, et que ta paix descende sur nos familles et notre communaute. Par Jesus le Christ, notre Seigneur.\n\nAmen." }
    ]
  },
  { id:"complies", label:"Complies", debut:21, fin:24, icon:"🌃", duree:10, desc:"Priere de nuit",
    sections:[
      { titre:"Introduction", contenu:"℣ Dieu, viens a mon aide,\n℟ Seigneur, a notre secours.\n\nGloire au Pere, et au Fils et au Saint-Esprit, au Dieu qui est, qui etait et qui vient, pour les siecles des siecles.\nAmen." },
      { titre:"Hymne", contenu:"Ferme mes yeux pour revoir tes merveilles\nen ce moment que le jour fuit !\nAllume dans la nuit\nune clarte nouvelle !\n\nQue le silence alentour me console\nde la faiblesse de ma foi,\npuisque j'ecoute en moi\nresonner ta parole !\n\nJusqu'a demain, si se leve l'aurore,\nje t'abandonne mon esprit !\nTa grace me suffit,\nc'est elle que j'implore.\n\nAmen." },
      { titre:"Psaume 4", antienne:"Dans la paix, je reposerai.", ref:"Ps 4", contenu:"² Quand je crie, reponds-moi,\nDieu, ma justice !\n\nToi qui me liberes dans la detresse,\npitie pour moi, ecoute ma priere !\n\n³ Fils des hommes,\njusqu'ou irez-vous dans l'insulte a ma gloire,\nl'amour du neant et la course au mensonge ?\n\n⁴ Sachez que le Seigneur a mis a part son fidele,\nle Seigneur entend quand je crie vers lui.\n\n⁸ Dans la paix aussitot je m'endors et je repose,\ncar c'est toi seul, Seigneur,\nqui me donnes la securite.\n\nAntienne : Dans la paix, je reposerai." },
      { titre:"Psaume 133", antienne:"Au long des nuits, benissez le Seigneur !", ref:"Ps 133", contenu:"¹ Vous tous, benissez le Seigneur,\nvous qui servez le Seigneur,\nqui veillez dans la maison du Seigneur\nau long des nuits.\n\n² Levez les mains vers le sanctuaire,\net benissez le Seigneur.\n\n³ Que le Seigneur te benisse de Sion,\nlui qui a fait le ciel et la terre !\n\nAntienne : Au long des nuits, benissez le Seigneur !" },
      { titre:"Parole de Dieu", ref:"Dt 6, 4-8a", contenu:"Ecoute, Israel : le Seigneur notre Dieu est l'Unique. Tu aimeras le Seigneur ton Dieu de tout ton coeur, de toute ton ame et de toute ta force. Ces commandements que je te donne aujourd'hui resteront graves dans ton coeur.\n\n℟ En tes mains, Seigneur, je remets mon esprit.\n℣ Tu es le Dieu fidele qui garde son Alliance. ℟\nGloire au Pere et au Fils et au Saint-Esprit. ℟" },
      { titre:"Cantique de Symeon", antienne:"Sauve-nous, Seigneur, quand nous veillons.", ref:"Lc 2, 29-32", contenu:"²⁹ Maintenant, o Maitre souverain,\ntu peux laisser ton serviteur s'en aller en paix,\nselon ta parole.\n\n³⁰ Car mes yeux ont vu le salut\n³¹ que tu preparais a la face des peuples :\n\n³² lumiere qui se revele aux nations\net donne gloire a ton peuple Israel.\n\nGloire au Pere, ...\n\nAntienne : Sauve-nous, Seigneur, quand nous veillons." },
      { titre:"Oraison et benediction", contenu:"Dieu du ciel et de la terre, nous levons les mains vers toi pour te benir, car tu nous as benis en ton Fils bien-aime. Dans la nuit que tu nous donnes pour unir notre priere a la sienne, nous te supplions de nous benir encore. Par Jesus le Christ, notre Seigneur. Amen.\n\nQue le Seigneur nous benisse, qu'il nous garde de tout mal, et nous conduise a la vie eternelle.\nAmen." },
      { titre:"Heureuse es-tu, Vierge Marie", contenu:"Heureuse es-tu, Vierge Marie !\nPar toi, le salut est entre dans le monde.\nComblee de gloire, tu te rejouis devant le Seigneur,\ntu cries de joie a l'ombre de ses ailes.\nSainte Mere de Dieu,\nprie pour nous, pauvres pecheurs." }
    ]
  }
];

function getStatut(h, prieresFaites) {
  const heure = new Date().getHours();
  if (prieresFaites.includes(h.id)) return "accomplie";
  if (heure >= h.debut && heure < h.fin) return "encours";
  if (heure >= h.fin) return "manquee";
  return "future";
}
