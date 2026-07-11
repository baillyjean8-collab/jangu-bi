import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storiesApi } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';

const VERT = '#1e2d14';
const OR = '#C8A84B';

const COULEURS_FOND = ['#1e2d14', '#2E5C3E', '#8B6020', '#5C2E2E', '#2E3A5C', '#0C0A06'];

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('texte'); // 'texte' | 'media'
  const [texte, setTexte] = useState('');
  const [bgColor, setBgColor] = useState(COULEURS_FOND[0]);

  const [mediaFile, setMediaFile] = useState(null); // { file, previewUrl, kind }
  const [caption, setCaption] = useState('');

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
    setErreur('');
  }

  function retourTexte() {
    setMediaFile(null);
    setMode('texte');
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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999, maxWidth: 430, margin: '0 auto',
      background: mode === 'texte' ? bgColor : '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={surFichierChoisi}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 14px 0' }}>
        <button onClick={() => navigate(-1)} style={{
          width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none',
          color: 'white', fontSize: 16, cursor: 'pointer',
        }}>&#10005;</button>
        <div style={{ color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'Georgia,serif' }}>Nouvelle story</div>
        <button onClick={publier} disabled={publishing} style={{
          background: OR, border: 'none', borderRadius: 20, padding: '8px 16px',
          fontSize: 12, fontWeight: 700, color: VERT, cursor: publishing ? 'default' : 'pointer',
          opacity: publishing ? 0.6 : 1,
        }}>{publishing ? '...' : 'Publier'}</button>
      </div>

      {erreur && (
        <div style={{ margin: '10px 14px 0', background: 'rgba(183,28,28,0.85)', color: 'white', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>
          {erreur}
        </div>
      )}

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {mode === 'texte' && (
          <textarea
            value={texte}
            onChange={function(e) { setTexte(e.target.value); }}
            placeholder="Ecrivez quelque chose..."
            maxLength={300}
            style={{
              width: '85%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              color: 'white', fontFamily: 'Georgia,serif', fontSize: 22, textAlign: 'center', lineHeight: 1.5,
              height: 200,
            }}
          />
        )}

        {mode === 'media' && mediaFile && mediaFile.kind === 'image' && (
          <img src={mediaFile.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}
        {mode === 'media' && mediaFile && mediaFile.kind === 'video' && (
          <video src={mediaFile.previewUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}
      </div>

      {mode === 'media' && (
        <div style={{ padding: '0 14px 10px' }}>
          <input
            value={caption}
            onChange={function(e) { setCaption(e.target.value); }}
            placeholder="Ajouter une legende..."
            maxLength={300}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20,
              padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {mode === 'texte' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '0 14px 14px' }}>
          {COULEURS_FOND.map(function(c) {
            return (
              <div
                key={c}
                onClick={function() { setBgColor(c); }}
                style={{
                  width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: bgColor === c ? '2.5px solid white' : '2px solid rgba(255,255,255,0.4)',
                }}
              />
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '10px 14px 26px' }}>
        <div onClick={retourTexte} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
          opacity: mode === 'texte' ? 1 : 0.55,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 700 }}>Aa</div>
          <span style={{ color: 'white', fontSize: 10 }}>Texte</span>
        </div>
        <div onClick={ouvrirSelecteur} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
          opacity: mode === 'media' ? 1 : 0.55,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18 }}>
            <i className="ti ti-camera" />
          </div>
          <span style={{ color: 'white', fontSize: 10 }}>Photo/Video</span>
        </div>
      </div>
    </div>
  );
}
