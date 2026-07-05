import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';

const OR     = '#C8A84B';
const VERT   = '#1e2d14';
const IVOIRE = '#F5F0E8';
const BOGOLAN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A84B' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

// Page detail d'un avertissement
function PageDetailAvertissement({ notif, onRetour }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0C0A06', backgroundImage: BOGOLAN, padding: '0 0 90px' }}>
      <div style={{ padding: '44px 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onRetour} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
        </button>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 900, color: IVOIRE }}>
          Detail de l avertissement
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Statut */}
        <div style={{
          background: notif.compteur >= 3 ? 'rgba(192,57,43,0.15)' : 'rgba(200,168,75,0.08)',
          border: '1px solid ' + (notif.compteur >= 3 ? 'rgba(192,57,43,0.4)' : 'rgba(200,168,75,0.3)'),
          borderRadius: 16, padding: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {notif.compteur >= 3 ? '🚫' : '⚠️'}
          </div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: notif.compteur >= 3 ? '#e74c3c' : OR, marginBottom: 8 }}>
            {notif.compteur >= 3 ? 'Commentaires restreints' : 'Commentaire non publie'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.7)', lineHeight: 1.6, fontFamily: 'Georgia,serif' }}>
            {notif.compteur >= 3
              ? 'Suite a plusieurs manquements, votre acces aux commentaires est suspendu pendant 30 jours. Vous pouvez toujours lire, aimer et faire des dons.'
              : 'Votre commentaire a ete bloque car il ne respecte pas les valeurs de la communaute Jangu Bi. Avertissement ' + notif.compteur + ' sur 3.'}
          </div>
          {notif.texte && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 10,
              border: '1px solid rgba(192,57,43,0.3)',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 9, color: 'rgba(245,240,232,0.4)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 4 }}>
                COMMENTAIRE BLOQUE
              </div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.75)', fontFamily: 'Georgia,serif', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{notif.texte}"
              </div>
            </div>
          )}

          <div style={{
            marginTop: 14, display: 'inline-flex', gap: 6, alignItems: 'center',
            background: 'rgba(200,168,75,0.1)', borderRadius: 20, padding: '4px 14px',
          }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i <= notif.compteur ? '#e74c3c' : 'rgba(255,255,255,0.15)',
              }} />
            ))}
            <span style={{ fontSize: 10, color: 'rgba(245,240,232,0.6)', marginLeft: 4 }}>
              {notif.compteur}/3 avertissements
            </span>
          </div>
        </div>

        {/* Regles */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, border: '1px solid rgba(200,168,75,0.1)' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 700, color: OR, marginBottom: 12 }}>
            Regles de la communaute Jangu Bi
          </div>
          {[
            'Respecter la dignite de chaque fidele',
            'Eviter tout langage offensant ou irrespectueux',
            'Ne pas diffuser de fausses informations',
            'Favoriser un esprit de fraternite chretienne',
            'Signaler les contenus inappropries a la paroisse',
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <i className="ti ti-cross" style={{ fontSize: 12, color: OR, marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'rgba(245,240,232,0.75)', fontFamily: 'Georgia,serif', lineHeight: 1.5 }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Citation */}
        <div style={{ background: 'rgba(200,168,75,0.06)', borderRadius: 16, padding: 16, border: '1px solid rgba(200,168,75,0.15)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(245,240,232,0.8)', lineHeight: 1.7 }}>
            "Que votre parole soit toujours bienveillante, assaisonnee de sel, afin que vous sachiez comment repondre a chacun."
          </div>
          <div style={{ fontSize: 10, color: OR, marginTop: 6, fontWeight: 700 }}>Colossiens 4, 6</div>
        </div>

        {notif.compteur < 3 && (
          <button style={{
            background: 'linear-gradient(135deg, #C8A84B, #8B6020)',
            border: 'none', borderRadius: 14, padding: '14px',
            fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: 14, color: VERT,
            cursor: 'pointer', width: '100%',
          }} onClick={onRetour}>
            Je comprends et je m engage
          </button>
        )}
      </div>
    </div>
  );
}

const NOTIFS_BASE = [
  {
    id: 'n1', type: 'don', lu: false, temps: 'Il y a 5 min',
    titre: 'Merci pour votre don',
    message: 'La Paroisse Saint-Pierre vous remercie pour votre don de 5 000 FCFA.',
    icon: '🕯️', couleur: OR,
    route: '/donate',
    description: 'Voir la page des dons',
  },
  {
    id: 'n2', type: 'publication', lu: false, temps: 'Il y a 1h',
    titre: 'Nouvelle publication',
    message: 'Paroisse Sacre-Coeur : Messe de la Nativite - Vendredi 25 a 22h00.',
    icon: '📢', couleur: '#4CAF50',
    route: '/',
    description: 'Voir la publication',
  },
  {
    id: 'n3', type: 'priere', lu: true, temps: 'Il y a 3h',
    titre: 'Rappel de priere',
    message: 'C est l heure des Vepres (18h00). Prenez un moment pour prier.',
    icon: '🙏', couleur: VERT,
    route: '/catechese?tab=prieres&office=auto',
    description: 'Ouvrir l office en cours',
  },
  {
    id: 'n4', type: 'commentaire', lu: true, temps: 'Hier',
    titre: 'Reponse a votre commentaire',
    message: 'Paroisse Notre-Dame a repondu : Merci pour votre fidelite, frere.',
    icon: '💬', couleur: '#1565C0',
    route: '/?openComments=n4',
    description: 'Voir la conversation',
  },
  {
    id: 'n5', type: 'demande', lu: true, temps: 'Hier',
    titre: 'Demande traitee',
    message: 'Votre extrait de bapteme est pret. Recuperez-le en paroisse lundi-vendredi.',
    icon: '📄', couleur: '#7B1FA2',
    route: '/demandes',
    description: 'Voir mes demandes',
  },
  {
    id: 'n6', type: 'story', lu: true, temps: 'Il y a 2 jours',
    titre: 'Nouvelle story',
    message: 'Paroisse Saint-Joseph a partage une nouvelle story.',
    icon: '✨', couleur: '#E65100',
    route: '/',
    description: 'Voir la story',
  },
];

