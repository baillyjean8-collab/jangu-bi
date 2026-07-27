import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { postsApi, parishesApi } from '../../services/api';

const VERT = '#1e2d14';
const OR = '#C8A84B';
const IVOIRE = '#F5F0E8';

const TRANCHES = [
  { id: 'enfant',     label: 'Enfant (0-12 ans)' },
  { id: 'adolescent', label: 'Adolescent (13-17 ans)' },
  { id: 'adulte',     label: 'Adulte (18-59 ans)' },
  { id: 'senior',     label: 'Senior (60 ans et +)' },
];

function nouveauParticipant(nomDefaut, parishIdDefaut, parishNomDefaut, sexeDefaut, trancheDefaut) {
  return {
    nom: nomDefaut || '',
    parishId: parishIdDefaut || '',
    parishNom: parishNomDefaut || '',
    sexe: sexeDefaut || 'homme',
    trancheAge: trancheDefaut || 'adulte',
  };
}

function calculerTrancheAge(dateNaissance) {
  if (!dateNaissance) return 'adulte';
  const naissance = new Date(dateNaissance);
  if (isNaN(naissance.getTime())) return 'adulte';
  const aujourdHui = new Date();
  let age = aujourdHui.getFullYear() - naissance.getFullYear();
  const m = aujourdHui.getMonth() - naissance.getMonth();
  if (m < 0 || (m === 0 && aujourdHui.getDate() < naissance.getDate())) age--;
  if (age <= 12) return 'enfant';
  if (age <= 17) return 'adolescent';
  if (age <= 59) return 'adulte';
  return 'senior';
}

