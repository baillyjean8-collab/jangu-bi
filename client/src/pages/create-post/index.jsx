import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { postsApi, storiesApi } from '../../services/api';

const VERT = '#1e2d14';
const OR   = '#C8A84B';
const IVOIRE = '#F5F0E8';

const TYPES_PUB = [
  { id: 'NORMAL',      label: 'Publication', color: 'rgba(200,168,75,0.15)', tc: '#8B6020' },
  { id: 'ANNONCE',     label: 'Annonce',     color: '#e3f2fd',              tc: '#1565c0' },
  { id: 'INSCRIPTION', label: 'Inscription', color: 'rgba(21,101,192,0.1)', tc: '#1565C0' },
  { id: 'COLLECTE',    label: 'Collecte',    color: 'rgba(200,168,75,0.15)',tc: '#8B6020' },
  { id: 'EVENEMENT',   label: 'Evenement',   color: '#e8f5e9',              tc: '#2e7d32' },
  { id: 'MEDIA',       label: 'Media',       color: 'rgba(183,28,28,0.08)', tc: '#b71c1c' },
];

const FILTRES = [
  { id: 'normal',     label: 'Normal',     css: 'none' },
  { id: 'vif',        label: 'Vif',        css: 'saturate(1.6) contrast(1.05)' },
  { id: 'chaleureux', label: 'Chaleureux', css: 'sepia(0.35) saturate(1.2)' },
  { id: 'nb',         label: 'N&B',        css: 'grayscale(1)' },
  { id: 'contraste',  label: 'Contraste',  css: 'contrast(1.4)' },
];

