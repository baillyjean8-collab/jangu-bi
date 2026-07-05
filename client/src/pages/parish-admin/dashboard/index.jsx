import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';

// Formater une date en "Il y a X min/h/j"
function formatTemps(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const j    = Math.floor(diff / 86400000);
  const mois = Math.floor(diff / 2592000000);
  if (mois > 0) return 'Il y a ' + mois + ' mois';
  if (j > 0)    return 'Il y a ' + j + ' j';
  if (h > 0)    return 'Il y a ' + h + 'h';
  if (min > 0)  return 'Il y a ' + min + ' min';
  return 'À l\u2019instant';
}

const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const MENU_ITEMS = [
  { path: '/parish-admin/publications', icon: 'ti-news',      label: 'Publications & Stories', sub: 'Gérer vos posts et stories', color: OR },
  { path: '/parish-admin/demandes',     icon: 'ti-file-text', label: 'Demandes des fidèles',   sub: 'Valider ou rejeter',          color: '#e53935', badge: true },
  { path: '/parish-admin/dons',         icon: 'ti-coin',      label: 'Dons & Campagnes',        sub: 'Campagnes et historique',     color: OR },
  { path: '/parish-admin/fideles',      icon: 'ti-users',     label: 'Fidèles & Paroissiens',   sub: 'Communauté et contacts',      color: '#81C784' },
  { path: '/parish-admin/moderation',   icon: 'ti-shield',    label: 'Modération',              sub: 'Commentaires signalés',       color: '#e53935', badge: true },
  { path: '/parish-admin/branches',     icon: 'ti-sitemap',   label: 'Branches & Groupes',      sub: 'Chorale, Jeunes, Pastoral...', color: OR },
  { path: '/parish-admin/live',         icon: 'ti-broadcast', label: 'Gestion Live',            sub: 'Lancer et gérer vos directs', color: '#ef9a9a' },
  { path: '/parish-admin/paroisse',     icon: 'ti-settings',  label: 'Ma Paroisse',             sub: 'Infos, horaires, admins',     color: OR },
];

