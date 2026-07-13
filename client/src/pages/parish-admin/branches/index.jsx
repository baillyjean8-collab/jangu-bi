import { useState, useEffect } from 'react';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

export default function AdminBranches() {
  const token = localStorage.getItem('jb_admin_token');
  const BASE = import.meta.env.VITE_API_URL || '/api';

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fideles, setFideles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newType, setNewType] = useState('public');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [ajoutMembreId, setAjoutMembreId] = useState('');

  async function chargerGroupes() {
    try {
      const res = await fetch(BASE + '/parish-admin/groups', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data && data.data) setGroups(data.data);
    } catch (e) { console.log('Groupes:', e.message); }
    finally { setLoading(false); }
  }

  async function chargerFideles() {
    try {
      const res = await fetch(BASE + '/parish-admin/fideles?limit=100', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data && data.data) setFideles(Array.isArray(data.data) ? data.data : (data.data.items || []));
    } catch (e) { console.log('Fideles:', e.message); }
  }

  useEffect(function() { if (token) { chargerGroupes(); chargerFideles(); } }, []);

  async function creerBranche() {
    if (!newNom.trim()) return;
    try {
      const res = await fetch(BASE + '/parish-admin/groups', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newNom.trim(), type: newType }),
      });
      const data = await res.json();
      if (data && data.data) {
        setNewNom(''); setShowCreate(false);
        chargerGroupes();
      }
    } catch (e) { console.log('Creer groupe:', e.message); }
  }

  async function toggleActif(g) {
    try {
      await fetch(BASE + '/parish-admin/groups/' + g._id, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !g.isActive }),
      });
      chargerGroupes();
    } catch (e) { console.log('Toggle actif:', e.message); }
  }

  async function ouvrirGestion(g) {
    if (expandedId === g._id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(g._id);
    setLoadingDetail(true);
    try {
      const res = await fetch(BASE + '/parish-admin/groups/' + g._id, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data && data.data) setDetail(data.data.group);
    } catch (e) { console.log('Detail groupe:', e.message); }
    finally { setLoadingDetail(false); }
  }

  async function changerModerateur(groupId, moderatorId) {
    try {
      await fetch(BASE + '/parish-admin/groups/' + groupId, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderatorId: moderatorId || null }),
      });
      const g = groups.find(function(x) { return x._id === groupId; });
      if (g) ouvrirGestionRefresh(g);
      chargerGroupes();
    } catch (e) { console.log('Moderateur:', e.message); }
  }

  async function ouvrirGestionRefresh(g) {
    try {
      const res = await fetch(BASE + '/parish-admin/groups/' + g._id, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data && data.data) setDetail(data.data.group);
    } catch (e) { console.log('Refresh detail:', e.message); }
  }

  async function ajouterMembre(groupId) {
    if (!ajoutMembreId) return;
    try {
      await fetch(BASE + '/parish-admin/groups/' + groupId + '/members', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: ajoutMembreId }),
      });
      setAjoutMembreId('');
      const g = groups.find(function(x) { return x._id === groupId; });
      if (g) ouvrirGestionRefresh(g);
      chargerGroupes();
    } catch (e) { console.log('Ajouter membre:', e.message); }
  }

  async function retirerMembre(groupId, userId) {
    try {
      await fetch(BASE + '/parish-admin/groups/' + groupId + '/members/' + userId, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      const g = groups.find(function(x) { return x._id === groupId; });
      if (g) ouvrirGestionRefresh(g);
      chargerGroupes();
    } catch (e) { console.log('Retirer membre:', e.message); }
  }

  const publiques = groups.filter(function(g) { return g.type === 'public'; }).length;
  const privees = groups.filter(function(g) { return g.type === 'prive'; }).length;

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 14px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Nos Branches</div>
            <div style={{ fontSize: 9, color: 'rgba(200,168,75,0.5)', marginTop: 2 }}>{groups.length} branches - groupes et mouvements</div>
          </div>
          <button onClick={function() { setShowCreate(true); }} style={{ background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 9, color: VERT, fontWeight: 700, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>+ Creer</button>
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 4 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: OR }}>{publiques}</div>
            <div style={{ fontSize: 9, color: '#7A6E5E' }}>Pages publiques</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: VERT }}>{privees}</div>
            <div style={{ fontSize: 9, color: '#7A6E5E' }}>Groupes prives</div>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>}
        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>Aucun groupe pour le moment</div>
        )}

        {groups.map(function(g) {
          const estOuvert = expandedId === g._id;
          return (
            <div key={g._id} style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)', opacity: g.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: g.type === 'prive' ? 'linear-gradient(135deg,#1e2d14,#0a140a)' : 'rgba(200,168,75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid ' + (g.type === 'prive' ? 'rgba(200,168,75,0.3)' : 'rgba(200,168,75,0.2)') }}>
                  <i className={g.type === 'prive' ? 'ti ti-lock' : 'ti ti-world'} style={{ fontSize: 19, color: g.type === 'prive' ? OR : '#8B6020' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{g.name}</div>
                  <div style={{ fontSize: 9, color: '#7A6E5E', marginTop: 2 }}>{g.memberCount || 0} membres - Moderateur : {g.moderatorId ? (g.moderatorId.firstName + ' ' + g.moderatorId.lastName) : 'a definir'}</div>
                </div>
                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 8, fontWeight: 700, background: g.type === 'prive' ? 'rgba(30,45,20,0.08)' : 'rgba(200,168,75,0.12)', color: g.type === 'prive' ? VERT : '#8B6020' }}>
                  {g.type === 'prive' ? 'Prive' : 'Public'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={function() { ouvrirGestion(g); }} style={{ flex: 1, padding: '7px 4px', background: estOuvert ? OR : 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 9, fontSize: 9, color: estOuvert ? VERT : '#8B6020', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>Gerer</button>
                <button onClick={function() { toggleActif(g); }} style={{ flex: 1, padding: '7px 4px', background: g.isActive ? 'rgba(229,57,53,0.08)' : 'rgba(16,185,129,0.1)', border: '1px solid ' + (g.isActive ? 'rgba(229,57,53,0.2)' : 'rgba(16,185,129,0.3)'), borderRadius: 9, fontSize: 9, color: g.isActive ? '#e53935' : '#065F46', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>
                  {g.isActive ? 'Desactiver' : 'Activer'}
                </button>
              </div>

              {estOuvert && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0ece4' }}>
                  {loadingDetail && <div style={{ textAlign: 'center', padding: 10, color: '#9A8E7E', fontSize: 11 }}>Chargement...</div>}
                  {!loadingDetail && detail && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 5 }}>MODERATEUR</div>
                        <select value={(detail.moderatorId && detail.moderatorId._id) || ''} onChange={function(e) { changerModerateur(g._id, e.target.value); }} style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 9, padding: '8px 10px', fontSize: 11, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none' }}>
                          <option value="">Aucun</option>
                          {fideles.map(function(f) {
                            return <option key={f._id} value={f._id}>{f.firstName} {f.lastName}</option>;
                          })}
                        </select>
                      </div>

                      <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 5 }}>MEMBRES ({(detail.members || []).length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                        {(detail.members || []).length === 0 && (
                          <div style={{ fontSize: 10, color: '#9A8E7E' }}>Aucun membre pour le moment</div>
                        )}
                        {(detail.members || []).map(function(m) {
                          return (
                            <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F0E8', borderRadius: 8, padding: '6px 10px' }}>
                              <div style={{ flex: 1, fontSize: 11, color: VERT }}>{m.firstName} {m.lastName}</div>
                              <i onClick={function() { retirerMembre(g._id, m._id); }} className="ti ti-x" style={{ fontSize: 13, color: '#e53935', cursor: 'pointer' }} />
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <select value={ajoutMembreId} onChange={function(e) { setAjoutMembreId(e.target.value); }} style={{ flex: 1, border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 9, padding: '8px 10px', fontSize: 11, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none' }}>
                          <option value="">Choisir un fidele...</option>
                          {fideles.map(function(f) {
                            return <option key={f._id} value={f._id}>{f.firstName} {f.lastName}</option>;
                          })}
                        </select>
                        <button onClick={function() { ajouterMembre(g._id); }} style={{ padding: '0 14px', background: VERT, border: 'none', borderRadius: 9, color: OR, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Ajouter</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: IVOIRE, backgroundImage: BOGOLAN, borderRadius: '20px 20px 0 0', padding: '20px 16px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 14 }}>Creer une branche</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>NOM DE LA BRANCHE</div>
              <input value={newNom} onChange={function(e) { setNewNom(e.target.value); }} placeholder="Ex: Chorale, Conseil pastoral..." style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 8 }}>TYPE DE PAGE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={function() { setNewType('public'); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid ' + (newType === 'public' ? OR : 'rgba(0,0,0,0.08)'), background: newType === 'public' ? 'rgba(200,168,75,0.08)' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                  <i className="ti ti-world" style={{ fontSize: 20, color: OR, marginBottom: 4, display: 'block' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Publique</div>
                  <div style={{ fontSize: 9, color: '#7A6E5E', marginTop: 2 }}>Visible par tous</div>
                </div>
                <div onClick={function() { setNewType('prive'); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid ' + (newType === 'prive' ? OR : 'rgba(0,0,0,0.08)'), background: newType === 'prive' ? 'rgba(200,168,75,0.08)' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                  <i className="ti ti-lock" style={{ fontSize: 20, color: OR, marginBottom: 4, display: 'block' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Privee</div>
                  <div style={{ fontSize: 9, color: '#7A6E5E', marginTop: 2 }}>Membres invites</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowCreate(false); }} style={{ flex: 1, padding: 11, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia,serif', color: '#7A6E5E' }}>Annuler</button>
              <button onClick={creerBranche} style={{ flex: 1, padding: 11, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 12, fontSize: 12, color: OR, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Creer</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
