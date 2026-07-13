import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#1e2d14,#0C0A06)',
  'linear-gradient(135deg,#1565C0,#0a2a5e)',
  'linear-gradient(135deg,#6a1b9a,#2d0050)',
  'linear-gradient(135deg,#b71c1c,#4a0000)',
  'linear-gradient(135deg,#0d47a1,#002171)',
  'linear-gradient(135deg,#1b5e20,#0a2e0a)',
  'linear-gradient(135deg,#4a148c,#1a0030)',
  'linear-gradient(135deg,#004d40,#001a15)',
  'linear-gradient(135deg,#e65100,#6e2700)',
  'linear-gradient(135deg,#880e4f,#3a0020)',
];

function getAvatarColor(nom) {
  let hash = 0;
  for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitiales(nom) {
  return (nom || '??').replace(/^(Paroisse|Cathedrale|Chapelle|Abbaye|Sanctuaire|Notre-Dame|Saint|Sainte)\s*/i, '')
    .split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || (nom || '??').substring(0, 2).toUpperCase();
}

function Chip({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
      borderRadius: 20, fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap',
      fontFamily: 'Georgia,serif', fontWeight: 700, flexShrink: 0,
      background: active ? VERT : 'white',
      color: active ? IVOIRE : '#5A5045',
      border: active ? 'none' : '1px solid rgba(0,0,0,0.08)',
      transition: 'all .2s',
    }}>
      {label}
    </div>
  );
}

function ParoisseCard({ p, suivi, onToggleSuivi, onClick }) {
  const initiales = getInitiales(p.nom);
  const avatarBg  = p.photo ? 'none' : getAvatarColor(p.nom);
  const hasCoords = !!(p.coords && p.coords.lat && p.coords.lng);

  return (
    <div onClick={onClick} style={{
      background: 'white', borderRadius: 16, padding: '12px 12px 10px',
      border: suivi ? `1.5px solid rgba(200,168,75,0.35)` : '1px solid rgba(0,0,0,0.06)',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: avatarBg, border: `2px solid ${OR}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden',
        }}>
          {p.photo
            ? <img src={p.photo} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initiales || <i className="ti ti-building-church" style={{ fontSize: 19, color: OR }} />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif', lineHeight: 1.3, marginRight: 6 }}>
              {p.nom}
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 5, fontFamily: 'Georgia,serif' }}>
            {[p.ville, p.pays].filter(Boolean).join(' - ')}
          </div>
          {p.denomination && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ background: '#e8f5e9', color: VERT, padding: '2px 7px', borderRadius: 20, fontSize: 8, fontWeight: 700, fontFamily: 'Georgia,serif' }}>
                {p.denomination}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 7, marginTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 8 }}>
        {hasCoords && (
          <button
            onClick={e => { e.stopPropagation(); window.open(`https://maps.google.com/?q=${p.coords.lat},${p.coords.lng}`); }}
            style={{ flex: 1, padding: 7, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 9, fontSize: 9, color: '#5A5045', cursor: 'pointer', fontFamily: 'Georgia,serif' }}
          >
            <i className="ti ti-map" style={{ fontSize: 10 }} /> Itineraire
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onToggleSuivi(p.id); }}
          style={{
            flex: 1, padding: 7, border: 'none', borderRadius: 9, fontSize: 9,
            cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700,
            background: suivi ? 'linear-gradient(135deg,#C8A84B,#8B6020)' : '#f0ece4',
            color: VERT,
          }}
        >
          {suivi ? 'Suivi' : '+ Suivre'}
        </button>
      </div>
    </div>
  );
}

