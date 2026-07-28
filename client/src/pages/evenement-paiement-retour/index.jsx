import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { postsApi } from '../../services/api';

const VERT = '#1e2d14';
const OR = '#C8A84B';
const IVOIRE = '#F5F0E8';

export default function EvenementPaiementRetourPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('postId');

  const [statut, setStatut] = useState('verification'); // verification | paye | attente | erreur
  const [tentatives, setTentatives] = useState(0);

  useEffect(function() {
    if (!postId) { setStatut('erreur'); return; }
    let annule = false;

    async function verifier() {
      try {
        const res = await postsApi.getMonInscription(postId);
        const d = (res && res.data) || {};
        if (annule) return;
        if (d.statutPaiement === 'paye_ligne') {
          setStatut('paye');
        } else if (tentatives < 5) {
          setTentatives(function(t) { return t + 1; });
          setTimeout(verifier, 2500);
        } else {
          setStatut('attente');
        }
      } catch (e) {
        if (!annule) setStatut('erreur');
      }
    }
    verifier();

    return function() { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        {statut === 'verification' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: VERT, marginBottom: 8 }}>Verification du paiement...</div>
            <div style={{ fontSize: 13, color: '#7A6E5E' }}>Merci de patienter quelques instants.</div>
          </>
        )}

        {statut === 'paye' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: VERT, marginBottom: 8 }}>Paiement confirme</div>
            <div style={{ fontSize: 13, color: '#7A6E5E', marginBottom: 20 }}>Votre inscription est validee. A bientot pour cet evenement !</div>
            <button onClick={function() { navigate('/'); }} style={{ padding: '10px 24px', background: VERT, color: OR, border: 'none', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Retour au fil
            </button>
          </>
        )}

        {statut === 'attente' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: VERT, marginBottom: 8 }}>Paiement en cours de traitement</div>
            <div style={{ fontSize: 13, color: '#7A6E5E', marginBottom: 20 }}>
              La confirmation prend parfois un peu plus de temps. Verifiez dans "Mon Profil → Inscription" dans quelques minutes.
            </div>
            <button onClick={function() { navigate('/profile'); }} style={{ padding: '10px 24px', background: VERT, color: OR, border: 'none', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Voir mon profil
            </button>
          </>
        )}

        {statut === 'erreur' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: VERT, marginBottom: 8 }}>Impossible de verifier le paiement</div>
            <div style={{ fontSize: 13, color: '#7A6E5E', marginBottom: 20 }}>Verifiez dans "Mon Profil → Inscription", ou contactez la paroisse si le montant a bien ete debite.</div>
            <button onClick={function() { navigate('/'); }} style={{ padding: '10px 24px', background: VERT, color: OR, border: 'none', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Retour au fil
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
