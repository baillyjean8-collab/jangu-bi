import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const COULEURS = [
  'linear-gradient(135deg,#C8A84B,#8B6020)',
  'linear-gradient(135deg,#1565C0,#0a2a5e)',
  'linear-gradient(135deg,#6a1b9a,#2d0050)',
  'linear-gradient(135deg,#b71c1c,#4a0000)',
  'linear-gradient(135deg,#1e2d14,#0C0A06)',
];

function getInitiales(user) {
  return ((user.firstName || '')[0] || '') + ((user.lastName || '')[0] || '');
}

function getCouleur(id) {
  if (!id) return COULEURS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return COULEURS[Math.abs(h) % COULEURS.length];
}

export default function AdminFideles() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState('');
  const [onglet, setOnglet]       = useState('tous');
  const [fideles, setFideles]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [action, setAction]       = useState(null);
  const [message, setMessage]     = useState('');
  const token = localStorage.getItem('jb_admin_token');

  async function loadFideles() {
    try {
      const q = new URLSearchParams({ limit: 50, type: onglet !== 'tous' ? onglet : '' }).toString();
      const res = await fetch('/api/parish-admin/fideles?' + q, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data && data.data) {
        setFideles(Array.isArray(data.data) ? data.data : (data.data.items || []));
      }
    } catch(e) { console.log('Fideles:', e.message); }
    finally { setLoading(false); }
  }

  useEffect(function() { if (token) loadFideles(); }, [onglet]);

  const filtres = fideles.filter(function(f) {
    if (!recherche) return true;
    const nom = ((f.firstName || '') + ' ' + (f.lastName || '')).toLowerCase();
    return nom.includes(recherche.toLowerCase()) || (f.phone || '').includes(recherche);
  });

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 14px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={function() { navigate('/parish-admin/dashboard'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
          </button>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Fidèles</div>
            <div style={{ fontSize: 9, color: 'rgba(200,168,75,0.5)' }}>{fideles.length} membres chargés</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <i className="ti ti-search" style={{ fontSize: 14, color: 'rgba(200,168,75,0.6)' }} />
          <input value={recherche} onChange={function(e) { setRecherche(e.target.value); }} placeholder="Rechercher un fidèle..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 11, color: IVOIRE, fontFamily: 'Georgia,serif', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['tous','paroissiens','abonnes'].map(function(o) {
            return (
              <div key={o} onClick={function() { setOnglet(o); }} style={{ padding: '4px 12px', borderRadius: 20, background: onglet===o ? OR : 'rgba(255,255,255,0.08)', color: onglet===o ? VERT : 'rgba(245,240,232,0.5)', fontSize: 9, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                {o === 'tous' ? 'Tous' : o === 'paroissiens' ? 'Paroissiens' : 'Abonnés'}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>}
        {!loading && filtres.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>Aucun fidèle trouvé</div>
        )}
        {filtres.map(function(f) {
          const initiales = getInitiales(f);
          const estParoissien = !!f.parishId;
          return (
            <div key={f._id} style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div onClick={function() { setExpanded(expanded === f._id ? null : f._id); }} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: getCouleur(f._id), border: '2px solid ' + OR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initiales || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{(f.firstName || '') + ' ' + (f.lastName || '')}</div>
                  <div style={{ fontSize: 9, color: '#7A6E5E' }}>{f.phone || 'Pas de téléphone'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ background: estParoissien ? 'rgba(200,168,75,0.15)' : 'rgba(30,45,20,0.08)', color: estParoissien ? '#8B6020' : VERT, padding: '2px 7px', borderRadius: 20, fontSize: 7, fontWeight: 700 }}>
                    {estParoissien ? '✝️ Paroissien' : '👁 Abonné'}
                  </span>
                  {f.isSuspended && <span style={{ background: 'rgba(229,57,53,0.1)', color: '#e53935', padding: '2px 7px', borderRadius: 20, fontSize: 7, fontWeight: 700 }}>Suspendu</span>}
                </div>
              </div>
              {expanded === f._id && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '10px 0' }}>
                    <div style={{ background: '#F5F0E8', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 8, color: '#7A6E5E' }}>Dons totaux</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: OR }}>{(f.totalDons || 0).toLocaleString('fr-SN')} FCFA</div>
                    </div>
                    <div style={{ background: '#F5F0E8', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 8, color: '#7A6E5E' }}>Statut</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: VERT }}>{f.isSuspended ? '🚫 Suspendu' : '✅ Actif'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={function() { setAction({type:'message', fidele:f}); }} style={{ flex: 1, padding: 8, background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 9, fontSize: 9, color: '#8B6020', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>💬 Message</button>
                    <button onClick={function() { setAction({type:'suspendre', fidele:f}); }} style={{ flex: 1, padding: 8, background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: 9, fontSize: 9, color: '#e65100', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>⏸ Suspendre</button>
                    <button onClick={function() { setAction({type:'signaler', fidele:f}); }} style={{ flex: 1, padding: 8, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 9, fontSize: 9, color: '#e53935', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>⚠️ Signaler</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {action && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ background: '#F5F0E8', borderRadius: '20px 20px 0 0', padding: '24px 16px 40px', width: '100%', maxWidth: 430, margin: '0 auto' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 12 }}>
              {action.type === 'message' ? '💬 Message à ' + action.fidele.firstName : action.type === 'suspendre' ? '⏸ Suspendre ' + action.fidele.firstName : '⚠️ Signaler ' + action.fidele.firstName}
            </div>
            {action.type === 'message' && (
              <textarea value={message} onChange={function(e) { setMessage(e.target.value); }} placeholder="Votre message..." style={{ width: '100%', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 10, fontSize: 11, fontFamily: 'Georgia,serif', resize: 'none', height: 90, boxSizing: 'border-box', outline: 'none', color: VERT, marginBottom: 10 }} />
            )}
            {action.type === 'suspendre' && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {['24h','3j','7j','30j'].map(function(d) {
                  return <div key={d} style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', fontSize: 10, color: '#8B6020', cursor: 'pointer', fontWeight: 700 }}>{d}</div>;
                })}
              </div>
            )}
            {action.type === 'signaler' && (
              <textarea placeholder="Motif du signalement..." style={{ width: '100%', border: '1.5px solid rgba(229,57,53,0.2)', borderRadius: 10, padding: 10, fontSize: 11, fontFamily: 'Georgia,serif', resize: 'none', height: 70, boxSizing: 'border-box', outline: 'none', color: VERT, marginBottom: 12 }} />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setAction(null); }} style={{ flex: 1, padding: 12, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 12, color: '#7A6E5E', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Annuler</button>
              <button onClick={function() { setAction(null); }} style={{ flex: 1, padding: 12, background: action.type === 'signaler' ? '#e53935' : action.type === 'suspendre' ? '#e65100' : 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 12, color: action.type === 'message' ? OR : 'white', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                {action.type === 'message' ? 'Envoyer' : action.type === 'suspendre' ? 'Suspendre' : 'Signaler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
