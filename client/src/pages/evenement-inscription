import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { postsApi } from '../../services/api';

const VERT = '#1e2d14';
const OR = '#C8A84B';
const IVOIRE = '#F5F0E8';

export default function EvenementInscriptionPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dejaInscrit, setDejaInscrit] = useState(false);
  const [placesRestantes, setPlacesRestantes] = useState(null);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(function() {
    setNom(((user?.firstName || '') + ' ' + (user?.lastName || '')).trim());
    setTelephone(user?.phone || '');
  }, [user]);

  useEffect(function() {
    async function charger() {
      setLoading(true);
      try {
        const [resPost, resInscription] = await Promise.all([
          postsApi.getOne(postId),
          postsApi.getMonInscription(postId),
        ]);
        setPost(resPost && resPost.data && resPost.data.post);
        const d = resInscription && resInscription.data ? resInscription.data : {};
        setDejaInscrit(!!d.inscrit);
        setPlacesRestantes(d.placesRestantes);
      } catch (e) {
        setErreur(e.message || 'Impossible de charger cet evenement.');
      } finally {
        setLoading(false);
      }
    }
    charger();
  }, [postId]);

  async function confirmer() {
    if (!nom.trim() || !telephone.trim()) {
      setErreur('Nom et telephone requis.');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      await postsApi.inscrireEvenement(postId, { nom: nom.trim(), telephone: telephone.trim() });
      setSuccess(true);
    } catch (e) {
      setErreur(e.message || 'Une erreur est survenue.');
    } finally {
      setEnvoi(false);
    }
  }

  const complet = placesRestantes === 0;

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '44px 16px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: VERT }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: VERT }}>Inscription a l'evenement</div>
        </div>

        <div style={{ padding: 16 }}>
          {loading && (
            <div style={{ fontSize: 13, color: '#9A8E7E', padding: '20px 0' }}>Chargement...</div>
          )}

          {!loading && post && (
            <>
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: '#8B6020', fontWeight: 700, marginBottom: 6, letterSpacing: '.04em' }}>EVENEMENT</div>
                <div style={{ fontSize: 14, color: VERT, lineHeight: 1.5, marginBottom: 10, fontFamily: 'Georgia,serif' }}>{post.content}</div>
                {post.eventCapacity != null && (
                  <div style={{ fontSize: 11.5, color: '#8B6020', fontWeight: 700 }}>
                    {placesRestantes != null ? placesRestantes + ' place(s) restante(s) sur ' + post.eventCapacity : 'Places limitees : ' + post.eventCapacity}
                  </div>
                )}
              </div>

              {success && (
                <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: VERT, marginBottom: 8 }}>Inscription confirmee</div>
                  <div style={{ fontSize: 13, color: '#7A6E5E', marginBottom: 20 }}>A bientot pour cet evenement !</div>
                  <button onClick={function() { navigate(-1); }} style={{ padding: '10px 24px', background: VERT, color: OR, border: 'none', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Retour au fil
                  </button>
                </div>
              )}

              {!success && dejaInscrit && (
                <div style={{ textAlign: 'center', padding: '30px 16px', fontSize: 13, color: '#3a3a3a' }}>
                  Vous etes deja inscrit(e) a cet evenement.
                </div>
              )}

              {!success && !dejaInscrit && complet && (
                <div style={{ textAlign: 'center', padding: '30px 16px', fontSize: 13, color: '#b71c1c' }}>
                  Il n'y a plus de places disponibles pour cet evenement.
                </div>
              )}

              {!success && !dejaInscrit && !complet && (
                <>
                  <label style={{ fontSize: 11, color: '#9A8E7E', fontWeight: 700, display: 'block', marginBottom: 6 }}>Nom complet</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={function(e) { setNom(e.target.value); }}
                    style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 12, padding: '11px 14px', fontSize: 14, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: VERT, marginBottom: 14 }}
                  />
                  <label style={{ fontSize: 11, color: '#9A8E7E', fontWeight: 700, display: 'block', marginBottom: 6 }}>Telephone</label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={function(e) { setTelephone(e.target.value); }}
                    style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 12, padding: '11px 14px', fontSize: 14, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: VERT, marginBottom: 20 }}
                  />

                  {erreur && (
                    <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 12, color: '#e53935' }}>
                      {erreur}
                    </div>
                  )}

                  <button
                    onClick={confirmer}
                    disabled={envoi}
                    style={{
                      width: '100%', padding: 14, background: envoi ? 'rgba(200,168,75,0.5)' : 'linear-gradient(135deg,#C8A84B,#8B6020)',
                      border: 'none', borderRadius: 14, color: VERT, fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif',
                      cursor: envoi ? 'default' : 'pointer',
                    }}
                  >
                    {envoi ? 'Envoi...' : 'Confirmer mon inscription'}
                  </button>
                </>
              )}
            </>
          )}

          {!loading && !post && (
            <div style={{ textAlign: 'center', padding: '30px 16px', fontSize: 13, color: '#b71c1c' }}>{erreur || 'Evenement introuvable.'}</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
