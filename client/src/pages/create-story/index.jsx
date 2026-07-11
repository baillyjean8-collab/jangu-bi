import React, { useState, useRef } from 'react';
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
const AUTO_ADJUST_CSS = 'contrast(1.12) saturate(1.18) brightness(1.04)';

function limiterOffset(x, y, zoom) {
  const marge = 90 * Math.max(zoom - 1, 0);
  const clampVal = function(v) { return Math.max(-marge, Math.min(marge, v)); };
  return { x: clampVal(x), y: clampVal(y) };
}

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dragRef = useRef({ actif: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const [mode, setMode] = useState('texte'); // 'texte' | 'media'
  const [texte, setTexte] = useState('');
  const [bgColor, setBgColor] = useState(COULEURS_FOND[0]);

  const [mediaFile, setMediaFile] = useState(null); // { file, previewUrl, kind }
  const [caption, setCaption] = useState('');
  const [filtre, setFiltre] = useState('normal');
  const [autoAjust, setAutoAjust] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const [publishing, setPublishing] = useState(false);
  const [erreur, setErreur] = useState('');

  function ouvrirSelecteur() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function surFichierChoisi(e) {
    const file = (e.target.files || [])[0];
    if (!file) return;
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    const previewUrl = URL.createObjectURL(file);
    setMediaFile({ file: file, previewUrl: previewUrl, kind: kind });
    setMode('media');
    setFiltre('normal');
    setAutoAjust(false);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setErreur('');
  }

  function retourTexte() {
    setMediaFile(null);
    setMode('texte');
  }

  function styleFiltreActif() {
    const parts = [];
    if (autoAjust) parts.push(AUTO_ADJUST_CSS);
    const f = FILTRES.find(function(x) { return x.id === filtre; });
    if (f && f.css !== 'none') parts.push(f.css);
    return parts.length ? parts.join(' ') : 'none';
  }

  function demarrerGlisser(e) {
    dragRef.current.actif = true;
    const point = e.touches ? e.touches[0] : e;
    dragRef.current.startX = point.clientX;
    dragRef.current.startY = point.clientY;
    dragRef.current.baseX = offsetX;
    dragRef.current.baseY = offsetY;
  }
  function bougerGlisser(e) {
    if (!dragRef.current.actif) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - dragRef.current.startX;
    const dy = point.clientY - dragRef.current.startY;
    const limite = limiterOffset(dragRef.current.baseX + dx, dragRef.current.baseY + dy, zoom);
    setOffsetX(limite.x);
    setOffsetY(limite.y);
  }
  function arreterGlisser() {
    dragRef.current.actif = false;
  }
  function changerZoom(valeur) {
    const limite = limiterOffset(offsetX, offsetY, valeur);
    setZoom(valeur);
    setOffsetX(limite.x);
    setOffsetY(limite.y);
  }

  async function publier() {
    if (mode === 'texte' && !texte.trim()) {
      setErreur('Ecrivez un texte avant de publier.');
      return;
    }
    if (mode === 'media' && !mediaFile) {
      setErreur('Choisissez une photo ou une video.');
      return;
    }
    setPublishing(true);
    setErreur('');
    try {
      if (mode === 'texte') {
        await storiesApi.create({ type: 'texte', caption: texte.trim(), bgColor: bgColor });
      } else {
        const url = await uploadToCloudinary(mediaFile.file, mediaFile.kind === 'video' ? 'video' : 'image');
        await storiesApi.create({
          type: mediaFile.kind,
          imageUrl: mediaFile.kind === 'image' ? url : undefined,
          videoUrl: mediaFile.kind === 'video' ? url : undefined,
          caption: caption.trim(),
        });
      }
      navigate(-1);
    } catch (e) {
      setErreur((e && e.message) || 'Une erreur est survenue, veuillez reessayer.');
    } finally {
      setPublishing(false);
    }
  }

  const mediaStyle = {
    position: 'absolute', top: '50%', left: '50%', minWidth: '100%', minHeight: '100%',
    width: 'auto', height: 'auto', objectFit: 'cover',
    transform: 'translate(-50%, -50%) translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + zoom + ')',
    filter: styleFiltreActif(),
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
        <div style={{ color: OR, fontSize: 13, fontWeight: 700, fontFamily: 'Georgia,serif', letterSpacing: '.03em' }}>Nouvelle story</div>
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
          onMouseDown={mode === 'media' ? demarrerGlisser : undefined}
          onMouseMove={mode === 'media' ? bougerGlisser : undefined}
          onMouseUp={mode === 'media' ? arreterGlisser : undefined}
          onMouseLeave={mode === 'media' ? arreterGlisser : undefined}
          onTouchStart={mode === 'media' ? demarrerGlisser : undefined}
          onTouchMove={mode === 'media' ? bougerGlisser : undefined}
          onTouchEnd={mode === 'media' ? arreterGlisser : undefined}
          style={{
            position: 'relative', width: '100%', maxWidth: 300, aspectRatio: '9 / 16', maxHeight: '100%',
            borderRadius: 20, overflow: 'hidden', border: '2px solid #C8A84B',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            background: mode === 'texte' ? bgColor : '#000',
            cursor: mode === 'media' ? 'grab' : 'default',
          }}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,168,75,.15),transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />

          {mode === 'texte' && (
            <textarea
              value={texte}
              onChange={function(e) { setTexte(e.target.value); }}
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

          {mode === 'media' && mediaFile && mediaFile.kind === 'image' && (
            <img src={mediaFile.previewUrl} alt="" style={mediaStyle} draggable={false} />
          )}
          {mode === 'media' && mediaFile && mediaFile.kind === 'video' && (
            <video src={mediaFile.previewUrl} autoPlay muted loop playsInline style={mediaStyle} />
          )}

          {mode === 'media' && caption && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', padding: '30px 14px 14px', zIndex: 2 }}>
              <div style={{ color: IVOIRE, fontFamily: 'Georgia,serif', fontSize: 13, textAlign: 'center' }}>{caption}</div>
            </div>
          )}
        </div>
      </div>

      {/* Options media : filtres, ajustement, zoom, legende */}
      {mode === 'media' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {FILTRES.map(function(f) {
              return (
                <div
                  key={f.id}
                  onClick={function() { setFiltre(f.id); }}
                  style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Georgia,serif',
                    background: filtre === f.id ? OR : 'rgba(255,255,255,0.1)',
                    color: filtre === f.id ? VERT : IVOIRE,
                    border: '1px solid ' + (filtre === f.id ? OR : 'rgba(200,168,75,0.3)'),
                  }}
                >{f.label}</div>
              );
            })}
            <div
              onClick={function() { setAutoAjust(!autoAjust); }}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Georgia,serif',
                background: autoAjust ? OR : 'rgba(255,255,255,0.1)',
                color: autoAjust ? VERT : IVOIRE,
                border: '1px solid ' + (autoAjust ? OR : 'rgba(200,168,75,0.3)'),
              }}
            >Auto</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <i className="ti ti-zoom-in" style={{ color: OR, fontSize: 15 }} />
            <input
              type="range" min="1" max="2.5" step="0.05" value={zoom}
              onChange={function(e) { changerZoom(parseFloat(e.target.value)); }}
              style={{ flex: 1, accentColor: OR }}
            />
          </div>

          <input
            value={caption}
            onChange={function(e) { setCaption(e.target.value); }}
            placeholder="Ajouter une legende..."
            maxLength={300}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 20,
              padding: '10px 14px', color: IVOIRE, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'Georgia,serif', marginBottom: 10,
            }}
          />
        </div>
      )}

      {/* Palette de couleurs (mode texte) */}
      {mode === 'texte' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '0 14px 14px' }}>
          {COULEURS_FOND.map(function(c) {
            return (
              <div
                key={c}
                onClick={function() { setBgColor(c); }}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: bgColor === c ? '2.5px solid ' + OR : '2px solid rgba(255,255,255,0.3)',
                  boxShadow: bgColor === c ? '0 0 0 2px rgba(200,168,75,0.3)' : 'none',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Barre du bas : basculer texte / media */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 28, padding: '10px 14px 26px', borderTop: '1px solid rgba(200,168,75,0.15)' }}>
        <div onClick={retourTexte} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: mode === 'texte' ? OR : 'rgba(255,255,255,0.1)',
            border: '1px solid ' + (mode === 'texte' ? OR : 'rgba(200,168,75,0.3)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: mode === 'texte' ? VERT : IVOIRE, fontSize: 16, fontWeight: 700, fontFamily: 'Georgia,serif',
          }}>Aa</div>
          <span style={{ color: mode === 'texte' ? OR : IVOIRE, fontSize: 10, fontFamily: 'Georgia,serif' }}>Texte</span>
        </div>
        <div onClick={ouvrirSelecteur} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: mode === 'media' ? OR : 'rgba(255,255,255,0.1)',
            border: '1px solid ' + (mode === 'media' ? OR : 'rgba(200,168,75,0.3)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: mode === 'media' ? VERT : IVOIRE, fontSize: 18,
          }}><i className="ti ti-camera" /></div>
          <span style={{ color: mode === 'media' ? OR : IVOIRE, fontSize: 10, fontFamily: 'Georgia,serif' }}>Photo/Video</span>
        </div>
      </div>
    </div>
  );
}
