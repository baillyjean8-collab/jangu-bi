import { useNavigate, useLocation } from 'react-router-dom';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';


const NAV_ITEMS = [
  { path: '/parish-admin/dashboard',    icon: 'ti-home',      label: 'Accueil'  },
  { path: '/parish-admin/publications', icon: 'ti-news',      label: 'Posts'    },
  { path: '/parish-admin/demandes',     icon: 'ti-file-text', label: 'Demandes', badge: 7 },
  { path: '/parish-admin/fideles',      icon: 'ti-users',     label: 'Fidèles'  },
  { path: '/parish-admin/paroisse',     icon: 'ti-settings',  label: 'Paroisse' },
];

export default function AdminShell({ children, titre, actions }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: IVOIRE, backgroundImage: BOGOLAN, position: 'relative', paddingBottom: 80 }}>
      {children}
      {/* Navbar admin */}
      <div style={{ position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 24px)', maxWidth: 406, background: '#0C0A06', backgroundImage: BOGOLAN_DARK, borderRadius: 50, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path;
          return (
            <div key={item.path} onClick={() => navigate(item.path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', position: 'relative', padding: '0 6px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: active ? 'rgba(200,168,75,0.18)' : 'transparent', boxShadow: active ? '0 0 0 1.5px rgba(200,168,75,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: active ? OR : 'rgba(255,255,255,0.35)' }} />
              </div>
              {item.badge && <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: '50%', background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: 'white' }}>{item.badge}</div>}
              <span style={{ fontSize: 7, color: active ? OR : 'rgba(255,255,255,0.35)', fontFamily: 'Georgia,serif' }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
