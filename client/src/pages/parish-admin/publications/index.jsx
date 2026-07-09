import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

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

const TYPES_PUB = [
  { id: 'normal',      label: 'Publication', color: 'rgba(200,168,75,0.15)', tc: '#8B6020' },
  { id: 'annonce',     label: 'Annonce',     color: 'rgba(30,45,20,0.1)',    tc: '#1e2d14' },
  { id: 'inscription', label: 'Inscription', color: 'rgba(21,101,192,0.1)',  tc: '#1565C0' },
  { id: 'collecte',    label: 'Collecte',    color: 'rgba(200,168,75,0.15)', tc: '#8B6020' },
  { id: 'evenement',   label: 'Evenement',   color: 'rgba(106,27,154,0.1)', tc: '#6a1b9a' },
  { id: 'media',       label: 'Media',       color: 'rgba(183,28,28,0.08)', tc: '#b71c1c' },
];

const FILTRES = ['tous', 'annonce', 'inscription', 'collecte', 'evenement'];

export default function AdminPublications() {
  const navigate = useNavigate();
  const [filtre, setFiltre]         = useState('tous');
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [texte, setTexte]           = useState('');
  const [typePub, setTypePub]       = useState('normal');
  const token = localStorage.getItem('jb_admin_token');

  async function loadPosts() {
    try {
      const res = await fetch('/api/posts?limit=30', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data && data.data) {
        const items = Array.isArray(data.data) ? data.data : (data.data.items || data.data.data || []);
        setPosts(items);
      }
    } catch(e) { console.log('Posts:', e.message); }
    finally { setLoading(false); }
  }

  useEffect(function() { if (token) loadPosts(); }, []);

  function ouvrirCreation() {
    setEditingId(null);
    setTexte('');
    setTypePub('normal');
    setShowCreate(true);
  }

  function ouvrirEdition(post) {
    setEditingId(post._id);
    setTexte(post.content || post.text || '');
    setTypePub((post.type || 'normal').toLowerCase());
    setShowCreate(true);
  }

  async function publier() {
    if (!texte.trim()) return;
    try {
      const isEdit = !!editingId;
      const url = isEdit ? '/api/posts/' + editingId : '/api/posts';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: texte, type: typePub.toUpperCase() }),
      });
      if (res.ok) {
        setTexte(''); setShowCreate(false); setEditingId(null);
        loadPosts();
      }
    } catch(e) { console.log('Publier:', e.message); }
  }

  async function supprimer(id) {
    try {
      await fetch('/api/posts/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      setPosts(function(prev) { return prev.filter(function(p) { return p._id !== id; }); });
    } catch(e) { console.log('Delete:', e.message); }
  }

  const filtrees = posts.filter(function(p) {
    if (filtre === 'tous') return true;
    return (p.type || '').toLowerCase() === filtre;
  });

  const totalInteractions = posts.reduce(function(acc, p) {
    const likes = (p.stats && p.stats.likes) || 0;
    const comments = (p.stats && p.stats.comments) || (p.comments && p.comments.length) || 0;
    return acc + likes + comments;
  }, 0);

  const cetteSemaine = posts.filter(function(p) {
    if (!p.createdAt) return false;
    return (Date.now() - new Date(p.createdAt).getTime()) < 7 * 86400000;
  }).length;

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '16px 14px 14px', borderRadius: '0 0 22px 22px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button onClick={function() { navigate('/profile'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18, color: OR }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: IVOIRE }}>Publications</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: IVOIRE }}>{posts.length}</div>
            <div style={{ fontSize: 8, color: 'rgba(245,240,232,0.5)' }}>Publications</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: OR }}>{totalInteractions}</div>
            <div style={{ fontSize: 8, color: 'rgba(245,240,232,0.5)' }}>Interactions</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#4a9a5a' }}>{cetteSemaine}</div>
            <div style={{ fontSize: 8, color: 'rgba(245,240,232,0.5)' }}>Cette semaine</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FILTRES.map(function(f) {
            return (
              <div key={f} onClick={function() { setFiltre(f); }} style={{ padding: '5px 13px', borderRadius: 20, background: filtre===f ? OR : 'rgba(255,255,255,0.08)', color: filtre===f ? VERT : 'rgba(245,240,232,0.5)', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', textTransform: 'capitalize' }}>
                {f === 'tous' ? 'Tous' : f}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 14px 90px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>
        )}
        {!loading && filtrees.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>
            Aucune publication pour le moment
          </div>
        )}
        {filtrees.map(function(post) {
          const type = TYPES_PUB.find(function(t) { return t.id === (post.type || '').toLowerCase(); }) || TYPES_PUB[0];
          const archive = post.isPublished === false;
          return (
            <div key={post._id} style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)', opacity: archive ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1e2d14,#0C0A06)', border: '1.5px solid ' + OR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: OR, fontWeight: 700 }}>SC</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Paroisse Sacre-Coeur</div>
                    <div style={{ fontSize: 9, color: '#9A8E7E' }}>{formatTemps(post.createdAt)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={function() { ouvrirEdition(post); }} style={{ width: 26, height: 26, background: 'rgba(200,168,75,0.12)', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <i className="ti ti-edit" style={{ fontSize: 13, color: '#8B6020' }} />
                  </button>
                  <button onClick={function() { supprimer(post._id); }} style={{ width: 26, height: 26, background: 'rgba(229,57,53,0.08)', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <i className="ti ti-trash" style={{ fontSize: 13, color: '#e53935' }} />
                  </button>
                </div>
              </div>
              <div style={{ background: type.color, borderRadius: 8, padding: '3px 10px', marginBottom: 6, display: 'inline-block', fontSize: 8, color: type.tc, fontWeight: 700 }}>{type.label}</div>
              <div style={{ fontSize: 12, color: VERT, lineHeight: 1.5, marginBottom: 10, fontFamily: 'Georgia,serif' }}>{post.content || post.text || ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 8 }}>
                <div style={{ display: 'flex', gap: 14, fontSize: 10, color: '#7A6E5E' }}>
                  <span><i className="ti ti-heart" style={{ fontSize: 12, verticalAlign: -1 }} /> {post.stats && post.stats.likes || 0}</span>
                  <span><i className="ti ti-message-circle" style={{ fontSize: 12, verticalAlign: -1 }} /> {post.stats && post.stats.comments || (post.comments && post.comments.length) || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: archive ? 'rgba(0,0,0,0.05)' : 'rgba(6,95,70,0.1)', padding: '2px 8px', borderRadius: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: archive ? '#9A8E7E' : '#065F46' }} />
                  <span style={{ fontSize: 8, color: archive ? '#9A8E7E' : '#065F46', fontWeight: 700 }}>{archive ? 'Archive' : 'Publie'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={ouvrirCreation} style={{ position: 'fixed', right: 20, bottom: 88, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100 }}>
        <i className="ti ti-plus" style={{ fontSize: 22, color: VERT }} />
      </button>

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
                  <div key={t.id} onClick={function() { setTypePub(t.id); }} style={{ padding: '5px 11px', borderRadius: 20, background: typePub===t.id ? t.color : 'rgba(0,0,0,0.04)', border: '1px solid ' + (typePub===t.id ? t.tc+'40' : 'rgba(0,0,0,0.08)'), fontSize: 9, color: typePub===t.id ? t.tc : '#7A6E5E', cursor: 'pointer', fontWeight: typePub===t.id ? 700 : 400 }}>
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
    </AdminShell>
  );
}
