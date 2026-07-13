import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { parishesApi, postsApi, storiesApi, messagesApi } from '../../services/api';

const VERT = "#1e2d14";
const OR = "#c8a84b";

const TYPES_PUB = [
  { id: 'NORMAL',      label: 'Publication', color: 'rgba(200,168,75,0.15)', tc: '#8B6020' },
  { id: 'ANNONCE',     label: 'Annonce',     color: '#e3f2fd',              tc: '#1565c0' },
  { id: 'INSCRIPTION', label: 'Inscription', color: 'rgba(21,101,192,0.1)', tc: '#1565C0' },
  { id: 'COLLECTE',    label: 'Collecte',    color: 'rgba(200,168,75,0.15)',tc: '#8B6020' },
  { id: 'EVENEMENT',   label: 'Evenement',   color: '#e8f5e9',              tc: '#2e7d32' },
  { id: 'MEDIA',       label: 'Media',       color: 'rgba(183,28,28,0.08)', tc: '#b71c1c' },
];

function typeInfo(type) {
  return TYPES_PUB.find(function(t) { return t.id === type; }) || TYPES_PUB[0];
}

function formatTemps(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const h   = Math.floor(diff / 3600000);
  const j   = Math.floor(diff / 86400000);
  if (j > 0) return 'Il y a ' + j + 'j';
  if (h > 0) return 'Il y a ' + h + 'h';
  if (min > 0) return 'Il y a ' + min + ' min';
  return 'A l\u2019instant';
}

