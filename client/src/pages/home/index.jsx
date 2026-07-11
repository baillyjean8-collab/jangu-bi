import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { contientMotInterdit, sauvegarderAvertissement, compteRestreint, messageRestriction } from '../../utils/jb-filtre';
const BOGOLAN = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.05) 8px,rgba(200,168,75,0.05) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.05) 8px,rgba(200,168,75,0.05) 9px)';


// ── Filtre de langage irrespectueux (multilingue) ──────────────────────────────
const BANNED_WORDS = [
  'connard','connasse','salope','pute','putain','enculé','enculee','batard','batarde',
  'merde','con','conne','débile','imbécile','crétin','abruti','idiot','stupide',
  'ferme ta gueule','ta gueule','va te faire','nique','niquer','enfoiré',
  'fuck','shit','bitch','asshole','bastard','dumbass','retard',
  'dof','wakhul dara','xale bu bon','jigéen bu bon','rabb',
  'fuck god','fuck jesus','fuck church','va au diable',
  'je vais te tuer','je te tue','crève','va crever','va mourir',
];
function detecterLangageInapproprie(texte) {
  const t = texte.toLowerCase();
  return BANNED_WORDS.some(mot => t.includes(mot));
}

const VERSET = {
  texte: '« Beaucoup viendront de l’orient et de l’occident et prendront place avec Abraham, Isaac et Jacob »',
  ref: 'Mt 8, 5-17',
};

// Paroisses avec info story (hasStory = story active dans les 24h)
const PAROISSES = [
  { id: 'sj', initiales: 'SJ', nom: 'St-Joseph', bg: '#6B7B5A', hasStory: true,  storyText: 'Messe dominicale ce dimanche a 9h' },
  { id: 'sc', initiales: 'SC', nom: 'Sacre-Coeur', bg: '#2E5C3E', hasStory: true,  storyText: 'Adoration eucharistique ce soir 18h' },
  { id: 'nd', initiales: 'ND', nom: 'N-D Dakar', bg: '#3A5A2A', hasStory: false, storyText: '' },
];

// Posts enrichis avec type: 'normal' | 'media' | 'inscription' | 'don'
const POSTS = [
  {
    type: 'media',
    initiales: 'SJ', bg: '#6B7B5A', paroisse: 'St-Joseph — Dakar', temps: 'Il y a 1h',
    texte: 'Veillee de priere mariale ce vendredi a 19h30, suivie d’une procession aux flambeaux.',
    mediaTitle: 'Veillee Mariale', mediaSub: 'Vendredi 19h30',
    likes: 36, comments: 7, commentsList: [],
  },
  {
    type: 'inscription',
    initiales: 'SC', bg: '#0D3B2E', paroisse: 'Sacre-Coeur — Thies', temps: 'Il y a 4h',
    texte: 'Catechese 2026 — inscriptions ouvertes. Places limitees pour les enfants de 7 a 12 ans.',
    actionLabel: 'S’inscrire', actionIcon: 'ti-edit',
    likes: 41, comments: 12, commentsList: [],
  },
  {
    type: 'don',
    initiales: '', bg: '#1e2d14', paroisse: 'Saint-Pierre — Dakar', temps: 'Collecte de dons',
    titre: 'Restauration eglise Saint-Pierre',
    raised: 9750000, goal: 15000000, urgent: true,
    likes: 248,
  },
  {
    type: 'normal',
    initiales: 'SC', bg: '#2E5C3E', paroisse: 'Sacre-Coeur — Thies', temps: 'Il y a 5h',
    texte: 'Les inscriptions au catechisme 2026 sont ouvertes. Renseignez-vous au secretariat.',
    likes: 18, comments: 3, commentsList: [],
  },
];

function fmt(n) {
  return new Intl.NumberFormat('fr-FR').format(n);
}


