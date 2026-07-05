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

// ── DONNÉES ORIGINALES ────────────────────────────────────────
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
  }
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
  { ref: 'Jean 3:16',        texte: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais ait la vie éternelle." },
  { ref: 'Psaume 23:1',      texte: "Le Seigneur est mon berger ; je ne manque de rien." },
  { ref: 'Matthieu 5:3',     texte: "Heureux les pauvres en esprit, car le Royaume des cieux est à eux." },
  { ref: 'Romains 8:28',     texte: "Nous savons en effet que tout concourt au bien de ceux qui aiment Dieu." },
  { ref: 'Philippiens 4:13', texte: "Je puis tout en celui qui me fortifie." },
  { ref: 'Matthieu 11:28',   texte: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos." },
  { ref: 'Jean 14:6',        texte: "Je suis le chemin, la vérité et la vie. Nul ne vient au Père que par moi." },
  { ref: '1 Corinthiens 13:4', texte: "La charité est patiente, elle est pleine de bonté ; la charité n'est point envieuse." },
];

const QUIZ_QUESTIONS = [
  { question: "Combien de sacrements l'Église catholique reconnaît-elle ?", options: ["5","6","7","8"], correct: 2 },
  { question: "Quel est le premier sacrement reçu par un chrétien ?", options: ["La Confirmation","L'Eucharistie","Le Baptême","Le Mariage"], correct: 2 },
  { question: "Combien y a-t-il de commandements dans la loi de Moïse ?", options: ["7","8","10","12"], correct: 2 },
  { question: "Qui a écrit les épîtres aux Romains ?", options: ["Pierre","Jean","Paul","Jacques"], correct: 2 },
  { question: "Quel est le dernier livre de la Bible ?", options: ["Jude","Hébreux","Actes","Apocalypse"], correct: 3 },
];

// ── HEURES LITURGIQUES ────────────────────────────────────────
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



// ── COMPOSANT OFFICE DETAIL ───────────────────────────────────
function OfficePage({ heure, onBack, onTerminer }) {
  const [secIdx, setSecIdx] = React.useState(0);
  const [lecture, setLecture] = React.useState(false);
  const [lectureSecIdx, setLectureSecIdx] = React.useState(0);
  const flameRef = React.useRef(null);
  const lectureRef = React.useRef(false);
  const timeoutRef = React.useRef(null);

  // Cacher navbar via CSS quand office ouvert
  React.useEffect(() => {
    document.body.classList.add('office-open');
    return () => {
      document.body.classList.remove('office-open');
    };
  }, []);

    React.useEffect(() => {
    return () => {
      window.speechSynthesis && window.speechSynthesis.cancel();
      clearTimeout(timeoutRef.current);
      lectureRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.06;
      if (flameRef.current) flameRef.current.style.transform = 'scaleX(' + (1 + Math.sin(t * 1.4) * 0.07) + ') scaleY(' + (1 + Math.cos(t * 0.9) * 0.05) + ')';
    }, 50);
    return () => clearInterval(id);
  }, []);

  function preparerTexte(sec) {
    let texte = sec.titre + '. ';
    if (sec.antienne) texte += 'Antienne : ' + sec.antienne + '. ';
    let contenu = (sec.contenu || '')
      .replace(/☧/g, 'Verset.').replace(/℟/g, 'Repons.')
      .replace(/℣/g, 'Verset.').replace(/℟/g, 'Repons.')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, '').replace(/\n\n+/g, '. ').replace(/\n/g, '. ');
    return texte + contenu;
  }

  function lireSectionDepuis(idx) {
    if (!lectureRef.current || idx >= heure.sections.length) {
      setLecture(false); setLectureSecIdx(0); lectureRef.current = false; return;
    }
    setSecIdx(idx); setLectureSecIdx(idx);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(preparerTexte(heure.sections[idx]));
    u.lang = 'fr-FR'; u.rate = 0.82;
    u.onend = () => { if (lectureRef.current) timeoutRef.current = setTimeout(() => lireSectionDepuis(idx + 1), 2500); };
    u.onerror = () => { setLecture(false); lectureRef.current = false; };
    const lancer = () => window.speechSynthesis.speak(u);
    const voix = window.speechSynthesis.getVoices();
    if (!voix.length) { window.speechSynthesis.onvoiceschanged = lancer; window.speechSynthesis.getVoices(); }
    else setTimeout(lancer, 100);
  }

  function demarrerLecture() { lectureRef.current = true; setLecture(true); lireSectionDepuis(secIdx); }
  function arreterLecture() { lectureRef.current = false; setLecture(false); window.speechSynthesis && window.speechSynthesis.cancel(); clearTimeout(timeoutRef.current); }

  const sec = heure.sections[secIdx];
  const OR2 = '#C8A84B';
  const total = heure.sections.length;
  const heureCourante = new Date().getHours();
  const enCours = heureCourante >= heure.debut && heureCourante < heure.fin;

  return (
    <div style={{ position:'fixed',inset:0,zIndex:400,background:DARK,backgroundImage:DBOG,display:'flex',flexDirection:'column',maxWidth:430,margin:'0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ padding:'44px 16px 0',position:'relative' }}>
        <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:200,height:100,background:'radial-gradient(ellipse,rgba(200,168,75,0.07),transparent 70%)',pointerEvents:'none' }}/>

        {/* Ligne titre */}
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12,position:'relative',zIndex:2 }}>
          <button onClick={onBack} style={{ width:32,height:32,borderRadius:'50%',background:'rgba(200,168,75,0.1)',border:'1px solid rgba(200,168,75,0.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:OR2,fontSize:14,flexShrink:0 }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:2 }}>
              <span style={{ fontSize:17 }}>{heure.icon}</span>
              <span style={{ fontFamily:'Georgia,serif',fontSize:17,fontWeight:700,color:IVOIRE }}>{heure.label}</span>
              {enCours && <span style={{ fontSize:9,background:OR2,color:VERT,borderRadius:6,padding:'2px 7px',fontWeight:700 }}>EN COURS</span>}
            </div>
            <div style={{ fontSize:10,color:'rgba(200,168,75,0.55)' }}>{String(heure.debut).padStart(2,'0')}h00 — {heure.fin===24?'00':String(heure.fin).padStart(2,'0')}h00 · {heure.duree} min · {heure.desc}</div>
          </div>
          {/* Bouton audio */}
          <button onClick={() => lecture ? arreterLecture() : demarrerLecture()} style={{ background:lecture?'linear-gradient(135deg,rgba(200,168,75,0.3),rgba(200,168,75,0.15))':'linear-gradient(135deg,rgba(200,168,75,0.18),rgba(200,168,75,0.08))',border:'1px solid rgba(200,168,75,0.35)',borderRadius:20,padding:'7px 13px',display:'flex',alignItems:'center',gap:6,cursor:'pointer',flexShrink:0 }}>
            <span style={{ fontSize:13 }}>{lecture ? '⏸' : '▶'}</span>
            <span style={{ fontSize:10,color:OR2,fontWeight:700,fontFamily:'Georgia,serif' }}>{lecture ? 'Pause' : 'Écouter'}</span>
          </button>
          {/* Mini cierge */}
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0 }}>
            <div ref={flameRef} style={{ width:7,height:12,background:'radial-gradient(ellipse 50% 25% at 50% 90%,rgba(255,255,255,0.9),transparent 50%),radial-gradient(ellipse 80% 100% at 50% 100%,#F5A020,transparent 65%),radial-gradient(ellipse 60% 80% at 50% 60%,#E86820,transparent)',borderRadius:'50% 50% 30% 30%',filter:'blur(0.3px)',transformOrigin:'center bottom' }}/>
            <div style={{ width:1.5,height:3,background:'#2A1A0A' }}/>
            <div style={{ width:9,height:26,background:'linear-gradient(to right,#C8B890,#F8F0DC,#EDE0C0,#B8A878)',borderRadius:'2px 2px 0 0' }}/>
          </div>
        </div>

        {/* Progression en points */}
        <div style={{ display:'flex',alignItems:'center',gap:0,marginBottom:0,position:'relative',zIndex:2 }}>
          {heure.sections.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ flex:1,height:2,background:i<=secIdx?OR2:'rgba(200,168,75,0.12)',borderRadius:2 }}/>}
              <div
                onClick={() => setSecIdx(i)}
                style={{ width:i===secIdx?11:7,height:i===secIdx?11:7,borderRadius:'50%',background:i<secIdx?OR2:i===secIdx?OR2:'rgba(200,168,75,0.15)',border:i===secIdx?'none':i<secIdx?'none':'1px solid rgba(200,168,75,0.25)',boxShadow:i===secIdx?'0 0 0 3px rgba(200,168,75,0.2)':'none',cursor:'pointer',flexShrink:0,transition:'all 0.3s' }}
              />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── ONGLETS PILLS ── */}
      <div style={{ padding:'10px 16px 0',display:'flex',gap:5,overflowX:'auto',scrollbarWidth:'none' }}>
        {heure.sections.map((s, i) => (
          <button key={i} onClick={() => setSecIdx(i)} style={{ padding:'5px 12px',borderRadius:20,border:i===secIdx?'1px solid '+OR2:'1px solid rgba(200,168,75,0.18)',background:i===secIdx?'rgba(200,168,75,0.15)':'rgba(200,168,75,0.04)',color:i===secIdx?OR2:'rgba(200,168,75,0.45)',fontSize:10,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,fontWeight:i===secIdx?700:400,transition:'all 0.2s' }}>
            {s.titre}
          </button>
        ))}
      </div>

      {/* ── BARRE AUDIO ── */}
      {lecture && (
        <div style={{ margin:'8px 16px 0',padding:'7px 12px',background:'rgba(200,168,75,0.06)',borderRadius:10,border:'1px solid rgba(200,168,75,0.15)',display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ fontSize:12,color:OR2 }}>🔊</span>
          <div style={{ flex:1,height:2,background:'rgba(200,168,75,0.1)',borderRadius:2,overflow:'hidden' }}>
            <div style={{ height:'100%',background:'linear-gradient(to right,#8B6020,'+OR2+')',borderRadius:2,width:((lectureSecIdx+1)/total*100)+'%',transition:'width 0.6s' }}/>
          </div>
          <span style={{ fontSize:10,color:'rgba(200,168,75,0.6)',fontWeight:600 }}>{lectureSecIdx+1}/{total}</span>
          <button onClick={arreterLecture} style={{ background:'rgba(200,50,50,0.08)',border:'1px solid rgba(200,50,50,0.18)',borderRadius:7,padding:'2px 7px',fontSize:10,color:'#c0392b',cursor:'pointer',fontWeight:700 }}>■</button>
        </div>
      )}

      {/* ── CONTENU ── */}
      <div style={{ flex:1,overflowY:'auto',padding:'14px 18px 110px' }}>

        {/* Badge lecture en cours */}
        {lecture && lectureSecIdx===secIdx && (
          <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:14,padding:'8px 14px',background:'rgba(200,168,75,0.07)',borderRadius:10,borderLeft:'2px solid '+OR2 }}>
            <span style={{ fontSize:13,color:OR2 }}>🔊</span>
            <span style={{ fontSize:11,color:OR2,fontWeight:600,fontFamily:'Georgia,serif' }}>Lecture en cours…</span>
          </div>
        )}

        {/* En-tête section */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:'Georgia,serif',fontSize:20,fontWeight:700,color:IVOIRE,marginBottom:5 }}>{sec.titre}</div>
            {sec.antienne && <div style={{ fontFamily:'Georgia,serif',fontStyle:'italic',fontSize:12,color:OR2 }}>Antienne : {sec.antienne}</div>}
          </div>
          {sec.ref && <div style={{ background:'rgba(200,168,75,0.08)',border:'0.5px solid rgba(200,168,75,0.2)',borderRadius:6,padding:'4px 10px',fontSize:10,color:'rgba(200,168,75,0.6)',fontStyle:'italic',flexShrink:0,marginTop:2 }}>— {sec.ref}</div>}
        </div>

        {/* Filet décoratif */}
        <div style={{ height:1,background:'linear-gradient(to right,rgba(200,168,75,0.35),rgba(200,168,75,0.03))',marginBottom:16 }}/>

        {/* Texte liturgique */}
        <div style={{ fontFamily:'Georgia,serif',fontSize:14,lineHeight:2,color:'rgba(245,239,228,0.85)' }}>
          {(sec.contenu || '').split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} style={{ height:8 }}/>;
            const isLit = line.startsWith('℣') || line.startsWith('℟');
            const isNum = /^[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(line);
            if (isNum) {
              const num = line.match(/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+/)[0];
              const text = line.replace(/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+/, '');
              return (
                <div key={i} style={{ display:'flex',gap:10,marginBottom:8 }}>
                  <span style={{ color:OR2,fontSize:10,fontWeight:700,marginTop:5,flexShrink:0 }}>{num}</span>
                  <span>{text}</span>
                </div>
              );
            }
            return <div key={i} style={{ color:isLit?OR2:'rgba(245,239,228,0.85)',marginBottom:isLit?4:0 }}>{line}</div>;
          })}
        </div>

        {/* Antienne répétée en fin */}
        {sec.antienne && secIdx > 0 && (
          <div style={{ marginTop:16,paddingTop:14,borderTop:'0.5px solid rgba(200,168,75,0.15)',fontFamily:'Georgia,serif',fontStyle:'italic',fontSize:12,color:OR2 }}>
            Antienne : {sec.antienne}
          </div>
        )}
      </div>

      {/* ── NAVIGATION BAS ── */}
      <div style={{ position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,padding:'12px 16px 16px',boxSizing:'border-box',background:'#0C0A06',borderTop:'0.5px solid rgba(200,168,75,0.15)' }}>
        
        <div style={{ display:'flex',gap:8 }}>
          {secIdx > 0 && (
            <button onClick={() => setSecIdx(i => i-1)} style={{ flex:1,height:42,background:'rgba(200,168,75,0.06)',border:'1px solid rgba(200,168,75,0.15)',borderRadius:21,color:'rgba(200,168,75,0.6)',fontSize:12,cursor:'pointer',fontFamily:'Georgia,serif',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
              <span>←</span> Précédent
            </button>
          )}
          {secIdx < total - 1
            ? <button onClick={() => setSecIdx(i => i+1)} style={{ flex:2,height:42,background:'linear-gradient(135deg,#C8A84B,#8B6020)',border:'none',borderRadius:21,color:VERT,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Georgia,serif',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
                Suivant <span>→</span>
              </button>
            : <button onClick={onTerminer} style={{ flex:2,height:42,background:'linear-gradient(135deg,#C8A84B,#8B6020)',border:'none',borderRadius:21,color:VERT,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Georgia,serif' }}>
                Amen — Prière accomplie ✦
              </button>
          }
        </div>
        
      </div>
    </div>
  );
}

// ── ONGLET PRIÈRES = 7 HEURES ─────────────────────────────────
function OngletPrieres({ autoOpen }) {
  const heureAutoOuverte = useMemo(() => {
    if (!autoOpen) return null;
    const hc = new Date().getHours();
    const h = HEURES.find(x => hc >= x.debut && hc < x.fin);
    return h ? h.id : null;
  }, [autoOpen]);
  const [officeOuvert, setOfficeOuvert] = useState(heureAutoOuverte);
  const [prieresFaites, setPrieresFaites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jb_offices_' + new Date().toDateString()) || '[]'); } catch { return []; }
  });
  const flameRef = useRef(null);
  const glowRef  = useRef(null);

  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.06;
      if (flameRef.current) flameRef.current.style.transform = `scaleX(${1+Math.sin(t*1.4)*0.07}) scaleY(${1+Math.cos(t*0.9)*0.05})`;
      if (glowRef.current)  glowRef.current.style.opacity = String(0.5+Math.sin(t)*0.22);
    }, 50);
    return () => clearInterval(id);
  }, []);

  function terminer(id) {
    const n = [...new Set([...prieresFaites, id])];
    setPrieresFaites(n);
    try { localStorage.setItem('jb_offices_' + new Date().toDateString(), JSON.stringify(n)); } catch {}
    setOfficeOuvert(null);
  }

  const heureCourante = new Date().getHours();
  const nb = prieresFaites.length;
  const intensite = Math.min(nb / 7, 1);
  const niveauFlamme = intensite < 0.15 ? 'Étincelle' : intensite < 0.35 ? 'Petite flamme' : intensite < 0.55 ? 'Flamme vive' : intensite < 0.75 ? 'Flamme ardente' : 'Flamme rayonnante';
  const heureEnCours = HEURES.find(h => heureCourante >= h.debut && heureCourante < h.fin) || HEURES[6];

  if (officeOuvert) {
    const h = HEURES.find(x => x.id === officeOuvert);
    return <OfficePage heure={h} onBack={() => setOfficeOuvert(null)} onTerminer={() => terminer(officeOuvert)} />;
  }

  return (
    <div>
      {/* Header cierge + progression */}
      <div style={{ background:DARK,backgroundImage:DBOG,borderRadius:16,padding:'14px',marginBottom:10,position:'relative',overflow:'hidden' }}>
        <svg style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'100%',height:'100%',pointerEvents:'none',opacity:0.12 }} viewBox="0 0 430 160">
          <defs><radialGradient id="rgo" cx="50%" cy="5%" r="95%"><stop offset="0%" stopColor="#C8A84B" stopOpacity="1"/><stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/></radialGradient></defs>
          {[-100,-40,20,80,140,200,260,320,380].map((x,i) => <polygon key={i} points={`215,12 ${x},160 ${x+55},160`} fill="url(#rgo)"/>)}
        </svg>
        <div style={{ display:'flex',alignItems:'center',gap:14,position:'relative',zIndex:2 }}>
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <div ref={glowRef} style={{ position:'absolute',top:-6,left:'50%',transform:'translateX(-50%)',width:32,height:32,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,168,75,0.35),transparent 70%)',pointerEvents:'none' }}/>
              <div ref={flameRef} style={{ width:11,height:(14+Math.round(intensite*12))+'px',background:'radial-gradient(ellipse 50% 25% at 50% 90%,rgba(255,255,255,0.9),transparent 50%),radial-gradient(ellipse 80% 100% at 50% 100%,#F5A020,transparent 65%),radial-gradient(ellipse 60% 80% at 50% 60%,#E86820,transparent)',borderRadius:'50% 50% 30% 30%',filter:'blur(0.3px)',transformOrigin:'center bottom',position:'relative',zIndex:2 }}/>
            </div>
            <div style={{ width:1.5,height:5,background:'#2A1A0A' }}/>
            <div style={{ width:13,height:44,background:'linear-gradient(to right,#C8B890,#F8F0DC,#EDE0C0,#B8A878)',borderRadius:'3px 3px 0 0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1 }}>
              <span style={{ fontFamily:'Georgia,serif',fontSize:5,fontWeight:700,color:'rgba(120,80,20,0.55)' }}>M</span>
              <span style={{ fontFamily:'Georgia,serif',fontSize:5,fontWeight:700,color:'rgba(120,80,20,0.55)' }}>D</span>
            </div>
            <div style={{ width:17,height:4,background:'rgba(200,168,75,0.2)',borderRadius:'0 0 4px 4px' }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Georgia,serif',fontSize:15,fontWeight:700,color:IVOIRE,marginBottom:3 }}>Offices liturgiques</div>
            <div style={{ fontSize:11,color:OR,fontWeight:600,marginBottom:8 }}>{niveauFlamme} — {nb}/7 offices accomplis</div>
            <div style={{ height:4,background:'rgba(200,168,75,0.1)',borderRadius:10,overflow:'hidden',marginBottom:4 }}>
              <div style={{ height:'100%',width:`${Math.round(intensite*100)}%`,background:'linear-gradient(to right,#8B6020,'+OR+')',borderRadius:10,transition:'width 0.8s' }}/>
            </div>
            <div style={{ fontSize:10,color:'rgba(245,239,228,0.38)' }}>{Math.round(intensite*100)}% de lumière spirituelle</div>
          </div>
        </div>
      </div>

      {/* Heure en cours */}
      {(() => {
        const h = heureEnCours;
        const faite = prieresFaites.includes(h.id);
        return (
          <div style={{ background:faite?'rgba(30,45,20,0.04)':DARK,backgroundImage:faite?'none':DBOG,borderRadius:14,padding:'13px 14px',border:`1.5px solid ${faite?'rgba(30,45,20,0.12)':'rgba(200,168,75,0.4)'}`,marginBottom:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:8 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:faite?'#2d7a2d':OR }}/>
              <span style={{ fontSize:10,color:faite?'#2d7a2d':OR,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',marginLeft:4 }}>{faite?'Accomplie':'En cours maintenant'}</span>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ fontSize:26 }}>{h.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Georgia,serif',fontSize:15,fontWeight:700,color:faite?VERT:IVOIRE,marginBottom:3 }}>{h.label}</div>
                <div style={{ fontSize:10,color:faite?'rgba(30,45,20,0.5)':'rgba(245,239,228,0.5)',marginBottom:6 }}>{h.desc}</div>
                <div style={{ display:'flex',gap:6 }}>
                  <span style={{ background:'rgba(200,168,75,0.12)',border:'1px solid rgba(200,168,75,0.25)',borderRadius:20,padding:'2px 9px',fontSize:10,color:OR,fontWeight:600 }}>🕘 {String(h.debut).padStart(2,'0')}h00 → {h.fin===24?'00':String(h.fin).padStart(2,'0')}h00</span>
                  <span style={{ background:'rgba(200,168,75,0.08)',border:'1px solid rgba(200,168,75,0.18)',borderRadius:20,padding:'2px 9px',fontSize:10,color:'rgba(200,168,75,0.7)' }}>⏱ {h.duree} min</span>
                </div>
              </div>
              {!faite && <button onClick={() => setOfficeOuvert(h.id)} style={{ background:'linear-gradient(135deg,'+OR+',#8B6020)',color:VERT,border:'none',borderRadius:20,padding:'10px 14px',fontFamily:'Georgia,serif',fontSize:12,fontWeight:700,cursor:'pointer' }}>Prier ✦</button>}
            </div>
          </div>
        );
      })()}

      {/* Liste 7 heures */}
      <div style={{ fontSize:10,color:'rgba(30,45,20,0.4)',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8 }}>Les 7 Heures Liturgiques</div>
      <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
        {HEURES.map(h => {
          const statut = getStatut(h, prieresFaites);
          const bgMap    = { accomplie:'rgba(30,150,30,0.04)',  encours:'rgba(200,168,75,0.06)', manquee:'rgba(200,50,50,0.04)', future:'white' };
          const brdMap   = { accomplie:'rgba(30,150,30,0.15)',  encours:'rgba(200,168,75,0.35)', manquee:'rgba(200,50,50,0.15)', future:'rgba(30,45,20,0.07)' };
          const opacMap  = { accomplie:0.75, encours:1, manquee:0.8, future:0.5 };
          const badgeMap = {
            accomplie: <span style={{ fontSize:9,background:'rgba(30,150,30,0.1)',color:'#2d7a2d',border:'1px solid rgba(30,150,30,0.2)',borderRadius:10,padding:'1px 7px',fontWeight:700 }}>✓ Accomplie</span>,
            encours:   <span style={{ fontSize:9,background:OR,color:VERT,borderRadius:10,padding:'1px 7px',fontWeight:700 }}>▶ En cours</span>,
            manquee:   <span style={{ fontSize:9,background:'rgba(200,50,50,0.08)',color:'#c0392b',border:'1px solid rgba(200,50,50,0.2)',borderRadius:10,padding:'1px 7px',fontWeight:700 }}>⚠ Manquée</span>,
            future:    <span style={{ fontSize:9,background:'rgba(30,45,20,0.05)',color:'rgba(30,45,20,0.35)',border:'1px solid rgba(30,45,20,0.1)',borderRadius:10,padding:'1px 7px',fontWeight:600 }}>🔒 {String(h.debut).padStart(2,'0')}h00</span>,
          };
          const actionMap = {
            accomplie: <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(30,150,30,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#2d7a2d' }}>✓</div>,
            encours:   <button onClick={() => setOfficeOuvert(h.id)} style={{ background:'linear-gradient(135deg,'+OR+',#8B6020)',color:VERT,border:'none',borderRadius:14,padding:'7px 13px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Georgia,serif' }}>Prier ✦</button>,
            manquee:   <button onClick={() => setOfficeOuvert(h.id)} style={{ background:'rgba(200,50,50,0.07)',color:'#c0392b',border:'1px solid rgba(200,50,50,0.15)',borderRadius:14,padding:'6px 11px',fontSize:10,fontWeight:700,cursor:'pointer' }}>Rattraper</button>,
            future:    <div style={{ fontSize:18,opacity:0.3 }}>🔒</div>,
          };
          return (
            <div key={h.id} style={{ background:bgMap[statut],borderRadius:12,border:`1px solid ${brdMap[statut]}`,padding:'11px 13px',display:'flex',alignItems:'center',gap:10,opacity:opacMap[statut] }}>
              <div style={{ fontSize:20 }}>{h.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                  <span style={{ fontFamily:'Georgia,serif',fontSize:13,fontWeight:700,color:statut==='future'?'#888':'#222' }}>{h.label}</span>
                  {badgeMap[statut]}
                </div>
                <div style={{ fontSize:10,color:'#aaa' }}>{String(h.debut).padStart(2,'0')}h00 — {h.fin===24?'00':String(h.fin).padStart(2,'0')}h00 · {h.duree} min</div>
              </div>
              {actionMap[statut]}
            </div>
          );
        })}
      </div>

      <div style={{ background:DARK,backgroundImage:DBOG,borderRadius:12,padding:'12px 14px',marginTop:10,borderLeft:'2px solid '+OR }}>
        <div style={{ fontSize:11,color:OR,fontWeight:600,marginBottom:4 }}>💡 Le saviez-vous ?</div>
        <div style={{ fontFamily:'Georgia,serif',fontStyle:'italic',fontSize:11,color:'rgba(245,239,228,0.65)',lineHeight:1.7 }}>Les heures passées peuvent être rattrapées. Dieu accueille toujours votre prière, quelle que soit l'heure.</div>
      </div>
    </div>
  );
}

// ── QUIZ MODAL (original conservé) ───────────────────────────
function QuizModal({ onClose }) {
  const [idx,      setIdx]      = useState(0);
  const [selected, setSelected] = useState(null);
  const [score,    setScore]    = useState(0);
  const [termine,  setTermine]  = useState(false);

  function repondre(i) {
    if (selected !== null) return;
    setSelected(i);
    if (i === QUIZ_QUESTIONS[idx].correct) setScore(s => s + 1);
  }

  function suivant() {
    if (idx < QUIZ_QUESTIONS.length - 1) {
      setIdx(i => i + 1);
      setSelected(null);
    } else {
      setTermine(true);
    }
  }

  const q = QUIZ_QUESTIONS[idx];

  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:440,background:'#fff',borderRadius:'20px 20px 0 0',padding:'24px 20px 40px',maxHeight:'85vh',overflowY:'auto' }}>
        <div style={{ width:40,height:4,background:'#ddd',borderRadius:99,margin:'0 auto 20px' }}/>

        {!termine ? (
          <>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:16 }}>
              <span style={{ fontSize:13,fontWeight:700,color:VERT }}>Question {idx+1}/{QUIZ_QUESTIONS.length}</span>
              <span style={{ fontSize:13,fontWeight:700,color:OR }}>Score : {score}</span>
            </div>

            {/* Barre progression */}
            <div style={{ height:6,background:'#f0ece4',borderRadius:99,marginBottom:20 }}>
              <div style={{ height:'100%',background:OR,borderRadius:99,width:`${((idx+1)/QUIZ_QUESTIONS.length)*100}%`,transition:'width 0.3s' }}/>
            </div>

            <p style={{ fontSize:15,fontWeight:700,color:VERT,marginBottom:16,lineHeight:1.4 }}>{q.question}</p>

            <div style={{ display:'flex',flexDirection:'column',gap:10,marginBottom:20 }}>
              {q.options.map((opt,i) => {
                let bg = '#f9f7f2', border = '#e4e4e7', color = VERT;
                if (selected !== null) {
                  if (i === q.correct)        { bg='#e8f5e9'; border='#2e7d32'; color='#2e7d32'; }
                  else if (i === selected)    { bg='#ffebee'; border='#c62828'; color='#c62828'; }
                }
                return (
                  <button key={i} onClick={()=>repondre(i)} style={{ padding:'12px 16px',borderRadius:12,border:`2px solid ${border}`,background:bg,color,fontWeight:600,fontSize:14,textAlign:'left',cursor:selected!==null?'default':'pointer',transition:'all 0.2s' }}>
                    {selected!==null && i===q.correct ? '✓ ' : selected===i && i!==q.correct ? '✗ ' : ''}{opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <button onClick={suivant} style={{ width:'100%',padding:14,background:VERT,border:'none',borderRadius:12,color:OR,fontWeight:800,fontSize:14,cursor:'pointer' }}>
                {idx<QUIZ_QUESTIONS.length-1 ? 'Question suivante →' : 'Voir les résultats'}
              </button>
            )}
          </>
        ) : (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:56,marginBottom:12 }}>{score>=4?'🏆':score>=2?'👍':'📖'}</div>
            <h2 style={{ fontSize:20,fontWeight:800,color:VERT,margin:'0 0 8px' }}>{score}/{QUIZ_QUESTIONS.length}</h2>
            <p style={{ fontSize:14,color:'#71717A',marginBottom:20 }}>
              {score===5?'Excellent ! Vous maîtrisez bien la foi catholique 🎉':score>=3?'Bien ! Continuez à approfondir votre foi.':'Continuez à lire le catéchisme pour progresser.'}
            </p>
            <button onClick={onClose} style={{ width:'100%',padding:14,background:VERT,border:'none',borderRadius:12,color:OR,fontWeight:800,fontSize:14,cursor:'pointer' }}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────
export default function CatechesePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const officeParam = searchParams.get('office');
  const [onglet,            setOnglet]            = useState(tabParam === 'catechisme' || tabParam === 'bible' ? tabParam : 'prieres');
  const [categorieOuverte,  setCategorieOuverte]  = useState(null);
  const [priereOuverte,     setPriereOuverte]     = useState(null);
  const [articleOuvert,     setArticleOuvert]     = useState(null);
  const [recherche,         setRecherche]         = useState('');
  const [favoris,           setFavoris]           = useState({});
  const [lus,               setLus]               = useState({});
  const [showQuiz,          setShowQuiz]          = useState(false);
  const [lectureId,         setLectureId]         = useState(null);
  const [languePriere,      setLanguePriere]      = useState("fr");
  const [tradPrieres,       setTradPrieres]       = useState({});
  const [loadingTradId,     setLoadingTradId]     = useState(null);

  const LANGUES_PRIERE = [
    { code:"fr", nom:"Français",  flag:"🇫🇷" },
    { code:"en", nom:"Anglais",   flag:"🇬🇧" },
    { code:"es", nom:"Espagnol",  flag:"🇪🇸" },
    { code:"pt", nom:"Portugais", flag:"🇵🇹" },
    { code:"wo", nom:"Wolof",     flag:"🇸🇳" },
    { code:"sw", nom:"Swahili",   flag:"🇰🇪" },
    { code:"ha", nom:"Haoussa",   flag:"🇳🇬" },
    { code:"yo", nom:"Yoruba",    flag:"🇳🇬" },
    { code:"am", nom:"Amharique", flag:"🇪🇹" },
    { code:"ln", nom:"Lingala",   flag:"🇨🇩" },
    { code:"zu", nom:"Zulu",      flag:"🇿🇦" },
    { code:"it", nom:"Italien",   flag:"🇮🇹" },
    { code:"ar", nom:"Arabe",     flag:"🇲🇦" },
  ];

  async function traduirePriere(id, contenu, code) {
    if (code === "fr") { setTradPrieres(p => ({ ...p, [id]:null })); setLanguePriere("fr"); return; }
    setLoadingTradId(id);
    try {
      const res  = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${code}&dt=t&q=${encodeURIComponent(contenu)}`);
      const data = await res.json();
      const trad = data[0].map(x => x[0]).join("");
      setTradPrieres(p => ({ ...p, [id]:trad }));
    } catch(e) { console.error(e); }
    setLoadingTradId(null);
    setLanguePriere(code);
  }

  function parlerPriere(texte, id) {
    if (lectureId === id) { window.speechSynthesis.cancel(); setLectureId(null); return; }
    window.speechSynthesis.cancel();
    setLectureId(id);
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = "fr-FR"; u.rate = 0.85;
    u.onend = () => setLectureId(null);
    const lancer = () => window.speechSynthesis.speak(u);
    const voix = window.speechSynthesis.getVoices();
    if (voix.length === 0) { window.speechSynthesis.onvoiceschanged = lancer; window.speechSynthesis.getVoices(); }
    else setTimeout(lancer, 100);
  }

  const categoriesFiltrees = CATEGORIES_PRIERES.map(cat => ({
    ...cat,
    prieres: cat.prieres.filter(p => p.titre.toLowerCase().includes(recherche.toLowerCase()) || p.contenu.toLowerCase().includes(recherche.toLowerCase()))
  })).filter(cat => cat.prieres.length > 0);

  const versetsFiltres = VERSETS_CLES.filter(v => v.ref.toLowerCase().includes(recherche.toLowerCase()) || v.texte.toLowerCase().includes(recherche.toLowerCase()));

  const catechismeFiltrees = CATEGORIES_CATECHISME.map(cat => ({
    ...cat,
    articles: cat.articles.filter(a => a.titre.toLowerCase().includes(recherche.toLowerCase()) || a.contenu.toLowerCase().includes(recherche.toLowerCase()))
  })).filter(cat => cat.articles.length > 0);

  const toggleFavori = (id, e) => { e.stopPropagation(); setFavoris(prev => ({ ...prev, [id]:!prev[id] })); };
  const marquerLu    = (id)    => setLus(prev => ({ ...prev, [id]:true }));
  const totalLus     = Object.values(lus).filter(Boolean).length;

  const ONGLETS = [
    { id:'prieres',    label:'🙏 Prières'    },
    { id:'catechisme', label:'📖 Catéchisme' },
    { id:'bible',      label:'📚 Bible'      },
  ];

  return (
    <AppShell>
      {/* HEADER ivoire bogolan */}
      <div style={{ background:IVOIRE,backgroundImage:BOGOLAN,padding:'2.8rem 1rem 0',borderBottom:'1px solid rgba(200,168,75,0.2)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.75rem' }}>
          <div style={{ width:38,height:38,borderRadius:10,background:DARK,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem' }}>📖</div>
          <div style={{ flex:1 }}>
            <h1 style={{ margin:0,fontSize:'1.3rem',fontWeight:700,color:VERT,fontFamily:'Georgia,serif' }}>Catéchèse</h1>
            <p style={{ margin:0,fontSize:'0.75rem',color:'rgba(30,45,20,0.45)' }}>Prières · Catéchisme · Bible</p>
          </div>
          {totalLus > 0 && (
            <div style={{ background:'rgba(30,45,20,0.08)',borderRadius:20,padding:'4px 12px',fontSize:11,fontWeight:700,color:VERT }}>✓ {totalLus} lus</div>
          )}
        </div>

        {/* Recherche */}
        <div style={{ position:'relative',marginBottom:'0.75rem' }}>
          <span style={{ position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)' }}>🔍</span>
          <input type="text" placeholder="Rechercher une prière, un article…" value={recherche} onChange={e => setRecherche(e.target.value)}
            style={{ width:'100%',padding:'0.6rem 0.75rem 0.6rem 2.2rem',borderRadius:10,border:'1px solid rgba(200,168,75,0.25)',background:'white',color:VERT,fontSize:'0.85rem',outline:'none',boxSizing:'border-box' }}/>
        </div>

        {/* Onglets */}
        <div style={{ display:'flex',gap:'0.4rem',marginBottom:0 }}>
          {ONGLETS.map(tab => (
            <button key={tab.id} onClick={() => { setOnglet(tab.id); setRecherche(''); setCategorieOuverte(null); }}
              style={{ flex:1,padding:'0.6rem 0.25rem',borderRadius:'10px 10px 0 0',border:'none',cursor:'pointer',fontWeight:700,fontSize:'0.75rem',transition:'all 0.2s',background:onglet===tab.id?VERT:'rgba(30,45,20,0.07)',color:onglet===tab.id?OR:'rgba(30,45,20,0.5)' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'1rem',paddingBottom:'5rem',background:CREME,minHeight:'60vh' }}>

        {/* ── PRIÈRES = 7 HEURES LITURGIQUES ── */}
        {onglet === 'prieres' && <OngletPrieres autoOpen={officeParam === 'auto'} />}

        {/* ── CATÉCHISME + PRIÈRES CATHOLIQUES ── */}
        {onglet === 'catechisme' && (
          <div>
            {/* Banner */}
            <div style={{ background:'linear-gradient(135deg, #1a1a2e, #16213e)',borderRadius:14,padding:'1rem',marginBottom:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ display:'flex',alignItems:'center',gap:'0.75rem' }}>
                <span style={{ fontSize:'2rem' }}>📖</span>
                <div>
                  <div style={{ color:OR,fontWeight:700,fontSize:'0.95rem' }}>Catéchisme de l'Église</div>
                  <div style={{ color:'rgba(255,255,255,0.6)',fontSize:'0.73rem',marginTop:'0.2rem' }}>Sources : Vatican · CEC · Conciles</div>
                </div>
              </div>
              <button onClick={() => setShowQuiz(true)} style={{ padding:'8px 14px',borderRadius:12,background:OR,border:'none',color:VERT,fontWeight:800,fontSize:12,cursor:'pointer' }}>🎯 Quiz</button>
            </div>

            {/* Articles CEC */}
            {catechismeFiltrees.length === 0
              ? <p style={{ textAlign:'center',color:'#888',marginTop:'2rem' }}>Aucun sujet trouvé.</p>
              : catechismeFiltrees.map(cat => (
                <div key={cat.id} style={{ marginBottom:'0.75rem' }}>
                  <button onClick={() => setCategorieOuverte(prev => prev===cat.id ? null : cat.id)}
                    style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.85rem 1rem',borderRadius:12,border:`1px solid ${OR}33`,background:categorieOuverte===cat.id?`${VERT}10`:'#fff',cursor:'pointer' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'0.6rem' }}>
                      <span style={{ fontSize:'1.2rem' }}>{cat.icon}</span>
                      <span style={{ fontWeight:700,color:VERT,fontSize:'0.95rem',fontFamily:'Georgia,serif' }}>{cat.titre}</span>
                      <span style={{ background:OR,color:VERT,borderRadius:20,padding:'0.1rem 0.5rem',fontSize:'0.7rem',fontWeight:700 }}>{cat.count}</span>
                    </div>
                    <span style={{ color:OR }}>{categorieOuverte===cat.id?'▲':'▼'}</span>
                  </button>
                  {categorieOuverte===cat.id && (
                    <div style={{ marginTop:'0.5rem',paddingLeft:'0.5rem' }}>
                      {cat.articles.map(article => (
                        <div key={article.id} style={{ marginBottom:'0.4rem' }}>
                          <button onClick={() => { setArticleOuvert(prev => prev===article.id?null:article.id); marquerLu(article.id); }}
                            style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.7rem 0.9rem',borderRadius:10,border:'1px solid #e4e7eb',background:articleOuvert===article.id?`${OR}15`:'#fafafa',cursor:'pointer' }}>
                            <div style={{ display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0 }}>
                              <span style={{ fontWeight:600,color:'#1a1a2e',fontSize:'0.88rem',fontFamily:'Georgia,serif' }}>{article.titre}</span>
                              {lus[article.id] && <span style={{ fontSize:10,color:'#2e7d32',fontWeight:700 }}>✓</span>}
                            </div>
                            <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                              <span style={{ fontSize:10,color:'#aaa' }}>⏱ {article.temps}</span>
                              <span onClick={e => toggleFavori(article.id,e)} style={{ fontSize:16,cursor:'pointer' }}>{favoris[article.id]?'⭐':'☆'}</span>
                              <span style={{ color:VERT }}>{articleOuvert===article.id?'▲':'▼'}</span>
                            </div>
                          </button>
                          {articleOuvert===article.id && (
                            <div style={{ background:`linear-gradient(135deg,#1a1a2e08,${OR}08)`,border:`1px solid ${OR}33`,borderRadius:'0 0 10px 10px',padding:'1rem' }}>
                              <div style={{ display:'flex',gap:8,marginBottom:10 }}>
                                <span style={{ fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:10,background:`${VERT}15`,color:VERT,border:`1px solid ${VERT}30` }}>📚 {article.ref}</span>
                              </div>
                              <p style={{ whiteSpace:'pre-line',fontSize:'0.85rem',lineHeight:'1.75',color:'#2a2a2a',margin:'0 0 12px',fontFamily:'Georgia,serif' }}>{article.contenu}</p>
                              <div style={{ display:'flex',gap:8 }}>
                                <button onClick={() => navigator.clipboard?.writeText(article.contenu)} style={{ flex:1,padding:'8px 0',borderRadius:10,border:`1px solid ${OR}40`,background:'#fff',color:VERT,fontWeight:700,fontSize:12,cursor:'pointer' }}>📋 Copier</button>
                                <button onClick={() => navigator.share?.({title:article.titre,text:article.contenu})} style={{ flex:1,padding:'8px 0',borderRadius:10,border:'none',background:VERT,color:OR,fontWeight:700,fontSize:12,cursor:'pointer' }}>↗ Partager</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            }

            {/* Séparateur prières catholiques */}
            <div style={{ display:'flex',alignItems:'center',gap:8,margin:'16px 0 10px' }}>
              <div style={{ flex:1,height:1,background:`${OR}30` }}/>
              <div style={{ fontSize:10,color:'rgba(30,45,20,0.4)',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase' }}>Prières catholiques</div>
              <div style={{ flex:1,height:1,background:`${OR}30` }}/>
            </div>

            {categoriesFiltrees.map(cat => (
              <div key={cat.id} style={{ marginBottom:'0.75rem' }}>
                <button onClick={() => setCategorieOuverte(prev => prev===cat.id?null:cat.id)}
                  style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.85rem 1rem',borderRadius:12,border:`1px solid ${OR}33`,background:categorieOuverte===cat.id?`${VERT}10`:'#fff',cursor:'pointer' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'0.6rem' }}>
                    <span style={{ fontSize:'1.2rem' }}>{cat.icon}</span>
                    <span style={{ fontWeight:700,color:VERT,fontSize:'0.95rem',fontFamily:'Georgia,serif' }}>{cat.titre}</span>
                    <span style={{ background:OR,color:VERT,borderRadius:20,padding:'0.1rem 0.5rem',fontSize:'0.7rem',fontWeight:700 }}>{cat.count}</span>
                  </div>
                  <span style={{ color:OR }}>{categorieOuverte===cat.id?'▲':'▼'}</span>
                </button>
                {categorieOuverte===cat.id && (
                  <div style={{ marginTop:'0.5rem',paddingLeft:'0.5rem' }}>
                    {cat.prieres.map(priere => (
                      <div key={priere.id} style={{ marginBottom:'0.4rem' }}>
                        <button onClick={() => { setPriereOuverte(prev => prev===priere.id?null:priere.id); marquerLu(priere.id); }}
                          style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.7rem 0.9rem',borderRadius:10,border:'1px solid #e4e7eb',background:priereOuverte===priere.id?`${OR}15`:'#fafafa',cursor:'pointer' }}>
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <span style={{ fontSize:'0.88rem',fontWeight:600,color:'#1a1a2e',fontFamily:'Georgia,serif' }}>🙏 {priere.titre}</span>
                            {lus[priere.id] && <span style={{ fontSize:10,color:'#2e7d32',fontWeight:700 }}>✓ Lu</span>}
                          </div>
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <span style={{ fontSize:10,color:'#aaa' }}>⏱ {priere.duree}</span>
                            <span onClick={e => toggleFavori(priere.id,e)} style={{ fontSize:16,cursor:'pointer' }}>{favoris[priere.id]?'⭐':'☆'}</span>
                            <span style={{ color:VERT }}>{priereOuverte===priere.id?'▲':'▼'}</span>
                          </div>
                        </button>
                        {priereOuverte===priere.id && (
                          <div style={{ background:`linear-gradient(135deg,${VERT}08,${OR}08)`,border:`1px solid ${OR}33`,borderRadius:'0 0 10px 10px',padding:'1rem',fontFamily:'Georgia,serif',fontStyle:'italic',fontSize:'0.88rem',lineHeight:'1.75',color:'#2a2a2a',whiteSpace:'pre-line' }}>
                            {tradPrieres[priere.id] || priere.contenu}
                            <div style={{ display:'flex',gap:6,marginTop:10,flexWrap:'wrap' }}>
                              {LANGUES_PRIERE.map(l => (
                                <button key={l.code} onClick={() => traduirePriere(priere.id,priere.contenu,l.code)}
                                  style={{ padding:'4px 10px',borderRadius:20,border:`1px solid ${OR}`,background:languePriere===l.code?OR:'#fff',color:languePriere===l.code?VERT:OR,fontWeight:700,fontSize:11,cursor:'pointer' }}>
                                  {l.flag} {l.nom}
                                </button>
                              ))}
                            </div>
                            {loadingTradId===priere.id && <div style={{ fontSize:11,color:OR,marginTop:6 }}>Traduction en cours...</div>}
                            {tradPrieres[priere.id] && <div style={{ marginTop:10,borderTop:`1px solid ${OR}33`,paddingTop:10,whiteSpace:'pre-line' }}>{tradPrieres[priere.id]}</div>}
                            <div style={{ display:'flex',gap:8,marginTop:12 }}>
                              <button onClick={() => parlerPriere(priere.contenu,priere.id)} style={{ flex:1,padding:'8px 0',borderRadius:10,border:'none',background:lectureId===priere.id?OR:VERT,color:lectureId===priere.id?VERT:OR,fontWeight:700,fontSize:12,cursor:'pointer' }}>
                                {lectureId===priere.id?'⏹ Stop':'▶ Écouter'}
                              </button>
                              <button onClick={() => navigator.clipboard?.writeText(priere.contenu)} style={{ flex:1,padding:'8px 0',borderRadius:10,border:`1px solid ${OR}40`,background:'#fff',color:VERT,fontWeight:700,fontSize:12,cursor:'pointer' }}>📋 Copier</button>
                              <button onClick={() => navigator.share?.({title:priere.titre,text:priere.contenu})} style={{ flex:1,padding:'8px 0',borderRadius:10,border:'none',background:VERT,color:OR,fontWeight:700,fontSize:12,cursor:'pointer' }}>↗ Partager</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── BIBLE ── */}
        {onglet === 'bible' && (
          <div>
            <div style={{ background:'linear-gradient(135deg, #2c1810, #5c2e0e)',borderRadius:14,padding:'1.2rem',marginBottom:'1rem',textAlign:'center',color:'#fff' }}>
              <div style={{ fontSize:'2.5rem',marginBottom:'0.5rem' }}>📚</div>
              <h2 style={{ margin:0,fontSize:'1.1rem',color:OR,fontWeight:700,fontFamily:'Georgia,serif' }}>Bible de Jérusalem</h2>
              <p style={{ margin:'0.3rem 0 0.8rem',fontSize:'0.78rem',color:'rgba(255,255,255,0.7)' }}>Ancien et Nouveau Testament</p>
              <button onClick={() => navigate('/bible')} style={{ background:OR,color:VERT,border:'none',borderRadius:10,padding:'0.6rem 1.4rem',fontWeight:700,fontSize:'0.88rem',cursor:'pointer' }}>📖 Ouvrir la Bible complète</button>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
              <div style={{ background:'#fff',borderRadius:12,padding:'12px',textAlign:'center',border:'1px solid #e4e4e7' }}><div style={{ fontSize:24 }}>📖</div><div style={{ fontSize:18,fontWeight:800,color:VERT }}>73</div><div style={{ fontSize:11,color:'#888' }}>Livres</div></div>
              <div style={{ background:'#fff',borderRadius:12,padding:'12px',textAlign:'center',border:'1px solid #e4e4e7' }}><div style={{ fontSize:24 }}>✝️</div><div style={{ fontSize:18,fontWeight:800,color:VERT }}>1189</div><div style={{ fontSize:11,color:'#888' }}>Chapitres</div></div>
            </div>
            <h3 style={{ color:VERT,fontSize:'0.95rem',fontWeight:700,marginBottom:'0.75rem',fontFamily:'Georgia,serif' }}>✿ Versets clés</h3>
            {versetsFiltres.map((v,i) => (
              <div key={i} style={{ background:'#fff',borderRadius:12,padding:'0.9rem 1rem',marginBottom:'0.6rem',border:'1px solid #e4e7eb' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
                  <span style={{ background:`${VERT}15`,color:VERT,border:`1px solid ${VERT}30`,borderRadius:20,padding:'0.15rem 0.6rem',fontSize:'0.72rem',fontWeight:700 }}>{v.ref}</span>
                  <div style={{ display:'flex',gap:8 }}>
                    <button onClick={() => toggleFavori('v'+i,{stopPropagation:()=>{}})} style={{ background:'none',border:'none',cursor:'pointer',fontSize:16 }}>{favoris['v'+i]?'⭐':'☆'}</button>
                    <button onClick={() => navigator.clipboard?.writeText('« '+v.texte+' » — '+v.ref)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:14,color:VERT }}>📋</button>
                  </div>
                </div>
                <p style={{ margin:0,fontSize:'0.85rem',lineHeight:'1.6',color:'#2a2a2a',fontStyle:'italic',fontFamily:'Georgia,serif' }}>« {v.texte} »</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showQuiz && <QuizModal onClose={() => setShowQuiz(false)}/>}
    </AppShell>
  );
}
