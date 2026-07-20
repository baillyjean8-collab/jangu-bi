import { useState } from 'react';
import { AppShell } from '../../components/layout';

const VERT = '#1e2d14';
const OR = '#c8a84b';
const CREME = '#f5f3ee';

const CATEGORIES = [
  { id: 'actualites', label: 'Actualités', icon: '📰' },
  { id: 'senegal', label: 'Sénégal', icon: '🇸🇳' },
  { id: 'vatican', label: 'Vatican', icon: '⛪' },
  { id: 'bible', label: 'Bible', icon: '📖' },
  { id: 'saints', label: 'Saints', icon: '✨' },
  { id: 'classiques', label: 'Classiques', icon: '📜' },
  { id: 'temoignages', label: 'Témoignages', icon: '💬' },
];

const ARTICLES = [
  {
    id: 'popenguine-138-ans',
    categorie: 'actualites',
    date: '2026-05-24',
    titre: 'Popenguine : 138 ans de marche, entre foi et mémoire',
    source: 'Source : Tambacounda.info, 24 mai 2026',
    texte: "Chaque annee a la Pentecote, des dizaines de milliers de pelerins rallient a pied le sanctuaire de Popenguine. Ne en 1888, relance en 1981 apres une periode d'interruption, ce rendez-vous est devenu le coeur battant du catholicisme senegalais.\n\nCette annee encore, des fideles venus de tous les diocese du pays (Dakar, Thies, Kaolack, Saint-Louis, Ziguinchor, Kolda et Tambacounda) ont marche, certains depuis Dakar, Thies ou Mbour, dans un esprit de sacrifice et de fraternite. Les jeunes delegations diocesaines vivent cette marche comme un veritable chemin spirituel avant d'arriver au sanctuaire. L'Eglise a profite de ce rassemblement pour appeler les fideles a prier pour la paix au Senegal et dans la sous-region.",
    lienExterne: 'https://www.tambacounda.info/2026/05/24/popenguine-138-ans-de-marche-entre-foi-et-memoire/',
  },
  {
    id: 'sanctuaire-national-popenguine',
    categorie: 'actualites',
    date: '2023-12-09',
    titre: 'Popenguine reconnu sanctuaire marial national',
    source: 'Source : ZENIT, 11 decembre 2023',
    texte: "Le 9 decembre 2023, le sanctuaire Notre-Dame-de-la-Delivrande de Popenguine a ete officiellement inaugure et reconnu sanctuaire national par la Conference des eveques du Senegal, de la Mauritanie, du Cap-Vert et de la Guinee-Bissau. Mgr Benjamin Ndiaye, alors archeveque de Dakar, presidait la ceremonie, entoure d'eveques de la region et des autorites senegalaises.\n\nLe nouveau sanctuaire s'etend sur plus de 20 000 m2 avec une vue panoramique sur l'ocean. Cette reconnaissance officielle vient couronner plus d'un siecle d'histoire de devotion mariale sur ce site, depuis les origines du pelerinage en 1888.",
    lienExterne: 'https://fr.zenit.org/2023/12/11/consecration-du-nouveau-sanctuaire-marial-au-senegal/',
  },
  {
    id: 'popenguine',
    categorie: 'senegal',
    titre: 'Popenguine, le cœur marial du Sénégal',
    source: 'Sources : sanctuaire-popenguine.org, Wikipedia, presse senegalaise 2026',
    texte: "Tout commence en 1857, quand le missionnaire spiritain alsacien Joseph Strub s'installe dans ce village alors habite par des Soces convertis a l'islam. Son dispensaire attire les foules et de premieres conversions ont lieu. C'est son successeur, Mgr Mathurin Picarda, qui lance en 1888 la construction d'un sanctuaire dedie a la Vierge Marie, inspire du sanctuaire normand de Notre-Dame-de-la-Delivrande.\n\nLa toute premiere marche de pelerinage a lieu le 22 mai 1888, jour de la Pentecote. Sobre d'architecture, l'edifice ne sera acheve qu'un siecle plus tard, en 1988. Abritant une Vierge noire veneree par les fideles, il devient tres vite l'un des lieux de devotion mariale les plus importants du pays.\n\nEn 1992, lors de sa visite pastorale au Senegal, le pape Jean-Paul II eleve l'eglise au rang de basilique mineure. Le pelerinage national, relance en 1981 apres une periode d'interruption, rassemble aujourd'hui chaque lundi de Pentecote des dizaines de milliers de fideles venus a pied de tous les diocese du pays. En decembre 2023, la Conference des eveques du Senegal, de la Mauritanie, du Cap-Vert et de la Guinee-Bissau reconnait officiellement l'ensemble comme sanctuaire national.",
    lienExterne: null,
  },
  {
    id: 'archidiocese-dakar',
    categorie: 'senegal',
    titre: "L'Archidiocèse de Dakar, une histoire de plus d'un siècle",
    source: 'Source : Wikipedia, verifie juillet 2026',
        texte: "L'histoire de l'Eglise catholique organisee au Senegal remonte a 1842, avec la creation de la prefecture apostolique des Deux Guinees et Senegambie. Il faudra attendre le 14 septembre 1955 pour que le pape Pie XII erige canoniquement l'Archidiocese de Dakar tel qu'on le connait aujourd'hui.\n\nLa cathedrale Notre-Dame-des-Victoires de Dakar en est l'eglise principale. L'archidiocese est aujourd'hui dirige par Mgr Andre Gueye, et regroupe plus d'une cinquantaine de paroisses reparties en plusieurs doyennes, couvrant Dakar, Pikine, Guediawaye, Rufisque et une partie des regions de Thies et Fatick.",
    lienExterne: null,
  },
  {
    id: 'archeveques-dakar',
    categorie: 'senegal',
    titre: 'Les cinq archevêques de Dakar, depuis 1955',
    source: 'Sources : Wikipedia, APS (Agence de Presse Senegalaise), Catholic-Hierarchy — verifie juillet 2026',
    texte: "Depuis l'erection de l'Archidiocese de Dakar en 1955, cinq hommes se sont succede a sa tete.\n\nMgr Marcel Lefebvre fut le tout premier archeveque. Lui succeda Mgr Hyacinthe Thiandoum, ne le 2 fevrier 1921 a Poponguine meme, le village du grand sanctuaire marial. Nomme archeveque le 24 fevrier 1962, il dirigea le diocese pendant 38 ans, devint cardinal en 1976, et fut une figure tres proche du pape Jean-Paul II, qui lui exprima son affection dans l'un de ses derniers livres. Il mourut en France en 2004 et repose a la cathedrale de Dakar.\n\nLe cardinal Theodore-Adrien Sarr, ne le 28 novembre 1936 a Fadiouth, lui succeda de 2000 a 2014. Ancien eveque de Kaolack, il fut cree cardinal par Benoit XVI en 2007 et participa au conclave de 2013 qui elut le pape Francois.\n\nMgr Benjamin Ndiaye, egalement natif de Fadiouth, ne le 28 octobre 1948, dirigea l'archidiocese de 2014 a 2025, avant de ceder la place, en fevrier 2025, a l'actuel archeveque, Mgr Andre Gueye, ne le 6 janvier 1967, ancien eveque de Thies, installe le 3 mai 2025.",
    lienExterne: 'https://fr.wikipedia.org/wiki/Liste_des_archev%C3%AAques_de_Dakar',
  },
    {
    id: 'catechisme-extrait',
    categorie: 'vatican',
    titre: "Le Catéchisme de l'Église Catholique — sa structure et son contenu complet",
    source: "Source : Catechisme de l'Eglise Catholique, Libreria Editrice Vaticana, 1992",
    texte: "Le Catechisme de l'Eglise Catholique fut publie en 1992 sous le pontificat de Jean-Paul II, apres six annees de travail confiees a une commission de cardinaux et d'eveques presidee par le cardinal Joseph Ratzinger, futur pape Benoit XVI. Son objectif etait de rassembler en un seul ouvrage de reference l'ensemble de l'enseignement catholique, redige de maniere organique et accessible a tous les baptises, pretres comme laics.\n\nL'ouvrage repose sur quatre grandes parties, appelees traditionnellement les quatre piliers de la foi.\n\nLa premiere partie expose la profession de foi, c'est-a-dire le Credo, article par article : la foi en un seul Dieu Pere, Fils et Saint-Esprit, la creation du monde et de l'homme, la chute et le peche originel, l'Incarnation du Christ, sa mort et sa Resurrection, l'Eglise, la communion des saints et la vie eternelle.\n\nLa deuxieme partie est consacree a la celebration du mystere chretien, c'est-a-dire la liturgie et les sept sacrements : le bapteme, la confirmation, l'eucharistie, la penitence et reconciliation, l'onction des malades, l'ordre et le mariage. Chaque sacrement y est explique dans son origine biblique, sa signification spirituelle et son deroulement concret.\n\nLa troisieme partie traite de la vie dans le Christ, c'est-a-dire la morale chretienne : la dignite de la personne humaine, la liberte, la conscience, les vertus, le peche, puis un commentaire detaille des Dix Commandements, un par un, applique a la vie quotidienne.\n\nLa quatrieme et derniere partie est entierement dediee a la priere chretienne, avec un commentaire approfondi, phrase par phrase, du Notre Pere, la priere que Jesus lui-meme a enseignee a ses disciples.\n\nLe tout premier paragraphe du Catechisme resume l'esprit de l'ensemble : Dieu, infiniment parfait et bienheureux en lui-meme, a cree l'homme, dans un dessein de pure bonte, pour le faire participer a sa propre vie bienheureuse. C'est pourquoi, en tout temps et en tout lieu, Dieu se rend proche de l'homme. Il l'appelle et l'aide a le chercher, a le connaitre et a l'aimer de toutes ses forces. Il convoque tous les hommes, disperses par le peche, a l'unite de sa famille, l'Eglise. Pour cela, en la plenitude des temps, il a envoye son Fils comme Redempteur et Sauveur. En lui et par lui, Dieu appelle les hommes a devenir, dans l'Esprit Saint, ses fils adoptifs et, par consequent, les heritiers de sa vie bienheureuse.\n\nLe texte integral du Catechisme, avec ses 2865 paragraphes numerotes, est consultable librement sur le site officiel du Vatican, dans le lien ci-dessous.",
        lienExterne: 'https://www.vatican.va/archive/FRA0013/_INDEX.HTM',
  },
  {
    id: 'mariage-catholique',
    categorie: 'vatican',
    titre: 'Le mariage catholique — sens, sacrement et préparation',
    source: 'Sources : droit canon (canon 1134), Concile Vatican II (Gaudium et Spes), Diocese de Paris, Amoris Laetitia — verifie juillet 2026',
    texte: "Pour l'Eglise catholique, le mariage n'est pas d'abord une ceremonie ou un contrat civil, mais une alliance : l'union libre et definitive d'un homme et d'une femme, ordonnee au bien des epoux eux-memes ainsi qu'a l'accueil et l'education des enfants. Lorsque les deux epoux sont baptises, cette alliance est elevee par le Christ lui-meme a la dignite de sacrement.\n\nUn point souvent meconnu, meme parmi les catholiques : dans le rite latin, ce ne sont pas le pretre ou le diacre qui donnent le sacrement. Ce sont les epoux eux-memes qui se le donnent mutuellement, par leur consentement libre et public. Le pretre n'est present que comme temoin qualifie de l'Eglise et pour donner la benediction nuptiale ; c'est pourquoi, en cas de necessite grave, un mariage catholique valide peut meme se celebrer sans pretre, devant seulement des temoins.\n\nLe droit canon (canon 1134) precise que de ce consentement nait entre les epoux un lien qui, de par sa nature meme, est perpetuel et exclusif. Trois caracteristiques sont considerees comme essentielles et indissociables du mariage catholique : l'unite (un homme, une femme, exclusivement l'un a l'autre), l'indissolubilite (le lien ne peut, en principe, jamais etre rompu du vivant des deux epoux), et l'ouverture a la fecondite (le refus deliberé et permanent d'accueillir des enfants rend le mariage invalide aux yeux de l'Eglise). Si l'un des futurs epoux rejette ouvertement l'un de ces trois elements avant la celebration, le pretre a l'obligation, selon le droit canon, de refuser de celebrer le mariage religieux.\n\nSur le plan theologique, le concile Vatican II, dans sa constitution Gaudium et Spes, et plus tard le pape Francois dans son exhortation Amoris Laetitia (2016), insistent sur une meme idee centrale : l'amour conjugal des epoux devient le lieu concret ou se manifeste, dans l'histoire, l'amour meme du Christ pour son Eglise. Le mariage n'est donc pas vecu comme un episode isole, mais comme une participation reelle au don total de soi que le Christ a fait par sa vie, sa mort et sa resurrection.\n\nEn pratique, l'Eglise demande aux futurs epoux de commencer leur preparation au moins un an avant la date prevue, en prenant contact avec leur paroisse. Cette preparation ne vise pas a exiger une connaissance theologique poussee, mais a aider le couple a bien comprendre et a assumer librement les trois engagements essentiels : liberte du consentement, unite exclusive, et ouverture responsable a la vie.",
    lienExterne: 'https://fr.wikipedia.org/wiki/Mariage_catholique',
  },
      {
    id: 'sept-sacrements',
    categorie: 'vatican',
    titre: 'Les sept sacrements — comprendre chacun en détail',
    source: 'Sources : Catechisme de l\'Eglise Catholique, dioceses de Lyon, Besancon, Avignon, Frejus-Toulon — verifie juillet 2026',
    texte: "Un sacrement est defini par l'Eglise comme un signe visible et efficace de la grace de Dieu : un geste concret (de l'eau, une onction, une parole) par lequel Dieu agit reellement dans la vie de la personne qui le recoit, pas seulement un symbole. L'Eglise catholique en reconnait sept, regroupes traditionnellement en trois familles.\n\nLES TROIS SACREMENTS DE L'INITIATION CHRETIENNE\n\nLe BAPTEME est la porte d'entree dans la vie chretienne. Le mot vient du grec et signifie plonger, immerger. La personne est plongee dans l'eau, ou recoit l'eau sur la tete, trois fois, au nom du Pere, du Fils et du Saint-Esprit. Ce geste signifie qu'elle meurt symboliquement au peche et renait a une vie nouvelle comme enfant de Dieu. C'est le seul sacrement que tout baptise, meme non pretre, peut donner en cas d'urgence grave.\n\nLa CONFIRMATION acheve ce que le bapteme a commence. Par l'onction du saint chreme (une huile parfumee consacree) et l'imposition des mains, generalement par l'eveque, le confirme recoit une effusion particuliere de l'Esprit Saint qui le fortifie dans sa foi et fait de lui un temoin plus mature et plus engage de l'Evangile.\n\nL'EUCHARISTIE, aussi appelee communion ou messe, est consideree par l'Eglise comme le sommet et la source de toute la vie chretienne. Institue par Jesus lui-meme lors de la Cene, son dernier repas avant sa mort, ce sacrement rend reellement present, sous les apparences du pain et du vin, le Corps et le Sang du Christ. C'est le seul des sept sacrements que l'on peut recevoir tres frequemment, chaque jour si on le souhaite.\n\nLES DEUX SACREMENTS DE GUERISON\n\nLa RECONCILIATION, plus connue sous le nom de confession ou penitence, permet au croyant de retrouver la grace de Dieu apres avoir peche. Le fidele confesse ses peches en toute sincerite a un pretre, qui l'ecoute au nom du Christ et de l'Eglise, puis lui donne l'absolution : le pardon officiel de Dieu, accompagne generalement d'une penitence (une priere ou un geste reparateur) a accomplir.\n\nL'ONCTION DES MALADES est proposee aux personnes gravement malades, agees ou sur le point de subir une operation importante. Par l'onction d'une huile benite sur le front et les mains, ce sacrement unit les souffrances du malade a celles du Christ sur la croix, lui apportant reconfort, paix interieure et parfois, selon la foi de l'Eglise, une aide a la guerison meme physique.\n\nLES DEUX SACREMENTS AU SERVICE DE LA COMMUNAUTE\n\nL'ORDRE est le sacrement par lequel un homme devient diacre, pretre ou eveque. Par l'imposition des mains de l'eveque, celui qui le recoit est configure de maniere particuliere au Christ serviteur, capable, selon son degre, de precher, d'administrer les sacrements et, pour les pretres et eveques, de celebrer l'eucharistie.\n\nLe MARIAGE, septieme sacrement, unit un homme et une femme dans une alliance d'amour fidele, exclusive et ouverte a la vie. Ce sacrement est traite en profondeur dans un article dedie de cette bibliotheque, tant sa richesse theologique et pratique merite un developpement a part entiere.\n\nCes sept sacrements ne sont pas de simples ceremonies isolees : l'Eglise les concoit comme les etapes d'un meme chemin, accompagnant chaque grand moment de la vie du croyant, de la naissance spirituelle jusqu'a la fin de la vie terrestre.",
    lienExterne: 'https://www.vatican.va/archive/FRA0013/_INDEX.HTM',
  },
  {
    id: 'histoire-chapelet-rosaire',
    categorie: 'vatican',
    titre: 'Le chapelet et le Rosaire — histoire et structure complète',
    source: 'Sources : Aleteia, Rosary Center, chapelet.net, encyclopedie mariale — verifie juillet 2026',
    texte: "L'origine du chapelet remonte bien plus loin qu'on ne le croit souvent. Des les premiers siecles du christianisme, les Peres du desert enfilaient des cailloux sur un cordon pour compter leurs prieres repetees, une pratique qui donnera naissance au Moyen Age aux premieres cordelettes de priere, appelees alors paternostre, du nom du Notre Pere qu'on y recitait.\n\nLa tradition populaire attribue l'invention du Rosaire a saint Dominique, fondateur de l'ordre des Precheurs, vers l'an 1200 : la Vierge Marie lui serait apparue en lui disant de reciter son Psautier et de l'enseigner autour de lui. Les historiens actuels nuancent cependant cette origine legendaire : ils montrent plutot un developpement lent et progressif sur environ cinq siecles. Au XVe siecle, un moine chartreux nomme Dominique de Prusse, prieur de la Chartreuse de Treves, composa cinquante courtes meditations sur la vie du Christ et de Marie, appelees clausules, qu'il fit reciter accolees a l'Ave Maria. C'est le frere breton Alain de la Roche, dominicain du XVe siecle, qui popularisa largement cette devotion a travers l'Europe occidentale, fondant les premieres Confreries du Rosaire.\n\nLe mot chapelet vient du fait que les fideles avaient pris l'habitude, des le XIVe siecle, de couronner de petits chapeaux de fleurs les statues de la Vierge Marie. Le mot rosaire, lui, vient du latin rosarium, qui signifie roseraie ou bouquet de roses : chaque priere recitee etait symboliquement comparee a une rose offerte a Marie.\n\nEn 1569, le pape Pie V, lui-meme dominicain, officialise la liste des quinze mysteres du Rosaire, repartis en trois series de cinq : les mysteres joyeux (l'enfance de Jesus), les mysteres douloureux (sa Passion), et les mysteres glorieux (sa Resurrection et ce qui suit). Deux ans plus tard, en 1571, ce meme pape institue la fete de Notre-Dame du Rosaire le 7 octobre, en action de grace pour la victoire navale de Lepante contre une flotte ottomane, obtenue le jour meme ou toute la chretiente recitait le chapelet a cette intention.\n\nEn 2002, le pape Jean-Paul II a ajoute une quatrieme serie, les mysteres lumineux, centres sur la vie publique de Jesus (son bapteme, les noces de Cana, l'annonce du Royaume, la Transfiguration, l'institution de l'Eucharistie), afin de completer la meditation sur l'ensemble de la vie du Christ, pas seulement son enfance et sa Passion.\n\nCOMMENT SE RECITE LE CHAPELET AUJOURD'HUI\nUn chapelet complet correspond a une seule serie de cinq mysteres. Le Rosaire entier correspond aux trois series traditionnelles reunies (aujourd'hui quatre, avec les mysteres lumineux). Chaque serie se divise en cinq dizaines : sur chaque dizaine, on recite un Notre Pere, puis dix Je vous salue Marie tout en meditant le mystere du jour, et on acheve par un Gloire au Pere. On commence generalement sur le crucifix par le Signe de croix et le Credo, puis un Notre Pere et trois Je vous salue Marie avant d'entamer la premiere dizaine.",
    lienExterne: 'https://fr.aleteia.org/2014/10/07/video-a-lecole-de-la-foi-quelles-sont-les-origines-du-chapelet/',
  },
  {
    id: 'ignace-exercices',
    categorie: 'classiques',
    titre: 'Les Exercices spirituels de saint Ignace de Loyola',
    source: 'Domaine public — Christian Classics Ethereal Library (ccel.org)',
    texte: "Rediges par saint Ignace de Loyola au XVIe siecle, les Exercices spirituels sont nes de sa propre experience de conversion apres sa blessure de guerre en 1521. Ce petit livre n'est pas destine a etre simplement lu, mais pratique : il propose un parcours de priere en quatre etapes, appelees semaines, pour aider une personne a discerner la volonte de Dieu dans sa vie et a se detacher de ce qui l'eloigne de lui.\n\nCe texte est devenu la base de la formation spirituelle de tous les Jesuites a travers le monde, et reste aujourd'hui propose sous forme de retraites a des laics de toutes conditions, bien au-dela de la seule Compagnie de Jesus.",
    lienExterne: 'https://ccel.org/ccel/ignatius/exercises',
  },
    {
    id: 'lexique-hierarchie',
    categorie: 'classiques',
    titre: "Qui est qui dans l'Église ? Le lexique complet",
    source: 'Sources : droit canon, Vatican, Aleteia, Wikipedia — verifie juillet 2026',
    texte: "LE PAPE\nEveque de Rome et chef visible de l'Eglise catholique tout entiere, considere par les catholiques comme le successeur de l'apotre Pierre. Il est elu a vie par le college des cardinaux reunis en conclave. Le pape actuel est Leon XIV (Robert Francis Prevost), premier pape ne aux Etats-Unis, elu le 8 mai 2025 apres le deces du pape Francois.\n\nLE CARDINAL\nEveque (ou parfois pretre) choisi personnellement par le pape pour former son conseil le plus proche. Les cardinaux ages de moins de 80 ans ont seuls le droit de participer au conclave qui elit un nouveau pape.\n\nL'ARCHEVEQUE ET L'EVEQUE\nL'eveque est un pretre ayant recu le plus haut degre du sacrement de l'ordre. Il a la charge spirituelle d'un diocese : y enseigner la foi, y celebrer les sacrements les plus solennels, et veiller sur les pretres de son territoire. L'archeveque est un eveque a la tete d'un diocese plus important appele archidiocese, avec quelques responsabilites supplementaires sur les dioceses voisins dits suffragants.\n\nLE PRETRE ET LE CURE\nLe pretre a recu le sacrement de l'ordre et peut celebrer la messe et la plupart des sacrements, a l'exception de l'ordination elle-meme, reservee a l'eveque. Le curé est simplement le titre donne au pretre charge de diriger une paroisse precise ; il peut etre aide par un ou plusieurs pretres appeles vicaires.\n\nLE DIACRE\nPremier des trois degres du sacrement de l'ordre, avant la pretrise. Certains diacres, dits transitoires, se preparent a devenir pretres. D'autres, dits permanents, restent diacres toute leur vie, souvent maries, et assistent le pretre : ils peuvent prêcher, celebrer des baptemes et des mariages, mais pas la messe elle-meme.\n\nLE MOINE, LA RELIGIEUSE, LA SOEUR\nUn moine ou une religieuse appartient au clerge dit regulier, c'est-a-dire qu'il ou elle suit une regle de vie precise au sein d'une communaute, avec les trois voeux de pauvrete, chastete et obeissance. Une soeur ou une religieuse n'est pas ordonnee pretre (les femmes n'accedent pas au sacrement de l'ordre dans l'Eglise catholique), mais consacre sa vie a la priere, souvent accompagnee d'une oeuvre precise : enseignement, soin des malades, accueil des pauvres.\n\nLA CARMELITE\nUne carmelite est une religieuse appartenant a l'ordre du Carmel, fonde au Moyen Age puis reforme au XVIe siecle par sainte Therese d'Avila et saint Jean de la Croix. Les carmelites vivent generalement dans des monasteres fermes au monde exterieur (on parle de vie contemplative), consacrant leurs journees a la priere silencieuse plutot qu'a une oeuvre exterieure. Sainte Therese de Lisieux, tres populaire, etait elle aussi carmelite.\n\nLE DIOCESE\nTerritoire confie a un eveque, regroupant plusieurs paroisses. C'est l'unite territoriale de base de l'organisation de l'Eglise catholique.\n\nLE DOYENNE\nRegroupement de plusieurs paroisses voisines a l'interieur d'un meme diocese, souvent place sous la responsabilite d'un pretre appele doyen, pour faciliter la coordination pastorale entre paroisses proches.\n\nLA PAROISSE\nCommunaute de fideles confiee a un cure, generalement organisee autour d'une eglise principale. C'est le niveau le plus proche du quotidien des fideles : c'est la paroisse qui celebre les messes dominicales, prepare aux sacrements et anime la vie communautaire locale.\n\nLA CHAPELLE\nLieu de culte plus petit qu'une eglise paroissiale, souvent rattache a une paroisse voisine sans avoir son propre cure resident, ou construit pour un usage particulier (chapelle d'un couvent, d'un hopital, d'un lieu de pelerinage). Une chapelle n'a pas de territoire propre comme une paroisse : elle depend administrativement de la paroisse a laquelle elle est rattachee.",
    lienExterne: 'https://fr.wikipedia.org/wiki/Hi%C3%A9rarchie_dans_l%27%C3%89glise_catholique',
  },
    {
    id: 'saint-ignace-loyola-biographie',
    categorie: 'saints',
    titre: 'Saint Ignace de Loyola — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Inigo Lopez de Loyola nait en 1491 au chateau familial de Loyola, au Pays basque espagnol, dernier d'une famille noble de treize enfants. Jeune homme, il vise une carriere militaire et courtisane, mene une vie mondaine et parfois violente. En 1521, lors du siege de Pampelune contre les Francais, un boulet de canon lui brise gravement la jambe droite. Rapatrie au chateau familial pour se remettre, il subit plusieurs operations tres douloureuses, sans anesthesie, qui le laisseront boiteux toute sa vie.\n\nDurant cette longue et penible convalescence, faute d'autre lecture disponible, il se met a lire une Vie du Christ et des vies de saints. Il remarque alors une difference profonde entre le plaisir ephemere que lui procurent ses reveries de gloire militaire et la paix durable que lui laissent ses reveries sur une vie consacree a Dieu. C'est le point de depart de sa conversion et de ce qui deviendra plus tard sa methode de discernement spirituel.\n\nUne fois retabli, il abandonne definitivement les armes, se rend en pelerinage a Montserrat ou il depose son epee devant une statue de la Vierge, puis se retire pres d'un an dans une grotte a Manrese pour prier et faire penitence. C'est durant cette periode qu'il redige l'essentiel de ses celebres Exercices spirituels. Il reprend ensuite des etudes, tardivement, a Barcelone puis a l'universite de Paris, ou il rassemble autour de lui un petit groupe de compagnons, dont saint Francois Xavier.\n\nEn 1540, le pape Paul III approuve officiellement la fondation de leur nouvel ordre, la Compagnie de Jesus, dont Ignace devient le premier superieur general, poste qu'il occupera jusqu'a sa mort a Rome en 1556. Sous sa direction, les Jesuites se developpent rapidement, fondant des colleges et partant en mission jusqu'en Inde, au Japon et en Amerique. Canonise en 1622, saint Ignace demeure l'une des figures majeures de la reforme catholique du XVIe siecle, et ses Exercices spirituels continuent d'etre pratiques par des laics du monde entier, bien au-dela de son propre ordre.",
    lienExterne: 'https://ccel.org/ccel/ignatius/exercises',
  },
  {
    id: 'saint-jean-marie-vianney-biographie',
    categorie: 'saints',
    titre: 'Saint Jean-Marie Vianney, le curé d\'Ars — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Jean-Marie Vianney nait en 1786 pres de Lyon, dans une famille paysanne pieuse et nombreuse, en pleine periode revolutionnaire ou pratiquer sa foi expose a de reels dangers. Enfant, il assiste en secret a des messes clandestines celebrees par des pretres refractaires refusant de preter serment au regime revolutionnaire, ce qui marque profondement sa vocation naissante.\n\nSes debuts dans les etudes sont tres difficiles : peu instruit dans son enfance a cause du contexte revolutionnaire et des travaux des champs, il peine enormement en latin, matiere indispensable pour devenir pretre, au point de faillir abandonner ses etudes a plusieurs reprises. Il finit neanmoins par etre ordonne pretre en 1815, a vingt-neuf ans, un age tardif pour l'epoque.\n\nEn 1818, il est envoye comme cure dans le petit village d'Ars, alors reduit a quelques centaines d'habitants et reconnu pour son indifference religieuse. Vianney s'y installe pour n'en plus jamais repartir, y consacrant les quarante et un annees restantes de sa vie. Il restaure lui-meme l'eglise, aide financierement les plus pauvres, fonde un foyer pour recueillir des jeunes filles orphelines ou en difficulte, et transforme profondement la vie spirituelle de son village par sa seule presence et sa priere.\n\nC'est cependant au confessionnal qu'il devient celebre dans toute la France, puis au-dela. Des foules toujours plus nombreuses de penitents, parfois plusieurs milliers par semaine, viennent specialement a Ars pour se confesser a lui, au point qu'il passera jusqu'a seize ou dix-sept heures par jour dans ce petit espace, dormant a peine quelques heures. Il subit egalement, selon ses propres temoignages et ceux de son entourage, de tres nombreuses tentations et manifestations qu'il attribuait au demon, cherchant a le decourager de son ministere.\n\nEpuise par cette vie de don total, il meurt a Ars en 1859. Canonise en 1925 par le pape Pie XI, il est proclame en 1929 patron de tous les cures du monde, puis reconnu par le pape Benoit XVI comme patron de tous les pretres, sans distinction, a l'occasion d'une Annee sacerdotale dediee specialement a sa memoire en 2009-2010.",
    lienExterne: null,
  },
  {
    id: 'saint-dominique-biographie',
    categorie: 'saints',
    titre: 'Saint Dominique — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Dominique de Guzman nait vers 1170 a Caleruega, en Espagne, dans une famille noble castillane. Destine tres jeune a une carriere ecclesiastique, il etudie la theologie a Palencia, ou un episode marquant de sa jeunesse est rapporte par ses biographes : lors d'une grave famine, il aurait vendu ses propres livres d'etude, pourtant precieux et rares a l'epoque, pour nourrir des pauvres affames, declarant ne pas vouloir etudier sur des peaux mortes quand des hommes vivants mouraient de faim.\n\nDevenu chanoine puis pretre, Dominique accompagne son eveque dans un voyage a travers le sud de la France, alors profondement marque par la propagation de l'heresie cathare, un mouvement religieux dissident tres implante dans la region. Constatant que la simple predication officielle de l'Eglise, souvent percue comme trop riche et trop puissante, ne parvenait pas a convaincre une population attiree par la pauvrete affichee des precheurs cathares, Dominique choisit une strategie radicalement differente : precher lui-meme dans une pauvrete totale, a pied, sans moyens, pour incarner credibalement l'Evangile qu'il annoncait.\n\nCette conviction le conduit, en 1216, a fonder officiellement l'Ordre des Precheurs, approuve par le pape Honorius III, aujourd'hui connu sous le nom de Dominicains. Contrairement a de nombreux ordres monastiques anterieurs centres sur la vie cloitree, les Dominicains sont concus des l'origine pour une mission mobile de predication et d'enseignement, ce qui les conduira a jouer un role majeur dans le developpement des universites medievales.\n\nDominique meurt a Bologne, en Italie, en 1221, epuise par des annees de voyages et de predication constante a travers l'Europe. Canonise des 1234, a peine treize ans apres sa mort, il laisse un ordre qui donnera a l'Eglise certains de ses plus grands theologiens, dont saint Thomas d'Aquin quelques decennies plus tard. La tradition, bien que nuancee aujourd'hui par les historiens, lui attribue aussi un role dans les origines du chapelet, en lien avec une apparition mariale qu'il aurait recue.",
    lienExterne: null,
  },
  {
    id: 'saint-laurent-biographie',
    categorie: 'saints',
    titre: 'Saint Laurent — biographie complète',
    source: 'Sources : traditions anciennes de l\'Eglise de Rome, Nominis — verifie juillet 2026',
    texte: "Laurent est l'un des sept diacres de l'Eglise de Rome au milieu du IIIe siecle, sous le pontificat du pape Sixte II. A cette epoque, la fonction de diacre inclut notamment la responsabilite de gerer les biens materiels de l'Eglise et de les distribuer aux pauvres, aux veuves et aux orphelins de la communaute chretienne.\n\nEn aout 258, l'empereur romain Valerien declenche une nouvelle et severe persecution contre les chretiens, visant particulierement le clerge. Le pape Sixte II est arrete et execute avec plusieurs de ses diacres. Selon la tradition rapportee par les premiers historiens chretiens, Laurent, sachant sa propre arrestation imminente, aurait rapidement distribue aux pauvres tous les biens de l'Eglise dont il avait la charge, afin qu'ils ne tombent pas entre les mains des autorites romaines.\n\nLorsque le prefet de Rome lui ordonna de livrer les tresors de l'Eglise, Laurent aurait alors reuni les pauvres, les malades et les infirmes qu'il assistait quotidiennement et les aurait presentes au prefet en declarant que voila les veritables tresors de l'Eglise. Ce geste de defi lui valut d'etre condamne au martyre. La tradition, popularisee des les premiers siecles, rapporte qu'il aurait ete mis a mort sur un gril chauffe a blanc, et qu'il aurait meme plaisante face a ses bourreaux, leur demandant de le retourner car il etait suffisamment cuit d'un cote. Si l'authenticite precise de ce detail est discutee par les historiens modernes, elle temoigne en tout cas du courage et meme d'une forme d'humour attribues tres tot a ce martyr par la memoire chretienne.\n\nLe culte de saint Laurent s'est repandu tres rapidement et tres largement dans toute la chretiente des l'Antiquite, faisant de lui l'un des martyrs romains les plus veneres, avec une basilique construite en son honneur a Rome des le IVe siecle, toujours debout aujourd'hui.",
    lienExterne: null,
  },
  {
    id: 'sainte-claire-assise-biographie',
    categorie: 'saints',
    titre: "Sainte Claire d'Assise — biographie complète",
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Claire nait en 1194 a Assise, dans une famille noble italienne. Profondement marquee, adolescente, par la predication de Francois d'Assise, alors deja engage dans sa vie de pauvrete radicale, elle decide en 1212, a l'age de dix-huit ans, de fuir en secret le domicile familial la nuit du Dimanche des Rameaux pour rejoindre Francois et ses freres, malgre l'opposition previsible de sa famille qui esperait pour elle un mariage avantageux.\n\nFrancois lui-meme lui coupe les cheveux en signe de consecration et l'installe d'abord chez des religieuses benedictines, avant de lui trouver un lieu propre, la petite eglise de San Damiano a Assise, meme lieu ou Francois avait recu son propre appel spirituel des annees plus tot. Claire y fonde ce qui deviendra l'Ordre des Pauvres Dames, aujourd'hui appelees Clarisses, adoptant une regle de pauvrete encore plus stricte que celle des Franciscains masculins, ce qui lui vaudra de devoir se battre pendant des annees, y compris directement aupres de plusieurs papes successifs, pour obtenir le droit de vivre sans aucune possession, meme collective, un privilege alors juge trop radical pour un ordre feminin.\n\nElle dirigea sa communaute pendant plus de quarante ans depuis San Damiano, y compris durant de tres longues periodes de maladie grave qui l'immobiliserent alitee. La tradition rapporte un episode celebre survenu en 1240, lorsque des soldats musulmans au service de l'empereur Frederic II menacerent d'attaquer le monastere : Claire, trop malade pour se lever, se serait fait porter jusqu'a la porte avec le Saint-Sacrement expose, provoquant la retraite miraculeuse des assaillants.\n\nElle meurt en 1253, seulement deux jours apres avoir enfin recu du pape Innocent IV l'approbation definitive de sa regle de pauvrete absolue, redigee par elle-meme, une premiere pour une femme dans l'histoire de l'Eglise. Sa reputation de saintete etait telle qu'elle fut canonisee seulement deux ans apres sa mort, en 1255, par le pape Alexandre IV. Elle est aujourd'hui la sainte patronne de la television, en raison d'une vision qu'elle aurait eue, alors alitee, de la messe de Noel celebree loin d'elle dans la basilique d'Assise.",
    lienExterne: null,
  },
    {
    id: 'saint-thomas-aquin-biographie',
    categorie: 'saints',
    titre: "Saint Thomas d'Aquin — biographie complète",
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Thomas nait vers 1225 au chateau familial de Roccasecca, en Italie, dernier fils d'une famille noble apparentee aux plus grandes lignees d'Europe. Destine par sa famille a une brillante carriere ecclesiastique classique, peut-etre meme a devenir un jour abbe du prestigieux monastere du Mont-Cassin voisin, il choisit pourtant a l'adolescence de rejoindre l'ordre des Dominicains, alors tout recemment fonde et associe a une vie de pauvrete mendiante, ce qui provoque une reaction violente de sa famille.\n\nSes propres freres, sur ordre de leur mere, l'enlevent de force sur la route et le sequestrent pendant plus d'un an au chateau familial pour tenter de le faire renoncer a sa vocation, allant jusqu'a lui envoyer, selon la tradition, une femme chargee de le detourner de sa chastete. Thomas resiste a toutes ces tentatives et, une fois libere, part etudier a l'universite de Paris puis a Cologne, ou il devient l'eleve du grand theologien saint Albert le Grand.\n\nProfesseur a Paris, Thomas entreprend l'oeuvre de sa vie : mettre en dialogue la foi chretienne avec la philosophie d'Aristote, alors redecouverte en Occident et jugee par certains dangereuse pour la theologie. Sa Somme theologique, oeuvre monumentale et inachevee, cherche a organiser rationnellement l'ensemble de la doctrine chretienne, des preuves de l'existence de Dieu jusqu'aux questions morales les plus concretes.\n\nA la toute fin de sa vie, en 1273, lors d'une messe, Thomas connait une experience mystique si intense qu'il cesse totalement d'ecrire, declarant a son secretaire que tout ce qu'il avait redige jusque-la lui semblait de la paille comparee a ce qu'il venait de contempler. Il meurt quelques mois plus tard, en 1274, alors qu'il se rendait a un concile a Lyon sur ordre du pape.\n\nCanonise en 1323, proclame docteur de l'Eglise en 1567 et surnomme le docteur angelique, Thomas d'Aquin reste considere comme l'un des plus grands theologiens et philosophes de toute l'histoire chretienne, sa pensee continuant d'etre etudiee et enseignee dans les seminaires catholiques du monde entier.",
    lienExterne: null,
  },
  {
    id: 'sainte-catherine-sienne-biographie',
    categorie: 'saints',
    titre: 'Sainte Catherine de Sienne — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Catherine Benincasa nait en 1347 a Sienne, en Italie, vingt-quatrieme d'une famille de vingt-cinq enfants, fille d'un teinturier. Des l'age de sept ans, elle rapporte avoir eu une premiere vision du Christ qui la marque durablement et fait naitre en elle le desir d'une vie entierement consacree a Dieu, un choix que sa famille tente d'abord de contrarier en cherchant a la marier.\n\nA seize ans, elle rejoint le Tiers-Ordre dominicain, ce qui lui permet de vivre une vie religieuse intense tout en restant chez ses parents, sans entrer dans un couvent au sens strict. N'ayant recu quasiment aucune education formelle, elle apprend neanmoins a lire par elle-meme et dictera plus tard l'essentiel de ses ecrits, faute de savoir bien ecrire de sa propre main.\n\nCe qui distingue profondement Catherine de nombreuses mystiques de son epoque, c'est son engagement public et politique, rare pour une femme du XIVe siecle. Alors que la papaute, fragilisee, s'etait installee a Avignon depuis plusieurs decennies plutot qu'a Rome, Catherine multiplie les lettres pressantes, y compris directement adressees au pape Gregoire XI, pour le convaincre de revenir s'etablir a Rome, siege historique de la papaute. Elle se rend meme personnellement a Avignon en 1376 pour le rencontrer, et le pape finira par retourner a Rome l'annee suivante, un evenement dans lequel les historiens reconnaissent generalement une influence reelle de son insistance.\n\nElle meurt a Rome en 1380, seulement a trente-trois ans, epuisee par des jeunes extremes et une vie d'ascese intense. Ses lettres et son Dialogue, dicte a des secretaires durant ses extases mystiques, restent des textes majeurs de la spiritualite chretienne. Canonisee en 1461, proclamee docteur de l'Eglise en 1970 par Paul VI, elle est aujourd'hui, avec sainte Therese d'Avila, l'une des deux premieres femmes a avoir recu ce titre, et est co-patronne de l'Italie et de l'Europe entiere.",
    lienExterne: null,
  },
  {
    id: 'sainte-therese-avila-biographie',
    categorie: 'saints',
    titre: "Sainte Thérèse d'Avila — biographie complète",
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Therese de Cepeda y Ahumada nait en 1515 a Avila, en Espagne, dans une famille noble castillane. Adolescente rebelle et mondaine selon ses propres ecrits, elle entre pourtant au couvent des Carmelites d'Avila a vingt ans, un peu par crainte de l'enfer que par vocation profonde a ce moment-la, avant de connaitre progressivement une conversion interieure plus authentique au fil des annees suivantes.\n\nVers quarante ans, elle traverse une periode de crise spirituelle intense puis vit une serie d'experiences mystiques profondes, dont la celebre transverberation, un episode ou elle rapporte avoir senti son coeur transperce par une fleche de feu tenue par un ange, symbole de l'amour divin la traversant. Elle decrira cette experience et bien d'autres dans ses ecrits, notamment son autobiographie, Le Livre de la vie.\n\nConstatant un certain relachement dans la discipline des couvents carmelites de son temps, Therese entreprend une reforme profonde de son ordre, revenant a une regle plus austere et contemplative, fondant elle-meme dix-sept nouveaux monastères a travers toute l'Espagne malgre une opposition parfois violente de certains superieurs et meme des soupcons de l'Inquisition espagnole a son egard. Elle collabore etroitement dans cette reforme avec un jeune moine, saint Jean de la Croix, qu'elle convainc de reformer egalement la branche masculine du Carmel.\n\nElle laisse une oeuvre ecrite considerable, dont le celebre Chateau interieur, qui decrit l'ame comme un chateau aux multiples demeures que l'on traverse progressivement pour atteindre l'union intime avec Dieu au centre. Elle meurt en 1582, epuisee par ses voyages incessants a travers l'Espagne pour visiter ses fondations. Canonisee en 1622, elle devient en 1970 la toute premiere femme de l'histoire proclamee docteur de l'Eglise, par le pape Paul VI, aux cotes de sainte Catherine de Sienne.",
    lienExterne: null,
  },
  {
    id: 'saint-jean-croix-biographie',
    categorie: 'saints',
    titre: 'Saint Jean de la Croix — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Jean de Yepes nait en 1542 en Castille, en Espagne, dans une famille pauvre apres la mort prematuree de son pere. Malgre des debuts de vie tres difficiles, marques par la pauvrete, il recoit une education soignee grace a des institutions charitables, avant d'entrer chez les Carmelites a vingt et un ans, puis d'etre ordonne pretre.\n\nC'est sa rencontre avec Therese d'Avila, alors agee et deja engagee dans sa reforme du Carmel feminin, qui va bouleverser sa vie : elle le convainc de conduire la meme reforme, vers plus d'austerite et de vie contemplative, du cote des freres carmelites, donnant naissance a la branche dite des Carmes dechaux.\n\nCette reforme suscite une vive opposition parmi les carmelites restes fideles a l'ancienne regle plus douce. En 1577, Jean est enleve et emprisonne pendant neuf mois dans une cellule minuscule et sombre a Tolede par des freres de son propre ordre opposes a la reforme, subissant des chatiments corporels reguliers. C'est durant cette detention extremement penible qu'il compose de memoire, faute de papier au debut, certains de ses plus grands poemes mystiques, dont le celebre Cantique spirituel.\n\nApres son evasion spectaculaire, il continue son oeuvre de reforme et redige ses grands traites de theologie mystique, notamment La Nuit obscure de l'ame et La Montee du Carmel, qui decrivent le chemin de purification interieure, parfois tres douloureux, que l'ame doit traverser pour parvenir a une union totale avec Dieu. Ces oeuvres restent aujourd'hui parmi les sommets de la litterature mystique de toute l'histoire chretienne.\n\nIl meurt en 1591, a nouveau dans des circonstances difficiles, marginalise par certains de ses propres freres reformes. Canonise en 1726, il est proclame docteur de l'Eglise en 1926 par le pape Pie XI, reconnu comme l'un des plus grands mystiques et poetes spirituels de la tradition catholique.",
    lienExterne: null,
  },
  {
    id: 'saint-vincent-de-paul-biographie',
    categorie: 'saints',
    titre: 'Saint Vincent de Paul — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Vincent de Paul nait en 1581 dans une famille paysanne modeste du sud-ouest de la France. Ordonne pretre jeune, il traverse dans sa jeunesse une periode de vie assez ordinaire, cherchant meme, selon certains de ses biographes, a ameliorer sa situation materielle personnelle, avant qu'un tournant profond ne survienne dans les annees suivant son ordination.\n\nUn episode central de sa conversion interieure est sa rencontre, comme aumonier, avec des galeriens et des prisonniers dans des conditions de vie effroyables, qui le bouleverse profondement et oriente definitivement sa vocation vers le service des plus demunis. Il devient egalement precepteur puis aumonier dans de grandes familles nobles, ce qui lui donne acces a des ressources qu'il utilisera toute sa vie au service des pauvres.\n\nEn 1625, il fonde la Congregation de la Mission, dont les membres seront appeles Lazaristes, dediee a l'evangelisation des campagnes rurales alors souvent negligees par l'Eglise institutionnelle de l'epoque. Quelques annees plus tard, avec sainte Louise de Marillac, il fonde en 1633 les Filles de la Charite, une communaute revolutionnaire pour son temps : contrairement aux religieuses cloitrees habituelles, ces femmes sortent librement dans les rues pour soigner les malades, secourir les pauvres et recueillir les enfants abandonnes, sans jamais entrer dans un couvent au sens traditionnel.\n\nVincent de Paul organise egalement le secours aux victimes des guerres qui ravagent alors la France, aux enfants trouves abandonnes dans les rues de Paris, et aux populations affamees des provinces devastees. Il meurt a Paris en 1660, laissant derriere lui un reseau d'oeuvres caritatives considerable pour son epoque.\n\nCanonise en 1737, il est aujourd'hui le saint patron de toutes les oeuvres de charite chretiennes, et son nom reste attache dans le monde entier a de tres nombreuses associations caritatives, dont les celebres Conferences Saint-Vincent-de-Paul, actives aujourd'hui encore dans des dizaines de pays.",
    lienExterne: null,
  },
  {
    id: 'saint-jean-bosco-biographie',
    categorie: 'saints',
    titre: 'Saint Jean Bosco — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Jean Bosco nait en 1815 dans une famille paysanne tres pauvre du Piemont, dans le nord de l'Italie, et perd son pere alors qu'il n'a que deux ans. Enfant, il fait un reve marquant, qu'il racontera plus tard comme prophetique, ou il voit une foule d'enfants pauvres et livres a eux-memes qu'il doit conduire vers le bien, non par la force mais par la douceur et l'amitie.\n\nDevenu pretre en 1841, dans une ville de Turin alors en pleine revolution industrielle, il decouvre avec effroi la situation de milliers de jeunes garcons arrives des campagnes pour travailler dans les usines naissantes, souvent sans famille, sans logement stable, livres a la delinquance et a l'exploitation. Il commence par simplement rassembler ces jeunes le dimanche pour des jeux, un catechisme informel et un repas, avant de developper progressivement de veritables oratoires permanents.\n\nFace a l'ampleur des besoins, Bosco fonde des ateliers professionnels pour apprendre un metier a ces jeunes (cordonnerie, imprimerie, menuiserie), des internats pour les loger, et finalement, en 1859, une congregation religieuse dediee entierement a cette mission educative : les Salesiens de Don Bosco, nommes en hommage a saint Francois de Sales dont Bosco admirait la douceur pedagogique.\n\nSa methode educative, qu'il appelle lui-meme le systeme preventif, repose sur trois piliers revolutionnaires pour l'epoque : la raison plutot que la contrainte aveugle, la religion vecue joyeusement plutot qu'imposee severement, et surtout une affection sincere et manifeste envers chaque jeune, quelle que soit sa conduite passee. Cette approche contraste fortement avec l'education souvent tres severe et punitive de son temps.\n\nIl meurt a Turin en 1888, laissant une congregation deja bien etablie qui continuera de se developper massivement apres sa mort, aujourd'hui presente dans plus de cent trente pays a travers le monde, avec des ecoles, des centres de formation professionnelle et des oratoires pour la jeunesse defavorisee. Canonise en 1934, il est le saint patron des jeunes apprentis et de l'edition populaire chretienne.",
    lienExterne: null,
  },
    {
    id: 'saint-justin-biographie',
    categorie: 'saints',
    titre: 'Saint Justin, philosophe et martyr — biographie complète',
    source: 'Sources : audiences pontificales, Nominis — verifie juillet 2026',
    texte: "Justin nait vers l'an 100 en Palestine, dans une famille grecque paienne installee dans la region. Passionne des sa jeunesse par la philosophie, il explore successivement plusieurs grandes ecoles de pensee de son temps, cherchant en chacune une reponse satisfaisante au sens de la vie et a la nature de Dieu, sans jamais trouver de reponse pleinement convaincante.\n\nSa rencontre determinante survient sur le bord de mer, ou il croise, selon son propre recit, un vieillard mysterieux qui l'interroge sur ses certitudes philosophiques et lui parle des prophetes de l'Ancien Testament et de leur accomplissement dans le Christ. Justin decouvre alors, selon ses propres mots, ce qu'il appellera la veritable philosophie : le christianisme, qu'il embrasse et ne quittera plus.\n\nContrairement a beaucoup de convertis de son epoque, Justin ne renonce pas a son identite de philosophe : il continue a porter le manteau caracteristique des philosophes grecs et enseigne desormais le christianisme comme l'accomplissement de toute recherche philosophique authentique. Il s'installe a Rome et redige plusieurs Apologies, des textes adresses directement aux empereurs romains, dans lesquels il defend rationnellement la foi chretienne face aux accusations et calomnies qui circulaient alors contre les chretiens.\n\nSes ecrits constituent aujourd'hui l'une des sources les plus precieuses sur la vie et les pratiques des toutes premieres communautes chretiennes, notamment sur le deroulement de leurs celebrations eucharistiques. Denonce comme chretien, il est traduit devant le prefet de Rome Rusticus sous le regne de l'empereur Marc Aurele, se declare ouvertement chretien lors de son interrogatoire, et est condamne a mort par decapitation vers 165, avec plusieurs de ses disciples egalement arretes a ses cotes.",
    lienExterne: null,
  },
  {
    id: 'saint-charles-lwanga-biographie',
    categorie: 'saints',
    titre: "Saint Charles Lwanga et les martyrs de l'Ouganda — biographie complète",
    source: 'Sources : Vatican, Wikipedia — verifie juillet 2026',
    texte: "Charles Lwanga nait en 1860 dans le royaume du Buganda, sur le territoire de l'actuel Ouganda. Jeune homme, il devient page a la cour du roi Mwanga II, un souverain connu pour sa cruaute envers ses sujets, en particulier les jeunes pages places sous son autorite directe.\n\nDes missionnaires catholiques, les Peres Blancs, ainsi que des missionnaires anglicans, avaient commence a evangeliser la region quelques annees plus tot, avec un succes croissant parmi les jeunes de la cour royale. Le roi Mwanga, inquiet de cette influence chretienne grandissante sur son entourage et de la resistance nouvelle de certains pages a ses exigences, se met a persecuter violemment les convertis.\n\nEn novembre 1885, Joseph Mukasa, catechiste laic responsable des jeunes pages chretiens, est execute sur ordre du roi apres avoir ose lui reprocher un meurtre. Charles Lwanga, alors present, reprend immediatement sa charge et fait baptiser en urgence, la nuit meme, plusieurs autres pages menaces. Le lendemain, le roi apprend cette resistance collective et ordonne l'execution de tous les pages chretiens.\n\nCharles Lwanga et une vingtaine de ses compagnons, dont plusieurs adolescents, sont conduits a Namugongo ou ils sont brules vifs le 3 juin 1886, apres avoir refuse de renier leur foi malgre les menaces. Certains temoignages rapportent qu'ils priaient et chantaient jusqu'a leur dernier souffle. Loin d'affaiblir la jeune Eglise ougandaise, ce martyre collectif contribua au contraire a son developpement rapide dans les decennies suivantes, l'Ouganda devenant l'un des pays d'Afrique ou le christianisme s'est le plus solidement implante.\n\nBeatifies en 1920 par le pape Benoit XV, ils sont canonises ensemble le 18 octobre 1964 par le pape Paul VI, devenant les tout premiers saints canonises originaires d'Afrique subsaharienne.",
    lienExterne: null,
  },
  {
    id: 'saint-barnabe-biographie',
    categorie: 'saints',
    titre: 'Saint Barnabé, apôtre — biographie complète',
    source: 'Sources : Actes des Apotres, traditions anciennes — verifie juillet 2026',
    texte: "Joseph, surnomme Barnabe par les apotres (un nom qui signifierait fils de consolation ou d'encouragement), est un levite juif ne a Chypre, membre de la toute premiere communaute chretienne de Jerusalem decrite dans les Actes des Apotres. Le livre des Actes le presente comme un homme genereux, vendant un champ dont il possedait pour en remettre integralement le produit aux apotres au benefice de la communaute.\n\nSon role le plus decisif intervient lorsque Paul, apres sa conversion soudaine et spectaculaire sur le chemin de Damas, se rend a Jerusalem : les autres disciples, se souvenant de son passe de persecuteur des chretiens, se mefient profondement de lui et refusent de le recevoir. C'est Barnabe seul qui accepte de le presenter aux apotres et de garantir la sincerite de sa conversion, permettant ainsi a Paul d'etre integre a la communaute chretienne naissante.\n\nBarnabe accompagne ensuite Paul dans son tout premier grand voyage missionnaire a travers Chypre et l'Asie Mineure, jouant initialement le role de figure principale du duo, avant que Paul ne prenne progressivement l'ascendant au fil du recit des Actes. Les deux hommes finiront neanmoins par se separer suite a un desaccord sur l'opportunite d'emmener a nouveau un jeune disciple, Jean-Marc, dans un voyage ulterieur, Barnabe souhaitant lui donner une seconde chance que Paul refusait.\n\nBien qu'il ne fasse pas partie des Douze apotres choisis directement par Jesus durant sa vie terrestre, son role fondateur dans la diffusion de l'Evangile et dans l'integration de Paul lui vaut, des les tout premiers siecles chretiens, d'etre traditionnellement designe lui-meme comme apotre. La tradition rapporte qu'il aurait ete martyrise a Chypre, ile dont il est aujourd'hui le saint patron.",
    lienExterne: null,
  },
  {
    id: 'saint-antoine-padoue-biographie',
    categorie: 'saints',
    titre: 'Saint Antoine de Padoue — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Fernando de Bulhoes nait en 1195 a Lisbonne, au Portugal, dans une famille noble. Il rejoint d'abord les chanoines augustins avant de connaitre un tournant decisif en 1220, lorsqu'il assiste au retour des corps de cinq freres franciscains, missionnaires martyrises au Maroc. Profondement bouleverse par leur temoignage, il rejoint a son tour l'ordre tout recemment fonde par Francois d'Assise, prenant le nom d'Antoine.\n\nIl part lui-meme en mission au Maroc, mais tombe gravement malade des son arrivee et doit rentrer en Europe, son navire etant devie par une tempete jusqu'en Sicile. C'est alors, presque par hasard, que son talent exceptionnel pour la predication est decouvert : lors d'une ordination ou personne n'etait prepare a precher, Antoine, invite a improviser faute d'autre orateur disponible, revele une eloquence et une connaissance des Ecritures qui impressionnent immediatement l'assemblee.\n\nFrancois d'Assise lui-meme, informe de ce talent, le charge alors d'enseigner la theologie aux jeunes freres franciscains, une responsabilite rare a une epoque ou l'ordre se mefiait encore d'un savoir trop academique. Antoine devient rapidement l'un des plus grands predicateurs de son temps, attirant des foules immenses a travers l'Italie et le sud de la France, notamment lors de ses campagnes de predication contre les heresies alors repandues dans ces regions.\n\nEpuise par une vie de predication intense et de jeunes severes, il meurt en 1231 pres de Padoue, en Italie, a seulement trente-cinq ans. Sa canonisation intervient tres rapidement, des l'annee suivante en 1232, tant sa reputation de saintete etait deja largement reconnue de son vivant. Tres populaire aupres des fideles du monde entier, il est aujourd'hui invoque comme le saint patron des objets perdus, une devotion nee de recits ou des personnes auraient retrouve des objets egares apres l'avoir invoque.",
    lienExterne: null,
  },
  {
    id: 'saint-louis-gonzague-biographie',
    categorie: 'saints',
    titre: 'Saint Louis de Gonzague — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Louis de Gonzague nait en 1568 dans une famille noble et puissante d'Italie du Nord, destine des sa naissance a une carriere militaire et politique prestigieuse, son pere ayant meme obtenu pour lui, encore enfant, le droit de porter une petite armure et de participer symboliquement a des exercices militaires.\n\nDes son plus jeune age cependant, Louis manifeste une piete et une austerite personnelle inhabituelles pour un enfant de son rang, s'imposant lui-meme des jeunes et des privations. Adolescent, il annonce a sa famille son intention de renoncer entierement a son heritage et a son titre de succession pour rejoindre l'ordre des Jesuites, une decision qui provoque une vive opposition de son pere, qui esperait au contraire le voir reprendre les responsabilites familiales.\n\nApres plusieurs annees de resistance familiale, Louis finit par obtenir gain de cause et entre chez les Jesuites a Rome en 1585, renoncant formellement a tous ses droits d'heritage au profit de son jeune frere. Il poursuit alors des etudes de theologie tout en se distinguant par une vie de priere et d'humilite tres marquee, refusant tout traitement particulier malgre ses origines nobles.\n\nEn 1591, une grave epidemie de peste frappe Rome. Encore jeune religieux en formation, Louis se porte volontaire pour soigner les malades dans les hopitaux de la ville, un service alors extremement dangereux et souvent evite par crainte de contagion. Il contracte lui-meme la maladie au contact des malades qu'il assistait et meurt la meme annee, a seulement vingt-trois ans.\n\nCanonise en 1726, sa jeunesse et son don total de lui-meme au service des malades les plus contagieux en ont fait le saint patron de la jeunesse chretienne et des etudiants, une devotion tres repandue notamment dans les colleges et universites catholiques du monde entier.",
    lienExterne: null,
  },
  {
    id: 'saint-irenee-lyon-biographie',
    categorie: 'saints',
    titre: 'Saint Irénée de Lyon — biographie complète',
    source: 'Sources : audiences pontificales, Vatican News — verifie juillet 2026',
    texte: "Irenee nait vers 130 en Asie Mineure, dans l'actuelle Turquie. Enfant, il aurait ete le disciple direct de saint Polycarpe, eveque de Smyrne, lui-meme disciple de l'apotre Jean selon la tradition, ce qui fait d'Irenee un maillon precieux et rare reliant directement les toutes premieres generations chretiennes aux temoins de la vie de Jesus.\n\nIrenee s'installe ensuite a Lyon, en Gaule romaine, ou une importante communaute chretienne s'etait deja formee. Il y devient pretre, puis, apres le martyre de l'eveque de la ville lors d'une severe persecution en 177, il lui succede comme second eveque de Lyon.\n\nSon oeuvre majeure, redigee en grec sous le titre Contre les heresies, constitue une refutation systematique et detaillee du gnosticisme, un ensemble de doctrines alors tres repandues qui menacaient l'unite de la foi chretienne en melangeant elements chretiens et speculations philosophiques etrangeres a l'Evangile. Ce texte reste aujourd'hui l'une des sources historiques les plus precieuses sur la diversite des courants religieux du IIe siecle et sur la formation progressive du canon des Ecritures chretiennes.\n\nIrenee joua egalement un role important de mediateur et de pacificateur au sein de l'Eglise de son temps, intervenant notamment aupres du pape Victor Ier pour eviter une rupture grave entre l'Eglise de Rome et les Eglises d'Orient au sujet de la date de celebration de Paques, ce qui lui vaut d'etre aussi surnomme l'apotre de la paix.\n\nLes circonstances precises de sa mort restent incertaines, situee vers l'an 202, possiblement lors d'une nouvelle vague de persecution a Lyon. Reconnu docteur de l'Eglise par le pape Francois en 2022, pres de dix-huit siecles apres sa mort, il est aujourd'hui considere comme l'un des tout premiers grands theologiens systematiques du christianisme.",
    lienExterne: null,
  },
  {
    id: 'augustin-confessions',
    categorie: 'classiques',
    titre: 'Les Confessions de saint Augustin',
    source: 'Domaine public — Christian Classics Ethereal Library (ccel.org)',
    texte: "Ecrites vers 397-400, les Confessions de saint Augustin sont considerees comme l'une des toutes premieres autobiographies spirituelles de l'histoire occidentale. Augustin y raconte sans complaisance sa jeunesse dissipee, ses annees d'errance intellectuelle, puis sa conversion bouleversante au christianisme, en grande partie grace aux prieres inlassables de sa mere, sainte Monique.\n\nL'ouvrage se termine par une longue meditation sur la creation et le sens du temps, mais c'est surtout sa premiere partie, le recit intime d'un homme en quete de verite, qui continue de toucher des lecteurs de toutes les generations.",
    lienExterne: 'https://ccel.org/ccel/augustine/confessions',
  },
];

