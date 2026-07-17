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
_id: p._id,
type: 'normal',
              initiales: p.parishId && p.parishId.name ? p.parishId.name.substring(0,2).toUpperCase() : 'SC',
              logo: p.parishId && p.parishId.logoUrl ? p.parishId.logoUrl : null,
              parishId: p.parishId && p.parishId._id ? p.parishId._id : null,
              bg: '#2E5C3E',
              paroisse: p.parishId && p.parishId.name ? p.parishId.name : 'Paroisse',
              temps: formatTempsPost(p.createdAt),
              texte: p.content || p.text || '',
              image: p.image || p.imageUrl || (p.images && p.images[0]) || '',
images: p.imageUrls && p.imageUrls.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []),
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
  const [parishLogo, setParishLogo] = useState(null);
  useEffect(() => {
    async function loadUnreadMessages() {
      try {
        const estAdmin = user && (user.role === 'parish_admin' || user.role === 'super_admin');
        if (estAdmin) {
          const token = localStorage.getItem('jb_admin_token');
          if (!token) return;
          const BASE = import.meta.env.VITE_API_URL || '/api';
          const res = await fetch(BASE + '/parish-admin/notifications-count', { headers: { Authorization: 'Bearer ' + token } });
          const data = await res.json();
          if (data && data.data) setUnreadMessages(data.data.messagesNonRepondus || 0);
        } else {
          const { messagesApi } = await import('../../services/api');
          const data = await messagesApi.unreadCount();
          if (data && data.data) setUnreadMessages(data.data.total || 0);
        }
      } catch (e) {
        console.log('Unread messages:', e.message);
      }
    }
    loadUnreadMessages();
  }, [user]);

  useEffect(() => {
    async function loadParishLogo() {
      if (!user || (user.role !== 'parish_admin' && user.role !== 'super_admin')) return;
      if (!user.parishId) return;
      try {
        const { parishesApi } = await import('../../services/api');
        const data = await parishesApi.getOne(user.parishId);
        const p = data && data.data && data.data.parish;
        if (p && p.logoUrl) setParishLogo(p.logoUrl);
      } catch(e) {
        console.log('Parish logo:', e.message);
      }
    }
    loadParishLogo();
  }, [user]);

  const [liked, setLiked] = useState({});
const [galerieOuverte, setGalerieOuverte] = useState(null);
const [galerieIndex, setGalerieIndex] = useState(0);
  const [avertissement, setAvertissement] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [liveParishIds, setLiveParishIds] = useState(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storyGroupIndex, setStoryGroupIndex] = useState(null); // index du groupe (paroisse) en cours
  const [storySlideIndex, setStorySlideIndex] = useState(0); // index de la story dans le groupe
  const [storyPaused, setStoryPaused] = useState(false); // maintien du doigt = pause
  const storyTimerRef = useRef(null);
  const [postsState, setPostsState] = useState(() => POSTS.map(p => ({ ...p, commentsList: [] })));
  const [visibleCount, setVisibleCount] = useState(10);
  const [openComments, setOpenComments] = useState(null); // index du post dont les commentaires sont ouverts
  const [avertissementCommentaire, setAvertissementCommentaire] = useState('');
  const [compteurAvertissements, setCompteurAvertissements] = useState(0);
  const [commentDraft, setCommentDraft] = useState('');