export default function EvenementInscriptionPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dejaInscrit, setDejaInscrit] = useState(false);
  const [placesRestantes, setPlacesRestantes] = useState(null);
  const [autoriserAnnulation, setAutoriserAnnulation] = useState(true);
  const [annulation, setAnnulation] = useState(false);
  const [annule, setAnnule] = useState(false);
  const [telephone, setTelephone] = useState('');
  const [participants, setParticipants] = useState([nouveauParticipant()]);
  const [paroisses, setParoisses] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [success, setSuccess] = useState(false);

    useEffect(function() {
    setTelephone(user?.phone || '');
    const nomDefaut = ((user?.firstName || '') + ' ' + (user?.lastName || '')).trim();
    const parishIdDefaut = user?.parishId || (user?.parish && user.parish._id) || '';
    const parishNomDefaut = (user?.parish && user.parish.name) || '';
    const sexeDefaut = user?.sexe || 'homme';
    const trancheDefaut = calculerTrancheAge(user?.dateNaissance);
    setParticipants([nouveauParticipant(nomDefaut, parishIdDefaut, parishNomDefaut, sexeDefaut, trancheDefaut)]);
  }, [user]);

  useEffect(function() {
    async function chargerParoisses() {
      try {
        const data = await parishesApi.getAll({ limit: 200 });
        const items = data && data.data ? (Array.isArray(data.data) ? data.data : (data.data.items || data.data.data || [])) : [];
        setParoisses(items.map(function(p) { return { id: p._id, nom: p.name }; }));
      } catch (e) {
        console.log('Paroisses:', e.message);
      }
    }
    chargerParoisses();
  }, []);

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
        setAutoriserAnnulation(d.autoriserAnnulation !== false);
      } catch (e) {
        setErreur(e.message || 'Impossible de charger cet evenement.');
      } finally {
        setLoading(false);
      }
    }
    charger();
  }, [postId]);

  function majParticipant(index, champs) {
    setParticipants(function(prev) {
      return prev.map(function(p, i) { return i !== index ? p : Object.assign({}, p, champs); });
    });
  }

  function choisirParoisse(index, parishId) {
    const p = paroisses.find(function(x) { return x.id === parishId; });
    majParticipant(index, { parishId: parishId, parishNom: p ? p.nom : '' });
  }

  function ajouterParticipant() {
    const premier = participants[0];
    setParticipants(function(prev) {
      return prev.concat([nouveauParticipant('', premier ? premier.parishId : '', premier ? premier.parishNom : '')]);
    });
  }

  function retirerParticipant(index) {
    if (participants.length <= 1) return;
    setParticipants(function(prev) { return prev.filter(function(_, i) { return i !== index; }); });
  }

  async function confirmer() {
    if (!telephone.trim()) {
      setErreur('Le numero de telephone est requis.');
      return;
    }
    for (let i = 0; i < participants.length; i++) {
      if (!participants[i].nom.trim()) {
        setErreur('Chaque participant doit avoir un nom (participant ' + (i + 1) + ').');
        return;
      }
    }
    setEnvoi(true);
    setErreur('');
    try {
      await postsApi.inscrireEvenement(postId, {
        telephone: telephone.trim(),
        participants: participants.map(function(p) {
          return { nom: p.nom.trim(), parishId: p.parishId || null, parishNom: p.parishNom, sexe: p.sexe, trancheAge: p.trancheAge };
        }),
      });
      setSuccess(true);
    } catch (e) {
      setErreur(e.message || 'Une erreur est survenue.');
    } finally {
      setEnvoi(false);
    }
  }

  async function annulerInscription() {
    setAnnulation(true);
    setErreur('');
    try {
      await postsApi.annulerInscription(postId);
      setAnnule(true);
      setDejaInscrit(false);
      setTimeout(function() { navigate('/'); }, 1400);
    } catch (e) {
      setErreur(e.message || "Impossible d'annuler l'inscription.");
    } finally {
      setAnnulation(false);
    }
  }

  const complet = placesRestantes === 0;
  const maintenant = new Date();
  const pasEncoreOuvert = post && post.inscriptionDebut && maintenant < new Date(post.inscriptionDebut);
  const ferme = post && post.inscriptionFin && maintenant > new Date(post.inscriptionFin);
  const selectStyle = { width: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '9px 12px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: VERT, background: '#fff' };
  const inputStyle = { width: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '9px 12px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: VERT };
  const labelStyle = { fontSize: 10, color: '#9A8E7E', fontWeight: 700, display: 'block', marginBottom: 4 };

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

              {annule && (
                <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 8 }}>Inscription annulee</div>
                  <div style={{ fontSize: 13, color: '#7A6E5E', marginBottom: 20 }}>Vous pouvez vous reinscrire a tout moment si des places restent disponibles.</div>
                  <button onClick={function() { window.location.reload(); }} style={{ padding: '10px 24px', background: VERT, color: OR, border: 'none', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Retour
                  </button>
                </div>
              )}

              {!success && !annule && dejaInscrit && (
                <div style={{ textAlign: 'center', padding: '20px 16px' }}>
                  <div style={{ fontSize: 13, color: '#3a3a3a', marginBottom: 16 }}>
                    Vous etes deja inscrit(e) a cet evenement.
                  </div>
                  {autoriserAnnulation ? (
                    <button onClick={annulerInscription} disabled={annulation} style={{ padding: '10px 22px', background: 'none', border: '1.5px solid #b71c1c', borderRadius: 999, color: '#b71c1c', fontWeight: 700, fontSize: 12.5, cursor: annulation ? 'default' : 'pointer' }}>
                      {annulation ? 'Annulation...' : 'Annuler mon inscription'}
                    </button>
                  ) : (
                    <div style={{ fontSize: 11.5, color: '#9A8E7E', fontStyle: 'italic' }}>
                      Cette inscription est definitive et ne peut pas etre annulee.
                    </div>
                  )}
                  {erreur && (
                    <div style={{ marginTop: 12, fontSize: 11.5, color: '#e53935' }}>{erreur}</div>
                  )}
                </div>
              )}

              {!success && !annule && !dejaInscrit && pasEncoreOuvert && (
                <div style={{ textAlign: 'center', padding: '30px 16px', fontSize: 13, color: '#8B6020' }}>
                  Les inscriptions ouvriront le {new Date(post.inscriptionDebut).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.
                </div>
              )}

              {!success && !annule && !dejaInscrit && !pasEncoreOuvert && ferme && (
                <div style={{ textAlign: 'center', padding: '30px 16px', fontSize: 13, color: '#b71c1c' }}>
                  Les inscriptions sont closes depuis le {new Date(post.inscriptionFin).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.
                </div>
              )}

              {!success && !annule && !dejaInscrit && !pasEncoreOuvert && !ferme && complet && (
                <div style={{ textAlign: 'center', padding: '30px 16px', fontSize: 13, color: '#b71c1c' }}>
                  Il n'y a plus de places disponibles pour cet evenement.
                </div>
              )}

              {!success && !annule && !dejaInscrit && !pasEncoreOuvert && !ferme && !complet && (
                <>
                  <label style={labelStyle}>Telephone de contact</label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={function(e) { setTelephone(e.target.value); }}
                    style={Object.assign({}, inputStyle, { marginBottom: 18 })}
                  />

                  <div style={{ fontSize: 11, color: '#9A8E7E', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
                    PARTICIPANT(S) — {participants.length}
                  </div>

                  {participants.map(function(p, i) {
                    return (
                      <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: 14, marginBottom: 12, position: 'relative' }}>
                        {participants.length > 1 && (
                          <button onClick={function() { retirerParticipant(i); }} style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', border: 'none', color: '#b71c1c', fontSize: 12, cursor: 'pointer' }}>
                            <i className="ti ti-x" />
                          </button>
                        )}
                        <div style={{ fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 10 }}>Personne {i + 1}</div>

                        <label style={labelStyle}>Nom complet</label>
                        <input
                          type="text"
                          value={p.nom}
                          onChange={function(e) { majParticipant(i, { nom: e.target.value }); }}
                          style={Object.assign({}, inputStyle, { marginBottom: 10 })}
                        />

                        <label style={labelStyle}>Sexe</label>
                        <select
                          value={p.sexe}
                          onChange={function(e) { majParticipant(i, { sexe: e.target.value }); }}
                          style={Object.assign({}, selectStyle, { marginBottom: 10 })}
                        >
                          <option value="homme">Homme</option>
                          <option value="femme">Femme</option>
                        </select>

                        <label style={labelStyle}>Paroisse</label>
                        <select
                          value={p.parishId}
                          onChange={function(e) { choisirParoisse(i, e.target.value); }}
                          style={Object.assign({}, selectStyle, { marginBottom: 10 })}
                        >
                          <option value="">-- Choisir une paroisse --</option>
                          {paroisses.map(function(par) {
                            return <option key={par.id} value={par.id}>{par.nom}</option>;
                          })}
                        </select>

                        <label style={labelStyle}>Tranche d'age</label>
                        <select
                          value={p.trancheAge}
                          onChange={function(e) { majParticipant(i, { trancheAge: e.target.value }); }}
                          style={selectStyle}
                        >
                          {TRANCHES.map(function(t) {
                            return <option key={t.id} value={t.id}>{t.label}</option>;
                          })}
                        </select>
                      </div>
                    );
                  })}

                  <div onClick={ajouterParticipant} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', border: '1.5px dashed rgba(200,168,75,0.4)', borderRadius: 12, color: '#8B6020', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>
                    <i className="ti ti-plus" /> Ajouter une personne
                  </div>

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