function formatTempsPost(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const h   = Math.floor(diff / 3600000);
  const j   = Math.floor(diff / 86400000);
  if (j > 0) return 'Il y a ' + j + 'j';
  if (h > 0) return 'Il y a ' + h + 'h';
  if (min > 0) return 'Il y a ' + min + ' min';
  return 'À l’instant';
}
export default function HomePage() {

  // ── Chargement des vraies publications ───────────────────
  useEffect(() => {
    async function loadPosts() {
      try {
        const { postsApi } = await import('../../services/api');
        const data = await postsApi.getAll({ limit: 20 });
        if (data && data.data) {
          const items = Array.isArray(data.data) ? data.data : (data.data.items || data.data.data || []);
          if (items.length > 0) {
            // Transformer les posts backend en format attendu par le composant
            // Les vraies publications sont affichees via le meme rendu que les
            // publications 'normal' (texte simple) : les champs riches
            // (media, don avec barre de progression) n'existent pas encore
            // sur les vraies publications recuperees depuis l'API.
            const formatted = items.map(p => ({
              type: 'normal',
              initiales: p.parishId && p.parishId.name ? p.parishId.name.substring(0,2).toUpperCase() : 'SC',
              bg: '#2E5C3E',
              paroisse: p.parishId && p.parishId.name ? p.parishId.name : 'Paroisse',
              temps: formatTempsPost(p.createdAt),
              texte: p.content || p.text || '',
              image: p.image || p.imageUrl || (p.images && p.images[0]) || '',
              likes: p.likes ? p.likes.length : 0,
              comments: p.comments ? p.comments.length : 0,
              commentsList: [],
            }));
            setPostsState(formatted);
          }
        }
      } catch(e) {
        console.log('Posts API:', e.message);
      }
    }
    loadPosts();
  }, []);

  const [realStories, setRealStories] = useState([]);
  useEffect(() => {
    async function loadStories() {
      try {
        const { storiesApi } = await import('../../services/api');
        const data = await storiesApi.getAll();
        const list = data && data.data && Array.isArray(data.data.stories) ? data.data.stories : [];
        setRealStories(list);
      } catch(e) {
        console.log('Stories API:', e.message);
      }
    }
    loadStories();
  }, []);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState({});
  const [avertissement, setAvertissement] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storyViewer, setStoryViewer] = useState(null); // index de la story en cours
  const storyTimerRef = useRef(null);
  const [postsState, setPostsState] = useState(() => POSTS.map(p => ({ ...p, commentsList: [] })));
  const [visibleCount, setVisibleCount] = useState(10);
  const [openComments, setOpenComments] = useState(null); // index du post dont les commentaires sont ouverts
  const [avertissementCommentaire, setAvertissementCommentaire] = useState('');
  const [compteurAvertissements, setCompteurAvertissements] = useState(0);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentError, setCommentError] = useState('');
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const recordTimeoutRef = useRef(null);

  const prenom = user?.firstName || 'Marie';
  const nom = user?.lastName || 'Diallo';
  const initiales = ((user?.firstName?.[0] || 'M') + (user?.lastName?.[0] || 'D')).toUpperCase();
  const photo = user?.profilePhoto || null;
  const faithDays = user?.faithDays ?? 34;
  const isAdmin = user?.role === 'parish_admin' || user?.role === 'super_admin';
  function estMaParoisse(p) {
    const nomParoisse = user?.parish?.name;
    if (!nomParoisse) return false;
    const a = p.nom.toLowerCase();
    const b = nomParoisse.toLowerCase();
    return a.includes(b) || b.includes(a);
  }

  function toggleLike(i) {
    setLiked(l => ({ ...l, [i]: !l[i] }));
  }

  function toggleCommentaires(i) {
    setOpenComments(prev => prev === i ? null : i);
    setCommentDraft('');
    setCommentError('');
    stopRecording();
  }

  function publierCommentaire() {
  // ── Filtre anti-mots-interdits (module partagé) ──
  if (compteRestreint()) {
    setAvertissement('🚫 Votre compte est restreint. Commentaires suspendus.');
    setTimeout(() => setAvertissement(''), 6000);
    return;
  }
  if (contientMotInterdit(commentDraft)) {
    const nvx = sauvegarderAvertissement(commentDraft);
    setAvertissement(messageRestriction(nvx));
    setTimeout(() => setAvertissement(''), 6000);
    return;
  }
  setAvertissement('');

    const texte = commentDraft.trim();
    if (!texte) return;
    if (detecterLangageInapproprie(texte)) {
      setCommentError('Votre message enfreint nos règles de respect et de bienveillance. Merci de reformuler dans un esprit fraternel.');
      return;
    }
    setPostsState(prev => prev.map((p, idx) => {
      if (idx !== openComments) return p;
      const newComment = {
        id: Date.now(),
        auteur: 'Marie Diallo',
        initiales: 'MD',
        texte,
        temps: 'À l\'instant',
      };
      return { ...p, commentsList: [...(p.commentsList || []), newComment], comments: (p.comments || 0) + 1 };
    }));
    setCommentDraft('');
    setCommentError('');
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setCommentError('La dictée vocale n\'est pas disponible sur ce navigateur.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCommentDraft(transcript.slice(0, 500));
    };
    recognition.onerror = () => stopRecording();
    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
    // Limite de 30 secondes pour eviter les dictees a rallonge
    recordTimeoutRef.current = setTimeout(() => stopRecording(), 30000);
  }

  function stopRecording() {
    clearTimeout(recordTimeoutRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
  }

  function matchesSearch(post, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    const haystack = [post.paroisse, post.texte, post.titre, post.mediaTitle].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  }

  const storiesWithContent = realStories.map(s => ({
    id: s._id,
    initiales: s.parishId && s.parishId.name ? s.parishId.name.substring(0,2).toUpperCase() : 'PA',
    nom: s.parishId && s.parishId.name ? s.parishId.name : 'Paroisse',
    bg: '#2E5C3E',
    storyText: s.caption || '',
    imageUrl: s.imageUrl,
  }));

  function openStory(parishId) {
    const idx = storiesWithContent.findIndex(p => p.id === parishId);
    if (idx === -1) return;
    setStoryViewer(idx);
    startStoryTimer(idx);
  }

  function startStoryTimer(idx) {
    clearTimeout(storyTimerRef.current);
    storyTimerRef.current = setTimeout(() => {
      if (idx + 1 < storiesWithContent.length) {
        setStoryViewer(idx + 1);
        startStoryTimer(idx + 1);
      } else {
        closeStory();
      }
    }, 4000);
  }

  function closeStory() {
    clearTimeout(storyTimerRef.current);
    setStoryViewer(null);
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: '#F5F0E8', backgroundImage: BOGOLAN }}>

        {/* HEADER */}
        <div style={{ background: '#F5F0E8', backgroundImage: BOGOLAN, padding: '30px 16px 0' }}>

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 900, color: '#1e2d14', letterSpacing: '.05em' }}>
              JANGU <span style={{ color: '#C8A84B' }}>BI</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div onClick={() => navigate('/create')} style={{ width: 32, height: 32, borderRadius: '50%', background: '#0D3B2E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-plus" style={{ fontSize: 16, color: 'white' }} />
              </div>
              <div onClick={() => setSearchOpen(o => !o)} style={{ width: 32, height: 32, borderRadius: '50%', background: searchOpen ? '#1e2d14' : 'rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-search" style={{ fontSize: 16, color: searchOpen ? '#C8A84B' : '#666' }} />
              </div>
              <div onClick={() => navigate('/notifications')} style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-bell" style={{ fontSize: 16, color: '#666' }} />
                <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#e53935', border: '1.5px solid #F5F0E8' }} />
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          {searchOpen && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #C8A84B', borderRadius: 12, padding: '9px 12px' }}>
                <i className="ti ti-search" style={{ fontSize: 15, color: '#999' }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Rechercher une paroisse, une publication..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 12, background: 'none' }}
                />
                <i onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="ti ti-x" style={{ fontSize: 15, color: '#999', cursor: 'pointer' }} />
              </div>
            </div>
          )}

          {/* Salutation + Photo profil synchronisee */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 24, fontWeight: 700, color: '#1e2d14', marginBottom: 2 }}>{isAdmin && user?.parish?.name ? user.parish.name : prenom + ' ' + nom}</div>
              <div style={{ fontSize: 13, color: '#7A6E5E', fontStyle: 'italic' }}>Que la paix soit avec vous 🙏</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 12 }}>
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => navigate('/profile')}
                  style={{ width: 50, height: 50, borderRadius: '50%', background: photo ? 'transparent' : 'linear-gradient(135deg,#C8A84B,#8B7030)', border: '2.5px solid rgba(200,168,75,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: '#1e2d14', boxShadow: '0 2px 10px rgba(200,168,75,.2)', cursor: 'pointer', overflow: 'hidden' }}
                >
                  {photo
                    ? <img src={photo} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initiales
                  }
                </div>
                <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#4ADE80', border: '2px solid #F5F0E8' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 10 }}>🕯️</span>
                <span style={{ fontSize: 8, color: '#C8A84B', fontWeight: 700 }}>{faithDays}J</span>
              </div>
            </div>
          </div>

          {/* Verset du jour — noir bogolan */}
          <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, borderRadius: 16, padding: '14px 16px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,168,75,.1),transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ background: '#C8A84B', borderRadius: 20, padding: '3px 10px', display: 'inline-block', fontSize: 9, fontWeight: 700, color: '#0C0A06', letterSpacing: '.08em', marginBottom: 10 }}>VERSET DU JOUR</div>
              <div style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontSize: 13, color: '#F5EFE4', lineHeight: 1.65, marginBottom: 8 }}>{VERSET.texte}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C8A84B' }}>{VERSET.ref}</div>
                <div onClick={() => {
                  const m = VERSET.ref.match(/^(S+)s+(d+)/);
                  if (m) navigate('/bible?livre=' + m[1] + '&chapitre=' + m[2]);
                  else navigate('/bible');
                }} style={{ fontSize: 11, color: 'rgba(245,239,228,.5)', cursor: 'pointer' }}>Lire le chapitre →</div>
              </div>
            </div>
          </div>

          {/* Paroisses fusionnees avec Stories (format Facebook pour celles avec story active) */}
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e2d14', marginBottom: 10, fontFamily: 'Georgia,serif' }}>Vos Paroisses</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {storiesWithContent.map((s, i) => (
              <div
                key={s.id}
                onClick={() => { setStoryViewer(i); startStoryTimer(i); }}
                style={{
                  position: 'relative', width: 78, height: 108, borderRadius: 14, overflow: 'hidden',
                  flexShrink: 0, cursor: 'pointer', border: '2px solid #C8A84B',
                  backgroundImage: 'url(' + s.imageUrl + ')', backgroundSize: 'cover', backgroundPosition: 'center',
                }}
              >
                <div style={{
                  position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: '50%',
                  border: '2px solid #C8A84B', background: '#1e2d14', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 700,
                }}>{s.initiales}</div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '18px 6px 6px',
                }}>
                  <div style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>{s.nom}</div>
                </div>
              </div>
            ))}
            {PAROISSES.map((p) => (
              p.hasStory ? (
                <div
                  key={p.id}
                  onClick={() => openStory(p.id)}
                  style={{
                    position: 'relative', width: 78, height: 108, borderRadius: 14, overflow: 'hidden',
                    flexShrink: 0, cursor: 'pointer', border: '2px solid #C8A84B',
                    background: `linear-gradient(160deg, ${p.bg}, #0C0A06)`,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: '50%',
                    border: '2px solid #C8A84B', background: '#1e2d14', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 700,
                  }}>{p.initiales}</div>
                  {isAdmin && estMaParoisse(p) && (
                    <div onClick={function(e) { e.stopPropagation(); navigate('/create'); }} style={{
                      position: 'absolute', bottom: 6, right: 6, width: 20, height: 20, borderRadius: '50%',
                      background: '#C8A84B', border: '2px solid white', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
                    }}>
                      <i className="ti ti-plus" style={{ fontSize: 11, color: '#1e2d14' }} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '18px 6px 6px',
                  }}>
                    <div style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>{p.nom}</div>
                  </div>
                </div>
              ) : (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 78, flexShrink: 0, cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', border: '2.5px solid #F5F0E8', boxShadow: '0 2px 6px rgba(0,0,0,.1)' }}>{p.initiales}</div>
                  <span style={{ fontSize: 9, color: '#7A6E5E', marginTop: 5, whiteSpace: 'nowrap' }}>{p.nom}</span>
                </div>
              )
            ))}
            <div onClick={() => navigate('/parishes')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 78, flexShrink: 0, cursor: 'pointer' }}>
              <div onClick={() => navigate('/demandes')} style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px dashed rgba(200,168,75,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#C8A84B' }}>+</div>
              <span style={{ fontSize: 9, color: '#C8A84B', marginTop: 5 }}>Ajouter</span>
            </div>
          </div>

          {/* Actions rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div onClick={() => navigate('/donate')} style={{ background: 'white', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(26,20,16,.06)', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🎁</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2d14' }}>Faire un don</div>
            </div>
            <div onClick={() => navigate('/catechese?tab=prieres&office=auto')} style={{ background: 'white', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(26,20,16,.06)', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#F0F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🌿</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2d14' }}>Priere du jour</div>
                <div style={{ fontSize: 10, color: '#7A6E5E' }}>{(() => {
                  const h = new Date().getHours();
                  if (h >= 21) return 'Complies — nuit';
                  if (h >= 18) return 'Vepres — soir';
                  if (h >= 15) return 'None — apres-midi';
                  if (h >= 12) return 'Sexte — midi';
                  if (h >= 9) return 'Tierce — matinee';
                  if (h >= 6) return 'Laudes — matin';
                  return 'Vigiles — nuit';
                })()}</div>
              </div>
            </div>
          </div>

        </div>

        {isAdmin && (
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <div onClick={function() { navigate('/create'); }} style={{
              background: 'white', border: '1.5px solid #C8A84B', borderRadius: 12, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#C8A84B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#1e2d14', fontWeight: 700, flexShrink: 0 }}>
                {initiales}
              </div>
              <div style={{ flex: 1, fontSize: 11, color: '#8a8a7c' }}>
                Publier une actualite{user?.parish?.name ? ' pour ' + user.parish.name : ''}...
              </div>
              <i className="ti ti-photo" style={{ fontSize: 15, color: '#8B6020' }} />
            </div>
          </div>
        )}

        {/* FIL DE PUBLICATIONS */}
        <div style={{ padding: '0 16px', paddingBottom: 90, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {postsState.filter(post => matchesSearch(post, searchQuery)).map((post, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 14, overflow: 'hidden',
              border: post.urgent ? '1.5px solid #C8A84B' : '1px solid #e4e4e7',
            }}>
              {/* Header post */}
              <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', gap: 9 }}>
                {post.type === 'don' ? (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #C8A84B', background: '#1e2d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth="1.5"><path d="M12 2L4 8v13h16V8l-8-6z" /><path d="M9 21v-7h6v7" /></svg>
                  </div>
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: post.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>{post.initiales}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2d14' }}>{post.paroisse}</div>
                  <div style={{ fontSize: 9, color: '#999' }}>{post.temps}</div>
                </div>
                {post.type === 'inscription' && (
                  <span style={{ fontSize: 8, background: '#0D3B2E', color: '#C8A84B', borderRadius: 10, padding: '3px 8px', fontWeight: 700 }}>INSCRIPTION</span>
                )}
                {post.urgent && (
                  <span style={{ fontSize: 8, background: '#e53935', color: 'white', borderRadius: 10, padding: '3px 8px', fontWeight: 700 }}>URGENT</span>
                )}
              </div>

              {/* Corps du post selon type */}
              {post.type === 'media' && (
                <>
                  <div style={{ padding: '0 12px 10px', fontSize: 12, color: '#3a3a3a', lineHeight: 1.5 }}>{post.texte}</div>
                  <div style={{ position: 'relative', height: 170, background: `linear-gradient(160deg, #1e2d14, #0C0A06)` }}>
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 360 170">
                      <circle cx="180" cy="85" r="46" fill="none" stroke="#C8A84B" strokeWidth="1" />
                      <path d="M180 48 L180 122 M152 85 L208 85" stroke="#C8A84B" strokeWidth="1.5" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: '#C8A84B' }}>{post.mediaTitle}</div>
                      <div style={{ fontSize: 10, color: 'rgba(245,239,228,.7)', marginTop: 3 }}>{post.mediaSub}</div>
                    </div>
                  </div>
                </>
              )}

              {post.type === 'inscription' && (
                <>
                  <div style={{ padding: '0 12px 10px', fontSize: 12, color: '#3a3a3a', lineHeight: 1.5 }}>{post.texte}</div>
                  <div style={{ padding: '0 12px 10px' }}>
                    <button onClick={() => navigate('/demandes')} style={{
                      width: '100%', padding: 9, background: 'linear-gradient(135deg,#C8A84B,#8B6020)',
                      border: 'none', borderRadius: 18, color: '#1e2d14', fontWeight: 700, fontSize: 11,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <i className={post.actionIcon} style={{ fontSize: 13 }} /> {post.actionLabel}
                    </button>
                  </div>
                </>
              )}

              {post.type === 'don' && (
                <div style={{ padding: '0 12px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2d14', marginBottom: 6, fontFamily: 'Georgia,serif' }}>{post.titre}</div>
                  <div style={{ height: 5, background: '#f0ece4', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${Math.min(100, Math.round((post.raised / post.goal) * 100))}%`, height: '100%', background: 'linear-gradient(to right,#8B6020,#C8A84B)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginBottom: 8 }}>
                    <span style={{ color: '#1e2d14', fontWeight: 700 }}>{fmt(post.raised)} FCFA</span>
                    <span>sur {fmt(post.goal)}</span>
                  </div>
                  <button onClick={() => navigate('/donate')} style={{
                    width: '100%', padding: 9, background: 'linear-gradient(135deg,#C8A84B,#8B6020)',
                    border: 'none', borderRadius: 18, color: '#1e2d14', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  }}>Faire un don ✦</button>
                </div>
              )}

              {post.type === 'normal' && (
                <div style={{ padding: '0 12px 10px', fontSize: 12, color: '#3a3a3a', lineHeight: 1.5 }}>{post.texte}</div>
              )}
              {post.image && (
                <img src={post.image} alt="publication" style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }} />
              )}

              {/* Actions bas de carte */}
              <div style={{ display: 'flex', gap: 14, padding: '8px 12px', borderTop: '1px solid #f0ece4', fontSize: 11, color: '#666' }}>
                <span onClick={() => toggleLike(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: liked[i] ? '#C8A84B' : '#666' }}>
                  <i className={liked[i] ? 'ti ti-heart-filled' : 'ti ti-heart'} style={{ fontSize: 13 }} /> {post.likes + (liked[i] ? 1 : 0)}
                </span>
                {post.type !== 'don' && (
                  <span onClick={() => toggleCommentaires(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <i className="ti ti-message-circle" style={{ fontSize: 13 }} /> {postsState[i]?.comments ?? post.comments}
                  </span>
                )}
                <span onClick={() => navigator.share?.({ title: post.paroisse, text: post.texte || post.titre })} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <i className="ti ti-share" style={{ fontSize: 13 }} /> Partager
                </span>
              </div>

              {/* Section commentaires integree (deroulante, style Facebook) */}
              {openComments === i && (
                <div style={{ borderTop: '1px solid #f0ece4', padding: '10px 12px' }}>

                  {/* Liste des commentaires existants */}
                  {(post.commentsList || []).length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      {post.commentsList.map(cm => (
                        <div key={cm.id} style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C8A84B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#1e2d14', flexShrink: 0 }}>{cm.initiales}</div>
                          <div style={{ flex: 1, background: '#F5F0E8', borderRadius: 10, padding: '6px 10px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#1e2d14' }}>{cm.auteur}</div>
                            <div style={{ fontSize: 11, color: '#3a3a3a', lineHeight: 1.4 }}>{cm.texte}</div>
                            <div style={{ fontSize: 8, color: '#aaa', marginTop: 2 }}>{cm.temps}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Erreur de moderation */}
                  {commentError && (
                    <div style={{ marginBottom: 8, padding: '8px 10px', background: '#1e2d14', borderRadius: 9, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <i className="ti ti-alert-triangle" style={{ fontSize: 12, color: '#C8A84B', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 9, color: 'rgba(245,239,228,0.85)', lineHeight: 1.4 }}>{commentError}</span>
                    </div>
                  )}

                  {/* Zone de saisie integree, toujours visible en bas */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C8A84B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#1e2d14', flexShrink: 0 }}>MD</div>
                    <input
                      type="text"
                      value={commentDraft}
                      onChange={e => { setCommentDraft(e.target.value.slice(0, 500)); setCommentError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') publierCommentaire(); }}
                      placeholder="Ecrire un commentaire..."
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: 18, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', background: 'white', color: '#1e2d14' }}
                      spellCheck="false"
                      autoComplete="off"
                    />
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: 'none', cursor: 'pointer',
                        background: recording ? '#e53935' : 'rgba(200,168,75,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <i className={recording ? 'ti ti-player-stop' : 'ti ti-microphone'} style={{ fontSize: 14, color: recording ? 'white' : '#C8A84B' }} />
                    </button>
                    <button
                      onClick={publierCommentaire}
                      disabled={!commentDraft.trim()}
                      style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: 'none', cursor: commentDraft.trim() ? 'pointer' : 'default',
                        background: commentDraft.trim() ? 'linear-gradient(135deg,#C8A84B,#8B6020)' : '#e4e4e7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <i className="ti ti-send" style={{ fontSize: 13, color: commentDraft.trim() ? '#1e2d14' : '#999' }} />
                    </button>
                  </div>
                  {recording && (
                    <div style={{ textAlign: 'center', fontSize: 9, color: '#e53935', marginTop: 6 }}>🎙️ Écoute en cours... (max 30s)</div>

                  )}
                {/* Avertissement filtre */}
                  {avertissement ? (
                    <div style={{
                      margin: '8px 0 0',
                      padding: '10px 14px',
                      background: 'rgba(180,20,20,0.08)',
                      border: '1px solid rgba(180,20,20,0.22)',
                      borderRadius: 10,
                      fontSize: 11,
                      color: '#b71c1c',
                      fontFamily: 'Georgia,serif',
                      lineHeight: 1.55,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{(window._jb_avert || 0) >= 3 ? '🚫' : '⚠️'}</span>
                      <span>{avertissement}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}

          {searchQuery && POSTS.filter(post => matchesSearch(post, searchQuery)).length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: '#999', fontSize: 12 }}>Aucune publication trouvee</div>
          )}
        </div>


        {/* LECTEUR DE STORIES plein ecran */}
        {storyViewer !== null && (
          <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 999, maxWidth: 430, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 4, padding: '46px 10px 0' }}>
              {storiesWithContent.map((s, i) => (
                <div key={s.id} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'white',
                    width: i < storyViewer ? '100%' : i === storyViewer ? '100%' : '0%',
                    transition: i === storyViewer ? 'width 4s linear' : 'none',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', top: 58, left: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e2d14', border: '1.5px solid #C8A84B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>
                {storiesWithContent[storyViewer]?.initiales}
              </div>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{storiesWithContent[storyViewer]?.nom}</span>
            </div>
            <button onClick={closeStory} style={{ position: 'absolute', top: 56, right: 14, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'white', fontSize: 14, cursor: 'pointer' }}>✕</button>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              backgroundImage: storiesWithContent[storyViewer]?.imageUrl ? ('url(' + storiesWithContent[storyViewer]?.imageUrl + ')') : `linear-gradient(160deg, ${storiesWithContent[storyViewer]?.bg}, #0C0A06)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
              {storiesWithContent[storyViewer]?.storyText && (
                <div style={{ color: 'white', fontFamily: 'Georgia,serif', fontSize: 14, textAlign: 'center', padding: '14px 20px 40px', background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', width: '100%' }}>
                  {storiesWithContent[storyViewer]?.storyText}
                </div>
              )}
            </div>
            <div onClick={closeStory} style={{ position: 'absolute', inset: 0 }} />
          </div>
        )}

      </div>
    </AppShell>
  );
}
