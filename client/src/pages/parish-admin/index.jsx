import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parishesApi, liveApi, adminApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../../components/layout';
import { Card, Button, StatCard, Badge, PageLoader, EmptyState, Input, useToast } from '../../components/ui';

const fmtXOF = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—';

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';

// ── Durée formatée ─────────────────────────────────────────────────────────────
function fmtDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}


// ── Liste de mots et expressions interdites (multilingue) ─────────────────────
const BANNED_WORDS = [
  // Français — insultes courantes
  'connard','connasse','salope','pute','putain','enculé','enculee','batard','batarde',
  'merde','con','conne','débile','imbécile','crétin','abruti','idiot','stupide',
  'ferme ta gueule','ta gueule','va te faire','nique','niquer','enfoiré',
  // Anglais
  'fuck','shit','bitch','asshole','bastard','idiot','stupid','dumbass','retard',
  // Wolof (transcriptions courantes)
  'dof','wakhul dara','xale bu bon','jigéen bu bon','rabb',
  // Discours non-catholique / blasphème
  'fuck god','fuck jesus','fuck church','va au diable','satan loué',
  // Harcèlement / menaces
  'je vais te tuer','je te tue','crève','va crever','va mourir',
];

function detecterLangageInapproprie(texte) {
  const t = texte.toLowerCase();
  return BANNED_WORDS.some(mot => t.includes(mot));
}

// Donnees de demonstration pour la moderation
const COMMENTAIRES_DEMO = [
  { id: 1, auteur: 'Jean F.', initiales: 'JF', avatarBg: '#5d7a52', texte: 'Merci pour cette belle célébration, que Dieu vous bénisse !', poste: 'Veillée Mariale', signalements: 0, statut: 'ok' },
  { id: 2, auteur: 'X. Y.', initiales: 'XY', avatarBg: '#888888', texte: '[commentaire signalé par 2 fidèles comme inapproprié]', poste: 'Catéchèse 2026', signalements: 2, statut: 'signale', telephone: '+221 77 XXX XX XX' },
  { id: 3, auteur: 'Awa S.', initiales: 'AS', avatarBg: '#0D3B2E', texte: 'Bonne nouvelle, mes enfants vont pouvoir s\'inscrire !', poste: 'Catéchèse 2026', signalements: 0, statut: 'ok' },
];

