import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout';

const VERT = '#1e2d14';
const OR   = '#c8a84b';
const CREME = '#f5f3ee';

const ONGLETS = [
  { id: 'annonces',   label: 'Annonces',   icon: '📢' },
  { id: 'calendrier', label: 'Calendrier', icon: '📅' },
  { id: 'loisirs',    label: 'Loisirs',    icon: '🎉' },
];

const CATEGORIES = [
  { id: 'tous',       label: 'Tous',       color: VERT },
  { id: 'messe',      label: 'Messe',      color: '#2e7d32' },
  { id: 'catechese',  label: 'Catéchèse',  color: '#1565c0' },
  { id: 'reunion',    label: 'Réunion',    color: '#6a1b9a' },
  { id: 'evenement',  label: 'Événement',  color: '#c62828' },
  { id: 'don',        label: 'Don',        color: '#e65100' },
];

const ANNONCES = [
  {
    id: 1, categorie: 'messe',
    titre: 'Messes dominicales et Horaires',
    paroisse: 'Sacré-Cœur – Dakar',
    texte: 'La messe des jeunes aura lieu ce dimanche à 09h00. La grande messe solennelle de la communauté suivra à 11h00. Venez nombreux en famille !',
    date: 'Dimanche 25 Mai', urgent: false,
    icon: '⛪', rappels: 142,
  },
  {
    id: 2, categorie: 'catechese',
    titre: 'Inscriptions au Catéchisme 2026',
    paroisse: 'St Joseph – Dakar',
    texte: 'Les réinscriptions et nouvelles inscriptions pour le parcours de première communion et de confirmation sont ouvertes au secrétariat paroissial tous les après-midis.',
    date: 'Lundi 26 Mai', urgent: true,
    icon: '📖', rappels: 89,
  },
  {
    id: 3, categorie: 'reunion',
    titre: 'Réunion des Conseils Paroissiaux',
    paroisse: 'St Pierre – Ziguinchor',
    texte: 'Le conseil pastoral et le comité économique sont convoqués ce samedi à 16h00 dans la grande salle de réunion pour faire le bilan du trimestre.',
    date: 'Samedi 31 Mai', urgent: false,
    icon: '👥', rappels: 34,
  },
  {
    id: 4, categorie: 'evenement',
    titre: 'Fête de la Pentecôte',
    paroisse: 'Cathédrale – Saint-Louis',
    texte: 'Célébration solennelle de la Pentecôte avec procession, chants liturgiques et agape fraternelle après la messe de 10h00.',
    date: 'Dimanche 8 Juin', urgent: false,
    icon: '🕊️', rappels: 203,
  },
  {
    id: 5, categorie: 'don',
    titre: 'Collecte pour la rénovation de l\'église',
    paroisse: 'Notre-Dame – Thiès',
    texte: 'Une collecte spéciale est organisée pour financer la rénovation du toit de notre église. Chaque contribution compte, grande ou petite.',
    date: 'Tout le mois de Juin', urgent: false,
    icon: '🙏', rappels: 67,
  },
  {
    id: 6, categorie: 'messe',
    titre: 'Messe de la Fête-Dieu',
    paroisse: 'Sacré-Cœur – Dakar',
    texte: 'Grande procession eucharistique dans les rues du quartier suivie d\'une messe solennelle. Portez vos plus beaux vêtements liturgiques.',
    date: 'Dimanche 22 Juin', urgent: false,
    icon: '✝️', rappels: 178,
  },
];

