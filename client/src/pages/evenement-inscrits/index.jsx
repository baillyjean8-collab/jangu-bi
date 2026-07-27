import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { postsApi } from '../../services/api';

const VERT = '#1e2d14';
const OR = '#C8A84B';
const IVOIRE = '#F5F0E8';

const STATUTS = [
  { id: 'non_requis',    label: 'Gratuit',        color: '#7A6E5E', bg: 'rgba(0,0,0,0.05)' },
  { id: 'en_attente',    label: 'En attente',     color: '#8B6020', bg: 'rgba(200,168,75,0.15)' },
  { id: 'paye_ligne',    label: 'Paye en ligne',  color: '#2e7c2e', bg: 'rgba(46,124,46,0.12)' },
  { id: 'paye_sur_place',label: 'Paye sur place', color: '#2e7c2e', bg: 'rgba(46,124,46,0.12)' },
];

const TRANCHES_LABEL = {
  enfant: 'Enfant',
  adolescent: 'Adolescent',
  adulte: 'Adulte',
  senior: 'Senior',
};

export default function EvenementInscritsPage() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [capacite, setCapacite] = useState(null);
  const [placesRestantes, setPlacesRestantes] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [menuOuvert, setMenuOuvert] = useState(null);

  useEffect(function() {
    async function charger() {
      setLoading(true);
      try {
        const [resPost, resListe] = await Promise.all([
          postsApi.getOne(postId),
          postsApi.getInscriptions(postId),
        ]);
        setPost(resPost && resPost.data && resPost.data.post);
        const d = resListe && resListe.data ? resListe.data : {};
        setInscriptions(d.inscriptions || []);
        setCapacite(d.capacite != null ? d.capacite : null);
        setPlacesRestantes(d.placesRestantes != null ? d.placesRestantes : null);
        setTotal(d.total || 0);
      } catch (e) {
        setErreur(e.message || 'Impossible de charger la liste.');
      } finally {
        setLoading(false);
      }
    }
    charger();
  }, [postId]);

  async function changerStatut(registrationId, statut) {
    setMenuOuvert(null);
    try {
      await postsApi.updateStatutPaiement(registrationId, statut);
      setInscriptions(function(prev) {
        return prev.map(function(ins) {
          return ins._id === registrationId ? Object.assign({}, ins, { statutPaiement: statut }) : ins;
        });
      });
    } catch (e) {
      setErreur(e.message || 'Impossible de mettre a jour le statut.');
    }
  }

  function statutInfo(id) {
    return STATUTS.find(function(s) { return s.id === id; }) || STATUTS[0];
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '44px 16px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: VERT }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: VERT }}>Inscrits a l'evenement</div>
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          {loading && <div style={{ fontSize: 13, color: '#9A8E7E' }}>Chargement...</div>}

          {!loading && post && (
            <>
              <div style={{ fontSize: 13, color: VERT, fontFamily: 'Georgia,serif', marginBottom: 6, lineHeight: 1.4 }}>{post.content}</div>
              <div style={{ fontSize: 11.5, color: '#8B6020', fontWeight: 700, marginBottom: 16 }}>
                {total} personne(s) inscrite(s){capacite != null ? ' sur ' + capacite + ' places (' + placesRestantes + ' restantes)' : ' — places illimitees'}
              </div>
            </>
          )}

          {erreur && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 12, color: '#e53935' }}>
              {erreur}
            </div>
          )}

          {!loading && inscriptions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 16px', fontSize: 13, color: '#9A8E7E' }}>Aucune inscription pour l'instant.</div>
          )}
        </div>

        <div style={{ padding: '0 16px 90px' }}>
          {inscriptions.map(function(ins, idx) {
            const statut = statutInfo(ins.statutPaiement);
            return (
              <div key={ins._id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 10, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9A8E7E' }}>Inscription {idx + 1} — {ins.telephone}</div>
                    <div style={{ fontSize: 9.5, color: '#bbb', marginTop: 2 }}>
                      {ins.createdAt ? new Date(ins.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                  <div
                    onClick={function() { setMenuOuvert(menuOuvert === ins._id ? null : ins._id); }}
                    style={{ fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 10, color: statut.color, background: statut.bg, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {statut.label} <i className="ti ti-chevron-down" style={{ fontSize: 9 }} />
                  </div>
                </div>

                  {(ins.participants || []).map(function(p, pi) {
                  return (
                    <div key={pi} style={{ padding: '8px 10px', background: '#F5F0E8', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: VERT }}>{p.nom}</div>
                      <div style={{ fontSize: 10.5, color: '#7A6E5E', marginTop: 2 }}>
                        {p.parishNom || 'Paroisse non precisee'} · {p.sexe === 'femme' ? 'Femme' : 'Homme'} · {TRANCHES_LABEL[p.trancheAge] || p.trancheAge}
                      </div>
                    </div>
                  );
                })}

                {menuOuvert === ins._id && (
                  <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {STATUTS.map(function(s) {
                      return (
                        <div
                          key={s.id}
                          onClick={function() { changerStatut(ins._id, s.id); }}
                          style={{ fontSize: 11.5, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', color: s.color, background: ins.statutPaiement === s.id ? s.bg : 'transparent', fontWeight: ins.statutPaiement === s.id ? 700 : 400 }}
                        >
                          {s.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
