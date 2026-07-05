import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout';
import { contientMotInterdit, sauvegarderAvertissement, compteRestreint, messageRestriction } from '../../utils/jb-filtre';

const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';
const OR    = '#C8A84B';
const VERT  = '#1e2d14';
const IVOIRE = '#F5F0E8';

const COLORS = {
  bgPage: IVOIRE,
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
  const [lives] = useState([
    { _id: '1', titre: 'Messe dominicale', paroisse: 'Cathédrale de Dakar', statut: 'en_cours', viewers: 342, type: 'messe' },
    { _id: '2', titre: 'Adoration eucharistique', paroisse: 'Saint-Michel, Dakar', statut: 'en_cours', viewers: 128, type: 'adoration' },
    { _id: '3', titre: 'Chapelet médité', paroisse: 'Institut Sainte-Jeanne, Thiès', statut: 'a_venir', viewers: 0, type: 'chapelet' },
  ]);

  return (
    <AppShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 20px 20px', borderRadius: '0 0 24px 24px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600, color: COLORS.gold, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Jangu Bi</p>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>Directs & Célébrations</h1>
      </div>
      <div style={{ padding: '16px' }}>
        {lives.map(live => (
          <div key={live._id}
            onClick={() => navigate('/live/' + live._id)}
            style={{ background: COLORS.bgCard, borderRadius: '16px', border: '1.5px solid ' + COLORS.accent, marginBottom: '12px', padding: '16px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,45,20,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {live.statut === 'en_cours' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: COLORS.live, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  EN DIRECT
                </span>
              )}
              {live.statut === 'a_venir' && (
                <span style={{ background: COLORS.accent, color: '#5a6e4a', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>À venir</span>
              )}
              <span style={{ fontSize: '11px', color: COLORS.textMuted }}>{live.viewers > 0 ? live.viewers + ' spectateurs' : ''}</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '4px' }}>{live.titre}</div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: live.statut === 'en_cours' ? '12px' : '0' }}>📍 {live.paroisse}</div>
            {live.statut === 'en_cours' && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/live/' + live._id); }}
                style={{ background: COLORS.green, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                Rejoindre le direct
              </button>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
