import { useState } from 'react';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';


const BRANCHES_MOCK = [
  { id:1, nom:'Chorale Saint-Cécile',     type:'prive',  membres:24, admin:'Marie D.', actif:true,  emoji:'🎵' },
  { id:2, nom:'Conseil pastoral',          type:'public', membres:12, admin:'Père Jean', actif:true, emoji:'⛪' },
  { id:3, nom:'Mouvement des jeunes',      type:'prive',  membres:67, admin:'Amadou D.', actif:true, emoji:'✝️' },
  { id:4, nom:'Caritas paroissiale',       type:'public', membres:8,  admin:'Fatou M.', actif:false, emoji:'❤️' },
];

export default function AdminBranches() {
  const [branches, setBranches] = useState(BRANCHES_MOCK);
  const [showCreate, setShowCreate] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newType, setNewType] = useState('public');

  function creerBranche() {
    if (!newNom.trim()) return;
    setBranches(prev => [...prev, { id: Date.now(), nom: newNom, type: newType, membres: 0, admin: 'À définir', actif: true, emoji: '📌' }]);
    setNewNom(''); setShowCreate(false);
  }

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 14px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Nos Branches</div>
            <div style={{ fontSize: 9, color: 'rgba(200,168,75,0.5)', marginTop: 2 }}>{branches.length} branches · groupes et mouvements</div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 9, color: VERT, fontWeight: 700, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>+ Créer</button>
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 4 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: OR }}>{branches.filter(b=>b.type==='public').length}</div>
            <div style={{ fontSize: 9, color: '#7A6E5E' }}>Pages publiques</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: VERT }}>{branches.filter(b=>b.type==='prive').length}</div>
            <div style={{ fontSize: 9, color: '#7A6E5E' }}>Groupes privés</div>
          </div>
        </div>

        {branches.map(b => (
          <div key={b.id} style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)', opacity: b.actif ? 1 : 0.6 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: b.type === 'prive' ? 'linear-gradient(135deg,#1e2d14,#0a140a)' : 'rgba(200,168,75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: `1.5px solid ${b.type==='prive' ? 'rgba(200,168,75,0.3)' : 'rgba(200,168,75,0.2)'}` }}>
                {b.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{b.nom}</div>
                <div style={{ fontSize: 9, color: '#7A6E5E', marginTop: 2 }}>{b.membres} membres · Admin : {b.admin}</div>
              </div>
              <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 8, fontWeight: 700, background: b.type==='prive' ? 'rgba(30,45,20,0.08)' : 'rgba(200,168,75,0.12)', color: b.type==='prive' ? VERT : '#8B6020' }}>
                {b.type === 'prive' ? '🔒 Privé' : '🌐 Public'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button style={{ flex: 1, padding: '7px 4px', background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 9, fontSize: 9, color: '#8B6020', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>✏️ Gérer</button>
              <button style={{ flex: 1, padding: '7px 4px', background: 'rgba(30,45,20,0.06)', border: '1px solid rgba(30,45,20,0.1)', borderRadius: 9, fontSize: 9, color: VERT, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>👥 Membres</button>
              <button onClick={() => setBranches(prev => prev.map(br => br.id===b.id ? {...br,actif:!br.actif} : br))} style={{ flex: 1, padding: '7px 4px', background: b.actif ? 'rgba(229,57,53,0.08)' : 'rgba(16,185,129,0.1)', border: `1px solid ${b.actif ? 'rgba(229,57,53,0.2)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 9, fontSize: 9, color: b.actif ? '#e53935' : '#065F46', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                {b.actif ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: IVOIRE, backgroundImage: BOGOLAN, borderRadius: '20px 20px 0 0', padding: '20px 16px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 14 }}>Créer une branche</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>NOM DE LA BRANCHE</div>
              <input value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Ex: Chorale, Conseil pastoral..." style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 8 }}>TYPE DE PAGE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={() => setNewType('public')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${newType==='public' ? OR : 'rgba(0,0,0,0.08)'}`, background: newType==='public' ? 'rgba(200,168,75,0.08)' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🌐</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Publique</div>
                  <div style={{ fontSize: 9, color: '#7A6E5E', marginTop: 2 }}>Visible par tous</div>
                </div>
                <div onClick={() => setNewType('prive')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${newType==='prive' ? OR : 'rgba(0,0,0,0.08)'}`, background: newType==='prive' ? 'rgba(200,168,75,0.08)' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🔒</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Privée</div>
                  <div style={{ fontSize: 9, color: '#7A6E5E', marginTop: 2 }}>Membres invités</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: 11, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia,serif', color: '#7A6E5E' }}>Annuler</button>
              <button onClick={creerBranche} style={{ flex: 1, padding: 11, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 12, fontSize: 12, color: OR, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
