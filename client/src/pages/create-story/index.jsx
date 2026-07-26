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

// offsetX/offsetY sont exprimes en FRACTION du cadre (ex: 0.2 = 20% de la largeur),
// pas en pixels bruts. Ainsi le recadrage se reproduit a l'identique sur l'image
// finale envoyee au serveur, quelle que soit la taille de l'ecran du telephone.
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

  // Plusieurs diapositives (comme une vraie "story" a tiroirs) : chacune
  // est soit un texte sur fond colore, soit une photo/video avec ses propres
  // reglages (filtre, luminosite, zoom, legende). Publier envoie chaque
  // diapositive comme une story separee, dans l'ordre : le fil les regroupe
  // deja automatiquement par paroisse (voir HomePage), donc aucun changement
  // cote serveur n'est necessaire pour ce chantier.
  const [slides, setSlides] = useState(function() { return [nouvelleSlideTexte()]; });
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = slides[activeSlideIndex];

  const [publishing, setPublishing] = useState(false);
  const [erreur, setErreur] = useState('');

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

  // Legende ecrite directement sur la photo (comme les publications), a la
  // place d'un champ de saisie separe. Elle reste stockee a part (pas gravee
  // dans les pixels) : c'est le lecteur de stories qui l'affiche en bandeau,
  // exactement comme avant - seule la facon de la saisir change.
  function surCaptionBlur(e) {
    majSlideActive({ caption: e.target.textContent });
  }
  useEffect(function() {
    if (captionRef.current) {
      captionRef.current.textContent = (activeSlide && activeSlide.caption) || '';
    }
  }, [activeSlideIndex]);

  // Grave reellement le filtre + le recadrage/zoom dans l'image avant l'envoi,
  // pour que la story vue par les fideles corresponde exactement a ce qui a ete
  // compose a l'ecran. Le cadre story est toujours 9:16, rempli en entier (cover).
  // Pour les videos, ceci n'est pas applicable cote client (traitement serveur
  // necessaire) : le filtre choisi reste donc un apercu uniquement pour les videos.
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
        ctx.filter = reglages.filtreCss;

        const echelleCouverture = Math.max(outputW / naturalW, outputH / naturalH);
        const echelle = echelleCouverture * Math.max(reglages.zoom, 1);
        const drawW = naturalW * echelle;
        const drawH = naturalH * echelle;
        const baseX = (outputW - drawW) / 2;
        const baseY = (outputH - drawH) / 2;
        const panX = (reglages.offsetX || 0) * outputW;
        const panY = (reglages.offsetY || 0) * outputH;
        ctx.drawImage(img, baseX + panX, baseY + panY, drawW, drawH);

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
      // Envoyees dans l'ordre, une par une : le fil les regroupe deja par
      // paroisse et par date de creation, donc l'ordre choisi ici est respecte.
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        if (s.mode === 'texte') {
          await storiesApi.create({ type: 'texte', caption: s.texte.trim(), bgColor: s.bgColor });
        } else if (s.mediaFile.kind === 'image') {
          const fichierGrave = await graverImageStory(s.mediaFile.file, {
            filtreCss: calculerFiltreCss(s), zoom: s.zoom, offsetX: s.offsetX, offsetY: s.offsetY,
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

      {/* Barre du haut */}
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

      {/* Cadre story 9:16, esprit Jangu Bi */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px 10px', minHeight: 0 }}>
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
            position: 'relative', width: '100%', maxWidth: 300, aspectRatio: '9 / 16', maxHeight: '100%',
            borderRadius: 20, overflow: 'hidden', border: '2px solid #C8A84B',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            background: activeSlide.mode === 'texte' ? activeSlide.bgColor : '#000',
            cursor: activeSlide.mode === 'media' ? 'grab' : 'default',
          }}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,168,75,.15),transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />

          {/* points de progression (plusieurs diapositives) */}
          {slides.length > 1 && (
            <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', gap: 4, zIndex: 5 }}>
              {slides.map(function(_, i) {
                return (
                  <div key={i} onClick={function() { setActiveSlideIndex(i); }} style={{ flex: 1, height: 3, borderRadius: 2, background: i === activeSlideIndex ? OR : 'rgba(255,255,255,0.35)', cursor: 'pointer' }} />
                );
              })}
            </div>
          )}

          {/* fleches gauche/droite entre diapositives */}
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

          {/* supprimer la diapositive actuelle */}
          {slides.length > 1 && (
            <button onClick={supprimerSlideActive} style={{ position: 'absolute', top: 16, left: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: 12, zIndex: 5 }}>
              <i className="ti ti-x" />
            </button>
          )}

          {/* ajouter une nouvelle diapositive */}
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

          {activeSlide.mode === 'media' && (
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

      {/* Options media : filtres, ajustement, zoom */}
      {activeSlide.mode === 'media' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {FILTRES.map(function(f) {
              return (
                <div
                  key={f.id}
                  onClick={function() { majSlideActive({ filtre: f.id }); }}
                  style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Georgia,serif',
                    background: activeSlide.filtre === f.id ? OR : 'rgba(255,255,255,0.1)',
                    color: activeSlide.filtre === f.id ? VERT : IVOIRE,
                    border: '1px solid ' + (activeSlide.filtre === f.id ? OR : 'rgba(200,168,75,0.3)'),
                  }}
                >{f.label}</div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginBottom: 6 }}>
            <span onClick={appliquerAjustementAuto} style={{ fontSize: 10.5, fontWeight: 700, color: OR, cursor: 'pointer' }}>Auto</span>
            <span onClick={reinitialiserAjustements} style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(245,239,228,0.5)', cursor: 'pointer' }}>Reinitialiser</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 9.5, color: IVOIRE, width: 62 }}>Luminosite</span>
            <input type="range" min="50" max="150" value={activeSlide.brightness} onChange={function(e) { majSlideActive({ brightness: +e.target.value }); }} style={{ flex: 1, accentColor: OR }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 9.5, color: IVOIRE, width: 62 }}>Contraste</span>
            <input type="range" min="50" max="150" value={activeSlide.contrast} onChange={function(e) { majSlideActive({ contrast: +e.target.value }); }} style={{ flex: 1, accentColor: OR }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 9.5, color: IVOIRE, width: 62 }}>Saturation</span>
            <input type="range" min="0" max="200" value={activeSlide.saturation} onChange={function(e) { majSlideActive({ saturation: +e.target.value }); }} style={{ flex: 1, accentColor: OR }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <i className="ti ti-zoom-in" style={{ color: OR, fontSize: 15 }} />
            <input
              type="range" min="1" max="2.5" step="0.05" value={activeSlide.zoom}
              onChange={function(e) { changerZoom(parseFloat(e.target.value)); }}
              style={{ flex: 1, accentColor: OR }}
            />
          </div>
        </div>
      )}

      {/* Palette de couleurs (mode texte) */}
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

      {/* Barre du bas : basculer texte / media pour la diapositive active */}
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