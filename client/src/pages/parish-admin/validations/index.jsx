import { useState, useEffect } from 'react';
import AdminShell from '../AdminShell';

const OR = '#C8A84B';
const VERT = '#1e2d14';
const IVOIRE = '#F5F0E8';

export default function AdminValidations() {
  const token = localStorage.getItem('jb_admin_token');
  const BASE = import.meta.env.VITE_API_URL || '/api';
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  async function charger() {
    try {
      const res = await fetch(BASE + '/admin/parish-applications', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data && data.data) setApplications(data.data);
    } catch (e) { console.log('Applications:', e.message); }
    finally { setLoading(false); }
  }

  useEffect(function() { if (token) charger(); }, []);

  async function approuver(id) {
    try {
      await fetch(BASE + '/admin/parish-applications/' + id + '/approve', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
      charger();
    } catch (e) { console.log('Approve:', e.message); }
  }

  async function rejeter(id) {
    try {
      await fetch(BASE + '/admin/parish-applications/' + id + '/reject', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      charger();
    } catch (e) { console.log('Reject:', e.message); }
  }

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', padding: '44px 16px 20px' }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Demandes en attente</div>
        <div style={{ fontSize: 10, color: 'rgba(200,168,75,0.6)', marginTop: 4 }}>{applications.length} paroisse{applications.length > 1 ? 's' : ''} a verifier</div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>}
        {!loading && applications.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>Aucune demande en attente</div>
        )}
        {applications.map(function(a) {
          const ouvert = expandedId === a._id;
          const u = a.userId;
          const p = a.parishId;
          return (
            <div key={a._id} style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid #e8e4dc' }}>
              <div onClick={function() { setExpandedId(ouvert ? null : a._id); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: VERT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: OR, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {p && p.name ? p.name.substring(0, 2).toUpperCase() : '??'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{p ? p.name : 'Paroisse'}</div>
                  <div style={{ fontSize: 10, color: '#9A8E7E' }}>{u ? (u.firstName + ' ' + u.lastName) : ''} {p && p.diocese ? '- ' + p.diocese : ''}</div>
                </div>
                <span style={{ background: 'rgba(200,168,75,0.15)', color: '#8B6020', fontSize: 8, fontWeight: 700, padding: '3px 8px', borderRadius: 10 }}>En attente</span>
              </div>

              {ouvert && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0ece4' }}>
                  <div style={{ fontSize: 10, color: '#7A6E5E', marginBottom: 8, lineHeight: 1.6 }}>
                    Telephone : {u ? u.phone : '-'}<br />
                    Ville : {p && p.location ? p.location.city : '-'}, {p && p.location ? p.location.country : '-'}<br />
                    Fonction : {a.fonction || 'Non precisee'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {a.identityDocUrl && (
                      <a href={a.identityDocUrl} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: 8, background: '#F5F0E8', borderRadius: 8, fontSize: 10, color: VERT, textDecoration: 'none' }}>
                        <i className="ti ti-id" style={{ fontSize: 13, verticalAlign: -2 }} /> Piece d'identite
                      </a>
                    )}
                    {a.functionDocUrl && (
                      <a href={a.functionDocUrl} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: 8, background: '#F5F0E8', borderRadius: 8, fontSize: 10, color: VERT, textDecoration: 'none' }}>
                        <i className="ti ti-file-certificate" style={{ fontSize: 13, verticalAlign: -2 }} /> Fonction
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={function() { rejeter(a._id); }} style={{ flex: 1, padding: 9, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 9, color: '#e53935', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Rejeter</button>
                    <button onClick={function() { approuver(a._id); }} style={{ flex: 1, padding: 9, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 9, color: OR, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Valider la paroisse</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
