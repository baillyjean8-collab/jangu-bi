import { useState, useEffect } from 'react';
import AdminShell from '../AdminShell';
import { demandesApi } from '../../../services/api';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const STATUTS = {
  en_attente: { label:'En attente', bg:'rgba(229,57,53,0.1)',    color:'#e53935' },
  validee:    { label:'Validée',    bg:'rgba(16,185,129,0.12)',  color:'#065F46' },
  rejetee:    { label:'Rejetée',    bg:'rgba(229,57,53,0.1)',    color:'#c62828' },
};

export default function AdminDemandes() {
  const [filtre, setFiltre] = useState('tous');
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [selected, setSelected] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [showRejet, setShowRejet] = useState(false);
  const [enTraitement, setEnTraitement] = useState(null);
  const [erreur, setErreur] = useState('');

  async function loadDemandes() {
    setChargement(true);
    try {
      const res = await demandesApi.getForAdmin();
      setDemandes((res && res.data && res.data.demandes) || []);
    } catch(e) {
      console.log('Demandes API:', e.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { loadDemandes(); }, []);

    async function changerStatut(id, statut, noteAdmin) {
    setEnTraitement(id);
    setErreur('');
    try {
      await demandesApi.updateStatut(id, statut, noteAdmin);
      setDemandes(prev => prev.map(d => d._id === id ? { ...d, statut, noteAdmin, dateTraitement: new Date().toISOString() } : d));
      setSelected(null);
      setShowRejet(false);
      setMotifRejet('');
    } catch(e) {
      setErreur(e.message || 'Impossible de mettre a jour le statut.');
    } finally {
      setEnTraitement(null);
    }
  }

  async function supprimerDemande(id) {
    if (!window.confirm('Supprimer definitivement cette demande ? Cette action est irreversible.')) return;
    setEnTraitement(id);
    setErreur('');
    try {
      await demandesApi.remove(id);
      setDemandes(prev => prev.filter(d => d._id !== id));
    } catch(e) {
      setErreur(e.message || 'Impossible de supprimer la demande.');
    } finally {
      setEnTraitement(null);
    }
  }

  const filtrees = filtre === 'tous' ? demandes : demandes.filter(d => d.statut === filtre);
  const detail = demandes.find(d => d._id === selected);

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 14px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE, marginBottom: 4 }}>
          Demandes <span style={{ fontSize: 12, color: 'rgba(200,168,75,0.6)', fontWeight: 400 }}>— {demandes.filter(d=>d.statut==='en_attente').length} en attente</span>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[['tous','Tous'],['en_attente','En attente'],['validee','Validées'],['rejetee','Rejetées']].map(([id,label]) => (
            <div key={id} onClick={() => setFiltre(id)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Georgia,serif', background: filtre===id ? OR : 'rgba(255,255,255,0.08)', color: filtre===id ? VERT : 'rgba(245,240,232,0.5)' }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chargement && (
          <div style={{ textAlign: 'center', padding: 30, fontSize: 13, color: '#7A6E5E' }}>Chargement...</div>
        )}
        {!chargement && filtrees.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, fontSize: 13, color: '#7A6E5E' }}>Aucune demande pour l'instant.</div>
        )}
        {erreur && (
          <div style={{ padding: '10px 14px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 12, color: '#e53935' }}>{erreur}</div>
        )}
        {filtrees.map(d => {
          const s = STATUTS[d.statut] || STATUTS.en_attente;
          const nomFidele = d.userId ? ((d.userId.firstName || '') + ' ' + (d.userId.lastName || '')) : 'Fidèle';
          return (
            <div key={d._id} style={{ background: 'white', borderRadius: 16, padding: 14, border: `1px solid ${d.statut==='en_attente' ? 'rgba(229,57,53,0.2)' : 'rgba(0,0,0,0.06)'}`, borderLeft: d.statut==='en_attente' ? '3px solid #e53935' : '3px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📄</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{d.titre}</div>
                    <div style={{ fontSize: 10, color: '#7A6E5E', marginTop: 2 }}>{nomFidele}{d.userId && d.userId.phone ? ' · ' + d.userId.phone : ''}</div>
                    <div style={{ fontSize: 9, color: '#9A8E7E' }}>Réf. {d.reference} · {d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : ''}</div>
                    {d.montant > 0 && <div style={{ fontSize: 9, color: OR, fontWeight: 700, marginTop: 2 }}>{d.montant.toLocaleString('fr-SN')} FCFA</div>}
                  </div>
                </div>
                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 8, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
              </div>
              {d.statut === 'en_attente' && (
                <div style={{ display: 'flex', gap: 7 }}>
                  <button
                    onClick={() => changerStatut(d._id, 'validee')}
                    disabled={enTraitement === d._id}
                    style={{ flex: 1, padding: '8px 4px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, fontSize: 10, color: '#065F46', cursor: enTraitement === d._id ? 'default' : 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}
                  >✓ Valider</button>
                  <button
                    onClick={() => { setSelected(d._id); setShowRejet(true); }}
                    disabled={enTraitement === d._id}
                    style={{ flex: 1, padding: '8px 4px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 10, color: '#e53935', cursor: enTraitement === d._id ? 'default' : 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}
                  >✕ Rejeter</button>
                </div>
              )}
                            {d.statut === 'rejetee' && d.noteAdmin && (
                <div style={{ fontSize: 10, color: '#9A8E7E', marginTop: 4, fontStyle: 'italic' }}>Motif : {d.noteAdmin}</div>
              )}
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <button
                  onClick={() => supprimerDemande(d._id)}
                  disabled={enTraitement === d._id}
                  style={{ background: 'none', border: 'none', color: '#9A8E7E', fontSize: 9, textDecoration: 'underline', cursor: enTraitement === d._id ? 'default' : 'pointer', fontFamily: 'Georgia,serif' }}
                >🗑 Supprimer</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal rejet avec motif */}
      {showRejet && detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: IVOIRE, backgroundImage: BOGOLAN, borderRadius: '20px 20px 0 0', padding: '20px 16px calc(24px + env(safe-area-inset-bottom))', maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 12 }}>Rejeter la demande</div>
            <div style={{ fontSize: 12, color: '#7A6E5E', marginBottom: 12 }}>Motif du rejet (envoyé au fidèle) :</div>
            <textarea value={motifRejet} onChange={e => setMotifRejet(e.target.value)} placeholder="Ex: Documents manquants, veuillez nous contacter..." style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', height: 80, background: 'white', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowRejet(false); setMotifRejet(''); }} style={{ flex: 1, padding: 11, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia,serif', color: '#7A6E5E' }}>Annuler</button>
              <button
                onClick={() => { if (motifRejet.trim()) changerStatut(selected, 'rejetee', motifRejet.trim()); }}
                disabled={!motifRejet.trim() || enTraitement === selected}
                style={{ flex: 1, padding: 11, background: motifRejet.trim() ? '#e53935' : '#e4e4e7', border: 'none', borderRadius: 12, fontSize: 12, color: 'white', fontWeight: 700, cursor: motifRejet.trim() ? 'pointer' : 'default', fontFamily: 'Georgia,serif' }}
              >Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
