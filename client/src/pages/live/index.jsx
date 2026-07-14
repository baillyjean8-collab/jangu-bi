import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout';

const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const COLORS = {
  bgCard: '#FFFFFF',
  green: '#1e2d14',
  gold: '#c8a84b',
  textPrimary: '#1a1a1a',
  textMuted: '#8a9a7a',
  accent: '#e8f0dc',
  live: '#e53e3e',
};

export default function LiveListPage() {
  const navigate = useNavigate();
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    async function charger() {
      try {
        const { liveApi } = await import('../../services/api');
        const data = await liveApi.getActifs();
        const sessions = data && data.data && data.data.sessions ? data.data.sessions : [];
        setLives(sessions);
      } catch (e) {
        console.log('Live actifs:', e.message);
      } finally {
        setLoading(false);
      }
    }
    charger();
    const intervalle = setInterval(charger, 15000);
    return function() { clearInterval(intervalle); };
  }, []);

  return (
    <AppShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 20px 20px', borderRadius: '0 0 24px 24px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600, color: COLORS.gold, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Jangu Bi</p>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>Directs & Celebrations</h1>
      </div>
      <div style={{ padding: '16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted, fontSize: 13 }}>Chargement...</div>
        )}
        {!loading && lives.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted, fontSize: 13 }}>Aucun direct en cours pour le moment</div>
        )}
        {lives.map(function(live) {
          const paroisse = live.parishId && live.parishId.name ? live.parishId.name : 'Paroisse';
          return (
            <div key={live._id}
              onClick={function() { navigate('/live/' + live._id); }}
              style={{ background: COLORS.bgCard, borderRadius: '16px', border: '1.5px solid ' + COLORS.accent, marginBottom: '12px', padding: '16px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,45,20,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: COLORS.live, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  EN DIRECT
                </span>
                <span style={{ fontSize: '11px', color: COLORS.textMuted }}>{live.currentViewerCount || 0} spectateurs</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '4px' }}>{live.title}</div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '12px' }}>{paroisse}</div>
              <button
                onClick={function(e) { e.stopPropagation(); navigate('/live/' + live._id); }}
                style={{ background: COLORS.green, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                Rejoindre le direct
              </button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
