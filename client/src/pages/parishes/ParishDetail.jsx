import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { parishesApi, postsApi, storiesApi } from '../../services/api';

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

const GESTION_ITEMS = [
  { icon: 'ti-article',        titre: 'Publications & Stories', sous: 'Gerer vos posts et stories',    route: '/parish-admin/publications', couleur: '#2E5C3E' },
  { icon: 'ti-file-description',titre: 'Demandes des fideles',  sous: 'Valider ou rejeter',              route: '/parish-admin/demandes',     couleur: '#b71c1c' },
  { icon: 'ti-currency-dollar', titre: 'Dons & Campagnes',      sous: 'Campagnes et historique',         route: '/parish-admin/dons',         couleur: '#8B6020' },
  { icon: 'ti-users',           titre: 'Fideles & Paroissiens', sous: 'Communaute et contacts',           route: '/parish-admin/fideles',      couleur: '#1565c0' },
  { icon: 'ti-shield',          titre: 'Moderation',             sous: 'Commentaires signales',            route: '/parish-admin/moderation',   couleur: '#6a1b9a' },
  { icon: 'ti-affiliate',       titre: 'Branches & Groupes',    sous: 'Chorale, Jeunes, Pastoral...',     route: '/parish-admin/branches',     couleur: '#2e7d32' },
  { icon: 'ti-broadcast',       titre: 'Gestion Live',           sous: 'Lancer et gerer vos directs',      route: '/parish-admin/live',         couleur: '#c62828' },
  { icon: 'ti-settings',        titre: 'Ma Paroisse',            sous: 'Infos, horaires, admins',          route: '/parish-admin/paroisse',     couleur: VERT },
];

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

  const fileCouvertureRef = useRef(null);
  const fileProfilRef = useRef(null);
  const [photoCouverture, setPhotoCouverture] = useState(null);
  const [photoProfil, setPhotoProfil] = useState(null);
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

  function rafraichirPosts() {
    postsApi.getAll({ parishId: id, limit: 30 }).then(function(res) {
      const items = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || [])) : [];
      setPosts(items);
    }).catch(function(e) { console.log('Posts:', e.message); });
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

  function handleCouverture(e) {
    const file = e.target.files && e.target.files[0];
    if (file) setPhotoCouverture(URL.createObjectURL(file));
  }

  function handleProfil(e) {
    const file = e.target.files && e.target.files[0];
    if (file) setPhotoProfil(URL.createObjectURL(file));
  }

  async function handleLogout() {
    try { await logout(); } catch (e) { /* ignore */ }
    localStorage.removeItem('jb_admin_token');
    localStorage.removeItem('jb_admin_user');
    localStorage.removeItem('jb_admin_parish');
    navigate('/login');
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
    // Suppression definitive reelle non exposee cote API pour l'instant (protection des donnees) ;
    // on masque la publication de maniere durable via isActive=false.
    try {
      await postsApi.remove(post._id);
      rafraichirPosts();
    } catch (e) {
      console.log('Supprimer:', e.message);
    }
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

  return (
    <AppShell>
      <div style={{ background: "#f7f5f0", minHeight: "100vh", paddingBottom: 80 }}>

        {/* PHOTO DE COUVERTURE */}
        <div style={{ position: "relative", height: 180, background: (photoCouverture || paroisse.logoUrl) ? "none" : "linear-gradient(135deg, #1e2d14 0%, #2d4a1e 100%)", overflow: "visible" }}>
          {(photoCouverture || paroisse.logoUrl)
            ? <img src={photoCouverture || paroisse.logoUrl} alt="couverture" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
              <input ref={fileCouvertureRef} type="file" accept="image/*" onChange={handleCouverture} style={{ display: "none" }} />
            </label>
          )}

          <div style={{ position: "absolute", bottom: -40, left: 16 }}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #fff", overflow: "hidden", background: VERT, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", fontSize: 28, fontWeight: 700, color: OR }}>
                {photoProfil
                  ? <img src={photoProfil} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (paroisse.name || '??').substring(0, 2).toUpperCase()
                }
              </div>
              {isOwner && (
                <label style={{ position: "absolute", bottom: 0, right: 0, background: OR, border: "2px solid #fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="ti ti-camera" style={{ fontSize: 13, color: VERT }} />
                  <input ref={fileProfilRef} type="file" accept="image/*" onChange={handleProfil} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* HEADER INFO */}
        <div style={{ background: VERT, padding: "44px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: OR, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{paroisse.denomination || ''}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{paroisse.name}</div>
            </div>
            {isOwner ? (
              <div style={{ background: OR, color: VERT, borderRadius: 10, padding: '6px 12px', fontWeight: 700, fontSize: 12 }}>Vous gerez cette page</div>
            ) : (
              <button onClick={function() { setSuivie(function(p) { return !p; }); }} style={{ background: suivie ? OR : "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: suivie ? VERT : "#fff", fontWeight: 700, fontSize: 12 }}>
                <i className={"ti " + (suivie ? "ti-heart-filled" : "ti-heart")} style={{ fontSize: 14 }} />
                {suivie ? "Suivi" : "Suivre"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {ville && (
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 13, color: OR }} />
                <span style={{ fontSize: 12, color: "#fff" }}>{ville}{pays ? ', ' + pays : ''}</span>
              </div>
            )}
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-users" style={{ fontSize: 13, color: OR }} />
              <span style={{ fontSize: 12, color: "#fff" }}>{(paroisse.stats && paroisse.stats.memberCount) || 0} fideles</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{posts.length}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)" }}>Publications</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: OR }}>{(paroisse.stats && paroisse.stats.memberCount) || 0}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)" }}>Fideles</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{posts.reduce(function(acc, p) { return acc + (p.likes ? p.likes.length : 0) + (p.comments ? p.comments.length : 0); }, 0)}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)" }}>Interactions</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {hasCoords && (
              <button onClick={ouvrirItineraire} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 16 }} /> Itineraire
              </button>
            )}
            <button onClick={function() { navigate('/donate'); }} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: OR, color: VERT, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <i className="ti ti-hand-finger" style={{ fontSize: 16 }} /> Don
            </button>
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

        {isOwner && (
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button onClick={ouvrirCreation} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#2E5C3E,#0D3B2E)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <i className="ti ti-plus" style={{ fontSize: 16 }} /> Nouvelle pub.
              </button>
              <button onClick={function() { navigate('/parish-admin/live'); }} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#c62828,#8e1616)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <i className="ti ti-broadcast" style={{ fontSize: 16 }} /> Lancer live
              </button>
            </div>

            <div style={{ fontSize: 15, fontWeight: 800, color: VERT, marginBottom: 10, fontFamily: 'Georgia,serif' }}>Gestion de la paroisse</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {GESTION_ITEMS.map(function(item, i) {
                return (
                  <div key={i} onClick={function() { navigate(item.route); }} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: '1px solid #e8e4dc', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: item.couleur + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={'ti ' + item.icon} style={{ fontSize: 18, color: item.couleur }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2a2a2a' }}>{item.titre}</div>
                      <div style={{ fontSize: 11, color: '#9A8E7E' }}>{item.sous}</div>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 16, color: '#ccc' }} />
                  </div>
                );
              })}
            </div>

            <button onClick={handleLogout} style={{ width: '100%', padding: 13, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 14, color: '#e53935', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
              Se deconnecter
            </button>
          </div>
        )}

        <div style={{ padding: "16px 16px 0" }}>

          {isOwner && onglet === "publications" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Vos stories (24h)</div>
                <div onClick={function() { setShowStoryForm(true); }} style={{ fontSize: 11, color: '#8B6020', fontWeight: 700, cursor: 'pointer' }}>Nouvelle +</div>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
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
                          <span style={{ fontSize: 13, fontWeight: 800, color: OR }}>{(paroisse.name || '??').substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: VERT }}>{paroisse.name}</div>
                          <div style={{ fontSize: 11, color: "#bbb" }}>{formatTemps(pub.createdAt)}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: tc.color, color: tc.tc }}>{tc.label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "#2a2a2a", lineHeight: 1.6 }}>{pub.content}</p>
                    </div>

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
            <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>
              Horaires des messes bientot disponibles
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
              </div>
              {paroisse.description && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "16px", border: "1px solid #e8e4dc" }}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: VERT }}>A propos</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#2a2a2a", lineHeight: 1.6 }}>{paroisse.description}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {isOwner && onglet === 'publications' && (
        <button onClick={ouvrirCreation} style={{ position: 'fixed', right: 20, bottom: 88, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100 }}>
          <i className="ti ti-plus" style={{ fontSize: 22, color: VERT }} />
        </button>
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
    </AppShell>
  );
}
