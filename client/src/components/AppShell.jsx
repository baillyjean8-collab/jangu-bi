import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.05) 8px,rgba(200,168,75,0.05) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.05) 8px,rgba(200,168,75,0.05) 9px)';

const menuItems = [
  { icon: 'ti-home', path: '/' },
  { icon: 'ti-building-church',path: '/parishes' },
  { icon: 'ti-speakerphone', path: '/announcements' },
  { icon: 'ti-broadcast', path: '/live' },
  { icon: 'ti-cross', path: '/catechese' },
  { icon: 'ti-books', path: '/bibliotheque' },
  { icon: 'ti-list-check', path: '/demandes' },
  { icon: 'ti-user', path: '/profile' },
];

function AppShell({ children, hideNav }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initiales = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'MD';
  const photo = user?.profilePhoto || null;
  const isProfile = location.pathname === '/profile';

  // Cas particulier : un admin dont /profile redirige vers /parishes/:id (sa propre
  // paroisse) doit voir l'icone Profil active, pas l'icone Paroisses.
  const estSurSaPropreParoisse = !!(
    user && user.parishId &&
    location.pathname === '/parishes/' + user.parishId
  );

  return (
    <div style={{ background: '#f5f5f0', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '430px', background: '#F5F0E8', minHeight: '100vh', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', paddingBottom: hideNav ? 0 : '72px', boxSizing: 'border-box' }}>
        <main style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
          {children}
        </main>

        {!hideNav && (
          <nav style={{
          position: 'fixed',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 20px)',
          maxWidth: '410px',
          height: '60px',
          background: 'rgba(12,10,6,0.97)',
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.03) 8px,rgba(200,168,75,0.03) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.03) 8px,rgba(200,168,75,0.03) 9px)',
          border: '0.5px solid rgba(200,168,75,0.3)',
          borderRadius: '50px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          zIndex: 999,
          boxSizing: 'border-box',
          padding: '0 6px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {menuItems.map((item, idx) => {
            let isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            // Override pour le cas particulier ci-dessus
            if (estSurSaPropreParoisse) {
              if (item.path === '/parishes') isActive = false;
              if (item.path === '/profile') isActive = true;
            }

            const isLast = idx === menuItems.length - 1;
            return (
              <Link key={idx} to={item.path} style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                width: isLast ? 50 : 52,
                height: 44,
              }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: isActive ? 'rgba(200,168,75,0.15)' : 'transparent',
                  border: isActive ? '1.5px solid rgba(200,168,75,0.55)' : '1.5px solid transparent',
                  boxShadow: isActive ? '0 0 12px rgba(200,168,75,0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i className={`ti ${item.icon}`} style={{
                    fontSize: '23px',
                    color: isActive ? '#C8A84B' : 'rgba(200,168,75,0.45)',
                  }} />
                </div>
              </Link>
            );
          })}
        </nav>
        )}
      </div>
    </div>
  );
}

export default AppShell;
export { AppShell };
export function AuthShell({ children }) {
  return (
    <div style={{ background: '#f5f5f0', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '430px', background: '#F5F0E8', minHeight: '100vh', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  );
}