const [replyingTo, setReplyingTo] = useState(null);
  const [commentError, setCommentError] = useState('');
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const recordTimeoutRef = useRef(null);

  const prenom = user?.firstName || 'Marie';
  const nom = user?.lastName || 'Diallo';
  const initiales = ((user?.firstName?.[0] || 'M') + (user?.lastName?.[0] || 'D')).toUpperCase();
  const photo = parishLogo || user?.profilePhoto || user?.avatarUrl || null;
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
const post = postsState[i];
if (!post._id) { setLiked(l => ({ ...l, [i]: !l[i] })); return; }
setLiked(l => ({ ...l, [i]: !l[i] }));
import('../../services/api').then(function(mod) {
mod.postsApi.like(post._id).then(function(res) {
const nb = res && res.data && typeof res.data.likes === 'number' ? res.data.likes : null;
if (nb !== null) {
setPostsState(function(prev) {
return prev.map(function(p, idx) { return idx === i ? Object.assign({}, p, { likes: nb }) : p; });
});
}
}).catch(function(e) { console.log('Like:', e.message); });
});
}

  function toggleCommentaires(i) {
const estOuverture = openComments !== i;
setOpenComments(prev => prev === i ? null : i);
setCommentDraft('');
setCommentError('');
setReplyingTo(null);
stopRecording();
if (estOuverture) {
const post = postsState[i];
if (post && post._id) {
import('../../services/api').then(function(mod) {
mod.postsApi.getOne(post._id).then(function(res) {
const p2 = res && res.data && res.data.post;
const liste = p2 && Array.isArray(p2.comments) ? p2.comments : null;
if (liste) {
const formattee = liste.map(function(c) {
return {
id: c._id || Date.now(),
parentId: c.parentId || null,
auteur: (c.userId && (c.userId.firstName || c.userId.lastName)) ? ((c.userId.firstName || '') + ' ' + (c.userId.lastName || '')).trim() : 'Fidele',
initiales: (c.userId && c.userId.firstName ? c.userId.firstName[0] : 'F').toUpperCase(),
texte: c.text || c.texte || '',
temps: 'A l instant',
};
});
setPostsState(function(prev) {
return prev.map(function(p, idx) { return idx === i ? Object.assign({}, p, { commentsList: formattee }) : p; });
});
}
}).catch(function(e) { console.log('Get comments:', e.message); });
});
}
}
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
    const post = postsState[openComments];
if (post && post._id) {
import('../../services/api').then(function(mod) {
mod.postsApi.comment(post._id, texte, replyingTo ? replyingTo.id : null).then(function(res) {
const liste = res && res.data && Array.isArray(res.data.comments) ? res.data.comments : null;
setPostsState(function(prev) {
return prev.map(function(p, idx) {
if (idx !== openComments) return p;
if (liste) {
const formattee = liste.map(function(c) {
return {
id: c._id || Date.now(),
parentId: c.parentId || null,
auteur: (c.userId && (c.userId.firstName || c.userId.lastName)) ? ((c.userId.firstName || '') + ' ' + (c.userId.lastName || '')).trim() : 'Fidele',
initiales: (c.userId && c.userId.firstName ? c.userId.firstName[0] : 'F').toUpperCase(),
texte: c.text || c.texte || '',
temps: 'A l instant',
};
});
return Object.assign({}, p, { commentsList: formattee, comments: formattee.length });
}
const newComment = { id: Date.now(), parentId: replyingTo ? replyingTo.id : null, auteur: 'Marie Diallo', initiales: 'MD', texte: texte, temps: 'A l instant' };
return Object.assign({}, p, { commentsList: (p.commentsList || []).concat([newComment]), comments: (p.comments || 0) + 1 });
});
});
}).catch(function(e) { console.log('Comment:', e.message); });
});
}
setCommentDraft('');
setCommentError('');
setReplyingTo(null);
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

  function grilleImages(post, i) {
const imgs = post.images && post.images.length ? post.images : (post.image ? [post.image] : []);
if (imgs.length === 0) return null;
if (imgs.length === 1) {
return (
<img src={imgs[0]} alt="publication" onClick={function() { setGalerieOuverte(i); setGalerieIndex(0); }} style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover', cursor: 'pointer' }} />
);
}
const visibles = imgs.slice(0, 4);
return (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
{visibles.map(function(url, idx) {
const dernier = idx === 3 && imgs.length > 4;
return (
<div key={idx} onClick={function() { setGalerieOuverte(i); setGalerieIndex(idx); }} style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', cursor: 'pointer' }}>
<img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
{dernier && (
<div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>
+{imgs.length - 4}
</div>
)}
</div>
);
})}
</div>
);
}

function matchesSearch(post, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    const haystack = [post.paroisse, post.texte, post.titre, post.mediaTitle].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  }

  useEffect(function() {
    async function chargerLives() {
      try {
        const { liveApi } = await import('../../services/api');
        const data = await liveApi.getActifs();
        const sessions = data && data.data && data.data.sessions ? data.data.sessions : [];
        const ids = new Set(sessions.map(function(s) { return s.parishId && s.parishId._id ? String(s.parishId._id) : null; }).filter(Boolean));
        setLiveParishIds(ids);
      } catch (e) { console.log('Live actifs:', e.message); }
    }
    chargerLives();
    const intervalle = setInterval(chargerLives, 20000);
    return function() { clearInterval(intervalle); };
  }, []);

  const storyGroups = (function() {
    const map = {};
    const order = [];
    realStories.forEach(function(s) {
      const pid = s.parishId && s.parishId._id ? String(s.parishId._id) : ('inconnu-' + s._id);
      if (!map[pid]) {
        map[pid] = {
          parishId: pid,
          nom: s.parishId && s.parishId.name ? s.parishId.name : 'Paroisse',
          initiales: s.parishId && s.parishId.name ? s.parishId.name.substring(0,2).toUpperCase() : 'PA',
          slides: [],
        };
        order.push(pid);
      }
      map[pid].slides.push({
        id: s._id,
        bg: s.bgColor || '#2E5C3E',
        storyText: s.caption || '',
        imageUrl: s.imageUrl,
        videoUrl: s.videoUrl,
        type: s.type || 'image',
        createdAt: s.createdAt,
        seen: !!(user && Array.isArray(s.views) && s.views.some(function(v) { return String(v) === String(user._id); })),
      });
    });
    order.forEach(function(pid) {
      map[pid].slides.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
    });
    return order.map(function(pid) {
      const g = map[pid];
      g.allSeen = g.slides.every(function(sl) { return sl.seen; });
      return g;
    });
  })();

  function marquerVue(slideId) {
    import('../../services/api').then(function(mod) { mod.storiesApi.view(slideId).catch(function(){}); });
    setRealStories(function(prev) {
      return prev.map(function(rs) {
        if (String(rs._id) !== String(slideId)) return rs;
        const uid = user && user._id;
        const dejaVu = Array.isArray(rs.views) && rs.views.some(function(v) { return String(v) === String(uid); });
        if (dejaVu || !uid) return rs;
        return { ...rs, views: (rs.views || []).concat([uid]) };
      });
    });
  }

  function openStoryGroup(groupIdx) {
    setStoryGroupIndex(groupIdx);
    setStorySlideIndex(0);
    setStoryPaused(false);
  }

  function closeStory() {
    clearTimeout(storyTimerRef.current);
    setStoryGroupIndex(null);
    setStorySlideIndex(0);
    setStoryPaused(false);
  }

  function avancerStory() {
    if (storyGroupIndex === null) return;
    const groupe = storyGroups[storyGroupIndex];
    if (!groupe) { closeStory(); return; }
    if (storySlideIndex + 1 < groupe.slides.length) {
      setStorySlideIndex(storySlideIndex + 1);
    } else if (storyGroupIndex + 1 < storyGroups.length) {
      setStoryGroupIndex(storyGroupIndex + 1);
      setStorySlideIndex(0);
    } else {
      closeStory();
    }
  }

  function reculerStory() {
    if (storyGroupIndex === null) return;
    if (storySlideIndex > 0) {
      setStorySlideIndex(storySlideIndex - 1);
    } else if (storyGroupIndex > 0) {
      const groupePrec = storyGroups[storyGroupIndex - 1];
      setStoryGroupIndex(storyGroupIndex - 1);
      setStorySlideIndex(groupePrec ? groupePrec.slides.length - 1 : 0);
    }
  }

  useEffect(function() {
    if (storyGroupIndex === null) return;
    const groupe = storyGroups[storyGroupIndex];
    const slide = groupe && groupe.slides[storySlideIndex];
    if (!slide) return;

    marquerVue(slide.id);

    clearTimeout(storyTimerRef.current);
    if (slide.type !== 'video' && !storyPaused) {
      storyTimerRef.current = setTimeout(function() { avancerStory(); }, 4000);
    }
    return function() { clearTimeout(storyTimerRef.current); };
  }, [storyGroupIndex, storySlideIndex, storyPaused]);

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
              <div onClick={() => navigate(isAdmin ? '/parish-admin/messages' : '/messages')} style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-message-circle" style={{ fontSize: 16, color: '#666' }} />
                {unreadMessages > 0 && (
                  <div style={{ position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15, borderRadius: 8, background: '#e53935', border: '1.5px solid #F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white', padding: '0 3px' }}>{unreadMessages}</div>
                )}
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
            {isAdmin && (
              <div onClick={() => navigate('/create-story')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 78, flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px dashed #C8A84B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#C8A84B', background: 'white' }}>+</div>
                <span style={{ fontSize: 9, color: '#C8A84B', marginTop: 5, whiteSpace: 'nowrap' }}>Story</span>
              </div>
            )}
            {storyGroups.map((g, i) => (
              <div
                key={g.parishId}
                onClick={() => openStoryGroup(i)}
                style={{
                  position: 'relative', width: 78, height: 108, borderRadius: 14, overflow: 'hidden',
                  flexShrink: 0, cursor: 'pointer', border: g.allSeen ? '2px solid #B8B8B8' : '2px solid #C8A84B',
                  background: g.slides[0].type === 'texte' ? (g.slides[0].bg || '#2E5C3E') : '#1e2d14',
                }}
              >
                {g.slides[0].type === 'image' && (
                  <img src={g.slides[0].imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {g.slides[0].type === 'video' && (
                  <video src={g.slides[0].videoUrl} muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {g.slides[0].type === 'texte' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                    <div style={{ color: 'white', fontSize: 9, fontFamily: 'Georgia,serif', textAlign: 'center', lineHeight: 1.3 }}>{g.slides[0].storyText}</div>
                  </div>
                )}
                {g.slides.length > 1 && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: '2px 6px', fontSize: 8, color: 'white', fontWeight: 700 }}>{g.slides.length}</div>
                )}
                <div style={{
                  position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: '50%',
                  border: g.allSeen ? '2px solid #B8B8B8' : '2px solid #C8A84B', background: '#1e2d14', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 700,
                }}>{g.initiales}</div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '18px 6px 6px',
                }}>
                  <div style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>{g.nom}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div onClick={() => navigate('/donate')} style={{ background: 'white', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(26,20,16,.06)', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}><i className="ti ti-heart-handshake" style={{ fontSize: 18, color: '#C8574A' }} /></div>
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
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#C8A84B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#1e2d14', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initiales}
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
              <div onClick={function() { if (post.parishId) navigate('/parishes/' + post.parishId); }} style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', gap: 9, cursor: post.parishId ? 'pointer' : 'default' }}>
                {post.type === 'don' ? (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #C8A84B', background: '#1e2d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth="1.5"><path d="M12 2L4 8v13h16V8l-8-6z" /><path d="M9 21v-7h6v7" /></svg>
                  </div>
                ) : (
                  <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                    {post.logo ? (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: (post.parishId && liveParishIds.has(post.parishId)) ? '2px solid #e53935' : 'none' }}>
                        <img src={post.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: post.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700, border: (post.parishId && liveParishIds.has(post.parishId)) ? '2px solid #e53935' : 'none' }}>{post.initiales}</div>
                    )}
                    {post.parishId && liveParishIds.has(post.parishId) && (
                      <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', background: '#e53935', color: '#fff', fontSize: 5, fontWeight: 800, padding: '1px 4px', borderRadius: 5, whiteSpace: 'nowrap' }}>LIVE</div>
                    )}
                  </div>
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
                {post.image && grilleImages(post, i)}

              {/* Actions bas de carte */}
              <div style={{ display: 'flex', gap: 14, padding: '8px 12px', borderTop: '1px solid #f0ece4', fontSize: 11, color: '#666' }}>
                <span onClick={() => toggleLike(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: liked[i] ? '#C8A84B' : '#666' }}>
                  <i className={liked[i] ? 'ti ti-heart-filled' : 'ti ti-heart'} style={{ fontSize: 13 }} /> {postsState[i]?.likes ?? post.likes}
                </span>
                {post.type !== 'don' && (
                  <span onClick={() => toggleCommentaires(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <i className="ti ti-message-circle" style={{ fontSize: 13 }} /> {postsState[i]?.comments ?? post.comments}
                  </span>
                )}
                <span onClick={() => {
navigator.share?.({ title: post.paroisse, text: post.texte || post.titre });
if (post._id) {
import('../../services/api').then(function(mod) {
mod.postsApi.share(post._id).then(function(res) {
const nb = res && res.data && typeof res.data.sharesCount === 'number' ? res.data.sharesCount : null;
if (nb !== null) {
setPostsState(function(prev) {
return prev.map(function(p, idx) { return idx === i ? Object.assign({}, p, { sharesCount: nb }) : p; });
});
}
}).catch(function(e) { console.log('Share:', e.message); });
});
}
}} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
<i className="ti ti-share" style={{ fontSize: 13 }} /> {postsState[i]?.sharesCount ?? 0}
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


        {/* LECTEUR DE STORIES plein ecran (groupees par paroisse, tap gauche/droite, maintien = pause) */}
        {storyGroupIndex !== null && storyGroups[storyGroupIndex] && (
          <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 99999, maxWidth: 430, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 4, padding: '46px 10px 0', position: 'relative', zIndex: 3 }}>
              {storyGroups[storyGroupIndex].slides.map((sl, i) => (
                <div key={sl.id} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'white',
                    width: i < storySlideIndex ? '100%' : i === storySlideIndex ? '100%' : '0%',
                    transition: i === storySlideIndex && !storyPaused && sl.type !== 'video' ? 'width 4s linear' : 'none',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', top: 58, left: 14, display: 'flex', alignItems: 'center', gap: 8, zIndex: 3 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e2d14', border: '1.5px solid #C8A84B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>
                {storyGroups[storyGroupIndex].initiales}
              </div>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{storyGroups[storyGroupIndex].nom}</span>
            </div>
            <button onClick={closeStory} style={{ position: 'absolute', top: 56, right: 14, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'white', fontSize: 14, cursor: 'pointer', zIndex: 3 }}>✕</button>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              background: storyGroups[storyGroupIndex].slides[storySlideIndex].type === 'texte' ? (storyGroups[storyGroupIndex].slides[storySlideIndex].bg || '#1e2d14') : '#000',
              overflow: 'hidden',
            }}>
              {storyGroups[storyGroupIndex].slides[storySlideIndex].type === 'image' && (
                <img src={storyGroups[storyGroupIndex].slides[storySlideIndex].imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {storyGroups[storyGroupIndex].slides[storySlideIndex].type === 'video' && (
                <video
                  src={storyGroups[storyGroupIndex].slides[storySlideIndex].videoUrl}
                  autoPlay muted playsInline
                  onEnded={avancerStory}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {storyGroups[storyGroupIndex].slides[storySlideIndex].type === 'texte' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 30px' }}>
                  <div style={{ color: 'white', fontFamily: 'Georgia,serif', fontSize: 20, textAlign: 'center', lineHeight: 1.5 }}>
                    {storyGroups[storyGroupIndex].slides[storySlideIndex].storyText}
                  </div>
                </div>
              )}
              {storyGroups[storyGroupIndex].slides[storySlideIndex].type !== 'texte' && storyGroups[storyGroupIndex].slides[storySlideIndex].storyText && (
                <div style={{ position: 'relative', zIndex: 1, color: 'white', fontFamily: 'Georgia,serif', fontSize: 14, textAlign: 'center', padding: '14px 20px 40px', background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', width: '100%' }}>
                  {storyGroups[storyGroupIndex].slides[storySlideIndex].storyText}
                </div>
              )}
            </div>

            {/* Zones tactiles : gauche = precedent, droite = suivant, maintien = pause */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 2 }}>
              <div
                onClick={reculerStory}
                onMouseDown={() => setStoryPaused(true)}
                onMouseUp={() => setStoryPaused(false)}
                onMouseLeave={() => setStoryPaused(false)}
                onTouchStart={() => setStoryPaused(true)}
                onTouchEnd={() => setStoryPaused(false)}
                style={{ width: '50%', height: '100%' }}
              />
              <div
                onClick={avancerStory}
                onMouseDown={() => setStoryPaused(true)}
                onMouseUp={() => setStoryPaused(false)}
                onMouseLeave={() => setStoryPaused(false)}
                onTouchStart={() => setStoryPaused(true)}
                onTouchEnd={() => setStoryPaused(false)}
                style={{ width: '50%', height: '100%' }}
              />
            </div>
          </div>
        )}

      </div>
    {galerieOuverte !== null && postsState[galerieOuverte] && (
<div onClick={function() { setGalerieOuverte(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
<div onClick={function(e) { e.stopPropagation(); }} style={{ position: 'relative', width: '100%', maxWidth: 430, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<img
src={(postsState[galerieOuverte].images && postsState[galerieOuverte].images[galerieIndex]) || postsState[galerieOuverte].image}
alt=""
style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
/>
{postsState[galerieOuverte].images && postsState[galerieOuverte].images.length > 1 && (
<>
{galerieIndex > 0 && (
<div onClick={function() { setGalerieIndex(function(v) { return v - 1; }); }} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
<i className="ti ti-chevron-left" style={{ color: '#fff', fontSize: 18 }} />
</div>
)}
{galerieIndex < postsState[galerieOuverte].images.length - 1 && (
<div onClick={function() { setGalerieIndex(function(v) { return v + 1; }); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
<i className="ti ti-chevron-right" style={{ color: '#fff', fontSize: 18 }} />
</div>
)}
</>
)}
</div>
{postsState[galerieOuverte].images && postsState[galerieOuverte].images.length > 1 && (
<div style={{ marginTop: 14, fontSize: 12, color: '#fff', fontWeight: 700 }}>
{galerieIndex + 1} / {postsState[galerieOuverte].images.length}
</div>
)}
<div onClick={function() { setGalerieOuverte(null); }} style={{ position: 'absolute', top: 44, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
<i className="ti ti-x" style={{ color: '#fff', fontSize: 16 }} />
</div>
</div>
)}
</AppShell>
);
}