const AUTO_ADJUST_CSS = 'contrast(1.12) saturate(1.18) brightness(1.04)';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [typePub, setTypePub]     = useState('NORMAL');
  const [texte, setTexte]         = useState('');
  const [publishing, setPublishing] = useState(false);
  const [erreur, setErreur]       = useState('');
  const [aussiEnStory, setAussiEnStory] = useState(false);

  const [mediaItems, setMediaItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFiltres, setShowFiltres] = useState(false);
  const [effetsMessage, setEffetsMessage] = useState('');

  const initiales = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'MD';
  const activeMedia = mediaItems[activeIndex] || null;
  const yAMediaLocal = mediaItems.some(function(m) { return m.local; });

  function ouvrirSelecteurFichiers() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function surFichiersChoisis(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const nouveaux = files.map(function(file) {
      return {
        url: URL.createObjectURL(file),
        kind: file.type.startsWith('video/') ? 'video' : 'image',
        filtre: 'normal',
        auto: false,
        local: true,
        mode: 'contain', // image entiere visible par defaut, rien n'est coupe
        zoom: 1,
      };
    });
    setMediaItems(function(prev) {
      const next = [...prev, ...nouveaux];
      setActiveIndex(prev.length);
      return next;
    });
    e.target.value = '';
  }

  function retirerMediaActif() {
    setMediaItems(function(prev) {
      const next = prev.filter(function(_, i) { return i !== activeIndex; });
      setActiveIndex(0);
      return next;
    });
  }

  function toggleRognage() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, mode: m.mode === 'cover' ? 'contain' : 'cover', zoom: 1 };
      });
    });
  }

  function changerZoom(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, zoom: valeur };
      });
    });
  }

  function toggleAutoAjust() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, auto: !m.auto };
      });
    });
  }

  function choisirFiltre(filtreId) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, filtre: filtreId };
      });
    });
  }

  function styleFiltreActif() {
    if (!activeMedia) return 'none';
    const parts = [];
    if (activeMedia.auto) parts.push(AUTO_ADJUST_CSS);
    const f = FILTRES.find(function(x) { return x.id === activeMedia.filtre; });
    if (f && f.css !== 'none') parts.push(f.css);
    return parts.length ? parts.join(' ') : 'none';
  }

  const premiereImage = mediaItems.find(function(m) { return m.kind === 'image'; });

  async function publier() {
    if (!texte.trim()) {
      setErreur('Ecrivez au moins une phrase avant de publier.');
      return;
    }
    setPublishing(true);
    setErreur('');
    try {
      const premiereUrlValide = mediaItems.length > 0 && !mediaItems[0].local ? mediaItems[0].url : undefined;

      await postsApi.create({
        content: texte.trim(),
        type: typePub,
        imageUrl: premiereUrlValide,
      });

      if (aussiEnStory && premiereImage && !premiereImage.local) {
        try {
          await storiesApi.create({ imageUrl: premiereImage.url, caption: texte.trim() });
        } catch (e) {
          console.log('Story:', e.message);
        }
      }

      navigate(-1);
    } catch (e) {
      setErreur(e?.message || 'Une erreur est survenue, veuillez reessayer.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE }}>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={surFichiersChoisis}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '44px 16px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: VERT }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: VERT }}>Nouvelle publication</div>
        </div>

        <div style={{ padding: 16 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: VERT }}>
              {initiales}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: VERT }}>{user?.parish?.name || ((user?.firstName || '') + ' ' + (user?.lastName || ''))}</div>
              <div style={{ fontSize: 10, color: '#9A8E7E' }}>Visible par tous les fideles</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#9A8E7E', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>NATURE DE LA PUBLICATION</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {TYPES_PUB.map(function(t) {
              return (
                <div key={t.id} onClick={function() { setTypePub(t.id); }} style={{ padding: '6px 13px', borderRadius: 20, background: typePub === t.id ? t.color : 'rgba(0,0,0,0.04)', border: '1px solid ' + (typePub === t.id ? t.tc + '40' : 'rgba(0,0,0,0.08)'), fontSize: 11, color: typePub === t.id ? t.tc : '#7A6E5E', cursor: 'pointer', fontWeight: typePub === t.id ? 700 : 400 }}>
                  {t.label}
                </div>
              );
            })}
          </div>

          <textarea
            value={texte}
            onChange={function(e) { setTexte(e.target.value); setErreur(''); }}
            placeholder="Partagez une nouvelle avec vos fideles..."
            style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.25)', borderRadius: 14, padding: 14, fontSize: 13, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', height: 120, background: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: 18 }}
          />

          <div style={{ fontSize: 11, color: '#9A8E7E', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>MEDIA (OPTIONNEL)</div>

          {mediaItems.length === 0 && (
            <div onClick={ouvrirSelecteurFichiers} style={{ background: 'rgba(200,168,75,0.06)', border: '1.5px dashed rgba(200,168,75,0.35)', borderRadius: 14, padding: '34px 16px', textAlign: 'center', marginBottom: 12, cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
              <div style={{ fontSize: 12, color: '#8B6020', fontWeight: 700 }}>Ajouter une photo ou une video</div>
              <div style={{ fontSize: 10, color: '#9A8E7E', marginTop: 4 }}>Une ou plusieurs, depuis vos fichiers</div>
            </div>
          )}

          {mediaItems.length > 0 && (
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 260, marginBottom: 12, background: '#0C0A06' }}>

              {activeMedia.kind === 'video' ? (
                <video src={activeMedia.url} style={{ width: '100%', height: '100%', objectFit: activeMedia.mode === 'cover' ? 'cover' : 'contain', backgroundColor: '#000', transform: activeMedia.mode === 'cover' ? 'scale(' + activeMedia.zoom + ')' : 'none', filter: styleFiltreActif() }} muted loop autoPlay playsInline />
              ) : (
                <img src={activeMedia.url} alt="media" style={{ width: '100%', height: '100%', objectFit: activeMedia.mode === 'cover' ? 'cover' : 'contain', backgroundColor: '#000', transform: activeMedia.mode === 'cover' ? 'scale(' + activeMedia.zoom + ')' : 'none', filter: styleFiltreActif() }} onError={function(e) { e.target.style.opacity = 0.2; }} />
              )}

              <button onClick={retirerMediaActif} style={{ position: 'absolute', top: 12, left: 12, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', zIndex: 2 }}>
                <i className="ti ti-x" />
              </button>

              {mediaItems.length > 1 && (
                <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 2 }}>
                  {mediaItems.map(function(_, i) {
                    return (
                      <div key={i} onClick={function() { setActiveIndex(i); }} style={{ width: i === activeIndex ? 16 : 6, height: 6, borderRadius: 3, background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all .2s' }} />
                    );
                  })}
                </div>
              )}

              <button onClick={ouvrirSelecteurFichiers} style={{ position: 'absolute', top: 12, right: 56, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', zIndex: 2 }}>
                +
              </button>

              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 2 }}>
                <button onClick={toggleRognage} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: activeMedia.mode === 'cover' ? OR : 'rgba(0,0,0,0.45)', color: activeMedia.mode === 'cover' ? VERT : '#fff', fontSize: 14 }} title="Rogner">
                  <i className="ti ti-crop" />
                </button>
                <button onClick={toggleAutoAjust} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: activeMedia.auto ? OR : 'rgba(0,0,0,0.45)', color: activeMedia.auto ? VERT : '#fff', fontSize: 14 }} title="Ajustement automatique">
                  <i className="ti ti-sparkles" />
                </button>
                <button onClick={function() { setShowFiltres(function(v) { return !v; }); }} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: showFiltres ? OR : 'rgba(0,0,0,0.45)', color: showFiltres ? VERT : '#fff', fontSize: 14 }} title="Filtres">
                  <i className="ti ti-palette" />
                </button>
                <button onClick={function() { setEffetsMessage('Effets avances bientot disponibles.'); setTimeout(function() { setEffetsMessage(''); }, 2500); }} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 14 }} title="Effets">
                  <i className="ti ti-sun" />
                </button>
              </div>

              {activeMedia.mode === 'cover' && (
                <div style={{ position: 'absolute', bottom: showFiltres ? 74 : 14, left: 14, right: 70, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-zoom-out" style={{ color: '#fff', fontSize: 13 }} />
                  <input type="range" min="1" max="2.5" step="0.05" value={activeMedia.zoom} onChange={function(e) { changerZoom(parseFloat(e.target.value)); }} style={{ flex: 1 }} />
                  <i className="ti ti-zoom-in" style={{ color: '#fff', fontSize: 13 }} />
                </div>
              )}

              {effetsMessage && (
                <div style={{ position: 'absolute', bottom: showFiltres ? 74 : 12, left: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '6px 10px', borderRadius: 8, textAlign: 'center', zIndex: 3 }}>
                  {effetsMessage}
                </div>
              )}

              {showFiltres && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '26px 10px 10px', display: 'flex', gap: 8, overflowX: 'auto', zIndex: 2 }}>
                  {FILTRES.map(function(f) {
                    const actif = activeMedia.filtre === f.id;
                    return (
                      <div key={f.id} onClick={function() { choisirFiltre(f.id); }} style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, backgroundImage: activeMedia.kind === 'image' ? 'url(' + activeMedia.url + ')' : 'none', backgroundColor: '#333', backgroundSize: 'cover', backgroundPosition: 'center', filter: f.css, border: actif ? '2px solid ' + OR : '1.5px solid rgba(255,255,255,0.4)' }} />
                        <div style={{ fontSize: 8, color: '#fff', marginTop: 3 }}>{f.label}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {yAMediaLocal && (
            <div style={{ fontSize: 10, color: '#8a6d00', background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.25)', borderRadius: 10, padding: '8px 12px', marginBottom: 18 }}>
              Apercu local uniquement : l'envoi reel vers le serveur n'est pas encore active, ce media ne sera pas visible par les autres fideles pour le moment.
            </div>
          )}

          <div onClick={function() { setAussiEnStory(function(v) { return !v; }); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: VERT }}>Publier aussi en story</div>
              <div style={{ fontSize: 10, color: '#9A8E7E' }}>Visible 24h en plus de la publication</div>
            </div>
            <div style={{ width: 42, height: 24, borderRadius: 20, background: aussiEnStory ? OR : '#e5e0d5', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: aussiEnStory ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>

          {erreur && (
            <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 12, color: '#e53935' }}>
              {erreur}
            </div>
          )}

          <button
            onClick={publier}
            disabled={publishing}
            style={{ width: '100%', padding: 14, background: publishing ? 'rgba(200,168,75,0.5)' : 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 14, color: VERT, fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: publishing ? 'default' : 'pointer' }}
          >
            {publishing ? 'Publication en cours...' : 'Publier'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
