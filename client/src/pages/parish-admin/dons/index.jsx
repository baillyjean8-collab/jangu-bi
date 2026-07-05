import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../AdminShell';

const OR = '#C8A84B';
const VERT = '#1e2d14';
const IVOIRE = '#F5F0E8';
const BD = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';
function fmt(n) { if(!n)return '0'; if(n>=1000000)return(Math.round(n/100000)/10)+'M'; if(n>=1000)return Math.round(n/1000)+'K'; return n.toLocaleString('fr-SN'); }
function fmtDate(d) { if(!d)return ''; const diff=Date.now()-new Date(d).getTime(); const j=Math.floor(diff/86400000); if(j>0)return j+' juin 2026'; return 'Aujourd\u2019hui'; }

export default function AdminDons() {
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState('campagnes');
  const [dons, setDons] = useState([]);
  const [stats, setStats] = useState({ total: 0, count: 0, donateurs: 0 });
  const [loading, setLoading] = useState(true);
  const [showNouvelle, setShowNouvelle] = useState(false);
  const [nouvelleCamp, setNouvelleCamp] = useState({ titre: '', objectif: '', urgent: false });
  const token = localStorage.getItem('jb_admin_token');

  useEffect(function() {
    async function load() {
      try {
        const res = await fetch('/api/admin/donations?limit=50&status=SUCCESS', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (data && data.data) {
          const items = Array.isArray(data.data) ? data.data : (data.data.items || []);
          setDons(items);
          const total = items.reduce(function(s, d) { return s + (d.netAmount || d.amount || 0); }, 0);
          const donateurs = new Set(items.map(function(d) { return d.userId && (d.userId._id || d.userId); })).size;
          setStats({ total, count: items.length, donateurs });
        }
      } catch(e) { console.log('Dons:', e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const CAMPAGNES_MOCK = [
    { id: 1, titre: 'Restauration de l\u2019\u00e9glise', objectif: 15000000, collecte: 9750000, urgent: true, donateurs: 89 },
    { id: 2, titre: 'Aide aux familles d\u00e9munies', objectif: 5000000, collecte: 3200000, urgent: false, donateurs: 53 },
  ];

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BD, padding: '44px 14px 14px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={function() { navigate('/parish-admin/dashboard'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Dons & Campagnes</div>
        </div>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 700, color: OR, marginBottom: 10 }}>{fmt(stats.total)} <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(200,168,75,0.6)' }}>FCFA</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
          {[['Campagnes', CAMPAGNES_MOCK.length], ['Donateurs', stats.donateurs], ['Ce mois', stats.count]].map(function(s, i) {
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: i === 0 ? OR : IVOIRE }}>{s[1]}</div>
                <div style={{ fontSize: 8, color: 'rgba(200,168,75,0.5)' }}>{s[0]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['campagnes', 'historique'].map(function(o) {
            return (
              <div key={o} onClick={function() { setOnglet(o); }} style={{ padding: '4px 14px', borderRadius: 20, background: onglet === o ? OR : 'rgba(255,255,255,0.08)', color: onglet === o ? VERT : 'rgba(245,240,232,0.5)', fontSize: 9, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                {o === 'campagnes' ? 'Campagnes' : 'Historique'}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 14px' }}>
        {onglet === 'campagnes' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT }}>Campagnes actives</div>
              <button onClick={function() { setShowNouvelle(true); }} style={{ background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 20, padding: '5px 12px', fontSize: 9, color: VERT, fontWeight: 700, cursor: 'pointer' }}>+ Nouvelle</button>
            </div>
            {CAMPAGNES_MOCK.map(function(c) {
              const pct = Math.round(c.collecte / c.objectif * 100);
              return (
                <div key={c.id} style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 700, color: VERT }}>{c.titre}</div>
                    {c.urgent && <span style={{ background: 'rgba(229,57,53,0.1)', color: '#e53935', padding: '2px 8px', borderRadius: 20, fontSize: 8, fontWeight: 700 }}>URGENT</span>}
                  </div>
                  <div style={{ background: '#e8e4dc', borderRadius: 4, height: 7, marginBottom: 6, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg,#C8A84B,#8B6020)', borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#7A6E5E', marginBottom: 8 }}>
                    <span><strong style={{ color: OR }}>{c.collecte.toLocaleString('fr-SN')}</strong> FCFA ({pct}%)</span>
                    <span>sur {c.objectif.toLocaleString('fr-SN')} FCFA</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 8 }}>👥 {c.donateurs} donateurs</div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button style={{ flex: 1, padding: 8, background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 9, fontSize: 9, color: '#8B6020', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>✏️ Modifier</button>
                    <button style={{ flex: 1, padding: 8, background: 'rgba(229,57,53,0.06)', border: '1px solid rgba(229,57,53,0.15)', borderRadius: 9, fontSize: 9, color: '#e53935', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>⏸ Suspendre</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {onglet === 'historique' && (
          <>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 10 }}>
              Historique des dons <span style={{ fontSize: 9, color: '#9A8E7E', fontWeight: 400 }}>(nom visible admin uniquement)</span>
            </div>
            {loading && <div style={{ textAlign: 'center', padding: 20, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {dons.length === 0 && !loading && (
                <div style={{ padding: 20, textAlign: 'center', color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 12 }}>Aucun don enregistré</div>
              )}
              {dons.map(function(d, i) {
                const nom = d.isAnonymous ? 'Un fidèle' : (d.userId && d.userId.firstName ? d.userId.firstName + ' ' + d.userId.lastName : 'Un fidèle');
                const estReel = !d.isAnonymous && d.userId && d.userId.firstName;
                return (
                  <div key={d._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < dons.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>
                        {nom}
                        {estReel && <span style={{ fontSize: 8, color: '#9A8E7E', fontWeight: 400, marginLeft: 5 }}>(nom réel)</span>}
                      </div>
                      <div style={{ fontSize: 9, color: '#9A8E7E' }}>{fmtDate(d.createdAt)} · {d.provider || 'Wave'}</div>
                    </div>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 700, color: OR }}>{fmt(d.netAmount || d.amount)} F</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showNouvelle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ background: IVOIRE, borderRadius: '20px 20px 0 0', padding: '24px 16px 40px', width: '100%', maxWidth: 430, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT }}>Nouvelle campagne</div>
              <button onClick={function() { setShowNouvelle(false); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9A8E7E' }}>✕</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 4 }}>Titre</div>
              <input value={nouvelleCamp.titre} onChange={function(e) { setNouvelleCamp(function(p) { return {...p, titre: e.target.value}; }); }} placeholder="Ex: Restauration du clocher" style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 10, padding: '9px 12px', fontSize: 11, color: VERT, fontFamily: 'Georgia,serif', outline: 'none', boxSizing: 'border-box', background: 'white' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 4 }}>Objectif (FCFA)</div>
              <input value={nouvelleCamp.objectif} onChange={function(e) { setNouvelleCamp(function(p) { return {...p, objectif: e.target.value}; }); }} placeholder="Ex: 5000000" type="number" style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 10, padding: '9px 12px', fontSize: 11, color: VERT, fontFamily: 'Georgia,serif', outline: 'none', boxSizing: 'border-box', background: 'white' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowNouvelle(false); }} style={{ flex: 1, padding: 12, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 12, color: '#7A6E5E', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Annuler</button>
              <button onClick={function() { setShowNouvelle(false); }} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 12, color: VERT, fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Créer →</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
