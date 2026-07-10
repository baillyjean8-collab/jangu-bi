import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { postsApi } from '../../services/api';

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

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [typePub, setTypePub]     = useState('NORMAL');
  const [texte, setTexte]         = useState('');
  const [imageUrl, setImageUrl]   = useState('');
  const [publishing, setPublishing] = useState(false);
  const [erreur, setErreur]       = useState('');

  const initiales = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'MD';

  async function publier() {
    if (!texte.trim()) {
      setErreur('Ecrivez au moins une phrase avant de publier.');
      return;
    }
    setPublishing(true);
    setErreur('');
    try {
      await postsApi.create({
        content: texte.trim(),
        type: typePub,
        imageUrl: imageUrl.trim() || undefined,
      });
      // Publication reussie : l'accueil et le profil rechargent les vraies
      // donnees a chaque affichage, donc revenir en arriere suffit pour que
      // la nouvelle publication apparaisse partout (admin + visiteurs).
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '44px 16px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: VERT }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: VERT }}>Nouvelle publication</div>
        </div>

        <div style={{ padding: 16 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
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
            style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.25)', borderRadius: 14, padding: 14, fontSize: 13, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', height: 140, background: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
          />

          <div style={{ fontSize: 11, color: '#9A8E7E', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>MEDIA (OPTIONNEL)</div>
          <div style={{ background: 'rgba(200,168,75,0.06)', border: '1px dashed rgba(200,168,75,0.3)', borderRadius: 12, padding: 12, marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: '#8a6d00', marginBottom: 8 }}>
              L'envoi direct d'une photo/video depuis votre appareil n'est pas encore disponible. En attendant, vous pouvez coller l'URL d'une image deja hebergee en ligne.
            </div>
            <input
              value={imageUrl}
              onChange={function(e) { setImageUrl(e.target.value); }}
              placeholder="https://..."
              style={{ width: '100%', border: '1px solid rgba(200,168,75,0.25)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: 'white', outline: 'none', boxSizing: 'border-box' }}
            />
            {imageUrl.trim() && (
              <img src={imageUrl.trim()} alt="apercu" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, marginTop: 10 }} onError={function(e) { e.target.style.display = 'none'; }} />
            )}
          </div>

          {erreur && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 12, color: '#e53935' }}>
              {erreur}
            </div>
          )}

          <button
            onClick={publier}
            disabled={publishing}
            style={{ width: '100%', marginTop: 20, padding: 14, background: publishing ? 'rgba(200,168,75,0.5)' : 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 14, color: VERT, fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: publishing ? 'default' : 'pointer' }}
          >
            {publishing ? 'Publication en cours...' : 'Publier'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
