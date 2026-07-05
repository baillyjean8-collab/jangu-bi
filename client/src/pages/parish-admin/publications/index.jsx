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
  return 'À l\u2019instant';
}

const TYPES_PUB = [
  { id: 'normal',      label: '\uD83D\uDCDD Publication', color: 'rgba(200,168,75,0.15)', tc: '#8B6020' },
  { id: 'annonce',     label: '\uD83D\uDCE2 Annonce',     color: 'rgba(30,45,20,0.1)',    tc: '#1e2d14' },
  { id: 'inscription', label: '\uD83D\uDCCB Inscription', color: 'rgba(21,101,192,0.1)',  tc: '#1565C0' },
  { id: 'collecte',    label: '\uD83D\uDCB0 Collecte',    color: 'rgba(200,168,75,0.15)', tc: '#8B6020' },
  { id: 'evenement',   label: '\uD83D\uDCC5 Événement',   color: 'rgba(106,27,154,0.1)', tc: '#6a1b9a' },
  { id: 'media',       label: '\uD83D\uDDBC Média',       color: 'rgba(183,28,28,0.08)', tc: '#b71c1c' },
];

const FILTRES = ['tous', 'annonce', 'inscription', 'collecte', 'evenement'];

export default function AdminPublications() {
  const navigate = useNavigate();
  const [filtre, setFiltre]         = useState('tous');
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
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

  async function publier() {
    if (!texte.trim()) return;
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: texte, type: typePub.toUpperCase() }),
      });
      if (res.ok) {
        setTexte(''); setShowCreate(false);
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

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 14px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={function() { navigate('/parish-admin/dashboard'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
            </button>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Publications</div>
          </div>
          <button onClick={function() { setShowCreate(true); }} style={{ background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 10, color: VERT, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} />Créer
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FILTRES.map(function(f) {
            return (
              <div key={f} onClick={function() { setFiltre(f); }} style={{ padding: '4px 12px', borderRadius: 20, background: filtre===f ? OR : 'rgba(255,255,255,0.08)', color: filtre===f ? VERT : 'rgba(245,240,232,0.5)', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', textTransform: 'capitalize' }}>
                {f === 'tous' ? 'Tous' : f}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          return (
            <div key={post._id} style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1e2d14,#0C0A06)', border: '1.5px solid ' + OR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: OR, fontWeight: 700 }}>SC</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Paroisse Sacré-Cœur</div>
                    <div style={{ fontSize: 9, color: '#9A8E7E' }}>{formatTemps(post.createdAt)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button style={{ background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 8, padding: '4px 8px', fontSize: 9, color: '#8B6020', cursor: 'pointer' }}>✏️</button>
                  <button onClick={function() { supprimer(post._id); }} style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 8, padding: '4px 8px', fontSize: 9, color: '#e53935', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
              <div style={{ background: type.color, borderRadius: 8, padding: '3px 10px', marginBottom: 6, display: 'inline-block', fontSize: 8, color: type.tc, fontWeight: 700 }}>{type.label}</div>
              <div style={{ fontSize: 12, color: VERT, lineHeight: 1.5, marginBottom: 8, fontFamily: 'Georgia,serif' }}>{post.content || post.text || ''}</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 10, color: '#7A6E5E', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 8 }}>
                <span>❤️ {post.stats && post.stats.likes || 0}</span>
                <span>💬 {post.stats && post.stats.comments || (post.comments && post.comments.length) || 0}</span>
                <span style={{ color: post.isPublished !== false ? '#065F46' : '#9A8E7E', fontWeight: 700, fontSize: 8 }}>● {post.isPublished !== false ? 'Publié' : 'Archivé'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ background: '#F5F0E8', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', width: '100%', maxWidth: 430, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT }}>Nouvelle publication</div>
              <button onClick={function() { setShowCreate(false); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9A8E7E' }}>✕</button>
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
            <textarea value={texte} onChange={function(e) { setTexte(e.target.value); }} placeholder="Partagez une nouvelle avec vos fidèles..." style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: 12, fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', height: 100, background: 'white', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={function() { setShowCreate(false); }} style={{ flex: 1, padding: 11, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 12, color: '#7A6E5E', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Annuler</button>
              <button onClick={publier} style={{ flex: 2, padding: 11, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 12, color: OR, fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Publier →</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
