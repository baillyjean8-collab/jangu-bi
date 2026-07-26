import { useState, useRef, useEffect } from 'react';
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
  const [activePanel, setActivePanel] = useState(null); // 'filtres' | 'ajuster' | 'recadrer' | 'texte' | null
  const [editionOuverte, setEditionOuverte] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const texteRef = useRef(null);

  const initiales = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'MD';
  const activeMedia = mediaItems[activeIndex] || null;
  const yAMediaLocal = mediaItems.some(function(m) { return m.local; });

  function ratioEffectif(m) {
    if (!m) return 1;
    const cadre = CADRES.find(function(c) { return c.id === m.cadre; });
    if (cadre && cadre.ratio !== null) return cadre.ratio;
    return m.ratio || 1;
  }

  // Une photo remplit tout le cadre (cover) des qu'on zoome dessus ou qu'on choisit
  // un format autre que "Original". Sinon elle reste entiere, sans etre coupee (contain).
  function doitRemplirLeCadre(m) {
    if (!m) return false;
    const cadreFixe = ratioEffectif(m) !== (m.ratio || 1);
    return m.zoom > 1 || cadreFixe;
  }

  function objectFitPour(m) {
    return doitRemplirLeCadre(m) ? 'cover' : 'contain';
  }

  // offsetX/offsetY sont exprimes en FRACTION du cadre (ex: 0.2 = 20% de la largeur),
  // pas en pixels bruts. Ainsi le meme recadrage se reproduit a l'identique sur l'image
  // finale envoyee au serveur, quelle que soit la taille de l'ecran du telephone.
  function limiterOffset(offsetXFrac, offsetYFrac, zoom) {
    const marge = Math.max(zoom - 1, 0) / 2;
    const clamp = function(v) { return Math.max(-marge, Math.min(marge, v)); };
    return { x: clamp(offsetXFrac), y: clamp(offsetYFrac) };
  }

  function demanderQuitter() {
    if (texte.trim() || mediaItems.length > 0) {
      setShowLeaveConfirm(true);
    } else {
      navigate(-1);
    }
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
        brightness: 100,
        contrast: 100,
        saturation: 100,
        local: r.local,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        cadre: 'original',
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

  function changerBrightness(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, brightness: valeur }; });
    });
  }

  function changerContrast(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, contrast: valeur }; });
    });
  }

  function changerSaturation(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, saturation: valeur }; });
    });
  }

  function appliquerAjustementAuto() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, brightness: 104, contrast: 112, saturation: 118 }; });
    });
  }

  function reinitialiserAjustements() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, brightness: 100, contrast: 100, saturation: 100 }; });
    });
  }

  function choisirCadre(cadreId) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, cadre: cadreId, zoom: 1, offsetX: 0, offsetY: 0 };
      });
    });
  }

  function surTexteBlur(e) {
    const nouveauTexte = e.target.textContent;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, texteAjoute: nouveauTexte };
      });
    });
  }

  useEffect(function() {
    if (texteRef.current) {
      texteRef.current.textContent = (activeMedia && activeMedia.texteAjoute) || '';
    }
  }, [activeIndex, editionOuverte]);

  useEffect(function() {
    if (activePanel === 'texte' && texteRef.current) {
      texteRef.current.focus();
    }
  }, [activePanel]);

  function demarrerGlisser(e) {
    if (!activeMedia) return;
    if (!doitRemplirLeCadre(activeMedia)) return;
    const point = e.touches ? e.touches[0] : e;
    dragRef.current = { actif: true, startX: point.clientX, startY: point.clientY, baseX: activeMedia.offsetX, baseY: activeMedia.offsetY };
  }

  function bougerGlisser(e) {
    if (!dragRef.current.actif) return;
    const el = conteneurMediaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const dxFrac = (point.clientX - dragRef.current.startX) / rect.width;
    const dyFrac = (point.clientY - dragRef.current.startY) / rect.height;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        const limite = limiterOffset(dragRef.current.baseX + dxFrac, dragRef.current.baseY + dyFrac, Math.max(m.zoom, 1));
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

  function calculerFiltreCss(m) {
    if (!m) return 'none';
    const parts = [];
    const f = FILTRES.find(function(x) { return x.id === m.filtre; });
    if (f && f.css !== 'none') parts.push(f.css);
    const b = m.brightness != null ? m.brightness : 100;
    const c = m.contrast != null ? m.contrast : 100;
    const s = m.saturation != null ? m.saturation : 100;
    if (b !== 100 || c !== 100 || s !== 100) {
      parts.push('brightness(' + b + '%) contrast(' + c + '%) saturate(' + s + '%)');
    }
    return parts.length ? parts.join(' ') : 'none';
  }

  function styleFiltreActif() {
    return calculerFiltreCss(activeMedia);
  }

  function graverImageFinale(m) {
    return new Promise(function(resolve, reject) {
      if (m.kind !== 'image') { resolve(m.url); return; }
      const img = new Image();
      img.onload = function() {
        const naturalW = img.naturalWidth, naturalH = img.naturalHeight;
        const doitRogner = doitRemplirLeCadre(m);

        let outputW, outputH;
        if (doitRogner) {
          const r = ratioEffectif(m);
          outputW = 1080;
          outputH = Math.round(outputW / r);
        } else {
          outputW = naturalW;
          outputH = naturalH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = outputW;
        canvas.height = outputH;
        const ctx = canvas.getContext('2d');
        ctx.filter = calculerFiltreCss(m);

        if (doitRogner) {
          const echelleCouverture = Math.max(outputW / naturalW, outputH / naturalH);
          const zoomSupp = Math.max(m.zoom, 1);
          const echelle = echelleCouverture * zoomSupp;
          const drawW = naturalW * echelle;
          const drawH = naturalH * echelle;
          const baseX = (outputW - drawW) / 2;
          const baseY = (outputH - drawH) / 2;
          const panX = (m.offsetX || 0) * outputW;
          const panY = (m.offsetY || 0) * outputH;
          ctx.drawImage(img, baseX + panX, baseY + panY, drawW, drawH);
        } else {
          ctx.drawImage(img, 0, 0, outputW, outputH);
        }

        if (m.texteAjoute) {
          ctx.filter = 'none';
          const tailleFonte = Math.round(outputW * 0.06);
          ctx.font = tailleFonte + 'px Georgia, serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 2;

          const maxLargeur = outputW * 0.82;
          const mots = m.texteAjoute.split(' ');
          const lignes = [];
          let ligneActuelle = '';
          mots.forEach(function(mot) {
            const test = ligneActuelle ? ligneActuelle + ' ' + mot : mot;
            if (ctx.measureText(test).width > maxLargeur && ligneActuelle) {
              lignes.push(ligneActuelle);
              ligneActuelle = mot;
            } else {
              ligneActuelle = test;
            }
          });
          if (ligneActuelle) lignes.push(ligneActuelle);

          const interligne = tailleFonte * 1.25;
          const departY = outputH / 2 - ((lignes.length - 1) * interligne) / 2;
          lignes.forEach(function(ligne, i) {
            ctx.fillText(ligne, outputW / 2, departY + i * interligne);
          });
        }

        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = function() { reject(new Error("Impossible de graver l'image.")); };
      img.src = m.url;
    });
  }

  function enregistrerRatio(largeur, hauteur) {
    if (!largeur || !hauteur) return;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        if (m.ratio) return m;
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
      const imagesAEnvoyer = mediaItems.filter(function(m) { return m.kind === 'image' && !m.local; });
      const imagesGravees = await Promise.all(imagesAEnvoyer.map(graverImageFinale));
      const videoValide = mediaItems.find(function(m) { return m.kind === 'video' && !m.local; });

      await postsApi.create({
        content: texte.trim(),
        type: typePub,
        imageUrl: imagesGravees[0],
        imageUrls: imagesGravees,
        videoUrl: videoValide ? videoValide.url : undefined,
      });

      if (aussiEnStory && premiereImage && !premiereImage.local) {
        try {
          const imageStoryGravee = await graverImageFinale(premiereImage);
          await storiesApi.create({ imageUrl: imageStoryGravee, caption: texte.trim() });
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
    if (doitRemplirLeCadre(m)) {
      return 'translate(' + ((m.offsetX || 0) * 100) + '%,' + ((m.offsetY || 0) * 100) + '%) scale(' + Math.max(m.zoom, 1) + ')';
    }
    return 'none';
  }

  function rendreMedia() {
    if (!activeMedia) return null;
    const fit = objectFitPour(activeMedia);
    return (
      <>
        {activeMedia.kind === 'video' ? (
          <video src={activeMedia.url} style={{ width: '100%', height: '100%', objectFit: fit, background: '#000', transform: transformActif(activeMedia), filter: styleFiltreActif() }} muted loop autoPlay playsInline />
        ) : (
          <img src={activeMedia.url} alt="media" style={{ width: '100%', height: '100%', objectFit: fit, background: '#000', transform: transformActif(activeMedia), filter: styleFiltreActif() }} />
        )}

        <div
          ref={texteRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={surTexteBlur}
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            color: '#fff', fontWeight: 700, fontSize: 22, textAlign: 'center', minWidth: 30,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)', padding: '8px 20px', zIndex: 4,
            fontFamily: 'Georgia,serif', outline: 'none', cursor: 'text',
            border: activePanel === 'texte' ? '1.5px dashed rgba(255,255,255,0.5)' : 'none',
            borderRadius: 8,
          }}
        />
        {!activeMedia.texteAjoute && activePanel === 'texte' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 22, fontFamily: 'Georgia,serif', pointerEvents: 'none', zIndex: 3 }}>
            Ecrire un texte…
          </div>
        )}

        <button onClick={retirerMediaActif} style={{ position: 'absolute', top: 12, left: 12, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', zIndex: 3 }}>
          <i className="ti ti-x" />
        </button>

        {mediaItems.length > 1 && (
          <>
            <button
              onClick={function() { if (activeIndex > 0) setActiveIndex(activeIndex - 1); }}
              disabled={activeIndex === 0}
              style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', fontSize: 16, zIndex: 3, opacity: activeIndex === 0 ? 0.3 : 1 }}
            >‹</button>
            <button
              onClick={function() { if (activeIndex < mediaItems.length - 1) setActiveIndex(activeIndex + 1); }}
              disabled={activeIndex === mediaItems.length - 1}
              style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', fontSize: 16, zIndex: 3, opacity: activeIndex === mediaItems.length - 1 ? 0.3 : 1 }}
            >›</button>
          </>
        )}

        <button onClick={ouvrirSelecteurFichiers} style={{ position: 'absolute', top: 12, right: 56, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', zIndex: 3 }}>
          +
        </button>

        <div style={{ position: 'absolute', top: 56, right: 12, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 3 }}>
          <div onClick={function() { setActivePanel(activePanel === 'filtres' ? null : 'filtres'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: activePanel === 'filtres' ? OR : 'rgba(0,0,0,0.45)', color: activePanel === 'filtres' ? VERT : '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-palette" />
            </div>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>Filtres</span>
          </div>

          <div onClick={function() { setActivePanel(activePanel === 'ajuster' ? null : 'ajuster'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: activePanel === 'ajuster' ? OR : 'rgba(0,0,0,0.45)', color: activePanel === 'ajuster' ? VERT : '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-sun" />
            </div>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>Ajuster</span>
          </div>

          <div onClick={function() { setActivePanel(activePanel === 'texte' ? null : 'texte'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: activeMedia.texteAjoute || activePanel === 'texte' ? OR : 'rgba(0,0,0,0.45)', color: activeMedia.texteAjoute || activePanel === 'texte' ? VERT : '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Aa
            </div>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>Texte</span>
          </div>

          <div onClick={function() { setActivePanel(activePanel === 'recadrer' ? null : 'recadrer'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: activePanel === 'recadrer' ? OR : 'rgba(0,0,0,0.45)', color: activePanel === 'recadrer' ? VERT : '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-crop" />
            </div>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>Cadrer</span>
          </div>
        </div>

        {activePanel === 'filtres' && (
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

        {activePanel === 'ajuster' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', padding: '30px 16px 14px', zIndex: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginBottom: 10 }}>
              <span onClick={appliquerAjustementAuto} style={{ fontSize: 11, fontWeight: 700, color: OR, cursor: 'pointer' }}>Auto</span>
              <span onClick={reinitialiserAjustements} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Reinitialiser</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: '#fff', width: 72 }}>Luminosite</span>
              <input type="range" min="50" max="150" value={activeMedia.brightness} onChange={function(e) { changerBrightness(+e.target.value); }} style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: '#fff', width: 72 }}>Contraste</span>
              <input type="range" min="50" max="150" value={activeMedia.contrast} onChange={function(e) { changerContrast(+e.target.value); }} style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: '#fff', width: 72 }}>Saturation</span>
              <input type="range" min="0" max="200" value={activeMedia.saturation} onChange={function(e) { changerSaturation(+e.target.value); }} style={{ flex: 1 }} />
            </div>
          </div>
        )}

        {activePanel === 'recadrer' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', padding: '26px 10px 14px', zIndex: 3 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14 }}>
              {CADRES.map(function(c) {
                const actif = (activeMedia.cadre || 'original') === c.id;
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ti ti-zoom-out" style={{ color: '#fff', fontSize: 13 }} />
              <input type="range" min="1" max="2.5" step="0.05" value={activeMedia.zoom} onChange={function(e) { changerZoom(parseFloat(e.target.value)); }} style={{ flex: 1 }} />
              <i className="ti ti-zoom-in" style={{ color: '#fff', fontSize: 13 }} />
            </div>
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
          <button onClick={demanderQuitter} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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

          {mediaItems.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10 }}>
              {mediaItems.map(function(m, i) {
                return (
                  <div key={i} onClick={function() { setActiveIndex(i); }} style={{ position: 'relative', flexShrink: 0, width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: i === activeIndex ? '2px solid ' + OR : '1.5px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}>
                    {m.kind === 'video' ? (
                      <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : (
                      <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                );
              })}
              <div onClick={ouvrirSelecteurFichiers} style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 10, border: '1.5px dashed rgba(200,168,75,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: OR, fontSize: 20 }}>
                +
              </div>
            </div>
          )}

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
                <video src={activeMedia.url} onLoadedMetadata={function(e) { enregistrerRatio(e.target.videoWidth, e.target.videoHeight); }} style={{ width: '100%', height: '100%', objectFit: objectFitPour(activeMedia), background: '#000', transform: transformActif(activeMedia), filter: styleFiltreActif() }} controls playsInline />
              ) : (
                <img src={activeMedia.url} alt="media" draggable="false" onLoad={function(e) { enregistrerRatio(e.target.naturalWidth, e.target.naturalHeight); }} style={{ width: '100%', height: '100%', objectFit: objectFitPour(activeMedia), background: '#000', transform: transformActif(activeMedia), filter: styleFiltreActif(), pointerEvents: 'none' }} onError={function(e) { e.target.style.opacity = 0.2; }} />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '44px 16px 6px', position: 'relative', zIndex: 20 }}>
            <button onClick={function() { setEditionOuverte(false); }} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 17, cursor: 'pointer' }}>‹</button>
            {mediaItems.length > 1 ? (
              <div style={{ display: 'flex', gap: 5 }}>
                {mediaItems.map(function(_, i) {
                  return <span key={i} onClick={function() { setActiveIndex(i); }} style={{ width: i === activeIndex ? 16 : 6, height: 6, borderRadius: 3, background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all .2s', cursor: 'pointer' }} />;
                })}
              </div>
            ) : <span />}
            <span style={{ width: 34 }} />
          </div>
          <div
            ref={conteneurMediaRef}
            onMouseDown={demarrerGlisser} onMouseMove={bougerGlisser} onMouseUp={arreterGlisser} onMouseLeave={arreterGlisser}
            onTouchStart={demarrerGlisser} onTouchMove={bougerGlisser} onTouchEnd={arreterGlisser}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 12, boxSizing: 'border-box' }}
          >
            <div style={{ position: 'relative', width: '100%', maxHeight: '100%', aspectRatio: ratioEffectif(activeMedia) + ' / 1', overflow: 'hidden', borderRadius: 4, cursor: doitRemplirLeCadre(activeMedia) ? 'grab' : 'default' }}>
              {rendreMedia()}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px 22px', position: 'relative', zIndex: 20 }}>
            <button onClick={function() { setEditionOuverte(false); }} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
            <button onClick={function() { setEditionOuverte(false); }} style={{ background: OR, color: VERT, border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Termine</button>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 18px', width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 6 }}>Quitter sans publier ?</div>
            <div style={{ fontSize: 12, color: '#7A6E5E', marginBottom: 18, lineHeight: 1.5 }}>Le texte et les photos ajoutes seront perdus.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowLeaveConfirm(false); }} style={{ flex: 1, padding: 11, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 10, color: OR, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Continuer la publication
              </button>
              <button onClick={function() { navigate(-1); }} style={{ flex: 1, padding: 11, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 10, color: '#b71c1c', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}