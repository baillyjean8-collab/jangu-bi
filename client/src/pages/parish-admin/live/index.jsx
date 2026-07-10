import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const DEMANDES_MOCK = [
  { id:1, nom:'Fatou M.' },
  { id:2, nom:'Amadou D.' },
  { id:3, nom:'Thérèse N.' },
];

export default function AdminLive() {
  const navigate = useNavigate();
  const [enLive, setEnLive]     = useState(false);
  const [titre, setTitre]       = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [confirm, setConfirm]   = useState(false);
  const [attente, setAttente]   = useState(DEMANDES_MOCK);

  function accepter(id) { setAttente(prev => prev.filter(d => d.id !== id)); }
  function refuser(id)  { setAttente(prev => prev.filter(d => d.id !== id)); }

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 16px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Gestion Live</div>
          {enLive && <div style={{ background: '#e53935', borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'white' }}>● EN DIRECT</div>}
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!enLive ? (
          <>
            <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 12 }}>Configuration du live</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 4 }}>Titre du live</div>
                <input
                  value={titre}
                  onChange={e => setTitre(e.target.value)}
                  placeholder="Ex: Messe dominicale en direct..."
                  style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 10, padding: '9px 12px', fontSize: 11, color: VERT, fontFamily: 'Georgia,serif', outline: 'none', boxSizing: 'border-box', background: '#FAFAF8' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Caméra</div>
                  <div style={{ fontSize: 9, color: '#7A6E5E' }}>Activez votre caméra pour le live</div>
                </div>
                <div
                  onClick={() => setCameraOn(v => !v)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: cameraOn ? OR : 'rgba(0,0,0,0.1)', position: 'relative', cursor: 'pointer', transition: 'all .3s' }}
                >
                  <div style={{ position: 'absolute', top: 2, left: cameraOn ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'all .3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(200,168,75,0.06)', border: '1px solid rgba(200,168,75,0.15)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: '#8B6020', lineHeight: 1.6, fontFamily: 'Georgia,serif' }}>
                ℹ️ Une fois le live lancé, vos fidèles recevront une notification immédiate. Vous pourrez gérer les participants, accepter les demandes de montée et terminer le live à tout moment.
              </div>
            </div>

            <button
              onClick={() => titre && setConfirm(true)}
              style={{ width: '100%', padding: 14, background: titre ? 'linear-gradient(135deg,#7f0000,#3a0000)' : 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 14, color: titre ? '#ffcdd2' : '#9A8E7E', fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: titre ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <i className="ti ti-broadcast" style={{ fontSize: 18 }} />
              Lancer le live
            </button>
          </>
        ) : (
          <>
            {/* Stats live */}
            <div style={{ background: 'linear-gradient(135deg,#1e2d14,#0a140a)', borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, justifyContent: 'center' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e53935', boxShadow: '0 0 8px #e53935' }} />
                <span style={{ fontSize: 10, color: '#ffcdd2', fontWeight: 700 }}>EN DIRECT</span>
              </div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 700, color: OR, textAlign: 'center', marginBottom: 10 }}>{titre}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: IVOIRE }}>153</div>
                  <div style={{ fontSize: 7, color: 'rgba(200,168,75,0.6)' }}>Spectateurs</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#e53935' }}>{attente.length}</div>
                  <div style={{ fontSize: 7, color: 'rgba(200,168,75,0.6)' }}>En attente</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: OR }}>346</div>
                  <div style={{ fontSize: 7, color: 'rgba(200,168,75,0.6)' }}>Likes</div>
                </div>
              </div>
            </div>

            {/* Demandes de montée */}
            {attente.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 10 }}>
                  Demandes de montée ({attente.length})
                </div>
                {attente.map((d, i) => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < attente.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <span style={{ fontSize: 11, color: VERT, fontFamily: 'Georgia,serif' }}>{d.nom}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => accepter(d.id)} style={{ padding: '5px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 9, color: '#065F46', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>✓ Accepter</button>
                      <button onClick={() => refuser(d.id)} style={{ padding: '5px 10px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 8, fontSize: 9, color: '#e53935', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>✕ Refuser</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contrôles live */}
            <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 10 }}>Contrôles</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => setCameraOn(v => !v)} style={{ padding: 10, background: cameraOn ? 'rgba(16,185,129,0.1)' : 'rgba(229,57,53,0.08)', border: cameraOn ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 10, color: cameraOn ? '#065F46' : '#e53935', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>
                  {cameraOn ? '📷 Caméra ON' : '📷 Caméra OFF'}
                </button>
                <button style={{ padding: 10, background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 10, fontSize: 10, color: '#8B6020', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>
                  🎨 Fond d'écran
                </button>
              </div>
            </div>

            <button onClick={() => setEnLive(false)} style={{ width: '100%', padding: 13, background: 'rgba(229,57,53,0.08)', border: '1.5px solid rgba(229,57,53,0.3)', borderRadius: 14, color: '#e53935', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
              ⏹ Terminer le live
            </button>
          </>
        )}
      </div>

      {/* Confirmation */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: IVOIRE, borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, textAlign: 'center', marginBottom: 8 }}>Lancer le live ?</div>
            <div style={{ fontSize: 12, color: '#7A6E5E', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
              "{titre}"<br/>Vos fidèles seront notifiés immédiatement.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: 12, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 12, color: '#7A6E5E', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => { setConfirm(false); setEnLive(true); }} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#7f0000,#3a0000)', border: 'none', borderRadius: 12, color: '#ffcdd2', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                🔴 Lancer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