export function ParishesPage() {
  const navigate = useNavigate();
  const [region,       setRegion]       = useState('Tous');
  const [recherche,    setRecherche]    = useState('');
  const [showSearch,   setShowSearch]   = useState(false);
  const [suivis,       setSuivis]       = useState(new Set());
  const [paroisses,    setParoisses]    = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(function() {
    async function charger() {
      try {
        const { parishesApi, userApi } = await import('../../services/api');
        const data = await parishesApi.getAll({ limit: 100 });
        const items = data && data.data ? (Array.isArray(data.data) ? data.data : (data.data.items || data.data.data || [])) : [];
        const mapped = items.map(function(p) {
          return {
            id: p._id,
            nom: p.name,
            ville: p.location && p.location.city,
            pays: p.location && p.location.country,
            denomination: p.denomination,
            photo: p.logoUrl || null,
            coords: p.location && p.location.coordinates && p.location.coordinates.coordinates
              ? { lat: p.location.coordinates.coordinates[1], lng: p.location.coordinates.coordinates[0] }
              : null,
          };
        });
        setParoisses(mapped);

        try {
          const meData = await userApi.getMe();
          const followed = meData && meData.data && meData.data.user && meData.data.user.followedParishes;
          if (Array.isArray(followed)) {
            setSuivis(new Set(followed.map(function(f) { return typeof f === 'string' ? f : f._id; })));
          }
        } catch (e) { console.log('Suivis:', e.message); }
      } catch (e) {
        console.log('Paroisses:', e.message);
      } finally {
        setLoading(false);
      }
    }
    charger();
  }, []);

  async function toggleSuivi(id) {
    const dejaSuivi = suivis.has(id);
    setSuivis(function(prev) {
      const next = new Set(prev);
      dejaSuivi ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      const { userApi } = await import('../../services/api');
      const BASE = import.meta.env.VITE_API_URL || '/api';
      const token = (await import('../../api/client')).tokenStore.get();
      await fetch(BASE + '/users/me/' + (dejaSuivi ? 'unfollow' : 'follow') + '/' + id, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
    } catch (e) { console.log('Toggle suivi:', e.message); }
  }

  const REGIONS = useMemo(function() {
    const villes = Array.from(new Set(paroisses.map(function(p) { return p.ville; }).filter(Boolean)));
    return ['Tous'].concat(villes);
  }, [paroisses]);

  const filtrees = useMemo(function() {
    return paroisses.filter(function(p) {
      if (region !== 'Tous' && p.ville !== region) return false;
      if (recherche) {
        const q = recherche.toLowerCase();
        const hayNom = (p.nom || '').toLowerCase();
        const hayVille = (p.ville || '').toLowerCase();
        if (!hayNom.includes(q) && !hayVille.includes(q)) return false;
      }
      return true;
    });
  }, [paroisses, region, recherche]);

  const paroisseSuivie = filtrees.filter(function(p) { return suivis.has(p.id); });
  const autresParoisses = filtrees.filter(function(p) { return !suivis.has(p.id); });

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE, backgroundImage: BOGOLAN, paddingBottom: 90 }}>

        <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 12px', borderRadius: '0 0 24px 24px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Paroisses</div>
              <div style={{ fontSize: 9, color: 'rgba(200,168,75,0.6)', marginTop: 1 }}>
                {filtrees.length} lieu{filtrees.length > 1 ? 'x' : ''} de culte
              </div>
            </div>
            <button
              onClick={function() { setShowSearch(function(s) { return !s; }); }}
              style={{ width: 34, height: 34, borderRadius: '50%', background: showSearch ? 'rgba(200,168,75,0.25)' : 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <i className="ti ti-search" style={{ fontSize: 15, color: OR }} />
            </button>
          </div>

          {showSearch && (
            <div style={{ marginBottom: 8 }}>
              <input
                autoFocus
                value={recherche}
                onChange={function(e) { setRecherche(e.target.value); }}
                placeholder="Rechercher une paroisse, ville..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: IVOIRE, outline: 'none', fontFamily: 'Georgia,serif', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {REGIONS.map(function(r) {
              return <Chip key={r} label={r} active={region === r} onClick={function() { setRegion(r); }} />;
            })}
          </div>
        </div>

        <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-bell" style={{ fontSize: 12, color: OR }} />
            <span style={{ fontSize: 10, color: '#7A6E5E', fontFamily: 'Georgia,serif' }}>
              <strong style={{ color: VERT }}>{suivis.size}</strong> suivies
            </span>
          </div>
        </div>

        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {loading && <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>}

          {!loading && paroisseSuivie.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: VERT, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Georgia,serif' }}>
                <i className="ti ti-bell" style={{ fontSize: 11, color: OR }} /> Paroisse{paroisseSuivie.length > 1 ? 's' : ''} suivie{paroisseSuivie.length > 1 ? 's' : ''}
              </div>
              {paroisseSuivie.map(function(p) {
                return <ParoisseCard key={p.id} p={p} suivi onToggleSuivi={toggleSuivi} onClick={function() { navigate('/parishes/' + p.id); }} />;
              })}
            </>
          )}

          {!loading && autresParoisses.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif', marginTop: paroisseSuivie.length > 0 ? 4 : 0 }}>
                {paroisseSuivie.length > 0 ? 'Paroisses suivantes' : 'Toutes les paroisses'}
              </div>
              {autresParoisses.map(function(p) {
                return <ParoisseCard key={p.id} p={p} suivi={false} onToggleSuivi={toggleSuivi} onClick={function() { navigate('/parishes/' + p.id); }} />;
              })}
            </>
          )}

          {!loading && filtrees.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>
              Aucune paroisse trouvee
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
