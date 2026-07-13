import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../AdminShell';

const OR = '#C8A84B';
const VERT = '#1e2d14';
const IVOIRE = '#F5F0E8';

export default function CreerBranche() {
  const navigate = useNavigate();
  const token = localStorage.getItem('jb_admin_token');
  const BASE = import.meta.env.VITE_API_URL || '/api';
  const fileRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public');
  const [enregistrement, setEnregistrement] = useState(false);

  function choisirPhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) { setPhoto(ev.target.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function creer() {
    if (!nom.trim()) return;
    setEnregistrement(true);
    try {
      const res = await fetch(BASE + '/parish-admin/groups', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nom.trim(), description: description.trim(), type, photoUrl: photo }),
      });
      const data = await res.json();
      if (data && data.data) {
        navigate('/parish-admin/branches');
      }
    } catch (e) { console.log('Creer groupe:', e.message); }
    finally { setEnregistrement(false); }
  }

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', padding: '44px 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
        </button>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 800, color: IVOIRE }}>Creer une branche</div>
      </div>

      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div onClick={function() { fileRef.current && fileRef.current.click(); }} style={{ width: 84, height: 84, borderRadius: '50%', background: photo ? 'transparent' : 'linear-gradient(135deg,#C8A84B,#8B6020)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, position: 'relative', cursor: 'pointer', overflow: 'hidden' }}>
          {photo
            ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <i className="ti ti-camera" style={{ color: VERT, fontSize: 26 }} />
          }
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: VERT, border: '2px solid #F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-plus" style={{ color: OR, fontSize: 13 }} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={choisirPhoto} />
        </div>
        <div style={{ fontSize: 10, color: '#8B6020' }}>Photo du groupe</div>
      </div>

      <div style={{ padding: '0 16px 30px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>NOM DU GROUPE</div>
          <input value={nom} onChange={function(e) { setNom(e.target.value); }} placeholder="Ex: Chorale Sainte-Cecile" style={{ width: '100%', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div>
          <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>DESCRIPTION (optionnel)</div>
          <textarea value={description} onChange={function(e) { setDescription(e.target.value); }} placeholder="Quelques mots sur ce groupe..." style={{ width: '100%', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none', height: 60, resize: 'none', boxSizing: 'border-box' }} />
        </div>

        <div>
          <div style={{ fontSize: 9, color: '#7A6E5E', fontWeight: 700, letterSpacing: '.06em', marginBottom: 8 }}>TYPE DE PAGE</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={function() { setType('public'); }} style={{ flex: 1, padding: 14, borderRadius: 12, border: '2px solid ' + (type === 'public' ? OR : 'rgba(0,0,0,0.08)'), background: type === 'public' ? 'rgba(200,168,75,0.08)' : 'white', textAlign: 'center', cursor: 'pointer' }}>
              <i className="ti ti-world" style={{ fontSize: 22, color: type === 'public' ? OR : '#7A6E5E' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: VERT, marginTop: 4 }}>Publique</div>
              <div style={{ fontSize: 9, color: '#7A6E5E' }}>Visible par tous</div>
            </div>
            <div onClick={function() { setType('prive'); }} style={{ flex: 1, padding: 14, borderRadius: 12, border: '2px solid ' + (type === 'prive' ? OR : 'rgba(0,0,0,0.08)'), background: type === 'prive' ? 'rgba(200,168,75,0.08)' : 'white', textAlign: 'center', cursor: 'pointer' }}>
              <i className="ti ti-lock" style={{ fontSize: 22, color: type === 'prive' ? OR : '#7A6E5E' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: VERT, marginTop: 4 }}>Privee</div>
              <div style={{ fontSize: 9, color: '#7A6E5E' }}>Membres invites</div>
            </div>
          </div>
        </div>

        <button onClick={creer} disabled={enregistrement || !nom.trim()} style={{ marginTop: 8, padding: 13, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 14, color: OR, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {enregistrement ? 'Creation...' : 'Creer la branche'}
        </button>
      </div>
    </AdminShell>
  );
}