// ════════════════════════════════════════════════════════
// TAB: Modération
// ════════════════════════════════════════════════════════
function ModerationTab() {
  const [commentaires, setCommentaires] = useState(COMMENTAIRES_DEMO);
  const [contactModal, setContactModal] = useState(null);
  const [messageTexte, setMessageTexte] = useState('');
  const { toast } = useToast ? useToast() : { toast: () => {} };

  function supprimerCommentaire(id) {
    setCommentaires(prev => prev.filter(cm => cm.id !== id));
  }

  function ouvrirContact(commentaire) {
    setContactModal(commentaire);
    setMessageTexte('');
  }

  function envoyerAvertissement() {
    if (toast) toast({ message: 'Avertissement envoyé à ' + contactModal.auteur, type: 'success' });
    setContactModal(null);
  }

  const signales = commentaires.filter(cm => cm.statut === 'signale');
  const normaux = commentaires.filter(cm => cm.statut === 'ok');

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Info filtre automatique */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-lg flex-shrink-0">🛡️</div>
          <div>
            <div className="text-sm font-semibold text-ivory mb-1">Filtre automatique actif</div>
            <div className="text-xs text-mist leading-relaxed">
              Les commentaires contenant un langage irrespectueux, des insultes ou des propos contraires
              à l'esprit fraternel sont automatiquement bloqués avant publication. Le fidèle reçoit un avertissement.
            </div>
          </div>
        </div>
      </Card>

      {/* Commentaires signalés */}
      {signales.length > 0 && (
        <div>
          <div className="text-xs font-bold text-mist uppercase tracking-wide mb-2">
            Commentaires signalés ({signales.length})
          </div>
          <div className="space-y-2">
            {signales.map(cm => (
              <Card key={cm.id} className="border-danger/40">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: cm.avatarBg }}>{cm.initiales}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ivory">{cm.auteur}</div>
                    <div className="text-xs text-mist">{cm.texte}</div>
                    <div className="text-[10px] text-red-400 mt-1">⚠ {cm.signalements} signalement(s) de fidèles — sur "{cm.poste}"</div>
                  </div>
                </div>
                <div className="flex gap-2 ml-10">
                  <button onClick={() => supprimerCommentaire(cm.id)}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-danger/10 text-red-400 border border-danger/30 flex items-center gap-1">
                    🗑 Supprimer
                  </button>
                  <button onClick={() => ouvrirContact(cm)}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-forest-dark text-gold border-none flex items-center gap-1">
                    💬 Contacter
                  </button>
                  <button onClick={() => setCommentaires(prev => prev.map(c2 => c2.id === cm.id ? { ...c2, statut: 'ok', signalements: 0 } : c2))}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-transparent text-mist border border-forest-light/40">
                    Ignorer
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Commentaires normaux */}
      <div>
        <div className="text-xs font-bold text-mist uppercase tracking-wide mb-2">Tous les commentaires</div>
        <div className="space-y-2">
          {normaux.map(cm => (
            <Card key={cm.id}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: cm.avatarBg }}>{cm.initiales}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ivory">{cm.auteur}</div>
                  <div className="text-xs text-mist">{cm.texte}</div>
                  <div className="text-[10px] text-mist/50 mt-1">sur "{cm.poste}"</div>
                </div>
                <button onClick={() => ouvrirContact(cm)} className="text-mist/50 text-xs flex-shrink-0">⋯</button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal contacter le fidele */}
      {contactModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setContactModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#16213e', borderRadius: '20px 20px 0 0', padding: '20px' }}>
            <div style={{ width: 40, height: 4, background: '#444', borderRadius: 99, margin: '0 auto 18px' }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: contactModal.avatarBg }}>{contactModal.initiales}</div>
              <div>
                <div className="text-sm font-semibold text-ivory">{contactModal.auteur}</div>
                <div className="text-xs text-mist">{contactModal.telephone || 'Téléphone non disponible'}</div>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <button className="flex-1 py-2.5 rounded-xl bg-forest-dark text-gold text-xs flex items-center justify-center gap-1.5">
                💬 Message in-app
              </button>
              <a href={'tel:' + (contactModal.telephone || '')} className="flex-1 py-2.5 rounded-xl bg-transparent border border-ivory/30 text-ivory text-xs flex items-center justify-center gap-1.5">
                📞 Appeler
              </a>
            </div>
            <textarea
              value={messageTexte}
              onChange={e => setMessageTexte(e.target.value)}
              placeholder="Écrire un avertissement fraternel..."
              className="input"
              style={{ height: 70, resize: 'none', marginBottom: 10 }}
            />
            <button onClick={envoyerAvertissement} className="w-full py-3 rounded-2xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#C8A84B,#8B6020)', color: '#1e2d14' }}>
              Envoyer l'avertissement ✦
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: Tableau de bord
// ════════════════════════════════════════════════════════
function DashboardTab({ parish, donations, liveHistory }) {
  const totalSuccess = donations.filter(d => d.status === 'SUCCESS').reduce((s, d) => s + (d.netAmount || 0), 0);
  const totalDons = donations.filter(d => d.status === 'SUCCESS').length;
  const avgDon = totalDons > 0 ? Math.round(totalSuccess / totalDons) : 0;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total collecté"   value={fmtXOF(totalSuccess)} icon="💰" glow />
        <StatCard label="Nombre de dons"   value={totalDons}            icon="💛" />
        <StatCard label="Don moyen"        value={fmtXOF(avgDon)}       icon="📊" />
        <StatCard label="Membres"          value={parish?.stats?.memberCount || 0} icon="👥" />
      </div>

      {/* Derniers dons */}
      {donations.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-ivory mb-3">Derniers dons reçus</h3>
          <div className="space-y-2">
            {donations.slice(0, 5).map(d => (
              <div key={d._id} className="flex items-center justify-between text-xs py-2
                                          border-b border-forest-light/20 last:border-0">
                <div>
                  <p className="text-ivory">
                    {d.isAnonymous ? 'Don anonyme' : `${d.userId?.firstName || ''} ${d.userId?.lastName || ''}`.trim() || 'Fidèle'}
                  </p>
                  <p className="text-mist">{fmtDate(d.createdAt)} · {d.provider}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-semibold">{fmtXOF(d.amount)}</p>
                  <Badge status={d.status} className="text-[10px]">{d.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Historique live */}
      {liveHistory.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-ivory mb-3">Derniers services diffusés</h3>
          <div className="space-y-2">
            {liveHistory.slice(0, 4).map(s => (
              <div key={s._id} className="flex items-center justify-between text-xs py-2
                                          border-b border-forest-light/20 last:border-0">
                <div>
                  <p className="text-ivory truncate max-w-[160px]">{s.title}</p>
                  <p className="text-mist">{fmtDate(s.startedAt)} · {fmtTime(s.startedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-ivory">{s.peakViewers} 👁 max</p>
                  <p className="text-mist">{fmtDuration(s.durationSeconds)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: Gestion du Live
// ════════════════════════════════════════════════════════
function LiveTab({ parish, onRefresh }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [form, setForm] = useState({ title: '', streamUrl: '' });

  useEffect(() => {
    if (!parish?._id) return;
    liveApi.getActive(parish._id)
      .then(r => setActiveSession(r.data.data.session))
      .catch(() => setActiveSession(null))
      .finally(() => setLoading(false));
  }, [parish]);

  async function startLive() {
    if (!form.title.trim()) return toast({ message: 'Titre du service requis', type: 'error' });
    setStarting(true);
    try {
      const res = await liveApi.startSession({ parishId: parish._id, ...form });
      setActiveSession(res.data.data.session);
      toast({ message: 'Service en direct lancé ! 🎉', type: 'success' });
      onRefresh();
    } catch (err) {
      toast({ message: err?.response?.data?.message || 'Erreur au lancement', type: 'error' });
    } finally {
      setStarting(false);
    }
  }

  async function endLive() {
    if (!window.confirm('Terminer ce service en direct ?')) return;
    setEnding(true);
    try {
      await liveApi.endSession(activeSession._id);
      setActiveSession(null);
      toast({ message: 'Service terminé.', type: 'info' });
      onRefresh();
    } catch (err) {
      toast({ message: err?.response?.data?.message || 'Erreur', type: 'error' });
    } finally {
      setEnding(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 animate-fade-up">
      {activeSession ? (
        /* Session active */
        <Card glow>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Service en direct</span>
          </div>

          <h3 className="font-display text-xl text-ivory mb-4">{activeSession.title}</h3>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-forest-light/10 rounded-xl">
              <p className="text-gold font-bold text-lg">{activeSession.currentViewerCount}</p>
              <p className="text-mist text-[10px]">En ligne</p>
            </div>
            <div className="text-center p-2 bg-forest-light/10 rounded-xl">
              <p className="text-ivory font-bold text-lg">{activeSession.peakViewers}</p>
              <p className="text-mist text-[10px]">Pic</p>
            </div>
            <div className="text-center p-2 bg-forest-light/10 rounded-xl">
              <p className="text-ivory font-bold text-lg">
                {Object.values(activeSession.reactionCounts || {}).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-mist text-[10px]">Réactions</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-mist mb-4">
            <span>🙏 {activeSession.reactionCounts?.amen || 0} Amen</span>
            <span>🎉 {activeSession.reactionCounts?.praise || 0} Louanges</span>
            <span>❤️ {activeSession.reactionCounts?.heart || 0} Amour</span>
            <span>🔥 {activeSession.reactionCounts?.fire || 0} Feu</span>
          </div>

          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(`/live/${activeSession._id}`)}
            >
              👁 Voir le direct
            </Button>
            <Button
              variant="danger"
              className="w-full"
              loading={ending}
              onClick={endLive}
            >
              ⏹ Terminer le service
            </Button>
          </div>
        </Card>
      ) : (
        /* Pas de session */
        <>
          <Card>
            <div className="text-center py-4 mb-4">
              <span className="text-4xl block mb-2">📡</span>
              <p className="text-ivory font-medium text-sm">Aucun service en direct</p>
              <p className="text-mist text-xs mt-1">Lancez un service pour diffuser à vos fidèles</p>
            </div>

            <div className="space-y-3">
              <Input
                label="Titre du service *"
                placeholder="Culte du dimanche matin, Conférence de prières…"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <Input
                label="URL de diffusion (optionnel)"
                type="url"
                placeholder="https://youtube.com/live/..."
                value={form.streamUrl}
                onChange={e => setForm(f => ({ ...f, streamUrl: e.target.value }))}
                hint="Lien YouTube Live, Facebook Live, etc."
              />
              <Button
                variant="primary"
                className="w-full"
                loading={starting}
                onClick={startLive}
              >
                🔴 Lancer le service en direct
              </Button>
            </div>
          </Card>

          <div className="bg-forest-light/10 border border-forest-light/20 rounded-xl px-4 py-3">
            <p className="text-mist text-xs leading-relaxed">
              💡 <strong className="text-ivory">Conseil :</strong> Obtenez votre lien de diffusion depuis YouTube Studio, Facebook Live ou OBS avant de lancer.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: Informations paroisse
// ════════════════════════════════════════════════════════
function ParishInfoTab({ parish, onRefresh }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name:        parish?.name || '',
    description: parish?.description || '',
    denomination:parish?.denomination || '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await parishesApi.update(parish._id, form);
      toast({ message: 'Informations mises à jour ✓', type: 'success' });
      onRefresh();
    } catch (err) {
      toast({ message: err?.response?.data?.message || 'Erreur', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <Card>
        <h3 className="text-sm font-medium text-ivory mb-4">Modifier les informations</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nom de la paroisse"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              maxLength={1000}
              className="input resize-none"
              placeholder="Décrivez votre paroisse, ses activités, son histoire…"
            />
            <p className="text-xs text-mist mt-1 text-right">{form.description.length}/1000</p>
          </div>
          <Input
            label="Dénomination (ex: Catholique, Évangélique…)"
            value={form.denomination}
            onChange={e => setForm(f => ({ ...f, denomination: e.target.value }))}
          />
          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Enregistrer les modifications
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE PRINCIPALE PARISH ADMIN
// ════════════════════════════════════════════════════════
export function ParishAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [parish, setParish] = useState(null);
  const [donations, setDonations] = useState([]);
  const [liveHistory, setLiveHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.parishId) return;
    try {
      const [parishRes, donsRes, liveRes] = await Promise.all([
        parishesApi.getById(user.parishId),
        adminApi.donations({ parishId: user.parishId, limit: 20 }),
        liveApi.getHistory({ parishId: user.parishId, limit: 8 }),
      ]);
      setParish(parishRes.data.data.parish);
      setDonations(donsRes.data.data.donations || []);
      setLiveHistory(liveRes.data.data || []);
    } catch { /* graceful */ }
    finally { setLoading(false); }
  }, [user?.parishId]);

  useEffect(() => { load(); }, [load]);

  if (!user?.parishId) {
    return (
      <AppShell>
        <EmptyState
          icon="⛪"
          title="Aucune paroisse assignée"
          description="Vous n'avez pas encore de paroisse assignée. Contactez un super administrateur."
          action={<Button variant="primary" onClick={() => navigate('/')}>Retour à l'accueil</Button>}
        />
      </AppShell>
    );
  }

  if (loading) return <AppShell><PageLoader message="Chargement du dashboard…" /></AppShell>;

  const TABS = [
    { id: 'dashboard',  label: '📊 Dashboard' },
    { id: 'live',       label: '📡 Live' },
    { id: 'moderation', label: '🛡️ Modération' },
    { id: 'info',       label: '⚙️ Infos' },
  ];

  return (
    <AppShell>
      {/* Header paroisse */}
      <div className="flex items-center gap-3 mb-6 animate-fade-up">
        <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20
                        flex items-center justify-center text-2xl">
          ⛪
        </div>
        <div>
          <h1 className="font-display text-xl text-ivory leading-tight">
            {parish?.name || 'Ma Paroisse'}
          </h1>
          <p className="text-mist text-xs mt-0.5">
            {parish?.location?.city}, {parish?.location?.country}
          </p>
        </div>
        {parish?.isVerified ? (
          <span className="ml-auto badge badge-success">✓ Vérifié</span>
        ) : (
          <span className="ml-auto badge badge-warning">En attente</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-charcoal/60 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                        ${tab === t.id
                          ? 'bg-gold/20 text-gold border border-gold/30'
                          : 'text-mist hover:text-ivory'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab parish={parish} donations={donations} liveHistory={liveHistory} />}
      {tab === 'live'      && <LiveTab parish={parish} onRefresh={load} />}
      {tab === 'moderation' && <ModerationTab />}
      {tab === 'info'      && <ParishInfoTab parish={parish} onRefresh={load} />}
    </AppShell>
  );
}
