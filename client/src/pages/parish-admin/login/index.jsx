import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [erreur, setErreur]           = useState('');

  async function handleLogin() {
    if (!identifiant || !motDePasse) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setErreur('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifiant, password: motDePasse }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.message || 'Identifiants incorrects.');
        return;
      }
      const role = data.data && data.data.user && data.data.user.role;
      if (role !== 'parish_admin' && role !== 'super_admin') {
        setErreur('Ce compte ne dispose pas des droits administrateur paroissial.');
        return;
      }
      const token = data.data && data.data.accessToken;
      if (token) {
        localStorage.setItem('jb_admin_token', token);
      }
      if (data.data && data.data.user) {
        localStorage.setItem('jb_admin_user', JSON.stringify(data.data.user));
      }
      navigate('/parish-admin/dashboard');
    } catch (e) {
      setErreur('Erreur de connexion. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#0C0A06', backgroundImage: BOGOLAN_DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#1e2d14,#0C0A06)', border: '3px solid ' + OR, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 0 32px rgba(200,168,75,0.2)' }}>
        <i className="ti ti-building-church" style={{ fontSize: 38, color: OR }} />
      </div>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 24, fontWeight: 900, color: IVOIRE, marginBottom: 4 }}>Jangu Bi</div>
      <div style={{ fontSize: 11, color: 'rgba(200,168,75,0.55)', marginBottom: 8, textAlign: 'center' }}>Espace Administration Paroissiale</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 20, padding: '4px 14px', marginBottom: 32 }}>
        <i className="ti ti-shield-check" style={{ fontSize: 12, color: OR }} />
        <span style={{ fontSize: 9, color: OR, fontWeight: 700 }}>Accès réservé aux paroisses vérifiées</span>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(200,168,75,0.7)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>IDENTIFIANT PAROISSE</div>
          <input
            value={identifiant}
            onChange={function(e) { setIdentifiant(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') handleLogin(); }}
            placeholder="Email de la paroisse"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: IVOIRE, outline: 'none', fontFamily: 'Georgia,serif', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(200,168,75,0.7)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>MOT DE PASSE</div>
          <input
            value={motDePasse}
            onChange={function(e) { setMotDePasse(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') handleLogin(); }}
            type="password"
            placeholder="••••••••••"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: IVOIRE, outline: 'none', fontFamily: 'Georgia,serif', boxSizing: 'border-box' }}
          />
        </div>
        {erreur ? <div style={{ fontSize: 11, color: '#ef9a9a', textAlign: 'center', padding: '8px', background: 'rgba(229,57,53,0.1)', borderRadius: 8 }}>{erreur}</div> : null}
      </div>

      <button
        onClick={handleLogin}
        style={{ width: '100%', padding: 14, background: loading ? 'rgba(200,168,75,0.4)' : 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 14, color: VERT, fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: 'pointer', marginBottom: 16 }}
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>

      <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.35)', textAlign: 'center', lineHeight: 1.7 }}>
        Mot de passe oublié ? Contactez<br/>support@jangu-bi.sn
      </div>

      <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,168,75,0.1)', borderRadius: 12, width: '100%' }}>
        <div style={{ fontSize: 9, color: 'rgba(245,240,232,0.3)', textAlign: 'center', lineHeight: 1.7 }}>
          Vous n'avez pas encore de compte paroisse ?<br/>
          La création est soumise à validation diocésaine.
        </div>
        <div style={{ fontSize: 10, color: OR, textAlign: 'center', marginTop: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'Georgia,serif' }}>
          Faire une demande de création →
        </div>
      </div>
    </div>
  );
}
