import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storiesApi } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';

const VERT = '#1e2d14';
const OR = '#C8A84B';
const IVOIRE = '#F5F0E8';

const COULEURS_FOND = ['#1e2d14', '#2E5C3E', '#8B6020', '#5C2E2E', '#2E3A5C', '#0C0A06'];

const FILTRES = [
  { id: 'normal',     label: 'Normal',     css: 'none' },
  { id: 'vif',        label: 'Vif',        css: 'saturate(1.6) contrast(1.05)' },
  { id: 'chaleureux', label: 'Chaleureux', css: 'sepia(0.35) saturate(1.2)' },
  { id: 'nb',         label: 'N&B',        css: 'grayscale(1)' },
  { id: 'contraste',  label: 'Contraste',  css: 'contrast(1.4)' },
];

function limiterOffset(x, y, zoom) {
  const marge = Math.max(zoom - 1, 0) / 2;
  const clampVal = function(v) { return Math.max(-marge, Math.min(marge, v)); };
  return { x: clampVal(x), y: clampVal(y) };
}

function nouvelleSlideTexte(bgColor) {
  return {
    mode: 'texte',
    texte: '',
    bgColor: bgColor || COULEURS_FOND[0],
    mediaFile: null,
    caption: '',
    filtre: 'normal',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dragRef = useRef({ actif: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const marcoRef = useRef(null);
  const captionRef = useRef(null);
  const texteIncrusteRef = useRef(null);

  const [slides, setSlides] = useState(function() { return [nouvelleSlideTexte()]; });
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = slides[activeSlideIndex];

  const [publishing, setPublishing] = useState(false);
  const [erreur, setErreur] = useState('');
  const [activePanel, setActivePanel] = useState(null); // 'filtres' | 'ajuster' | null
  const [reglageChoisi, setReglageChoisi] = useState('luminosite');
  const [outilsSupplementairesVisibles, setOutilsSupplementairesVisibles] = useState(true);

  function majSlideActive(champs) {
    setSlides(function(prev) {
      return prev.map(function(s, i) { return i !== activeSlideIndex ? s : { ...s, ...champs }; });
    });
  }

  function pxDuCadre() {
    const el = marcoRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }
    return { w: 300, h: (300 * 16) / 9 };
  }

  function ouvrirSelecteur() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function surFichierChoisi(e) {
    const file = (e.target.files || [])[0];
    if (!file) return;
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    const previewUrl = URL.createObjectURL(file);
        majSlideActive({
      mode: 'media',
      mediaFile: { file: file, previewUrl: previewUrl, kind: kind },
      filtre: 'normal', brightness: 100, contrast: 100, saturation: 100,
      zoom: 1, offsetX: 0, offsetY: 0,
      texteIncruste: '',
    });
    setErreur('');
    e.target.value = '';
  }

  function retourSlideTexte() {
    majSlideActive({ mode: 'texte', mediaFile: null });
  }

  function ajouterSlide() {
    setSlides(function(prev) { return [...prev, nouvelleSlideTexte()]; });
    setActiveSlideIndex(slides.length);
  }

  function supprimerSlideActive() {
    if (slides.length <= 1) return;
    setSlides(function(prev) { return prev.filter(function(_, i) { return i !== activeSlideIndex; }); });
    setActiveSlideIndex(function(i) { return Math.max(0, i - 1); });
  }

  function slidePrecedente() { if (activeSlideIndex > 0) setActiveSlideIndex(activeSlideIndex - 1); }
  function slideSuivante() { if (activeSlideIndex < slides.length - 1) setActiveSlideIndex(activeSlideIndex + 1); }

  function calculerFiltreCss(s) {
    const parts = [];
    const f = FILTRES.find(function(x) { return x.id === s.filtre; });
    if (f && f.css !== 'none') parts.push(f.css);
    if (s.brightness !== 100 || s.contrast !== 100 || s.saturation !== 100) {
      parts.push('brightness(' + s.brightness + '%) contrast(' + s.contrast + '%) saturate(' + s.saturation + '%)');
    }
    return parts.length ? parts.join(' ') : 'none';
  }

  function appliquerAjustementAuto() {
    majSlideActive({ brightness: 104, contrast: 112, saturation: 118 });
  }
  function reinitialiserAjustements() {
    majSlideActive({ brightness: 100, contrast: 100, saturation: 100 });
  }

  function demarrerGlisser(e) {
    dragRef.current.actif = true;
    const point = e.touches ? e.touches[0] : e;
    dragRef.current.startX = point.clientX;
    dragRef.current.startY = point.clientY;
    dragRef.current.baseX = activeSlide.offsetX;
    dragRef.current.baseY = activeSlide.offsetY;
  }
  function bougerGlisser(e) {
    if (!dragRef.current.actif) return;
    const cadre = pxDuCadre();
    const point = e.touches ? e.touches[0] : e;
    const dxFrac = (point.clientX - dragRef.current.startX) / cadre.w;
    const dyFrac = (point.clientY - dragRef.current.startY) / cadre.h;
    const limite = limiterOffset(dragRef.current.baseX + dxFrac, dragRef.current.baseY + dyFrac, activeSlide.zoom);
    majSlideActive({ offsetX: limite.x, offsetY: limite.y });
  }
  function arreterGlisser() {
    dragRef.current.actif = false;
  }
  function changerZoom(valeur) {
    const limite = limiterOffset(activeSlide.offsetX, activeSlide.offsetY, valeur);
    majSlideActive({ zoom: valeur, offsetX: limite.x, offsetY: limite.y });
  }

      function surCaptionBlur(e) {
    majSlideActive({ caption: e.target.textContent });
  }
    function surTexteIncrusteBlur(e) {
    majSlideActive({ texteIncruste: e.target.textContent });
  }
  useEffect(function() {
    if (captionRef.current) {
      captionRef.current.textContent = (activeSlide && activeSlide.caption) || '';
    }
  }, [activeSlideIndex]);
    useEffect(function() {
    if (texteIncrusteRef.current) {
      texteIncrusteRef.current.textContent = (activeSlide && activeSlide.texteIncruste) || '';
    }
  }, [activeSlideIndex]);

  useEffect(function() {
    if (activePanel === 'texte' && texteIncrusteRef.current) {
      texteIncrusteRef.current.focus();
    }
  }, [activePanel]);

  function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function appliquerBrightnessSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp255(data[i] * facteur);
      data[i + 1] = clamp255(data[i + 1] * facteur);
      data[i + 2] = clamp255(data[i + 2] * facteur);
    }
  }
  function appliquerContrasteSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp255((data[i] - 128) * facteur + 128);
      data[i + 1] = clamp255((data[i + 1] - 128) * facteur + 128);
      data[i + 2] = clamp255((data[i + 2] - 128) * facteur + 128);
    }
  }
  function appliquerSaturationSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      data[i] = clamp255(lum + (r - lum) * facteur);
      data[i + 1] = clamp255(lum + (g - lum) * facteur);
      data[i + 2] = clamp255(lum + (b - lum) * facteur);
    }
  }
  function appliquerGrayscaleSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const gris = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = clamp255(r + (gris - r) * facteur);
      data[i + 1] = clamp255(g + (gris - g) * facteur);
      data[i + 2] = clamp255(b + (gris - b) * facteur);
    }
  }
  function appliquerSepiaSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      data[i] = clamp255(r + (sr - r) * facteur);
      data[i + 1] = clamp255(g + (sg - g) * facteur);
      data[i + 2] = clamp255(b + (sb - b) * facteur);
    }
  }
  function appliquerFiltresSurCanvas(ctx, largeur, hauteur, s) {
    const imageData = ctx.getImageData(0, 0, largeur, hauteur);
    const data = imageData.data;

    if (s.filtre === 'vif') {
      appliquerSaturationSurPixels(data, 1.6);
      appliquerContrasteSurPixels(data, 1.05);
    } else if (s.filtre === 'chaleureux') {
      appliquerSepiaSurPixels(data, 0.35);
      appliquerSaturationSurPixels(data, 1.2);
    } else if (s.filtre === 'nb') {
      appliquerGrayscaleSurPixels(data, 1);
    } else if (s.filtre === 'contraste') {
      appliquerContrasteSurPixels(data, 1.4);
    }

    const b = s.brightness != null ? s.brightness : 100;
    const c = s.contrast != null ? s.contrast : 100;
    const sat = s.saturation != null ? s.saturation : 100;
    if (b !== 100) appliquerBrightnessSurPixels(data, b / 100);
    if (c !== 100) appliquerContrasteSurPixels(data, c / 100);
    if (sat !== 100) appliquerSaturationSurPixels(data, sat / 100);

    ctx.putImageData(imageData, 0, 0);
  }

  function graverImageStory(file, reglages) {
    return new Promise(function(resolve, reject) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = function() {
        const outputW = 1080, outputH = 1920;
        const naturalW = img.naturalWidth, naturalH = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = outputW;
        canvas.height = outputH;
        const ctx = canvas.getContext('2d');

        const echelleCouverture = Math.max(outputW / naturalW, outputH / naturalH);
        const echelle = echelleCouverture * Math.max(reglages.zoom, 1);
        const drawW = naturalW * echelle;
        const drawH = naturalH * echelle;
        const baseX = (outputW - drawW) / 2;
        const baseY = (outputH - drawH) / 2;
        const panX = (reglages.offsetX || 0) * outputW;
        const panY = (reglages.offsetY || 0) * outputH;
        ctx.drawImage(img, baseX + panX, baseY + panY, drawW, drawH);

                appliquerFiltresSurCanvas(ctx, outputW, outputH, reglages);

        if (reglages.texteIncruste) {
          const tailleFonte = Math.round(outputW * 0.065);
          ctx.font = tailleFonte + 'px Georgia, serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 2;

          const maxLargeur = outputW * 0.82;
          const mots = reglages.texteIncruste.split(' ');
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

        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(function(blob) {
          if (!blob) { reject(new Error("Impossible de traiter l'image.")); return; }
          resolve(new File([blob], 'story.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.88);
      };
      img.onerror = function() {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Impossible de charger l'image."));
      };
      img.src = objectUrl;
    });
  }

  async function publier() {
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s.mode === 'texte' && !s.texte.trim()) {
        setErreur('La diapositive ' + (i + 1) + ' (texte) est vide.');
        return;
      }
      if (s.mode === 'media' && !s.mediaFile) {
        setErreur('La diapositive ' + (i + 1) + ' n\'a pas de photo/video.');
        return;
      }
    }
    setPublishing(true);
    setErreur('');
    try {
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        if (s.mode === 'texte') {
          await storiesApi.create({ type: 'texte', caption: s.texte.trim(), bgColor: s.bgColor });
        } else if (s.mediaFile.kind === 'image') {
          const fichierGrave = await graverImageStory(s.mediaFile.file, {
            filtre: s.filtre, brightness: s.brightness, contrast: s.contrast, saturation: s.saturation,
            zoom: s.zoom, offsetX: s.offsetX, offsetY: s.offsetY,
          });
          const url = await uploadToCloudinary(fichierGrave, 'image');
          await storiesApi.create({ type: 'image', imageUrl: url, caption: (s.caption || '').trim() });
        } else {
          const url = await uploadToCloudinary(s.mediaFile.file, 'video');
          await storiesApi.create({ type: 'video', videoUrl: url, caption: (s.caption || '').trim() });
        }
      }
      navigate(-1);
    } catch (e) {
      setErreur((e && e.message) || 'Une erreur est survenue, veuillez reessayer.');
    } finally {
      setPublishing(false);
    }
  }

  const cadreTaille = pxDuCadre();
  const mediaStyle = {
    position: 'absolute', top: '50%', left: '50%', minWidth: '100%', minHeight: '100%',
    width: 'auto', height: 'auto', objectFit: 'cover',
    transform: 'translate(-50%, -50%) translate(' + (activeSlide.offsetX * cadreTaille.w) + 'px, ' + (activeSlide.offsetY * cadreTaille.h) + 'px) scale(' + activeSlide.zoom + ')',
    filter: calculerFiltreCss(activeSlide),
    touchAction: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999, maxWidth: 430, margin: '0 auto',
      background: '#0C0A06', display: 'flex', flexDirection: 'column',
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={surFichierChoisi}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 14px 12px' }}>
        <button onClick={() => navigate(-1)} style={{
          width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(200,168,75,0.3)',
          color: IVOIRE, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><i className="ti ti-x" /></button>
        <div style={{ color: OR, fontSize: 13, fontWeight: 700, fontFamily: 'Georgia,serif', letterSpacing: '.03em' }}>
          Nouvelle story{slides.length > 1 ? ' (' + (activeSlideIndex + 1) + '/' + slides.length + ')' : ''}
        </div>
        <button onClick={publier} disabled={publishing} style={{
          background: OR, border: 'none', borderRadius: 20, padding: '8px 18px',
          fontSize: 12, fontWeight: 700, color: VERT, cursor: publishing ? 'default' : 'pointer',
          opacity: publishing ? 0.6 : 1, fontFamily: 'Georgia,serif',
        }}>{publishing ? '...' : 'Publier'}</button>
      </div>

      {erreur && (
        <div style={{ margin: '0 14px 10px', background: 'rgba(139,32,32,0.85)', color: IVOIRE, fontSize: 12, padding: '8px 12px', borderRadius: 8, fontFamily: 'Georgia,serif' }}>
          {erreur}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, minHeight: 0 }}>
        <div
          ref={marcoRef}
          onMouseDown={activeSlide.mode === 'media' ? demarrerGlisser : undefined}
          onMouseMove={activeSlide.mode === 'media' ? bougerGlisser : undefined}
          onMouseUp={activeSlide.mode === 'media' ? arreterGlisser : undefined}
          onMouseLeave={activeSlide.mode === 'media' ? arreterGlisser : undefined}
          onTouchStart={activeSlide.mode === 'media' ? demarrerGlisser : undefined}
          onTouchMove={activeSlide.mode === 'media' ? bougerGlisser : undefined}
          onTouchEnd={activeSlide.mode === 'media' ? arreterGlisser : undefined}
          style={{
            position: 'relative', width: 'auto', height: '100%', maxWidth: '100%', aspectRatio: '9 / 16',
            overflow: 'hidden',
            background: activeSlide.mode === 'texte' ? activeSlide.bgColor : '#000',
            cursor: activeSlide.mode === 'media' ? 'grab' : 'default',
          }}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,168,75,.15),transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />

          {slides.length > 1 && (
            <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', gap: 4, zIndex: 5 }}>
              {slides.map(function(_, i) {
                return (
                  <div key={i} onClick={function() { setActiveSlideIndex(i); }} style={{ flex: 1, height: 3, borderRadius: 2, background: i === activeSlideIndex ? OR : 'rgba(255,255,255,0.35)', cursor: 'pointer' }} />
                );
              })}
            </div>
          )}

          {slides.length > 1 && (
            <>
              <button
                onClick={slidePrecedente}
                disabled={activeSlideIndex === 0}
                style={{ position: 'absolute', top: '50%', left: 6, transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: 15, zIndex: 5, opacity: activeSlideIndex === 0 ? 0.3 : 1 }}
              >‹</button>
              <button
                onClick={slideSuivante}
                disabled={activeSlideIndex === slides.length - 1}
                style={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: 15, zIndex: 5, opacity: activeSlideIndex === slides.length - 1 ? 0.3 : 1 }}
              >›</button>
            </>
          )}

          {slides.length > 1 && (
            <button onClick={supprimerSlideActive} style={{ position: 'absolute', top: 16, left: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: 12, zIndex: 5 }}>
              <i className="ti ti-x" />
            </button>
          )}

          <button onClick={ajouterSlide} style={{ position: 'absolute', top: 16, right: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: 15, zIndex: 5 }}>
            +
          </button>

          {activeSlide.mode === 'texte' && (
            <textarea
              value={activeSlide.texte}
              onChange={function(e) { majSlideActive({ texte: e.target.value }); }}
              placeholder="Ecrivez quelque chose..."
              maxLength={300}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', boxSizing: 'border-box',
                background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                color: IVOIRE, fontFamily: 'Georgia,serif', fontSize: 19, fontStyle: 'italic', textAlign: 'center',
                lineHeight: 1.6, padding: '40% 22px 0', zIndex: 2,
              }}
            />
          )}

          {activeSlide.mode === 'media' && activeSlide.mediaFile && activeSlide.mediaFile.kind === 'image' && (
            <img src={activeSlide.mediaFile.previewUrl} alt="" style={mediaStyle} draggable={false} />
          )}
          {activeSlide.mode === 'media' && activeSlide.mediaFile && activeSlide.mediaFile.kind === 'video' && (
            <video src={activeSlide.mediaFile.previewUrl} autoPlay muted loop playsInline style={mediaStyle} />
          )}

          {activeSlide.mode === 'media' && activeSlide.mediaFile && (
            <div style={{ position: 'absolute', top: 60, right: 12, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 6, alignItems: 'flex-end' }}>

              <div onClick={function() { setActivePanel(activePanel === 'filtres' ? null : 'filtres'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <span style={{ color: activePanel === 'filtres' ? OR : IVOIRE, fontSize: 12.5, fontWeight: 700, fontFamily: 'Georgia,serif', whiteSpace: 'nowrap' }}>Filtres</span>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activePanel === 'filtres' ? OR : '#fff', fontSize: 18 }}>
                  <i className="ti ti-circles" />
                </div>
              </div>

              <div onClick={function() { setActivePanel(activePanel === 'ajuster' ? null : 'ajuster'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <span style={{ color: activePanel === 'ajuster' ? OR : IVOIRE, fontSize: 12.5, fontWeight: 700, fontFamily: 'Georgia,serif', whiteSpace: 'nowrap' }}>Reglages</span>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activePanel === 'ajuster' ? OR : '#fff', fontSize: 18 }}>
                  <i className="ti ti-settings" />
                </div>
              </div>

              {outilsSupplementairesVisibles && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default', opacity: 0.55 }}>
                    <span style={{ color: IVOIRE, fontSize: 12.5, fontWeight: 700, fontFamily: 'Georgia,serif', whiteSpace: 'nowrap' }}>Audio</span>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
                      <i className="ti ti-music" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default', opacity: 0.55 }}>
                    <span style={{ color: IVOIRE, fontSize: 12.5, fontWeight: 700, fontFamily: 'Georgia,serif', whiteSpace: 'nowrap' }}>Effets</span>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
                      <i className="ti ti-sparkles" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default', opacity: 0.55 }}>
                    <span style={{ color: IVOIRE, fontSize: 12.5, fontWeight: 700, fontFamily: 'Georgia,serif', whiteSpace: 'nowrap' }}>Dessiner</span>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
                      <i className="ti ti-pencil" />
                    </div>
                  </div>
                </>
              )}

              <div onClick={function() { setOutilsSupplementairesVisibles(function(v) { return !v; }); }} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 16 }}>
                <i className={outilsSupplementairesVisibles ? 'ti ti-chevron-up' : 'ti ti-chevron-down'} />
              </div>

            </div>
          )}

          {activePanel === 'filtres' && activeSlide.mode === 'media' && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', padding: '26px 10px 14px', display: 'flex', gap: 8, overflowX: 'auto', zIndex: 6 }}>
              {FILTRES.map(function(f) {
                const actif = activeSlide.filtre === f.id;
                return (
                  <div key={f.id} onClick={function() { majSlideActive({ filtre: f.id }); }} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif', background: actif ? OR : 'rgba(255,255,255,0.15)', color: actif ? VERT : IVOIRE, border: '1px solid ' + (actif ? OR : 'rgba(200,168,75,0.3)') }}>
                    {f.label}
                  </div>
                );
              })}
            </div>
          )}

          {activePanel === 'ajuster' && activeSlide.mode === 'media' && (function() {
            const REGLAGES = [
              { id: 'luminosite', label: 'Luminosite', valeur: activeSlide.brightness, min: 50, max: 150, onChange: function(v) { majSlideActive({ brightness: v }); } },
              { id: 'contraste', label: 'Contraste', valeur: activeSlide.contrast, min: 50, max: 150, onChange: function(v) { majSlideActive({ contrast: v }); } },
              { id: 'saturation', label: 'Saturation', valeur: activeSlide.saturation, min: 0, max: 200, onChange: function(v) { majSlideActive({ saturation: v }); } },
              { id: 'zoom', label: 'Zoom', valeur: activeSlide.zoom, min: 1, max: 2.5, step: 0.05, onChange: changerZoom },
            ];
            const actuel = REGLAGES.find(function(r) { return r.id === reglageChoisi; }) || REGLAGES[0];
            return (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', padding: '20px 10px 14px', zIndex: 6 }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, paddingBottom: 2 }}>
                  {REGLAGES.map(function(r) {
                    const actif = r.id === reglageChoisi;
                    return (
                      <div key={r.id} onClick={function() { setReglageChoisi(r.id); }} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, background: actif ? OR : 'rgba(255,255,255,0.15)', color: actif ? VERT : IVOIRE, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Georgia,serif' }}>
                        {r.label}
                      </div>
                    );
                  })}
                  <div onClick={appliquerAjustementAuto} style={{ flexShrink: 0, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: OR, cursor: 'pointer', whiteSpace: 'nowrap' }}>Auto</div>
                  <div onClick={reinitialiserAjustements} style={{ flexShrink: 0, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: 'rgba(245,239,228,0.6)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Reinitialiser</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {actuel.id === 'zoom' && <i className="ti ti-zoom-in" style={{ color: OR, fontSize: 15 }} />}
                  <input type="range" min={actuel.min} max={actuel.max} step={actuel.step || 1} value={actuel.valeur} onChange={function(e) { actuel.onChange(actuel.id === 'zoom' ? parseFloat(e.target.value) : +e.target.value); }} style={{ flex: 1, accentColor: OR }} />
                  <span style={{ fontSize: 10, color: '#fff', width: 30, textAlign: 'right' }}>{actuel.id === 'zoom' ? actuel.valeur.toFixed(2) : actuel.valeur}</span>
                </div>
              </div>
            );
          })()}

          {activeSlide.mode === 'media' && !activePanel && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', padding: '34px 14px 16px', zIndex: 2 }}>
              <div
                ref={captionRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={surCaptionBlur}
                style={{ color: IVOIRE, fontFamily: 'Georgia,serif', fontSize: 13, textAlign: 'center', outline: 'none', minHeight: 18, cursor: 'text' }}
              />
              {!activeSlide.caption && (
                <div style={{ color: 'rgba(245,239,228,0.5)', fontFamily: 'Georgia,serif', fontSize: 13, textAlign: 'center', marginTop: -18, pointerEvents: 'none' }}>
                  Ajouter une legende...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeSlide.mode === 'texte' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '0 14px 14px' }}>
          {COULEURS_FOND.map(function(c) {
            return (
              <div
                key={c}
                onClick={function() { majSlideActive({ bgColor: c }); }}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: activeSlide.bgColor === c ? '2.5px solid ' + OR : '2px solid rgba(255,255,255,0.3)',
                  boxShadow: activeSlide.bgColor === c ? '0 0 0 2px rgba(200,168,75,0.3)' : 'none',
                }}
              />
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 28, padding: '10px 14px 26px', borderTop: '1px solid rgba(200,168,75,0.15)' }}>
        <div onClick={retourSlideTexte} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: activeSlide.mode === 'texte' ? OR : 'rgba(255,255,255,0.1)',
            border: '1px solid ' + (activeSlide.mode === 'texte' ? OR : 'rgba(200,168,75,0.3)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: activeSlide.mode === 'texte' ? VERT : IVOIRE, fontSize: 16, fontWeight: 700, fontFamily: 'Georgia,serif',
          }}>Aa</div>
          <span style={{ color: activeSlide.mode === 'texte' ? OR : IVOIRE, fontSize: 10, fontFamily: 'Georgia,serif' }}>Texte</span>
        </div>
        <div onClick={ouvrirSelecteur} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: activeSlide.mode === 'media' ? OR : 'rgba(255,255,255,0.1)',
            border: '1px solid ' + (activeSlide.mode === 'media' ? OR : 'rgba(200,168,75,0.3)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: activeSlide.mode === 'media' ? VERT : IVOIRE, fontSize: 18,
          }}><i className="ti ti-camera" /></div>
          <span style={{ color: activeSlide.mode === 'media' ? OR : IVOIRE, fontSize: 10, fontFamily: 'Georgia,serif' }}>Photo/Video</span>
        </div>
      </div>
    </div>
  );
}