export default function BibliothequePage() {
  const [categorie, setCategorie] = useState('actualites');
  const [articleOuvert, setArticleOuvert] = useState(null);
  const [recherche, setRecherche] = useState('');

  const filtres = ARTICLES
    .filter(function(a) { return a.categorie === categorie; })
    .filter(function(a) {
      if (!recherche.trim()) return true;
      const q = recherche.toLowerCase();
      return a.titre.toLowerCase().includes(q) || a.texte.toLowerCase().includes(q);
    })
    .sort(function(a, b) {
      if (!a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    });

  return (
    <AppShell>
      <div style={{ background: CREME, minHeight: '100vh' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e4e4e7', padding: '16px 16px 0', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>📚</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: VERT }}>Bibliothèque & News</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#71717A' }}>Textes et actualités authentiques, sources vérifiées</p>
            </div>
          </div>
          <input value={recherche} onChange={function(e) { setRecherche(e.target.value); }} placeholder="Rechercher un article..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e4e4e7', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
            {CATEGORIES.map(function(cat) {
              return (
                <button key={cat.id} onClick={function() { setCategorie(cat.id); setArticleOuvert(null); }} style={{
                  flex: '0 0 auto', padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                  background: categorie === cat.id ? VERT : '#fff',
                  color: categorie === cat.id ? OR : '#555',
                  fontWeight: categorie === cat.id ? 700 : 500,
                  fontSize: 12, whiteSpace: 'nowrap',
                  border: '1px solid ' + (categorie === cat.id ? VERT : '#e4e4e7'),
                }}>
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {filtres.length === 0 && (
            <p style={{ textAlign: 'center', color: '#71717A', fontSize: 13, marginTop: 40 }}>Aucun contenu pour l'instant dans cette categorie.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtres.map(function(a) {
              const ouvert = articleOuvert === a.id;
              return (
                <div key={a.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16 }}>
                  <div onClick={function() { setArticleOuvert(ouvert ? null : a.id); }} style={{ cursor: 'pointer' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: VERT, lineHeight: 1.3 }}>{a.titre}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#8B6020', fontStyle: 'italic' }}>{a.source}</p>
                  </div>
                  {ouvert && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{a.texte}</p>
                      {a.lienExterne && (
                        <a href={a.lienExterne} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', borderRadius: 10, background: VERT, color: OR, fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                          Continuer la lecture ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ height: 80 }} />
        </div>
      </div>
    </AppShell>
  );
}
