import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';

const OR     = '#C8A84B';
const VERT   = '#1e2d14';
const IVOIRE = '#F5F0E8';
const BOGOLAN = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const STATUTS = {
  en_attente:  { label: 'En attente',  bg: '#FFF8E1', color: '#8B6020' },
  en_cours:    { label: 'En cours',    bg: '#E3F2FD', color: '#1565C0' },
  validee:     { label: 'Validée',     bg: 'rgba(16,185,129,0.12)', color: '#065F46' },
  rejetee:     { label: 'Rejetée',     bg: 'rgba(229,57,53,0.1)', color: '#c62828' },
};

const DEMANDES_MOCK = [
  { id:1, type:'Extrait de baptême',    icon:'💧', date:'28 juin 2026', paroisse:'Paroisse Saint-Pierre',  statut:'en_cours',   ref:'JB-20260628', montant:250  },
  { id:2, type:'Demande de messe',      icon:'⛪', date:'25 juin 2026', paroisse:'Paroisse Sacré-Cœur',    statut:'validee',    ref:'JB-20260625', montant:4000 },
  { id:3, type:'Rendez-vous prêtre',    icon:'📅', date:'20 juin 2026', paroisse:'Paroisse Saint-Joseph',  statut:'validee',    ref:'JB-20260620', montant:0    },
  { id:4, type:'Cert. de confirmation', icon:'🔥', date:'10 juin 2026', paroisse:'Cathédrale Notre-Dame',  statut:'en_attente', ref:'JB-20260610', montant:250  },
  { id:5, type:'Cert. de communion',    icon:'🍞', date:'01 juin 2026', paroisse:'Paroisse Sainte-Anne',   statut:'rejetee',    ref:'JB-20260601', montant:250  },
];

export default function MesDemandesPage() {
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState('tout');
  const [detailId, setDetailId] = useState(null);

  const filtrees = DEMANDES_MOCK.filter(d => filtre === 'tout' || d.statut === filtre);
  const detail = DEMANDES_MOCK.find(d => d.id === detailId);

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE, backgroundImage: BOGOLAN, paddingBottom: 90 }}>

        {/* Header */}
        <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 16px 18px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
            </button>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Mes demandes</div>
          </div>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[['tout','Tout'],['en_attente','En attente'],['en_cours','En cours'],['validee','Validée'],['rejetee','Rejetée']].map(([id, label]) => (
              <div key={id} onClick={() => setFiltre(id)} style={{ background: filtre===id ? 'rgba(200,168,75,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (filtre===id ? 'rgba(200,168,75,0.4)' : 'rgba(255,255,255,0.1)'), borderRadius: 20, padding: '4px 13px', fontSize: 9, color: filtre===id ? OR : 'rgba(245,240,232,0.55)', fontWeight: filtre===id ? 700 : 400, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrees.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>
              Aucune demande dans cette catégorie
            </div>
          )}
          {filtrees.map(d => {
            const s = STATUTS[d.statut];
            return (
              <div key={d.id} onClick={() => setDetailId(d.id)} style={{ background: 'white', borderRadius: 16, padding: '14px 14px', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{d.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{d.type}</div>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#7A6E5E', marginBottom: 2 }}>{d.paroisse}</div>
                    <div style={{ fontSize: 10, color: '#9A8E7E' }}>Envoyée le {d.date}</div>
                    {d.montant > 0 && <div style={{ fontSize: 10, color: OR, fontWeight: 700, marginTop: 4 }}>{d.montant.toLocaleString('fr-SN')} FCFA</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal détail */}
        {detail && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
            <div style={{ background: IVOIRE, backgroundImage: BOGOLAN, borderRadius: '20px 20px 0 0', padding: '24px 16px 40px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: VERT }}>Détail de la demande</div>
                <button onClick={() => setDetailId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9A8E7E' }}>✕</button>
              </div>
              <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                {[
                  ['Référence', detail.ref],
                  ['Service', detail.type],
                  ['Paroisse', detail.paroisse],
                  ['Date', detail.date],
                  ['Statut', STATUTS[detail.statut].label],
                  ['Montant', detail.montant > 0 ? detail.montant.toLocaleString('fr-SN') + ' FCFA' : 'Gratuit'],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <span style={{ fontSize: 11, color: '#7A6E5E', fontFamily: 'Georgia,serif' }}>{k}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{v}</span>
                  </div>
                ))}
              </div>
              {detail.statut === 'rejetee' && (
                <div style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#c62828', fontFamily: 'Georgia,serif', lineHeight: 1.6 }}>
                    ℹ️ Votre demande a été rejetée. Veuillez contacter la paroisse pour plus d'informations.
                  </div>
                </div>
              )}
              <button onClick={() => navigate('/demandes')} style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 14, color: VERT, fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                Faire une nouvelle demande
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