function formatDateLongue(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

const ONGLETS = [
  { id: "publications", label: "Publications" },
  { id: "messes", label: "Horaires messes" },
  { id: "infos", label: "Infos" },
];

export default function ParishDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [onglet, setOnglet] = useState("publications");
  const [likees, setLikees] = useState([]);
  const [suivie, setSuivie] = useState(false);

  const [paroisse, setParoisse] = useState(null);
  const [loadingParoisse, setLoadingParoisse] = useState(true);
  const [erreurParoisse, setErreurParoisse] = useState('');

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [stories, setStories] = useState([]);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [storyCaption, setStoryCaption] = useState('');

  const [photoCouverture, setPhotoCouverture] = useState(null);
  const [photoProfil, setPhotoProfil] = useState(null);
  const [notifCount, setNotifCount] = useState({ nouveauxFideles: 0, messagesNonRepondus: 0 });

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [texte, setTexte] = useState('');
  const [typePub, setTypePub] = useState('NORMAL');

  // Seul un parish_admin/super_admin gerant CETTE paroisse voit les outils de gestion
  const isOwner = !!(
    user &&
    (user.role === 'parish_admin' || user.role === 'super_admin') &&
    paroisse &&
    String(user.parishId) === String(paroisse._id)
  );

  useEffect(function() {
    let cancelled = false;

    async function loadParoisse() {
      setLoadingParoisse(true);
      setErreurParoisse('');
      try {
        const res = await parishesApi.getOne(id);
        const p = res && res.data && res.data.parish;
        if (!cancelled) setParoisse(p || null);
      } catch (e) {
        if (!cancelled) setErreurParoisse(e.message || 'Impossible de charger la paroisse');
      } finally {
        if (!cancelled) setLoadingParoisse(false);
      }
    }

    async function loadPosts() {
      setLoadingPosts(true);
      try {
        const res = await postsApi.getAll({ parishId: id, limit: 30 });
        const items = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || [])) : [];
        if (!cancelled) setPosts(items);
      } catch (e) {
        console.log('Posts:', e.message);
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    }

    async function loadStories() {
      try {
        const res = await storiesApi.getAll({ parishId: id });
        const items = (res && res.data && res.data.stories) || [];
        if (!cancelled) setStories(items);
      } catch (e) {
        console.log('Stories:', e.message);
      }
    }

    loadParoisse();
    loadPosts();
    loadStories();

    return function() { cancelled = true; };
  }, [id]);

  useEffect(function() {
    if (!isOwner) return;
    const token = localStorage.getItem('jb_admin_token');
    if (!token) return;
    const BASE = import.meta.env.VITE_API_URL || '/api';
    fetch(BASE + '/parish-admin/notifications-count', { headers: { Authorization: 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d && d.data) setNotifCount(d.data); })
      .catch(function(e) { console.log('Notifications count:', e.message); });
  }, [isOwner]);

  function rafraichirPosts() {
    postsApi.getAll({ parishId: id, limit: 30 }).then(function(res) {
      const items = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || [])) : [];
      setPosts(items);
    }).catch(function(e) { console.log('Posts:', e.message); });
  }

  function rafraichirStories() {
    storiesApi.getAll({ parishId: id }).then(function(res) {
      const items = (res && res.data && res.data.stories) || [];
      setStories(items);
    }).catch(function(e) { console.log('Stories:', e.message); });
  }

  async function creerStory() {
    if (!storyImageUrl.trim()) return;
    try {
      await storiesApi.create({ imageUrl: storyImageUrl.trim(), caption: storyCaption.trim() });
      setStoryImageUrl('');
      setStoryCaption('');
      setShowStoryForm(false);
      rafraichirStories();
    } catch (e) {
      console.log('Creer story:', e.message);
    }
  }

  async function supprimerStory(storyId) {
    try {
      await storiesApi.remove(storyId);
      rafraichirStories();
    } catch (e) {
      console.log('Supprimer story:', e.message);
    }
  }

  async function envoyerMessageParoisse() {
    try {
      const data = await messagesApi.start(id);
      const conv = data && data.data && data.data.conversation;
      if (conv) navigate('/messages/' + conv._id);
    } catch (e) { console.log('Demarrer conversation:', e.message); }
  }

  const toggleLike = function(postId) {
    setLikees(function(prev) { return prev.includes(postId) ? prev.filter(function(i) { return i !== postId; }) : [...prev, postId]; });
    postsApi.like(postId).catch(function(e) { console.log('Like:', e.message); });
  };

  const ouvrirItineraire = function() {
    if (!paroisse || !paroisse.location || !paroisse.location.coordinates || !paroisse.location.coordinates.coordinates) return;
    const coords = paroisse.location.coordinates.coordinates;
    const lng = coords[0], lat = coords[1];
    window.open("https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng, "_blank");
  };

  // Ecran d'edition photo (couverture / profil) : meme mecanisme que le
  // composeur de publications (recadrage, zoom, glisser, filtres), avec
  // "gravure" finale dans un canvas au moment de valider, pour que le
  // recadrage choisi soit reellement celui qui est sauvegarde.
  const [editionPhotoOuverte, setEditionPhotoOuverte] = useState(null); // 'couverture' | 'profil' | null
  const [editUrl, setEditUrl] = useState(null);
  const [editZoom, setEditZoom] = useState(1);
  const [editOffsetX, setEditOffsetX] = useState(0);
  const [editOffsetY, setEditOffsetY] = useState(0);
  const [editFiltre, setEditFiltre] = useState('normal');
  const [editAuto, setEditAuto] = useState(false);
  const [editShowFiltres, setEditShowFiltres] = useState(false);
  const editDragRef = useRef({ actif: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const editConteneurRef = useRef(null);

  const EDIT_FILTRES = [
    { id: 'normal',     label: 'Normal',     css: 'none' },
    { id: 'vif',        label: 'Vif',        css: 'saturate(1.6) contrast(1.05)' },
    { id: 'chaleureux', label: 'Chaleureux', css: 'sepia(0.35) saturate(1.2)' },
    { id: 'nb',         label: 'N&B',        css: 'grayscale(1)' },
    { id: 'contraste',  label: 'Contraste',  css: 'contrast(1.4)' },
  ];
  const EDIT_AUTO_CSS = 'contrast(1.12) saturate(1.18) brightness(1.04)';

  function editStyleFiltre() {
    const parts = [];
    if (editAuto) parts.push(EDIT_AUTO_CSS);
    const f = EDIT_FILTRES.find(function(x) { return x.id === editFiltre; });
    if (f && f.css !== 'none') parts.push(f.css);
    return parts.length ? parts.join(' ') : 'none';
  }

  function editLimiterOffset(offsetX, offsetY, zoom) {
    const el = editConteneurRef.current;
    if (!el) return { x: offsetX, y: offsetY };
    const rect = el.getBoundingClientRect();
    const maxX = (rect.width * (zoom - 1)) / 2;
    const maxY = (rect.height * (zoom - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, offsetX)),
      y: Math.max(-maxY, Math.min(maxY, offsetY)),
    };
  }

  function editDemarrerGlisser(e) {
    const point = e.touches ? e.touches[0] : e;
    editDragRef.current = { actif: true, startX: point.clientX, startY: point.clientY, baseX: editOffsetX, baseY: editOffsetY };
  }
  function editBougerGlisser(e) {
    if (!editDragRef.current.actif) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - editDragRef.current.startX;
    const dy = point.clientY - editDragRef.current.startY;
    const limite = editLimiterOffset(editDragRef.current.baseX + dx, editDragRef.current.baseY + dy, editZoom);
    setEditOffsetX(limite.x);
    setEditOffsetY(limite.y);
  }
  function editArreterGlisser() {
    editDragRef.current.actif = false;
  }
  function editChangerZoom(valeur) {
    const limite = editLimiterOffset(editOffsetX, editOffsetY, valeur);
    setEditZoom(valeur);
    setEditOffsetX(limite.x);
    setEditOffsetY(limite.y);
  }

  function ouvrirEditionPhoto(cible, file) {
    const url = URL.createObjectURL(file);
    setEditUrl(url);
    setEditZoom(1);
    setEditOffsetX(0);
    setEditOffsetY(0);
    setEditFiltre('normal');
    setEditAuto(false);
    setEditShowFiltres(false);
    setEditionPhotoOuverte(cible);
  }

  function handleCouverture(e) {
    const file = e.target.files && e.target.files[0];
    if (file) ouvrirEditionPhoto('couverture', file);
    e.target.value = '';
  }

  function handleProfil(e) {
    const file = e.target.files && e.target.files[0];
    if (file) ouvrirEditionPhoto('profil', file);
    e.target.value = '';
  }

  async function validerEditionPhoto() {
    const cible = editionPhotoOuverte;
    const el = editConteneurRef.current;
    if (!editUrl || !el) return;
    const rect = el.getBoundingClientRect();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async function() {
      const targetW = cible === 'profil' ? 600 : 1200;
      const targetH = cible === 'profil' ? 600 : 400;
      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.filter = editStyleFiltre();

      const coverScale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
      const scale = coverScale * editZoom;
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;

      const fracX = rect.width ? (editOffsetX / rect.width) : 0;
      const fracY = rect.height ? (editOffsetY / rect.height) : 0;

      const dx = (targetW - drawW) / 2 + fracX * targetW;
      const dy = (targetH - drawH) / 2 + fracY * targetH;

      ctx.drawImage(img, dx, dy, drawW, drawH);
      const finalUrl = canvas.toDataURL('image/jpeg', 0.85);

      if (cible === 'couverture') setPhotoCouverture(finalUrl);
      else setPhotoProfil(finalUrl);

      setEditionPhotoOuverte(null);
      URL.revokeObjectURL(editUrl);
      setEditUrl(null);

      try {
        await parishesApi.update(id, cible === 'couverture' ? { coverUrl: finalUrl } : { logoUrl: finalUrl });
      } catch (err) {
        console.log('Sauvegarde photo:', err.message);
      }
    };
    img.src = editUrl;
  }

  function annulerEditionPhoto() {
    if (editUrl) URL.revokeObjectURL(editUrl);
    setEditUrl(null);
    setEditionPhotoOuverte(null);
  }

  function ouvrirCreation() {
    setEditingId(null);
    setTexte('');
    setTypePub('NORMAL');
    setShowCreate(true);
  }

  function ouvrirEdition(post) {
    setEditingId(post._id);
    setTexte(post.content || '');
    setTypePub(post.type || 'NORMAL');
    setShowCreate(true);
  }

  async function publier() {
    if (!texte.trim()) return;
    try {
      if (editingId) {
        await postsApi.update(editingId, { content: texte, type: typePub });
      } else {
        await postsApi.create({ content: texte, type: typePub });
      }
      setShowCreate(false);
      setEditingId(null);
      setTexte('');
      rafraichirPosts();
    } catch (e) {
      console.log('Publier:', e.message);
    }
  }

  async function masquerOuRepublier(post) {
    try {
      if (post.isActive === false) {
        await postsApi.update(post._id, { isActive: true });
      } else {
        await postsApi.remove(post._id);
      }
      rafraichirPosts();
    } catch (e) {
      console.log('Masquer/Republier:', e.message);
    }
  }

  async function supprimerDefinitivement(post) {
    try {
      await postsApi.remove(post._id);
      rafraichirPosts();
    } catch (e) {
      console.log('Supprimer:', e.message);
    }
  }

  async function handleLogout() {
    try { await logout(); } catch (e) { /* ignore */ }
    localStorage.removeItem('jb_admin_token');
    localStorage.removeItem('jb_admin_user');
    localStorage.removeItem('jb_admin_parish');
    navigate('/splash'); // meme comportement que la deconnexion fidele : retour a la page vitrine
  }

  if (loadingParoisse) {
    return (
      <AppShell>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>
          Chargement de la paroisse...
        </div>
      </AppShell>
    );
  }

  if (erreurParoisse || !paroisse) {
    return (
      <AppShell>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#9A8E7E', fontFamily: 'Georgia,serif', padding: 20, textAlign: 'center' }}>
          <div>Impossible de charger cette paroisse.</div>
          <button onClick={function() { navigate(-1); }} style={{ padding: '8px 16px', background: VERT, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>Retour</button>
        </div>
      </AppShell>
    );
  }

  const ville = paroisse.location && paroisse.location.city || '';
  const pays  = paroisse.location && paroisse.location.country || '';
  const hasCoords = !!(paroisse.location && paroisse.location.coordinates && paroisse.location.coordinates.coordinates && paroisse.location.coordinates.coordinates.length === 2);
  const initiales2 = (paroisse.name || '??').substring(0, 2).toUpperCase();

  return (
    <AppShell>
      <div style={{ background: "#f7f5f0", minHeight: "100vh", paddingBottom: 80 }}>

        {/* PHOTO DE COUVERTURE */}
        <div style={{ position: "relative", height: 180, background: (photoCouverture || paroisse.coverUrl) ? "none" : "linear-gradient(135deg, #1e2d14 0%, #2d4a1e 100%)", overflow: "visible" }}>
          {(photoCouverture || paroisse.coverUrl)
            ? <img src={photoCouverture || paroisse.coverUrl} alt="couverture" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 40, opacity: 0.3, color: '#fff' }}>+</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Photo de couverture</span>
              </div>
            )
          }

          <button onClick={function() { navigate(-1); }} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: "#fff" }} />
          </button>

          {isOwner && (
            <label style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#fff", fontSize: 12, fontWeight: 600 }}>
              <i className="ti ti-camera" style={{ fontSize: 15 }} />
              Modifier la couverture
              <input type="file" accept="image/*" onChange={handleCouverture} style={{ display: "none" }} />
            </label>
          )}

          <div style={{ position: "absolute", bottom: -40, left: 16 }}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #fff", overflow: "hidden", background: VERT, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", fontSize: 28, fontWeight: 700, color: OR }}>
                {(photoProfil || paroisse.logoUrl)
                  ? <img src={photoProfil || paroisse.logoUrl} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initiales2
                }
              </div>
              {isOwner && (
                <label style={{ position: "absolute", bottom: 0, right: 0, background: OR, border: "2px solid #fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="ti ti-camera" style={{ fontSize: 13, color: VERT }} />
                  <input type="file" accept="image/*" onChange={handleProfil} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* HEADER INFO */}
        <div style={{ background: VERT, padding: "44px 16px 0" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: OR, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{paroisse.denomination || ''}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{paroisse.name}</div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "space-around" }}>
            <div onClick={hasCoords ? ouvrirItineraire : undefined} style={{ textAlign: "center", flex: 1, cursor: hasCoords ? 'pointer' : 'default' }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, rgba(200,168,75,0.28), rgba(200,168,75,0.08))", boxShadow: "inset 0 0 0 1.5px rgba(200,168,75,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px" }}>
                <i className="ti ti-map-pin" style={{ fontSize: 18, color: OR }} />
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{isOwner ? 'Localisation' : 'Itineraire'}</div>
            </div>
            {isOwner && (
              <div onClick={function() { navigate('/parish-admin/branches'); }} style={{ textAlign: "center", flex: 1, cursor: "pointer" }}>
                <div style={{ position: "relative", width: 44, height: 44, margin: "0 auto 5px" }}>
                  <span style={{ position: "absolute", top: -3, right: -3, background: OR, color: VERT, fontSize: 11, fontWeight: 800, width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + VERT, zIndex: 2 }}>+</span>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, rgba(200,168,75,0.28), rgba(200,168,75,0.08))", boxShadow: "inset 0 0 0 1.5px rgba(200,168,75,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-affiliate" style={{ fontSize: 18, color: OR }} />
                  </div>
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Groupes</div>
              </div>
            )}
            <div onClick={isOwner ? function() { navigate('/parish-admin/fideles'); } : undefined} style={{ textAlign: "center", flex: 1, cursor: isOwner ? 'pointer' : 'default' }}>
              <div style={{ position: "relative", width: 44, height: 44, margin: "0 auto 5px" }}>
                {isOwner && notifCount.nouveauxFideles > 0 && (
                  <span style={{ position: "absolute", top: -3, right: -3, background: "#E24B4A", color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid " + VERT, zIndex: 2 }}>{notifCount.nouveauxFideles}</span>
                )}
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, rgba(200,168,75,0.32), rgba(200,168,75,0.1))", boxShadow: "inset 0 0 0 1.5px rgba(200,168,75,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-users" style={{ fontSize: 19, color: OR }} />
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: OR, marginBottom: 1 }}>{(paroisse.stats && paroisse.stats.memberCount) || 0}</div>
              <div style={{ fontSize: 9, color: OR, fontWeight: 700 }}>Fideles</div>
            </div>
            <div onClick={isOwner ? function() { navigate('/parish-admin/messages'); } : undefined} style={{ textAlign: "center", flex: 1, cursor: isOwner ? 'pointer' : 'default' }}>
              <div style={{ position: "relative", width: 44, height: 44, margin: "0 auto 5px" }}>
                {isOwner && notifCount.messagesNonRepondus > 0 && (
                  <span style={{ position: "absolute", top: -3, right: -3, background: "#E24B4A", color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid " + VERT, zIndex: 2 }}>{notifCount.messagesNonRepondus}</span>
                )}
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, rgba(200,168,75,0.22), rgba(200,168,75,0.06))", boxShadow: "inset 0 0 0 1.5px rgba(200,168,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-message-circle" style={{ fontSize: 19, color: OR }} />
                </div>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Interactions</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "space-around" }}>
            {isOwner ? (
              <>
                <div onClick={function() { navigate('/parish-admin/demandes'); }} style={{ textAlign: "center", flex: 1, cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#e53935,#b71c1c)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", boxShadow: "0 3px 8px rgba(229,57,53,0.3)" }}>
                    <i className="ti ti-file-description" style={{ fontSize: 19, color: "#fff" }} />
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Demandes</div>
                </div>
                <div onClick={function() { navigate('/parish-admin/dons'); }} style={{ textAlign: "center", flex: 1, cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#C8A84B,#8B6020)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", boxShadow: "0 3px 8px rgba(200,168,75,0.35)" }}>
                    <i className="ti ti-currency-dollar" style={{ fontSize: 19, color: VERT }} />
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Dons</div>
                </div>
                <div onClick={function() { navigate('/create'); }} style={{ textAlign: "center", flex: 1, cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#2E5C3E,#0D3B2E)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", boxShadow: "0 3px 8px rgba(46,92,62,0.3)" }}>
                    <i className="ti ti-plus" style={{ fontSize: 19, color: "#fff" }} />
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Publier</div>
                </div>
                <div onClick={function() { navigate('/parish-admin/live'); }} style={{ textAlign: "center", flex: 1, cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#c62828,#8e1616)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", boxShadow: "0 3px 8px rgba(198,40,40,0.3)" }}>
                    <i className="ti ti-broadcast" style={{ fontSize: 19, color: "#fff" }} />
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Live</div>
                </div>
              </>
            ) : (
              <>
                <button onClick={function() { navigate('/donate'); }} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: OR, color: VERT, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <i className="ti ti-hand-finger" style={{ fontSize: 16 }} /> Faire un don
                </button>
                <button onClick={envoyerMessageParoisse} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: VERT, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <i className="ti ti-message-circle" style={{ fontSize: 16 }} /> Message
                </button>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 0 }}>
            {ONGLETS.map(function(tab) {
              return (
                <button key={tab.id} onClick={function() { setOnglet(tab.id); }}
                  style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 700, color: onglet === tab.id ? OR : "rgba(255,255,255,0.5)", borderBottom: onglet === tab.id ? "2px solid " + OR : "2px solid transparent", transition: "all 0.2s" }}>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "16px 16px 0" }}>

          {isOwner && onglet === "publications" && (
            <div style={{ marginBottom: 16 }}>
              

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Vos stories (24h)</div>
                <div onClick={function() { setShowStoryForm(true); }} style={{ fontSize: 11, color: '#8B6020', fontWeight: 700, cursor: 'pointer' }}>Nouvelle +</div>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 18 }}>
                {stories.length === 0 && (
                  <div style={{ fontSize: 11, color: '#9A8E7E', padding: '8px 0' }}>Aucune story active</div>
                )}
                {stories.map(function(s) {
                  return (
                    <div key={s._id} style={{ position: 'relative', width: 64, height: 90, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '2px solid ' + OR }}>
                      <img src={s.imageUrl} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={function() { supprimerStory(s._id); }} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 10, fontFamily: 'Georgia,serif' }}>Gestion de la paroisse</div>
              <div onClick={function() { navigate('/parish-admin/moderation'); }} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: '1px solid #e8e4dc', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(106,27,154,0.18), rgba(106,27,154,0.05))', boxShadow: 'inset 0 0 0 1.5px rgba(106,27,154,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-shield" style={{ fontSize: 19, color: '#6a1b9a' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2a2a2a' }}>Moderation</div>
                  <div style={{ fontSize: 11, color: '#9A8E7E' }}>Commentaires signales</div>
                </div>
                <i className="ti ti-chevron-right" style={{ fontSize: 16, color: '#ccc' }} />
              </div>
            </div>
          )}

          {onglet === "publications" && (
            <div>
              {loadingPosts && (
                <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>
              )}
              {!loadingPosts && posts.length === 0 && (
                <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>Aucune publication pour le moment</div>
              )}
              {posts.map(function(pub) {
                const tc = typeInfo(pub.type);
                const estLike = likees.includes(pub._id);
                const masquee = pub.isActive === false;
                return (
                  <div key={pub._id} style={{ background: "#fff", borderRadius: 16, marginBottom: 12, border: "1px solid #e8e4dc", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", opacity: masquee ? 0.6 : 1 }}>
                    <div style={{ padding: "14px 14px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: VERT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: OR }}>{initiales2}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: VERT }}>{paroisse.name}</div>
                          <div style={{ fontSize: 11, color: "#bbb" }}>{formatTemps(pub.createdAt)}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: tc.color, color: tc.tc }}>{tc.label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "#2a2a2a", lineHeight: 1.6 }}>{pub.content}</p>
                    </div>
                    {pub.imageUrl && (
                      <img src={pub.imageUrl} alt="publication" style={{ width: '100%', display: 'block', maxHeight: 480, objectFit: 'cover' }} />
                    )}

                    {isOwner && (
                      <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px' }}>
                        <button onClick={function() { ouvrirEdition(pub); }} style={{ flex: 1, background: 'rgba(200,168,75,0.12)', border: 'none', borderRadius: 8, padding: '6px 0', fontSize: 11, color: '#8B6020', cursor: 'pointer', fontWeight: 700 }}>
                          <i className="ti ti-edit" style={{ fontSize: 12, verticalAlign: -1 }} /> Modifier
                        </button>
                        <button onClick={function() { masquerOuRepublier(pub); }} style={{ flex: 1, background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: 8, padding: '6px 0', fontSize: 11, color: '#7A6E5E', cursor: 'pointer', fontWeight: 700 }}>
                          <i className={masquee ? 'ti ti-eye' : 'ti ti-eye-off'} style={{ fontSize: 12, verticalAlign: -1 }} /> {masquee ? 'Republier' : 'Masquer'}
                        </button>
                        <button onClick={function() { supprimerDefinitivement(pub); }} style={{ flex: 1, background: 'rgba(229,57,53,0.08)', border: 'none', borderRadius: 8, padding: '6px 0', fontSize: 11, color: '#e53935', cursor: 'pointer', fontWeight: 700 }}>
                          <i className="ti ti-trash" style={{ fontSize: 12, verticalAlign: -1 }} /> Supprimer
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", borderTop: "1px solid #f0ece4", padding: "8px 14px" }}>
                      <button onClick={function() { toggleLike(pub._id); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: estLike ? "#e53935" : "#999", fontWeight: 600, fontSize: 13 }}>
                        <i className={"ti " + (estLike ? "ti-heart-filled" : "ti-heart")} style={{ fontSize: 16 }} />
                        {(pub.likes ? pub.likes.length : 0) + (estLike ? 1 : 0)}
                      </button>
                      <button style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "#999", fontWeight: 600, fontSize: 13 }}>
                        <i className="ti ti-message-circle" style={{ fontSize: 16 }} />
                        {pub.comments ? pub.comments.length : 0}
                      </button>
                      <button onClick={function() { navigator.share && navigator.share({ title: paroisse.name, text: pub.content }); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "#999", fontWeight: 600, fontSize: 13 }}>
                        <i className="ti ti-share" style={{ fontSize: 16 }} />
                        Partager
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {onglet === "messes" && (
            <div>
              <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>
                Horaires des messes bientot disponibles
              </div>
              {isOwner && (
                <div onClick={function() { navigate('/parish-admin/paroisse'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '9px 0', color: '#8B6020', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <i className="ti ti-edit" style={{ fontSize: 13 }} /> Modifier les horaires
                </div>
              )}
            </div>
          )}

          {onglet === "infos" && (
            <div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "16px", border: "1px solid #e8e4dc", marginBottom: 12 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: VERT }}>Informations generales</h3>
                {[
                  paroisse.denomination ? { icon: "ti-building-church", label: "Denomination", valeur: paroisse.denomination } : null,
                  ville ? { icon: "ti-map-pin", label: "Ville", valeur: ville } : null,
                  pays ? { icon: "ti-world", label: "Pays", valeur: pays } : null,
                  paroisse.location && paroisse.location.address ? { icon: "ti-home", label: "Adresse", valeur: paroisse.location.address } : null,
                  paroisse.createdAt ? { icon: "ti-calendar", label: "Creee le", valeur: formatDateLongue(paroisse.createdAt) } : null,
                ].filter(Boolean).map(function(item, i, arr) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < arr.length - 1 ? "1px solid #f0ece4" : "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: VERT + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={"ti " + item.icon} style={{ fontSize: 16, color: VERT }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#bbb", marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#2a2a2a" }}>{item.valeur}</div>
                      </div>
                    </div>
                  );
                })}
                {paroisse.description && (
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: "#2a2a2a", lineHeight: 1.6 }}>{paroisse.description}</p>
                )}
                {isOwner && (
                  <div onClick={function() { navigate('/parish-admin/paroisse'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '9px 0', color: '#8B6020', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 12 }}>
                    <i className="ti ti-edit" style={{ fontSize: 13 }} /> Modifier ces informations
                  </div>
                )}
              </div>

              {isOwner && (
                <button onClick={handleLogout} style={{ width: '100%', padding: 13, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 14, color: '#e53935', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Se deconnecter
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {isOwner && onglet === 'publications' && (
        <button onClick={function() { navigate('/create'); }} style={{ position: 'fixed', right: 20, bottom: 88, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100 }}>
          <i className="ti ti-plus" style={{ fontSize: 22, color: VERT }} />
        </button>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ background: '#F5F0E8', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', width: '100%', maxWidth: 430, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT }}>{editingId ? 'Modifier la publication' : 'Nouvelle publication'}</div>
              <button onClick={function() { setShowCreate(false); setEditingId(null); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9A8E7E' }}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {TYPES_PUB.map(function(t) {
                return (
                  <div key={t.id} onClick={function() { setTypePub(t.id); }} style={{ padding: '5px 11px', borderRadius: 20, background: typePub === t.id ? t.color : 'rgba(0,0,0,0.04)', border: '1px solid ' + (typePub === t.id ? t.tc + '40' : 'rgba(0,0,0,0.08)'), fontSize: 9, color: typePub === t.id ? t.tc : '#7A6E5E', cursor: 'pointer', fontWeight: typePub === t.id ? 700 : 400 }}>
                    {t.label}
                  </div>
                );
              })}
            </div>
            <textarea value={texte} onChange={function(e) { setTexte(e.target.value); }} placeholder="Partagez une nouvelle avec vos fideles..." style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: 12, fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', height: 100, background: 'white', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={function() { setShowCreate(false); setEditingId(null); }} style={{ flex: 1, padding: 11, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 12, color: '#7A6E5E', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Annuler</button>
              <button onClick={publier} style={{ flex: 2, padding: 11, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 12, color: OR, fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>{editingId ? 'Enregistrer' : 'Publier'}</button>
            </div>
          </div>
        </div>
      )}

      {showStoryForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ background: '#F5F0E8', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', width: '100%', maxWidth: 430, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT }}>Nouvelle story</div>
              <button onClick={function() { setShowStoryForm(false); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9A8E7E' }}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div style={{ fontSize: 10, color: '#9A8E7E', marginBottom: 10 }}>Collez l'URL d'une image (l'upload direct n'est pas encore disponible).</div>
            <input value={storyImageUrl} onChange={function(e) { setStoryImageUrl(e.target.value); }} placeholder="https://..." style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: 12, fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
            <input value={storyCaption} onChange={function(e) { setStoryCaption(e.target.value); }} placeholder="Legende (optionnel)" style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: 12, fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={function() { setShowStoryForm(false); }} style={{ flex: 1, padding: 11, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 12, color: '#7A6E5E', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Annuler</button>
              <button onClick={creerStory} style={{ flex: 2, padding: 11, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 12, color: OR, fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Publier la story</button>
            </div>
          </div>
        </div>
      )}

      {editionPhotoOuverte && editUrl && (
        <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '44px 16px 12px' }}>
            <div onClick={annulerEditionPhoto} style={{ color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{editionPhotoOuverte === 'profil' ? 'Photo de profil' : 'Photo de couverture'}</div>
            <div onClick={validerEditionPhoto} style={{ color: OR, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Valider</div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 20, boxSizing: 'border-box' }}>
            <div
              ref={editConteneurRef}
              onMouseDown={editDemarrerGlisser} onMouseMove={editBougerGlisser} onMouseUp={editArreterGlisser} onMouseLeave={editArreterGlisser}
              onTouchStart={editDemarrerGlisser} onTouchMove={editBougerGlisser} onTouchEnd={editArreterGlisser}
              style={{
                position: 'relative', overflow: 'hidden', cursor: 'grab',
                width: editionPhotoOuverte === 'profil' ? 260 : '100%',
                aspectRatio: editionPhotoOuverte === 'profil' ? '1 / 1' : '3 / 1',
                borderRadius: editionPhotoOuverte === 'profil' ? '50%' : 12,
                background: '#111',
              }}
            >
              <img
                src={editUrl}
                alt="edition"
                draggable="false"
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', filter: editStyleFiltre(), transform: 'translate(' + editOffsetX + 'px,' + editOffsetY + 'px) scale(' + editZoom + ')' }}
              />
            </div>
          </div>

          <div style={{ padding: '10px 16px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <i className="ti ti-zoom-out" style={{ color: '#fff', fontSize: 14 }} />
              <input type="range" min="1" max="2.5" step="0.05" value={editZoom} onChange={function(e) { editChangerZoom(parseFloat(e.target.value)); }} style={{ flex: 1 }} />
              <i className="ti ti-zoom-in" style={{ color: '#fff', fontSize: 14 }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
              <button onClick={function() { setEditAuto(function(v) { return !v; }); }} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', background: editAuto ? OR : 'rgba(255,255,255,0.12)', color: editAuto ? VERT : '#fff', fontSize: 16 }} title="Ajustement automatique">
                <i className="ti ti-sparkles" />
              </button>
              <button onClick={function() { setEditShowFiltres(function(v) { return !v; }); }} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', background: editShowFiltres ? OR : 'rgba(255,255,255,0.12)', color: editShowFiltres ? VERT : '#fff', fontSize: 16 }} title="Filtres">
                <i className="ti ti-palette" />
              </button>
            </div>

            {editShowFiltres && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', justifyContent: 'center' }}>
                {EDIT_FILTRES.map(function(f) {
                  const actif = editFiltre === f.id;
                  return (
                    <div key={f.id} onClick={function() { setEditFiltre(f.id); }} style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 8, backgroundImage: 'url(' + editUrl + ')', backgroundSize: 'cover', backgroundPosition: 'center', filter: f.css, border: actif ? '2px solid ' + OR : '1.5px solid rgba(255,255,255,0.4)' }} />
                      <div style={{ fontSize: 8, color: '#fff', marginTop: 3 }}>{f.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
