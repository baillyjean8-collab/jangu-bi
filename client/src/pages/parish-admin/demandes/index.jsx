import { useState, useEffect } from 'react';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';


const DEMANDES_MOCK = [
  { id:1, type:'Extrait de baptême',     icon:'💧', nom:'Amadou Diallo',  tel:'+221 77 123 45 67', ref:'JB-20260628', date:'28 juin 2026', montant:250,  statut:'en_attente', paroisse:'Sacré-Cœur' },
  { id:2, type:'Demande de messe',       icon:'⛪', nom:'Fatou Mbaye',    tel:'+221 76 987 65 43', ref:'JB-20260627', date:'27 juin 2026', montant:4000, statut:'en_attente', paroisse:'Sacré-Cœur' },
  { id:3, type:'Rendez-vous prêtre',     icon:'📅', nom:'Marie Diallo',   tel:'+221 78 234 56 78', ref:'JB-20260626', date:'26 juin 2026', montant:0,    statut:'en_attente', paroisse:'Sacré-Cœur' },
  { id:4, type:'Cert. de confirmation',  icon:'🔥', nom:'Joseph Mendy',   tel:'+221 77 456 78 90', ref:'JB-20260620', date:'20 juin 2026', montant:250,  statut:'en_cours',   paroisse:'Sacré-Cœur' },
  { id:5, type:'Cert. de communion',     icon:'🍞', nom:'Thérèse Ndiaye', tel:'+221 76 345 67 89', ref:'JB-20260615', date:'15 juin 2026', montant:250,  statut:'validee',    paroisse:'Sacré-Cœur' },
  { id:6, type:'Extrait de mariage',     icon:'💍', nom:'Pierre Faye',    tel:'+221 77 567 89 01', ref:'JB-20260610', date:'10 juin 2026', montant:500,  statut:'rejetee',    paroisse:'Sacré-Cœur' },
];

const STATUTS = {
  en_attente: { label:'En attente', bg:'rgba(229,57,53,0.1)',    color:'#e53935' },
  en_cours:   { label:'En cours',   bg:'rgba(21,101,192,0.1)',   color:'#1565C0' },
  validee:    { label:'Validée',    bg:'rgba(16,185,129,0.12)',  color:'#065F46' },
  rejetee:    { label:'Rejetée',    bg:'rgba(229,57,53,0.1)',    color:'#c62828' },
};

export default function AdminDemandes() {
  const [filtre, setFiltre] = useState('tous');
  const [demandes, setDemandes] = useState(DEMANDES_MOCK);
  const [selected, setSelected] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');

  async function loadDemandes() {
    try {
      const token = localStorage.getItem('jb_admin_token');
      if (!token) return;
      const res = await fetch('/api/parish-admin/demandes?limit=50', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data?.data?.items) setDemandes(data.data.items.map(d => ({
        id: d._id,
        icon: '📄',
        type: d.content || d.type || 'Demande',
        nom: (d.userId?.firstName || '') + ' ' + (d.userId?.lastName || ''),
        tel: d.userId?.phone || '',
        ref: 'JB-' + d._id?.slice(-8)?.toUpperCase(),
        date: new Date(d.createdAt).toLocaleDateString('fr-FR'),
        montant: d.metadata?.montant || 0,
        statut: d.metadata?.status || 'en_attente',
      })));
    } catch(e) { console.log('Demandes API:', e.message); }
  }

  useEffect(() => { loadDemandes(); }, []);
  const [showRejet, setShowRejet] = useState(false);

  function changerStatut(id, statut) {
    setDemandes(prev => prev.map(d => d.id === id ? {...d, statut} : d));
    setSelected(null); setShowRejet(false);
  }

  const filtrees = filtre === 'tous' ? demandes : demandes.filter(d => d.statut === filtre);
  const detail = demandes.find(d => d.id === selected);

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 14px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE, marginBottom: 4 }}>
          Demandes <span style={{ fontSize: 12, color: 'rgba(200,168,75,0.6)', fontWeight: 400 }}>— {demandes.filter(d=>d.statut==='en_attente').length} en attente</span>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[['tous','Tous'],['en_attente','En attente'],['en_cours','En cours'],['validee','Validées'],['rejetee','Rejetées']].map(([id,label]) => (
            <div key={id} onClick={() => setFiltre(id)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Georgia,serif', background: filtre===id ? OR : 'rgba(255,255,255,0.08)', color: filtre===id ? VERT : 'rgba(245,240,232,0.5)' }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtrees.map(d => {
          const s = STATUTS[d.statut];
          return (
            <div key={d.id} style={{ background: 'white', borderRadius: 16, padding: 14, border: `1px solid ${d.statut==='en_attente' ? 'rgba(229,57,53,0.2)' : 'rgba(0,0,0,0.06)'}`, borderLeft: d.statut==='en_attente' ? '3px solid #e53935' : '3px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{d.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{d.type}</div>
                    <div style={{ fontSize: 10, color: '#7A6E5E', marginTop: 2 }}>{d.nom}</div>
                    <div style={{ fontSize: 9, color: '#9A8E7E' }}>Réf. {d.ref} · {d.date}</div>
                    {d.montant > 0 && <div style={{ fontSize: 9, color: OR, fontWeight: 700, marginTop: 2 }}>{d.montant.toLocaleString('fr-SN')} FCFA</div>}
                  </div>
                </div>
                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 8, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
              </div>
              {d.statut === 'en_attente' && (
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => changerStatut(d.id, 'validee')} style={{ flex: 1, padding: '8px 4px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, fontSize: 10, color: '#065F46', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>✓ Valider</button>
                  <button onClick={() => { setSelected(d.id); setShowRejet(true); }} style={{ flex: 1, padding: '8px 4px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 10, color: '#e53935', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>✕ Rejeter</button>
                  <button onClick={() => setSelected(d.id)} style={{ flex: 1, padding: '8px 4px', background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 10, fontSize: 10, color: '#8B6020', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>💬 Contact</button>
                </div>
              )}
              {d.statut === 'en_cours' && (
                <button onClick={() => changerStatut(d.id, 'validee')} style={{ width: '100%', padding: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, fontSize: 10, color: '#065F46', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>✓ Marquer comme validée</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal rejet avec motif */}
      {showRejet && detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: IVOIRE, backgroundImage: BOGOLAN, borderRadius: '20px 20px 0 0', padding: '20px 16px 40px' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 12 }}>Rejeter la demande</div>
            <div style={{ fontSize: 12, color: '#7A6E5E', marginBottom: 12 }}>Motif du rejet (envoyé au fidèle) :</div>
            <textarea value={motifRejet} onChange={e => setMotifRejet(e.target.value)} placeholder="Ex: Documents manquants, veuillez nous contacter..." style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', height: 80, background: 'white', outline: 'none', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowRejet(false)} style={{ flex: 1, padding: 11, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia,serif', color: '#7A6E5E' }}>Annuler</button>
              <button onClick={() => changerStatut(selected, 'rejetee')} style={{ flex: 1, padding: 11, background: '#e53935', border: 'none', borderRadius: 12, fontSize: 12, color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