const CALENDRIER = [
  { date: '25 Mai', jour: 'Dim', titre: 'Solennité de la Pentecôte', type: 'Solennité', couleur: '#c62828' },
  { date: '26 Mai', jour: 'Lun', titre: 'Lundi de Pentecôte', type: 'Fête', couleur: '#1565c0' },
  { date: '29 Mai', jour: 'Jeu', titre: 'Saint Maximin de Trèves', type: 'Mémoire', couleur: '#2e7d32' },
  { date: '1 Jun',  jour: 'Dim', titre: 'La Très Sainte Trinité', type: 'Solennité', couleur: '#c62828' },
  { date: '8 Jun',  jour: 'Dim', titre: 'Fête-Dieu (Corpus Christi)', type: 'Solennité', couleur: '#c62828' },
  { date: '13 Jun', jour: 'Ven', titre: 'Saint Antoine de Padoue', type: 'Mémoire', couleur: '#2e7d32' },
  { date: '22 Jun', jour: 'Dim', titre: 'Naissance de Saint Jean-Baptiste', type: 'Solennité', couleur: '#c62828' },
  { date: '29 Jun', jour: 'Dim', titre: 'Saints Pierre et Paul', type: 'Solennité', couleur: '#c62828' },
];

const LOISIRS = [
  {
    titre: 'Tournoi de football inter-paroisses',
    lieu: 'Stade Municipal – Dakar',
    date: 'Samedi 7 Juin – 09h00',
    description: 'Compétition sportive fraternelle entre 8 paroisses de l\'archidiocèse. Inscription des équipes avant le 1er juin.',
    icon: '⚽', places: 'Gratuit',
  },
  {
    titre: 'Retraite spirituelle des jeunes',
    lieu: 'Centre Keur Moussa',
    date: '13-15 Juin 2026',
    description: 'Weekend de ressourcement spirituel pour les 18-35 ans. Thème : "Appelés à témoigner". Animé par les Pères Jésuites.',
    icon: '🕊️', places: '40 places',
  },
  {
    titre: 'Pèlerinage à Popenguine',
    lieu: 'Sanctuaire Notre-Dame – Popenguine',
    date: 'Lundi 26 Mai 2026',
    description: 'Pèlerinage annuel de Pentecôte. Départ en bus depuis la cathédrale à 05h30. Inscription obligatoire au secrétariat.',
    icon: '🚌', places: '120 places',
  },
  {
    titre: 'Concert de Gospel et Louange',
    lieu: 'Cathédrale Notre-Dame – Dakar',
    date: 'Vendredi 20 Juin – 19h30',
    description: 'Soirée de louange et adoration animée par la chorale diocésaine et des artistes gospel. Entrée libre.',
    icon: '🎵', places: 'Entrée libre',
  },
];

const catColor = (cat) => CATEGORIES.find(c => c.id === cat)?.color || VERT;
const catLabel = (cat) => CATEGORIES.find(c => c.id === cat)?.label || cat;

