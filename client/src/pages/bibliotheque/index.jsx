import { useState } from 'react';
import { AppShell } from '../../components/layout';

const VERT = '#1e2d14';
const OR = '#c8a84b';
const CREME = '#f5f3ee';

const CATEGORIES = [
  { id: 'actualites', label: 'Actualités', icon: '📰' },
  { id: 'senegal', label: 'Sénégal', icon: '🇸🇳' },
  { id: 'vatican', label: 'Vatican', icon: '⛪' },
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
    id: 'catechisme-extrait',
    categorie: 'vatican',
    titre: "Le Catéchisme de l'Église Catholique — sa structure et son contenu complet",
    source: "Source : Catechisme de l'Eglise Catholique, Libreria Editrice Vaticana, 1992",
    texte: "Le Catechisme de l'Eglise Catholique fut publie en 1992 sous le pontificat de Jean-Paul II, apres six annees de travail confiees a une commission de cardinaux et d'eveques presidee par le cardinal Joseph Ratzinger, futur pape Benoit XVI. Son objectif etait de rassembler en un seul ouvrage de reference l'ensemble de l'enseignement catholique, redige de maniere organique et accessible a tous les baptises, pretres comme laics.\n\nL'ouvrage repose sur quatre grandes parties, appelees traditionnellement les quatre piliers de la foi.\n\nLa premiere partie expose la profession de foi, c'est-a-dire le Credo, article par article : la foi en un seul Dieu Pere, Fils et Saint-Esprit, la creation du monde et de l'homme, la chute et le peche originel, l'Incarnation du Christ, sa mort et sa Resurrection, l'Eglise, la communion des saints et la vie eternelle.\n\nLa deuxieme partie est consacree a la celebration du mystere chretien, c'est-a-dire la liturgie et les sept sacrements : le bapteme, la confirmation, l'eucharistie, la penitence et reconciliation, l'onction des malades, l'ordre et le mariage. Chaque sacrement y est explique dans son origine biblique, sa signification spirituelle et son deroulement concret.\n\nLa troisieme partie traite de la vie dans le Christ, c'est-a-dire la morale chretienne : la dignite de la personne humaine, la liberte, la conscience, les vertus, le peche, puis un commentaire detaille des Dix Commandements, un par un, applique a la vie quotidienne.\n\nLa quatrieme et derniere partie est entierement dediee a la priere chretienne, avec un commentaire approfondi, phrase par phrase, du Notre Pere, la priere que Jesus lui-meme a enseignee a ses disciples.\n\nLe tout premier paragraphe du Catechisme resume l'esprit de l'ensemble : Dieu, infiniment parfait et bienheureux en lui-meme, a cree l'homme, dans un dessein de pure bonte, pour le faire participer a sa propre vie bienheureuse. C'est pourquoi, en tout temps et en tout lieu, Dieu se rend proche de l'homme. Il l'appelle et l'aide a le chercher, a le connaitre et a l'aimer de toutes ses forces. Il convoque tous les hommes, disperses par le peche, a l'unite de sa famille, l'Eglise. Pour cela, en la plenitude des temps, il a envoye son Fils comme Redempteur et Sauveur. En lui et par lui, Dieu appelle les hommes a devenir, dans l'Esprit Saint, ses fils adoptifs et, par consequent, les heritiers de sa vie bienheureuse.\n\nLe texte integral du Catechisme, avec ses 2865 paragraphes numerotes, est consultable librement sur le site officiel du Vatican, dans le lien ci-dessous.",
    lienExterne: 'https://www.vatican.va/archive/FRA0013/_INDEX.HTM',
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
