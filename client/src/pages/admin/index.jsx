import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api';
import { AppShell } from '../../components/layout';
import { Card, StatCard, Badge, Button, PageLoader, EmptyState, useToast } from '../../components/ui';

// ── Format helpers ─────────────────────────────────────────────────────────────
const fmtXOF = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

// ── Tab nav ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: '📊 Vue d\'ensemble' },
  { id: 'users',     label: '👥 Utilisateurs' },
  { id: 'donations', label: '💛 Dons' },
  { id: 'audit',     label: '🔍 Audit' },
];

// ── Overview tab ───────────────────────────────────────────────────────────────
function OverviewTab({ stats }) {
  if (!stats) return <PageLoader />;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total des dons"      value={fmtXOF(stats.totalDonationAmount)} icon="💰" glow />
        <StatCard label="Nombre de dons"       value={stats.totalDonations}              icon="📈" />
        <StatCard label="Utilisateurs"         value={stats.totalUsers}                  icon="👥" />
        <StatCard label="Paroisses actives"    value={stats.activeParishes}              icon="⛪" />
      </div>

      {/* Recent donations */}
      {stats.recentDonations?.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-ivory mb-3">Dons récents</h3>
          <div className="space-y-2">
            {stats.recentDonations.map(d => (
              <div key={d._id} className="flex items-center justify-between text-xs py-2
                                          border-b border-forest-light/20 last:border-0">
                <div>
                  <p className="text-ivory">{d.userId?.firstName} {d.userId?.lastName}</p>
                  <p className="text-mist">{fmtDate(d.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-semibold">{fmtXOF(d.amount)}</p>
                  <Badge status={d.status}>{d.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Live sessions summary */}
      {stats.activeLiveSessions > 0 && (
        <Card glow>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-mist uppercase tracking-widest mb-1">En ce moment</p>
              <p className="font-display text-xl text-ivory">
                {stats.activeLiveSessions} service{stats.activeLiveSessions > 1 ? 's' : ''} en direct
              </p>
              <p className="text-xs text-mist mt-0.5">
                {stats.totalCurrentViewers} spectateurs en ligne
              </p>
            </div>
            <span className="text-4xl">📡</span>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Users tab ──────────────────────────────────────────────────────────────────
function UsersTab() {
  const { toast }           = useToast();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await adminApi.users({ page: p, limit: LIMIT });
      setUsers(data.data.users || []);
      setTotal(data.data.total || 0);
      setPage(p);
    } catch { toast({ message: 'Erreur de chargement', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, []);

  async function changeRole(userId, role) {
    try {
      await adminApi.updateUserRole(userId, role);
      toast({ message: 'Rôle mis à jour', type: 'success' });
      load(page);
    } catch { toast({ message: 'Erreur', type: 'error' }); }
  }

  async function deactivate(userId) {
    if (!window.confirm('Désactiver cet utilisateur ?')) return;
    try {
      await adminApi.deactivateUser(userId);
      toast({ message: 'Utilisateur désactivé', type: 'success' });
      load(page);
    } catch { toast({ message: 'Erreur', type: 'error' }); }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-up space-y-3">
      <p className="text-mist text-xs">{total} utilisateur{total > 1 ? 's' : ''}</p>

      {users.map(u => (
        <Card key={u._id} className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-ivory text-sm font-medium truncate">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-mist text-xs truncate">{u.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge status={u.isActive ? 'SUCCESS' : 'FAILED'}>
                  {u.isActive ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge className="badge-muted">{u.role}</Badge>
                {u.isVerified && <Badge className="badge-success">✓</Badge>}
              </div>
            </div>
            <p className="text-mist text-[10px] flex-shrink-0">{fmtDate(u.createdAt)}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 pt-1 border-t border-forest-light/20">
            <select
              value={u.role}
              onChange={e => changeRole(u._id, e.target.value)}
              className="flex-1 bg-forest-dark/60 border border-forest-light/30 rounded-lg
                         px-2 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold/40"
            >
              <option value="user">Fidèle</option>
              <option value="parish_admin">Admin Paroisse</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {u.isActive && (
              <Button variant="danger" size="sm" onClick={() => deactivate(u._id)}
                      className="text-xs px-3 py-1.5">
                Désactiver
              </Button>
            )}
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => load(page - 1)} className="flex-1">
            ← Précédent
          </Button>
          <span className="flex items-center text-xs text-mist px-2">
            {page}/{Math.ceil(total / LIMIT)}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / LIMIT)}
                  onClick={() => load(page + 1)} className="flex-1">
            Suivant →
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Donations tab ──────────────────────────────────────────────────────────────
function DonationsTab() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const { toast }                 = useToast();

  useEffect(() => {
    adminApi.donations({ limit: 50, ...(filter && { status: filter }) })
      .then(r => setDonations(r.data.data.donations || []))
      .catch(() => toast({ message: 'Erreur de chargement', type: 'error' }))
      .finally(() => setLoading(false));
  }, [filter]);

  const totalSuccess = donations
    .filter(d => d.status === 'SUCCESS')
    .reduce((s, d) => s + d.amount, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-up space-y-4">
      {/* Filter + total */}
      <div className="flex items-center gap-2">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 bg-forest-dark/60 border border-forest-light/30 rounded-xl
                     px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold/40"
        >
          <option value="">Tous les statuts</option>
          {['INITIATED','PENDING','SUCCESS','FAILED','REFUNDED','CANCELLED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {totalSuccess > 0 && (
          <p className="text-xs text-gold font-medium whitespace-nowrap">{fmtXOF(totalSuccess)}</p>
        )}
      </div>

      {donations.length === 0 ? (
        <EmptyState icon="💰" title="Aucun don trouvé" />
      ) : (
        <div className="space-y-2">
          {donations.map(d => (
            <Card key={d._id} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-ivory text-sm truncate">
                  {d.userId?.firstName} {d.userId?.lastName}
                </p>
                <p className="text-mist text-xs mt-0.5">
                  {d.provider} • {fmtDate(d.createdAt)} {fmtTime(d.createdAt)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-gold font-semibold text-sm">{fmtXOF(d.amount)}</p>
                <Badge status={d.status} className="text-[10px]">{d.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Audit log tab ──────────────────────────────────────────────────────────────
function AuditTab() {
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.auditLogs({ limit: 50 })
      .then(r => setLogs(r.data.data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ACTION_ICONS = {
    'auth.':     '🔐',
    'donation.': '💛',
    'admin.':    '⚙️',
    'live.':     '📡',
    'webhook.':  '🔗',
  };

  function getIcon(action = '') {
    for (const [prefix, icon] of Object.entries(ACTION_ICONS)) {
      if (action.startsWith(prefix)) return icon;
    }
    return '📝';
  }

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-up space-y-2">
      {logs.length === 0 ? (
        <EmptyState icon="🔍" title="Aucun journal disponible" />
      ) : (
        logs.map(log => (
          <Card key={log._id} className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">{getIcon(log.action)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-ivory text-xs font-medium font-mono truncate">{log.action}</p>
                <Badge
                  className={`text-[10px] flex-shrink-0
                    ${log.status === 'success' ? 'badge-success' :
                      log.status === 'failure' ? 'badge-danger'  : 'badge-warning'}`}
                >
                  {log.status}
                </Badge>
              </div>
              <p className="text-mist text-[10px] mt-0.5">
                {fmtDate(log.timestamp)} {fmtTime(log.timestamp)}
                {log.ipAddress && ` • ${log.ipAddress}`}
              </p>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <p className="text-mist text-[10px] font-mono mt-1 truncate">
                  {JSON.stringify(log.metadata).slice(0, 80)}
                </p>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ADMIN DASHBOARD PAGE
// ══════════════════════════════════════════════════════
export function AdminPage() {
  const [tab, setTab]     = useState('overview');
  const [stats, setStats] = useState(null);
  const { toast }         = useToast();

  useEffect(() => {
    adminApi.dashboard()
      .then(r => setStats(r.data.data))
      .catch(() => toast({ message: 'Erreur de chargement du dashboard', type: 'error' }));
  }, []);

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="section-title">⚙️ Administration</h1>
        <p className="section-sub">Gérez votre plateforme JANGU BI</p>
      </div>

      {/* Tab nav — horizontal scroll for mobile */}
      <div className="flex gap-1 bg-charcoal/60 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                        ${tab === t.id
                          ? 'bg-gold/20 text-gold border border-gold/30'
                          : 'text-mist hover:text-ivory'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab stats={stats} />}
      {tab === 'users'     && <UsersTab />}
      {tab === 'donations' && <DonationsTab />}
      {tab === 'audit'     && <AuditTab />}
    </AppShell>
  );
}
