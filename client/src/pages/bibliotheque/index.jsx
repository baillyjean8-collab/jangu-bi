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
    id: 'ignace-exercices',
    categorie: 'classiques',
    titre: 'Les Exercices spirituels de saint Ignace de Loyola',
    source: 'Domaine public — Christian Classics Ethereal Library (ccel.org)',
    texte: "Rediges par saint Ignace de Loyola au XVIe siecle, les Exercices spirituels sont nes de sa propre experience de conversion apres sa blessure de guerre en 1521. Ce petit livre n'est pas destine a etre simplement lu, mais pratique : il propose un parcours de priere en quatre etapes, appelees semaines, pour aider une personne a discerner la volonte de Dieu dans sa vie et a se detacher de ce qui l'eloigne de lui.\n\nCe texte est devenu la base de la formation spirituelle de tous les Jesuites a travers le monde, et reste aujourd'hui propose sous forme de retraites a des laics de toutes conditions, bien au-dela de la seule Compagnie de Jesus.",
    lienExterne: 'https://ccel.org/ccel/ignatius/exercises',
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
