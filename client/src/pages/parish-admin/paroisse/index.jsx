import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../AdminShell';

const OR = '#C8A84B';
const VERT = '#1e2d14';
const IVOIRE = '#F5F0E8';
const BD = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

export default function AdminParoisse() {
  const navigate = useNavigate();
  const [nom, setNom]           = useState('');
  const [diocese, setDiocese]   = useState('');
  const [tel, setTel]           = useState('');
  const [adresse, setAdresse]   = useState('');
  const [desc, setDesc]         = useState('');
  const [dimanche, setDimanche] = useState('');
  const [semaine, setSemaine]   = useState('');
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [commentsOn, setCommentsOn] = useState(true);
  const token = localStorage.getItem('jb_admin_token');

  useEffect(function() {
    async function load() {
      try {
        // Étape 1: récupérer le user et son parishId
        const userRes = await fetch('/api/users/me', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const userData = await userRes.json();
        const u = userData.data && (userData.data.user || userData.data);
        if (!u) return;
        const parishId = u.parishId && (u.parishId._id || u.parishId);
        if (!parishId) { console.log('Pas de parishId'); return; }

        // Étape 2: charger les infos de la paroisse
        const res = await fetch('/api/parishes/' + parishId, {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        console.log('Paroisse data:', JSON.stringify(data).substring(0, 200));
        if (data && (data.data || data.parish)) {
          const par = (data.data && data.data.parish) || data.data || data.parish;
          setNom(par.name || '');
          setDiocese(par.diocese || par.dioceseName || par.region || '');
          setTel(par.phone || par.phoneNumber || '');
          setAdresse((par.location && par.location.address) || par.address || '');
          setDesc(par.description || par.about || '');
          if (par.massTimes) {
            setDimanche(par.massTimes.sunday || par.massTimes.dimanche || '');
            setSemaine(par.massTimes.weekdays || par.massTimes.semaine || '');
          }
        }
      } catch(e) { console.log('Paroisse load error:', e.message); }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const userRes = await fetch('/api/users/me', { headers: { Authorization: 'Bearer ' + token } });
      const userData = await userRes.json();
      const u2 = userData.data && (userData.data.user || userData.data); const parishId = u2 && u2.parishId && (u2.parishId._id || u2.parishId);
      if (parishId) {
        await fetch('/api/parishes/' + (parishId._id || parishId), {
          method: 'PATCH',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nom, diocese, phone: tel, address: adresse, description: desc, massTimes: { sunday: dimanche, weekdays: semaine } }),
        });
      }
      setSaved(true);
      setTimeout(function() { setSaved(false); }, 3000);
    } catch(e) { console.log('Save:', e.message); }
    finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BD, padding: '44px 14px 0', borderRadius: '0 0 28px 28px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={function() { navigate('/parish-admin/dashboard'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Ma Paroisse</div>
        </div>
        <div style={{ position: 'relative', height: 90, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button style={{ background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: 9, color: OR, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
            📷 Modifier la photo de couverture
          </button>
          <div style={{ position: 'absolute', bottom: -22, left: 14, width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#1e2d14,#0C0A06)', border: '2.5px solid ' + OR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-building-church" style={{ fontSize: 20, color: OR }} />
          </div>
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(200,168,75,0.2)', border: '1px solid rgba(200,168,75,0.4)', borderRadius: 8, padding: '2px 8px', fontSize: 7, color: OR, fontWeight: 700 }}>✓ VÉRIFIÉE</div>
        </div>
        <div style={{ height: 30 }} />
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Nom de la paroisse', value: nom, setter: setNom },
          { label: 'Diocèse', value: diocese, setter: setDiocese },
          { label: 'Téléphone', value: tel, setter: setTel },
          { label: 'Adresse', value: adresse, setter: setAdresse },
        ].map(function(f, i) {
          return (
            <div key={i} style={{ background: 'white', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>{f.label}</div>
              <input value={f.value} onChange={function(e) { f.setter(e.target.value); }} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'transparent', boxSizing: 'border-box' }} />
            </div>
          );
        })}

        <div style={{ background: 'white', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>Description</div>
          <textarea value={desc} onChange={function(e) { setDesc(e.target.value); }} rows={3} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'transparent', resize: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 10 }}>Horaires des messes</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 3 }}>Dimanche & Fêtes</div>
            <input value={dimanche} onChange={function(e) { setDimanche(e.target.value); }} placeholder="Ex: 07h00 · 09h00 · 11h00" style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.15)', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: VERT, fontFamily: 'Georgia,serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 3 }}>Jours de semaine</div>
            <input value={semaine} onChange={function(e) { setSemaine(e.target.value); }} placeholder="Ex: 06h30 · 18h30" style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.15)', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: VERT, fontFamily: 'Georgia,serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 12 }}>Sécurité & Accès</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Commentaires autorisés</div>
              <div style={{ fontSize: 9, color: '#7A6E5E' }}>Les fidèles peuvent commenter vos publications</div>
            </div>
            <div onClick={function() { setCommentsOn(function(v) { return !v; }); }} style={{ width: 44, height: 24, borderRadius: 12, background: commentsOn ? OR : 'rgba(0,0,0,0.15)', position: 'relative', cursor: 'pointer', transition: 'all .3s' }}>
              <div style={{ position: 'absolute', top: 2, left: commentsOn ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'all .3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>Historique de modération</div>
              <div style={{ fontSize: 9, color: '#7A6E5E' }}>Toutes les actions sont archivées</div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: OR, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </div>

        <button onClick={handleSave} style={{ width: '100%', padding: 13, background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#1e2d14,#0a140a)', border: saved ? '1.5px solid rgba(16,185,129,0.3)' : 'none', borderRadius: 14, color: saved ? '#065F46' : OR, fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer', transition: 'all .3s' }}>
          {saving ? 'Enregistrement...' : saved ? '✓ Modifications enregistrées' : 'Enregistrer les modifications'}
        </button>

        <button onClick={function() { setShowLogout(true); }} style={{ width: '100%', padding: 13, background: 'rgba(229,57,53,0.06)', border: '1.5px solid rgba(229,57,53,0.2)', borderRadius: 14, color: '#e53935', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer', marginBottom: 20 }}>
          Se déconnecter
        </button>
      </div>

      {showLogout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ background: IVOIRE, borderRadius: '20px 20px 0 0', padding: '24px 16px 40px', width: '100%', maxWidth: 430, margin: '0 auto' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, textAlign: 'center', marginBottom: 8 }}>Se déconnecter ?</div>
            <div style={{ fontSize: 12, color: '#7A6E5E', textAlign: 'center', marginBottom: 24 }}>Vous serez redirigé vers la page de connexion.</div>
            <button onClick={function() { localStorage.removeItem('jb_admin_token'); localStorage.removeItem('jb_admin_user'); navigate('/parish-admin/login'); }} style={{ width: '100%', padding: 13, background: '#e53935', border: 'none', borderRadius: 14, color: 'white', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer', marginBottom: 8 }}>Oui, se déconnecter</button>
            <button onClick={function() { setShowLogout(false); }} style={{ width: '100%', padding: 12, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 14, color: '#7A6E5E', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
