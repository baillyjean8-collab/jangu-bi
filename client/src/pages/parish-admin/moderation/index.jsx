import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../AdminShell';

const OR = '#C8A84B';
const VERT = '#1e2d14';
const IVOIRE = '#F5F0E8';
const BD = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const SIGNALEMENTS_MOCK = [
  { _id: '1', auteur: 'Moussa Kane', contenu: '[contenu inapproprié masqué par le filtre]', publication: 'Messe des jeunes', date: 'Il y a 2h', type: 'commentaire' },
  { _id: '2', auteur: 'Ibou Faye', contenu: '[contenu signalé par 3 fidèles]', publication: 'Collecte restauration', date: 'Il y a 5h', type: 'commentaire' },
];
const TRAITES_MOCK = [
  { _id: '3', auteur: 'Awa Diop', contenu: '[contenu traité]', statut: 'supprimé' },
];

export default function AdminModeration() {
  const navigate = useNavigate();
  const [signalements, setSignalements] = useState(SIGNALEMENTS_MOCK);
  const [traites, setTraites] = useState(TRAITES_MOCK);
  const token = localStorage.getItem('jb_admin_token');

  function supprimer(id) {
    const item = signalements.find(function(s) { return s._id === id; });
    if (item) setTraites(function(prev) { return [...prev, {...item, statut: 'supprimé'}]; });
    setSignalements(function(prev) { return prev.filter(function(s) { return s._id !== id; }); });
  }

  function ignorer(id) {
    const item = signalements.find(function(s) { return s._id === id; });
    if (item) setTraites(function(prev) { return [...prev, {...item, statut: 'ignoré'}]; });
    setSignalements(function(prev) { return prev.filter(function(s) { return s._id !== id; }); });
  }

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BD, padding: '44px 14px 16px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
          </button>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>
              Modération {signalements.length > 0 && <span style={{ background: '#e53935', borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700, color: 'white', marginLeft: 6 }}>{signalements.length}</span>}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(200,168,75,0.5)' }}>{signalements.length} signalement{signalements.length > 1 ? 's' : ''} en attente</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {signalements.length === 0 && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 13, color: '#065F46' }}>Aucun signalement en attente</div>
          </div>
        )}

        {signalements.length > 0 && (
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 10, fontWeight: 700, color: VERT, marginBottom: -4 }}>À traiter</div>
        )}

        {signalements.map(function(item) {
          return (
            <div key={item._id} style={{ background: 'white', borderRadius: 16, padding: 14, border: '1.5px solid rgba(229,57,53,0.2)', borderLeft: '3px solid #e53935' }}>
              <div style={{ fontSize: 9, color: '#e53935', fontWeight: 700, marginBottom: 5 }}>⚠️ Commentaire signalé</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 700, color: VERT, marginBottom: 2 }}>{item.auteur}</div>
              <div style={{ fontSize: 11, color: '#5A5045', marginBottom: 3, fontStyle: 'italic' }}>"{item.contenu}"</div>
              <div style={{ fontSize: 9, color: '#9A8E7E', marginBottom: 10 }}>Sur : {item.publication} · {item.date}</div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={function() { supprimer(item._id); }} style={{ flex: 1, padding: 8, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 9, fontSize: 9, color: '#e53935', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>🗑️ Supprimer</button>
                <button style={{ flex: 1, padding: 8, background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 9, fontSize: 9, color: '#8B6020', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>💬 Contacter</button>
                <button onClick={function() { ignorer(item._id); }} style={{ flex: 1, padding: 8, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 9, color: '#7A6E5E', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Ignorer</button>
              </div>
            </div>
          );
        })}

        {traites.length > 0 && (
          <>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 10, fontWeight: 700, color: VERT, marginTop: 4 }}>Traités</div>
            {traites.map(function(item) {
              return (
                <div key={item._id} style={{ background: 'white', borderRadius: 14, padding: 12, border: '1px solid rgba(0,0,0,0.05)', opacity: 0.6 }}>
                  <div style={{ fontSize: 11, color: '#5A5045', fontStyle: 'italic', marginBottom: 2 }}>"{item.contenu}"</div>
                  <div style={{ fontSize: 9, color: '#9A8E7E' }}>Par {item.auteur} · {item.statut === 'supprimé' ? '🗑️ Supprimé' : '👁 Ignoré'}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </AdminShell>
  );
}
