import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { postsApi, storiesApi } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';

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

// Formats standards, comme sur Facebook/Instagram/TikTok/Snap : donnent une
// homogeneite visuelle dans le fil, quelle que soit la photo/video importee.
const CADRES = [
  { id: 'original', label: 'Original', ratio: null },
  { id: 'carre',    label: '1:1',      ratio: 1 },
  { id: 'portrait', label: '4:5',      ratio: 0.8 },
  { id: 'story',    label: '9:16',     ratio: 0.5625 },
  { id: 'paysage',  label: '16:9',     ratio: 1.7778 },
];

const AUTO_ADJUST_CSS = 'contrast(1.12) saturate(1.18) brightness(1.04)';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const dragRef = useRef({ actif: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const conteneurMediaRef = useRef(null);

  const [typePub, setTypePub]     = useState('NORMAL');
  const [texte, setTexte]         = useState('');
  const [publishing, setPublishing] = useState(false);
  const [erreur, setErreur]       = useState('');
  const [aussiEnStory, setAussiEnStory] = useState(false);

  const [mediaItems, setMediaItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFiltres, setShowFiltres] = useState(false);
  const [showCadres, setShowCadres] = useState(false);
  const [showTexteInput, setShowTexteInput] = useState(false);
  const [texteTemp, setTexteTemp] = useState('');
  const [effetsMessage, setEffetsMessage] = useState('');
  const [editionOuverte, setEditionOuverte] = useState(false);

  const initiales = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'MD';
  const activeMedia = mediaItems[activeIndex] || null;
  const yAMediaLocal = mediaItems.some(function(m) { return m.local; });

  function ratioEffectif(m) {
    if (!m) return 1;
    const cadre = CADRES.find(function(c) { return c.id === m.cadre; });
    if (cadre && cadre.ratio !== null) return cadre.ratio;
    return m.ratio || 1;
  }

  function limiterOffset(offsetX, offsetY, zoom) {
    const el = conteneurMediaRef.current;
    if (!el) return { x: offsetX, y: offsetY };
    const rect = el.getBoundingClientRect();
    const maxX = (rect.width * (zoom - 1)) / 2;
    const maxY = (rect.height * (zoom - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, offsetX)),
      y: Math.max(-maxY, Math.min(maxY, offsetY)),
    };
  }

  function ouvrirSelecteurFichiers() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function redimensionnerEnBase64(file) {
    return new Promise(function(resolve, reject) {
      if (file.type.startsWith('video/')) {
        uploadToCloudinary(file, 'video')
          .then(function(url) { resolve({ url: url, kind: 'video', local: false }); })
          .catch(function() { resolve({ url: URL.createObjectURL(file), kind: 'video', local: true }); });
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = function() {
        const MAX = 1280;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * (MAX / w)); w = MAX; }
          else { w = Math.round(w * (MAX / h)); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        resolve({ url: canvas.toDataURL('image/jpeg', 0.82), kind: 'image', local: false });
      };
      img.onerror = function() {
        URL.revokeObjectURL(objectUrl);
        resolve({ url: objectUrl, kind: 'image', local: true });
      };
      img.src = objectUrl;
    });
  }

  async function surFichiersChoisis(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const resultats = await Promise.all(files.map(redimensionnerEnBase64));
    const nouveaux = resultats.map(function(r) {
      return {
        url: r.url,
        kind: r.kind,
        filtre: 'normal',
        auto: false,
        local: r.local,
        mode: 'contain',
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        cadre: 'portrait', // 4:5 par defaut : homogeneite garantie sans que l'admin y pense
        texteAjoute: '',
      };
    });
    setMediaItems(function(prev) {
      const next = [...prev, ...nouveaux];
      setActiveIndex(prev.length);
      return next;
    });
    e.target.value = '';
    setEditionOuverte(true);
  }

  function retirerMediaActif() {
    setMediaItems(function(prev) {
      const next = prev.filter(function(_, i) { return i !== activeIndex; });
      setActiveIndex(0);
      return next;
    });
    if (mediaItems.length <= 1) setEditionOuverte(false);
  }

  function toggleAutoAjust() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, auto: !m.auto };
      });
    });
  }

  function toggleRognage() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, mode: m.mode === 'cover' ? 'contain' : 'cover' };
      });
    });
  }

  function choisirCadre(cadreId) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, cadre: cadreId, zoom: 1, offsetX: 0, offsetY: 0 };
      });
    });
    setShowCadres(false);
  }

  function validerTexte() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, texteAjoute: texteTemp };
      });
    });
    setShowTexteInput(false);
  }

  function demarrerGlisser(e) {
    if (!activeMedia) return;
    const cadreFixe = ratioEffectif(activeMedia) !== (activeMedia.ratio || 1);
    if (activeMedia.mode !== 'cover' && !cadreFixe) return;
    const point = e.touches ? e.touches[0] : e;
    dragRef.current = { actif: true, startX: point.clientX, startY: point.clientY, baseX: activeMedia.offsetX, baseY: activeMedia.offsetY };
  }

  function bougerGlisser(e) {
    if (!dragRef.current.actif) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - dragRef.current.startX;
    const dy = point.clientY - dragRef.current.startY;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        const limite = limiterOffset(dragRef.current.baseX + dx, dragRef.current.baseY + dy, Math.max(m.zoom, 1));
        return { ...m, offsetX: limite.x, offsetY: limite.y };
      });
    });
  }

  function arreterGlisser() {
    dragRef.current.actif = false;
  }

  function changerZoom(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        const limite = limiterOffset(m.offsetX, m.offsetY, valeur);
        return { ...m, zoom: valeur, offsetX: limite.x, offsetY: limite.y };
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

  function enregistrerRatio(largeur, hauteur) {
    if (!largeur || !hauteur) return;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        if (m.ratio) return m; // deja mesure, ne pas ecraser
        return { ...m, ratio: largeur / hauteur };
      });
    });
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
      // (les photos passees par redimensionnerEnBase64 ont local=false : elles sont envoyees normalement)

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

  function transformActif(m) {
    const cadreFixe = ratioEffectif(m) !== (m.ratio || 1);
    if (m.mode === 'cover' || cadreFixe) {
      return 'translate(' + m.offsetX + 'px,' + m.offsetY + 'px) scale(' + Math.max(m.zoom, 1) + ')';
    }
    return 'none';
  }

  function rendreMedia() {
    if (!activeMedia) return null;
    return (
      <>
        {activeMedia.kind === 'video' ? (
          <video src={activeMedia.url} onLoadedMetadata={function(e) { enregistrerRatio(e.target.videoWidth, e.target.videoHeight); }} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: transformActif(activeMedia), filter: styleFiltreActif(), pointerEvents: 'none' }} muted loop autoPlay playsInline />
        ) : (
          <img src={activeMedia.url} alt="media" draggable="false" onLoad={function(e) { enregistrerRatio(e.target.naturalWidth, e.target.naturalHeight); }} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: transformActif(activeMedia), filter: styleFiltreActif(), pointerEvents: 'none' }} onError={function(e) { e.target.style.opacity = 0.2; }} />
        )}

        {activeMedia.texteAjoute && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', fontWeight: 700, fontSize: 22, textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.6)', padding: '0 20px', zIndex: 2, pointerEvents: 'none', fontFamily: 'Georgia,serif' }}>
            {activeMedia.texteAjoute}
          </div>
        )}

        <button onClick={retirerMediaActif} style={{ position: 'absolute', top: 12, left: 12, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', zIndex: 3 }}>
          <i className="ti ti-x" />
        </button>

        {mediaItems.length > 1 && (
          <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 3 }}>
            {mediaItems.map(function(_, i) {
              return (
                <div key={i} onClick={function() { setActiveIndex(i); }} style={{ width: i === activeIndex ? 16 : 6, height: 6, borderRadius: 3, background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all .2s' }} />
              );
            })}
          </div>
        )}

        <button onClick={ouvrirSelecteurFichiers} style={{ position: 'absolute', top: 12, right: 56, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', zIndex: 3 }}>
          +
        </button>

        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 3 }}>
          <button onClick={function() { setShowCadres(function(v) { return !v; }); setShowFiltres(false); }} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: showCadres ? OR : 'rgba(0,0,0,0.45)', color: showCadres ? VERT : '#fff', fontSize: 14 }} title="Format">
            <i className="ti ti-aspect-ratio" />
          </button>
          <button onClick={toggleRognage} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: activeMedia.mode === 'cover' ? OR : 'rgba(0,0,0,0.45)', color: activeMedia.mode === 'cover' ? VERT : '#fff', fontSize: 14 }} title="Rogner">
            <i className="ti ti-crop" />
          </button>
          <button onClick={toggleAutoAjust} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: activeMedia.auto ? OR : 'rgba(0,0,0,0.45)', color: activeMedia.auto ? VERT : '#fff', fontSize: 14 }} title="Ajustement automatique">
            <i className="ti ti-sparkles" />
          </button>
          <button onClick={function() { setShowFiltres(function(v) { return !v; }); setShowCadres(false); }} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: showFiltres ? OR : 'rgba(0,0,0,0.45)', color: showFiltres ? VERT : '#fff', fontSize: 14 }} title="Filtres">
            <i className="ti ti-palette" />
          </button>
          <button onClick={function() { setTexteTemp(activeMedia.texteAjoute || ''); setShowTexteInput(true); }} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: activeMedia.texteAjoute ? OR : 'rgba(0,0,0,0.45)', color: activeMedia.texteAjoute ? VERT : '#fff', fontSize: 13, fontWeight: 700 }} title="Ajouter du texte">
            Aa
          </button>
          <button onClick={function() { setEffetsMessage('Effets avances bientot disponibles.'); setTimeout(function() { setEffetsMessage(''); }, 2500); }} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 14 }} title="Effets">
            <i className="ti ti-sun" />
          </button>
        </div>

        {(activeMedia.mode === 'cover' || ratioEffectif(activeMedia) !== (activeMedia.ratio || 1)) && (
          <div style={{ position: 'absolute', bottom: showFiltres || showCadres ? 74 : 14, left: 14, right: 70, zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-zoom-out" style={{ color: '#fff', fontSize: 13 }} />
            <input type="range" min="1" max="2.5" step="0.05" value={activeMedia.zoom} onChange={function(e) { changerZoom(parseFloat(e.target.value)); }} style={{ flex: 1 }} />
            <i className="ti ti-zoom-in" style={{ color: '#fff', fontSize: 13 }} />
          </div>
        )}

        {effetsMessage && (
          <div style={{ position: 'absolute', bottom: (showFiltres || showCadres) ? 74 : 12, left: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '6px 10px', borderRadius: 8, textAlign: 'center', zIndex: 4 }}>
            {effetsMessage}
          </div>
        )}

        {showCadres && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '26px 10px 10px', display: 'flex', gap: 8, overflowX: 'auto', zIndex: 3 }}>
            {CADRES.map(function(c) {
              const actif = (activeMedia.cadre || 'portrait') === c.id;
              const r = c.ratio || (activeMedia.ratio || 1);
              const iconH = 22;
              const iconW = Math.max(12, Math.min(30, iconH * r));
              return (
                <div key={c.id} onClick={function() { choisirCadre(c.id); }} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 12, background: actif ? OR : 'rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                  <div style={{ width: iconW, height: iconH, border: '2px solid ' + (actif ? VERT : '#fff'), borderRadius: 2 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: actif ? VERT : '#fff' }}>{c.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {showFiltres && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '26px 10px 10px', display: 'flex', gap: 8, overflowX: 'auto', zIndex: 3 }}>
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
      </>
    );
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
            <div
              onClick={function() { setEditionOuverte(true); }}
              style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 12, background: '#0C0A06', aspectRatio: ratioEffectif(activeMedia) + ' / 1', cursor: 'pointer' }}
            >
              {activeMedia.kind === 'video' ? (
                <video src={activeMedia.url} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: transformActif(activeMedia), filter: styleFiltreActif() }} muted loop autoPlay playsInline />
              ) : (
                <img src={activeMedia.url} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: transformActif(activeMedia), filter: styleFiltreActif() }} />
              )}
              {activeMedia.texteAjoute && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', fontWeight: 700, fontSize: 16, textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.6)', padding: '0 14px', fontFamily: 'Georgia,serif' }}>
                  {activeMedia.texteAjoute}
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, padding: '4px 9px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-edit" style={{ fontSize: 11 }} /> Modifier
              </div>
            </div>
          )}

          {yAMediaLocal && (
            <div style={{ fontSize: 10, color: '#8a6d00', background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.25)', borderRadius: 10, padding: '8px 12px', marginBottom: 18 }}>
              Cette video reste en apercu local pour l'instant (trop volumineuse) : elle ne sera pas visible par les autres fideles. Les photos, elles, sont deja envoyees normalement.
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

      {editionOuverte && activeMedia && (
        <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '44px 16px 12px' }}>
            <div onClick={function() { setEditionOuverte(false); }} style={{ color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Modifier</div>
            <div onClick={function() { setEditionOuverte(false); }} style={{ color: OR, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Termine</div>
          </div>
          <div
            ref={conteneurMediaRef}
            onMouseDown={demarrerGlisser} onMouseMove={bougerGlisser} onMouseUp={arreterGlisser} onMouseLeave={arreterGlisser}
            onTouchStart={demarrerGlisser} onTouchMove={bougerGlisser} onTouchEnd={arreterGlisser}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 12, boxSizing: 'border-box' }}
          >
            <div style={{ position: 'relative', width: '100%', maxHeight: '100%', aspectRatio: ratioEffectif(activeMedia) + ' / 1', overflow: 'hidden', borderRadius: 4, cursor: activeMedia.mode === 'cover' ? 'grab' : 'default' }}>
              {rendreMedia()}
            </div>
          </div>

          {showTexteInput && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
              <div style={{ background: '#F5F0E8', borderRadius: 16, padding: 18, width: '100%', maxWidth: 360 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: VERT, marginBottom: 10, fontFamily: 'Georgia,serif' }}>Texte sur l'image</div>
                <textarea
                  value={texteTemp}
                  onChange={function(e) { setTexteTemp(e.target.value); }}
                  placeholder="Ecrivez votre texte..."
                  style={{ width: '100%', height: 70, border: '1.5px solid rgba(200,168,75,0.25)', borderRadius: 10, padding: 10, fontSize: 13, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', boxSizing: 'border-box', marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={function() { setShowTexteInput(false); }} style={{ flex: 1, padding: 10, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 10, color: '#7A6E5E', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                  <button onClick={validerTexte} style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 10, color: OR, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Valider</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