export default function NotificationsPage() {

  // ── Chargement des notifications réelles ─────────────────
  useEffect(() => {
    async function loadNotifs() {
      try {
        const token = localStorage.getItem('jb_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/notifications', {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            // Utiliser les vraies notifications si disponibles
            console.log('Notifications réelles:', data.data.length);
          }
        }
      } catch(e) {
        console.log('Notif API:', e.message);
      }
    }
    loadNotifs();
  }, []);
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [detailAvert, setDetailAvert] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('jb_avertissements') || '[]');
    const avertNotifs = stored.map((a, i) => ({
      id: 'avert_' + i,
      texte: a.texte || null,
      type: 'avertissement',
      lu: false,
      temps: a.temps || 'Recemment',
      titre: 'Commentaire non publie',
      message: a.compteur >= 3
        ? 'Acces aux commentaires suspendu 30 jours.'
        : (a.texte ? '"' + a.texte + '" — Avertissement ' + a.compteur + '/3.' : 'Commentaire bloque. Avertissement ' + a.compteur + '/3.'),
      icon: a.compteur >= 3 ? '🚫' : '⚠️',
      couleur: '#c0392b',
      route: null,
      description: 'Voir pourquoi',
      compteur: a.compteur,
    }));
    setNotifs([...avertNotifs, ...NOTIFS_BASE]);
  }, []);

  const nonLues = notifs.filter(n => !n.lu).length;

  function handleClick(n) {
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, lu: true } : x));
    if (n.type === 'avertissement') {
      setDetailAvert(n);
    } else if (n.route) {
      navigate(n.route);
    }
  }

  function supprimer(id, e) {
    e.stopPropagation();
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  function toutMarquerLu() {
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
  }

  if (detailAvert) {
    return (
      <AppShell hideNav>
        <PageDetailAvertissement notif={detailAvert} onRetour={() => setDetailAvert(null)} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE, backgroundImage: BOGOLAN, paddingBottom: 90 }}>
        <div style={{
          background: '#0C0A06', backgroundImage: BOGOLAN,
          padding: '44px 16px 20px', borderRadius: '0 0 24px 24px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
              </button>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>
                Notifications
              </div>
            </div>
            {nonLues > 0 && (
              <button onClick={toutMarquerLu} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: OR, fontFamily: 'Georgia,serif', fontWeight: 700,
              }}>Tout marquer lu</button>
            )}
          </div>
          {nonLues > 0 && (
            <div style={{
              marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(200,168,75,0.15)', borderRadius: 20, padding: '4px 12px',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: OR }} />
              <span style={{ fontSize: 11, color: OR, fontFamily: 'Georgia,serif' }}>
                {nonLues} nouvelle{nonLues > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifs.map(n => (
            <div key={n.id} onClick={() => handleClick(n)} style={{
              background: n.lu ? 'white' : (n.type === 'avertissement' ? 'rgba(192,57,43,0.05)' : 'rgba(200,168,75,0.06)'),
              borderRadius: 16, padding: '14px 14px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              border: n.lu ? '1px solid rgba(0,0,0,0.05)'
                : n.type === 'avertissement' ? '1px solid rgba(192,57,43,0.3)'
                : '1px solid rgba(200,168,75,0.25)',
              cursor: 'pointer', position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: n.couleur + '18', fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid ' + n.couleur + '30',
              }}>{n.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: n.type === 'avertissement' ? '#c0392b' : VERT, fontFamily: 'Georgia,serif' }}>
                    {n.titre}
                  </div>
                  <button onClick={e => supprimer(n.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', flexShrink: 0 }}>
                    <i className="ti ti-x" style={{ fontSize: 13, color: '#bbb' }} />
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#5A5045', lineHeight: 1.5, fontFamily: 'Georgia,serif' }}>{n.message}</div>
                <div style={{ fontSize: 10, color: OR, marginTop: 5, fontWeight: 700 }}>
                  {n.description} →
                </div>
                <div style={{ fontSize: 10, color: '#9A8E7E', marginTop: 3 }}>{n.temps}</div>
              </div>
              {!n.lu && (
                <div style={{
                  position: 'absolute', top: 14, right: 36,
                  width: 8, height: 8, borderRadius: '50%',
                  background: n.type === 'avertissement' ? '#c0392b' : OR,
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
