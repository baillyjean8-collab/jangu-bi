import { useState } from 'react';
import AdminShell from '../AdminShell';

const OR = '#C8A84B';
const VERT = '#1e2d14';
const IVOIRE = '#F5F0E8';

export default function AdminInvitations() {
  const token = localStorage.getItem('jb_admin_token');
  const BASE = import.meta.env.VITE_API_URL || '/api';
  const [lien, setLien] = useState(null);
  const [expire, setExpire] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [copie, setCopie] = useState(false);

  async function genererLien() {
    setChargement(true);
    setCopie(false);
    try {
      const res = await fetch(BASE + '/invitations', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data && data.data) {
        setLien(data.data.url);
        setExpire(data.data.expiresAt);
      }
    } catch (e) { console.log('Invitation:', e.message); }
    finally { setChargement(false); }
  }

  function copier() {
    if (!lien) return;
    navigator.clipboard.writeText(lien).then(function() {
      setCopie(true);
      setTimeout(function() { setCopie(false); }, 2000);
    });
  }

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', padding: '44px 16px 20px' }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Inviter une paroisse</div>
        <div style={{ fontSize: 10, color: 'rgba(200,168,75,0.6)', marginTop: 4 }}>Genere un lien unique a envoyer vous-meme au representant de la paroisse.</div>
      </div>

      <div style={{ padding: 16 }}>
        <button onClick={genererLien} disabled={chargement} style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 14, color: VERT, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
          {chargement ? 'Generation...' : 'Generer un nouveau lien'}
        </button>

        {lien && (
          <div style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid #e8e4dc' }}>
            <div style={{ background: '#F5F0E8', borderRadius: 10, padding: 10, fontSize: 11, color: '#8B6020', wordBreak: 'break-all', marginBottom: 10 }}>{lien}</div>
            <button onClick={copier} style={{ width: '100%', padding: 10, background: copie ? '#065F46' : VERT, color: OR, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {copie ? 'Copie !' : 'Copier le lien'}
            </button>
            {expire && <div style={{ fontSize: 9, color: '#9A8E7E', marginTop: 8, textAlign: 'center' }}>Valable jusqu'au {new Date(expire).toLocaleDateString('fr-FR')}</div>}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
