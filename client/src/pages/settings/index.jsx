import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';

const OR     = '#C8A84B';
const VERT   = '#1e2d14';
const IVOIRE = '#F5F0E8';
const BOGOLAN = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? OR : 'rgba(255,255,255,0.15)', position: 'relative', cursor: 'pointer', transition: 'all .3s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'all .3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
  );
}

function SettingRow({ icon, label, sub, value, onChange, type = 'toggle', onPress }) {
  return (
    <div onClick={onPress} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: onPress ? 'pointer' : 'default', background: 'white' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,168,75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 16, color: OR }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: '#7A6E5E', marginTop: 2 }}>{sub}</div>}
      </div>
      {type === 'toggle' && <Toggle value={value} onChange={onChange} />}
      {type === 'arrow' && <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#ccc' }} />}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth() || {};
  const [notifDons,       setNotifDons]       = useState(true);
  const [notifPub,        setNotifPub]        = useState(true);
  const [notifPrieres,    setNotifPrieres]    = useState(true);
  const [notifDemandes,   setNotifDemandes]   = useState(true);
  const [modeNuit,        setModeNuit]        = useState(false);
  const [langue,          setLangue]          = useState('Français');
  const [showLogout,      setShowLogout]      = useState(false);

  function handleLogout() {
    logout?.();
    navigate('/login');
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE, backgroundImage: BOGOLAN, paddingBottom: 90 }}>

        {/* Header */}
        <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 16px 20px', borderRadius: '0 0 24px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
            </button>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Paramètres</div>
          </div>
        </div>

        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Mon compte */}
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '10px 16px', background: '#f5f0e8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7A6E5E', letterSpacing: '.08em' }}>MON COMPTE</span>
            </div>
            <SettingRow icon="user" label="Modifier mon profil" sub="Nom, photo, paroisse..." type="arrow" onPress={() => navigate('/profile')} />
            <SettingRow icon="lock" label="Changer mon mot de passe" type="arrow" onPress={() => {}} />
            <SettingRow icon="phone" label="Changer mon numéro" sub="+221 77 XXX XX XX" type="arrow" onPress={() => {}} />
          </div>

          {/* Notifications */}
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '10px 16px', background: '#f5f0e8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7A6E5E', letterSpacing: '.08em' }}>NOTIFICATIONS</span>
            </div>
            <SettingRow icon="gift" label="Confirmations de dons" value={notifDons} onChange={setNotifDons} />
            <SettingRow icon="speakerphone" label="Nouvelles publications" value={notifPub} onChange={setNotifPub} />
            <SettingRow icon="cross" label="Rappels de prière" value={notifPrieres} onChange={setNotifPrieres} />
            <SettingRow icon="file" label="Suivi des demandes" value={notifDemandes} onChange={setNotifDemandes} />
          </div>

          {/* Affichage */}
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '10px 16px', background: '#f5f0e8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7A6E5E', letterSpacing: '.08em' }}>AFFICHAGE</span>
            </div>
            <SettingRow icon="moon" label="Mode nuit" sub="Fond sombre pour la prière" value={modeNuit} onChange={setModeNuit} />
            <SettingRow icon="language" label="Langue" sub={langue} type="arrow" onPress={() => {}} />
          </div>

          {/* Confidentialité */}
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '10px 16px', background: '#f5f0e8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7A6E5E', letterSpacing: '.08em' }}>CONFIDENTIALITÉ</span>
            </div>
            <SettingRow icon="eye" label="Visibilité de mon profil" sub="Public — visible par tous les fidèles" type="arrow" onPress={() => {}} />
            <SettingRow icon="heart" label="Dons anonymes par défaut" sub="Votre nom n'apparaît pas publiquement" type="arrow" onPress={() => {}} />
          </div>

          {/* Aide */}
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '10px 16px', background: '#f5f0e8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7A6E5E', letterSpacing: '.08em' }}>AIDE & INFOS</span>
            </div>
            <SettingRow icon="help-circle" label="Centre d'aide" type="arrow" onPress={() => {}} />
            <SettingRow icon="shield" label="Conditions d'utilisation" type="arrow" onPress={() => {}} />
            <SettingRow icon="info-circle" label="Version de l'app" sub="Jangu Bi v1.0.0" type="arrow" />
          </div>

          {/* Déconnexion */}
          <button onClick={() => setShowLogout(true)} style={{ width: '100%', padding: '14px', background: 'rgba(229,57,53,0.08)', border: '1.5px solid rgba(229,57,53,0.25)', borderRadius: 14, color: '#e53935', fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="ti ti-logout" style={{ fontSize: 16 }} />
            Se déconnecter
          </button>

        </div>

        {/* Modal confirmation déconnexion */}
        {showLogout && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
            <div style={{ background: IVOIRE, backgroundImage: BOGOLAN, borderRadius: '20px 20px 0 0', padding: '24px 16px 40px', width: '100%' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: VERT, textAlign: 'center', marginBottom: 8 }}>Se déconnecter ?</div>
              <div style={{ fontSize: 12, color: '#7A6E5E', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
                Vous devrez vous reconnecter pour accéder à Jangu Bi.
              </div>
              <button onClick={handleLogout} style={{ width: '100%', padding: 14, background: '#e53935', border: 'none', borderRadius: 14, color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: 'pointer', marginBottom: 10 }}>
                Oui, se déconnecter
              </button>
              <button onClick={() => setShowLogout(false)} style={{ width: '100%', padding: 13, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 14, color: '#7A6E5E', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