function formatMontant(n) {
  if (!n || n === 0) return '0';
  if (n >= 1000000) return (Math.round(n / 100000) / 10) + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'K';
  return n.toLocaleString('fr-SN');
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]       = useState(null);
  const [activite, setActivite] = useState([]);
  const token = localStorage.getItem('jb_admin_token');

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const [s, a] = await Promise.allSettled([
          fetch('/api/parish-admin/dashboard', {
            headers: { Authorization: 'Bearer ' + token }
          }).then(function(r) { return r.json(); }),
          fetch('/api/parish-admin/activite', {
            headers: { Authorization: 'Bearer ' + token }
          }).then(function(r) { return r.json(); }),
        ]);
        if (s.status === 'fulfilled' && s.value && s.value.data) {
          setStats(s.value.data);
        }
        if (a.status === 'fulfilled' && a.value && Array.isArray(a.value.data)) {
          setActivite(a.value.data);
        }
      } catch(e) {
        console.log('Dashboard load error:', e.message);
      }
    }

    load();
    const iv = setInterval(load, 30000);
    return function() { clearInterval(iv); };
  }, [token]);

  const STATS_DISPLAY = [
    { label: 'Paroissiens', value: stats ? stats.paroissiens : '...', sub: 'membres inscrits', icon: 'ti-cross',   color: OR },
    { label: 'Abonnés',     value: stats ? stats.abonnes : '...',     sub: 'suivent la page',  icon: 'ti-heart',   color: '#81C784' },
    { label: 'Dons FCFA',   value: stats ? formatMontant(stats.dons && stats.dons.total) : '...', sub: 'reçus au total', icon: 'ti-coin', color: OR },
    { label: 'En attente',  value: stats ? stats.demandesEnAttente : '...', sub: 'demandes', icon: 'ti-clock', color: '#e53935' },
  ];

  const NOTIFS_MOCK = [
    { icon: '📄', msg: 'Amadou D. a soumis une demande de baptême', temps: 'Il y a 5 min', urgent: true },
    { icon: '💰', msg: 'Un fidèle a fait un don de 25 000 FCFA', temps: 'Il y a 12 min', urgent: false },
    { icon: '💬', msg: 'Fatou M. vous a envoyé un message', temps: 'Il y a 1h', urgent: false },
    { icon: '👤', msg: 'Marie K. suit maintenant votre paroisse', temps: 'Il y a 2h', urgent: false },
  ];

  const notifs = activite.length > 0 ? activite : NOTIFS_MOCK;

  return (
    <AdminShell>
      {/* Header */}
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 16px', borderRadius: '0 0 28px 28px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(200,168,75,0.5)', letterSpacing: '.08em', marginBottom: 3 }}>ESPACE ADMIN ✓</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Paroisse Sacré-Cœur</div>
            <div style={{ fontSize: 9, color: 'rgba(245,240,232,0.4)', marginTop: 2 }}>Archidiocèse de Dakar</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <i className="ti ti-bell" style={{ fontSize: 16, color: OR }} />
                </div>
                <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: 'white', fontWeight: 700 }}>3</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1e2d14,#0C0A06)', border: '2px solid ' + OR, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate('/parish-admin/paroisse')}>
                <i className="ti ti-building-church" style={{ fontSize: 16, color: OR }} />
              </div>
            </div>
            <div style={{ background: 'rgba(200,168,75,0.2)', border: '1px solid rgba(200,168,75,0.4)', borderRadius: 8, padding: '2px 9px', fontSize: 7, color: OR, fontWeight: 700 }}>ADMIN</div>
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {STATS_DISPLAY.map(function(s, i) {
            return (
              <div key={i} style={{ background: i === 3 && stats && stats.demandesEnAttente > 0 ? 'rgba(229,57,53,0.15)' : 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 4px', textAlign: 'center', border: i === 3 && stats && stats.demandesEnAttente > 0 ? '1px solid rgba(229,57,53,0.3)' : 'none' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'Georgia,serif' }}>{s.value}</div>
                <div style={{ fontSize: 7, color: 'rgba(200,168,75,0.6)', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 14px' }}>
        {/* Actions rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <button onClick={function() { navigate('/parish-admin/publications'); }} style={{ background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 14, padding: '13px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: OR, fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: 11 }}>
            <i className="ti ti-plus" style={{ fontSize: 18 }} />Nouvelle pub.
          </button>
          <button onClick={function() { navigate('/parish-admin/live'); }} style={{ background: 'linear-gradient(135deg,#7f0000,#3a0000)', border: 'none', borderRadius: 14, padding: '13px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#ffcdd2', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: 11 }}>
            <i className="ti ti-broadcast" style={{ fontSize: 18 }} />Lancer live
          </button>
        </div>

        {/* Activité récente */}
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Activité récente</span>
          <span style={{ fontSize: 9, color: OR, fontWeight: 400, cursor: 'pointer' }}>Tout voir →</span>
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: '4px 0', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 14 }}>
          {notifs.map(function(n, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < notifs.length-1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: n.urgent ? 'rgba(229,57,53,0.08)' : 'rgba(200,168,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: VERT, lineHeight: 1.4, fontFamily: 'Georgia,serif' }}>{n.msg}</div>
                  <div style={{ fontSize: 9, color: n.urgent ? '#e53935' : '#9A8E7E', marginTop: 2 }}>{n.temps ? n.temps : formatTemps(n.createdAt || n.date)}</div>
                </div>
                {n.urgent && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e53935', marginTop: 4, flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        {/* Menu gestion */}
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 8 }}>Gestion</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {MENU_ITEMS.map(function(item, i) {
            return (
              <div key={i} onClick={function() { navigate(item.path); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={'ti ' + item.icon} style={{ fontSize: 18, color: item.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif' }}>{item.label}</div>
                  <div style={{ fontSize: 9, color: '#7A6E5E' }}>{item.sub}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {item.badge && stats && stats.demandesEnAttente > 0 && item.path.includes('demandes') && (
                    <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', padding: '0 4px' }}>{stats.demandesEnAttente}</div>
                  )}
                  <i className="ti ti-chevron-right" style={{ fontSize: 13, color: '#ccc' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