export default function AnnoncesPage() {
  const navigate = useNavigate();
  const [onglet, setOnglet]       = useState('annonces');
  const [categorie, setCategorie] = useState('tous');
  const [rappels, setRappels]     = useState({});

  const filtrees = ANNONCES.filter(a => categorie === 'tous' || a.categorie === categorie);

  function toggleRappel(id) {
    setRappels(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <AppShell>
      <div style={{ background: CREME, minHeight: '100vh' }}>

        {/* HEADER */}
        <div style={{ background: '#fff', borderBottom: `1px solid #e4e4e7`, padding: '16px 16px 0', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>📢</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: VERT }}>Annonces</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#71717A' }}>Messes, événements et calendrier liturgique</p>
            </div>
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <div style={{ background: VERT, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: 16 }}>🔔</span>
              </div>
              <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, background: '#e05050', borderRadius: '50%', border: '2px solid #fff' }} />
            </div>
          </div>

          {/* ONGLETS */}
          <div style={{ display: 'flex', gap: 4 }}>
            {ONGLETS.map(tab => (
              <button key={tab.id} onClick={() => setOnglet(tab.id)} style={{
                flex: 1, padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: onglet === tab.id ? `3px solid ${OR}` : '3px solid transparent',
                color: onglet === tab.id ? VERT : '#71717A',
                fontWeight: onglet === tab.id ? 800 : 500,
                fontSize: 13, fontFamily: 'sans-serif',
                transition: 'all 0.2s',
              }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ONGLET ANNONCES ── */}
        {onglet === 'annonces' && (
          <div style={{ padding: 16 }}>

            {/* Filtres catégories */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategorie(cat.id)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: categorie === cat.id ? cat.color : '#fff',
                  color: categorie === cat.id ? '#fff' : '#555',
                  fontWeight: categorie === cat.id ? 700 : 500,
                  fontSize: 12, whiteSpace: 'nowrap',
                  border: `1px solid ${categorie === cat.id ? cat.color : '#e4e4e7'}`,
                  transition: 'all 0.2s',
                }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Liste annonces */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtrees.map(a => (
                <div key={a.id} style={{
                  background: '#fff', borderRadius: 16,
                  border: `1px solid #e4e4e7`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                }}>
                  {a.urgent && (
                    <div style={{ background: '#fff3cd', padding: '6px 14px', fontSize: 11, fontWeight: 700, color: '#856404', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⚡ Annonce urgente
                    </div>
                  )}
                  <div style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: `${catColor(a.categorie)}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      }}>
                        {a.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: VERT, lineHeight: 1.3 }}>{a.titre}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: '#71717A' }}>{a.paroisse}</p>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
                        background: `${catColor(a.categorie)}15`,
                        color: catColor(a.categorie),
                        border: `1px solid ${catColor(a.categorie)}30`,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {catLabel(a.categorie)}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#374151', lineHeight: 1.55 }}>
                      {a.texte}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#71717A' }}>
                        <span>📅</span>
                        <span style={{ fontWeight: 600 }}>{a.date}</span>
                      </div>
                      <button onClick={() => toggleRappel(a.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: rappels[a.id] ? OR : VERT,
                        color: rappels[a.id] ? VERT : OR,
                        fontWeight: 700, fontSize: 12,
                        transition: 'all 0.2s',
                      }}>
                        {rappels[a.id] ? '✓ Rappel activé' : '🔔 Rappel'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 80 }} />
          </div>
        )}

        {/* ── ONGLET CALENDRIER ── */}
        {onglet === 'calendrier' && (
          <div style={{ padding: 16 }}>
            <div style={{ background: VERT, borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>⛪</span>
              <div>
                <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 13 }}>Calendrier liturgique</p>
                <p style={{ margin: 0, color: OR, fontSize: 11 }}>Temps ordinaire — Année B</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CALENDRIER.map((item, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 14,
                  border: '1px solid #e4e4e7',
                  padding: 14, display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: `${item.couleur}15`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: item.couleur, textTransform: 'uppercase' }}>{item.jour}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: item.couleur, lineHeight: 1 }}>{item.date.split(' ')[0]}</span>
                    <span style={{ fontSize: 9, color: item.couleur }}>{item.date.split(' ')[1]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: VERT }}>{item.titre}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: `${item.couleur}15`, color: item.couleur,
                    }}>
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 80 }} />
          </div>
        )}

        {/* ── ONGLET LOISIRS ── */}
        {onglet === 'loisirs' && (
          <div style={{ padding: 16 }}>
            <div style={{ background: VERT, borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 13 }}>Activités & Événements</p>
                <p style={{ margin: 0, color: OR, fontSize: 11 }}>Sport, retraites, pèlerinages, concerts</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {LOISIRS.map((item, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 16,
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: `${OR}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: VERT }}>{item.titre}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#71717A' }}>📍 {item.lieu}</p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 10,
                      background: `${VERT}15`, color: VERT, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {item.places}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#374151', lineHeight: 1.55 }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#71717A', fontWeight: 600 }}>
                      <span>🗓️</span> {item.date}
                    </div>
                    <button style={{
                      padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: VERT, color: OR, fontWeight: 700, fontSize: 12,
                    }}>
                      S'inscrire →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 80 }} />
          </div>
        )}

      </div>
    </AppShell>
  );
}
