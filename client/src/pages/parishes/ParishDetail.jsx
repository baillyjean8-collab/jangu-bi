import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from '../../components/AppShell';

const VERT = "#1e2d14";
const OR = "#c8a84b";

const paroisses = [
  { id: 1, nom: "Cathedrale Notre-Dame des Victoires", ville: "Dakar", diocese: "Archidiocese de Dakar", type: "Cathedrale", horaires: "07h - 19h", phone: "+221338890600", distance: "1.2 km", ouvert: true, lat: 14.6937, lng: -17.4441 },
  { id: 2, nom: "Paroisse Sacre-Coeur", ville: "Dakar", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "06h - 20h", phone: "+221338211234", distance: "3.1 km", ouvert: true, lat: 14.6857, lng: -17.4357 },
  { id: 3, nom: "Paroisse Saint-Joseph", ville: "Dakar", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "06h30 - 19h", phone: "+221338221560", distance: "3.5 km", ouvert: true, lat: 14.6877, lng: -17.4420 },
  { id: 4, nom: "Paroisse Sainte-Therese", ville: "Dakar", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "06h - 19h30", phone: "+221338210987", distance: "4.0 km", ouvert: true, lat: 14.6900, lng: -17.4390 },
  { id: 5, nom: "Paroisse Saint-Francois-d'Assise", ville: "Medina, Dakar", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "06h - 19h", phone: "+221338231422", distance: "4.2 km", ouvert: true, lat: 14.6920, lng: -17.4410 },
  { id: 6, nom: "Paroisse Saint-Paul", ville: "Grand Dakar", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "06h - 19h", phone: "+221338241155", distance: "5.0 km", ouvert: true, lat: 14.7150, lng: -17.4450 },
  { id: 7, nom: "Paroisse Saint-Pierre", ville: "Yoff, Dakar", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "06h30 - 19h", phone: "+221338203344", distance: "12.0 km", ouvert: true, lat: 14.7500, lng: -17.4900 },
  { id: 8, nom: "Paroisse Christ-Roi", ville: "HLM, Dakar", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "07h - 19h", phone: "+221338254477", distance: "6.3 km", ouvert: true, lat: 14.7200, lng: -17.4470 },
  { id: 9, nom: "Paroisse Saint-Augustin", ville: "Parcelles Assainies", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "06h - 18h30", phone: "+221338352211", distance: "14.0 km", ouvert: true, lat: 14.7700, lng: -17.4600 },
  { id: 10, nom: "Paroisse Sainte-Marie-Madeleine", ville: "Fann-Residence, Dakar", diocese: "Archidiocese de Dakar", type: "Paroisse", horaires: "06h30 - 19h", phone: "+221338243018", distance: "5.5 km", ouvert: true, lat: 14.6990, lng: -17.4530 },
  { id: 15, nom: "Sanctuaire Notre-Dame de la Delivrande", ville: "Popenguine", diocese: "Archidiocese de Dakar", type: "Sanctuaire", horaires: "07h - 18h", phone: "+221339577102", distance: "78.0 km", ouvert: true, lat: 14.5200, lng: -17.0000 },
  { id: 17, nom: "Abbaye Notre-Dame de Keur Moussa", ville: "Keur Moussa", diocese: "Archidiocese de Dakar", type: "Abbaye", horaires: "06h - 17h", phone: "+221339595262", distance: "40.0 km", ouvert: true, lat: 14.8100, lng: -17.1500 },
  { id: 19, nom: "Cathedrale Sainte-Anne", ville: "Thies", diocese: "Diocese de Thies", type: "Cathedrale", horaires: "07h - 19h", phone: "+221339511022", distance: "70.0 km", ouvert: true, lat: 14.7896, lng: -16.9356 },
  { id: 25, nom: "Cathedrale Saint-Louis", ville: "Saint-Louis", diocese: "Diocese de Saint-Louis", type: "Cathedrale", horaires: "07h - 18h", phone: "+221339611044", distance: "265.0 km", ouvert: true, lat: 16.0179, lng: -16.5017 },
  { id: 35, nom: "Cathedrale Saint-Antoine-de-Padoue", ville: "Ziguinchor", diocese: "Diocese de Ziguinchor", type: "Cathedrale", horaires: "07h - 19h", phone: "+221339911088", distance: "458.0 km", ouvert: true, lat: 12.5602, lng: -16.2730 },
  { id: 44, nom: "Cathedrale Marie Reine de l'Univers", ville: "Tambacounda", diocese: "Diocese de Tambacounda", type: "Cathedrale", horaires: "07h - 18h30", phone: "+221339811022", distance: "468.0 km", ouvert: true, lat: 13.7700, lng: -13.6700 },
];

const PUBLICATIONS_FICTIVES = [
  {
    id: 1,
    auteur: "Pere Jean-Baptiste",
    avatar: "JB",
    date: "Il y a 2 heures",
    contenu: "Chers paroissiens, la messe de dimanche sera celebree a 10h00 suivie d'une agape fraternelle. Venez nombreux !",
    likes: 24,
    commentaires: 5,
    type: "annonce",
  },
  {
    id: 2,
    auteur: "Conseil Paroissial",
    avatar: "CP",
    date: "Il y a 1 jour",
    contenu: "📢 Rappel : La collecte de vetements pour les families dans le besoin se poursuit jusqu'au 15 juin. Deposez vos dons a la sacristie.",
    likes: 41,
    commentaires: 8,
    type: "information",
  },
  {
    id: 3,
    auteur: "Chorale Sainte-Cecile",
    avatar: "CS",
    date: "Il y a 2 jours",
    contenu: "🎵 Repetition de la chorale ce samedi a 15h00 en salle paroissiale. Tous les nouveaux membres sont les bienvenus !",
    likes: 18,
    commentaires: 3,
    type: "evenement",
  },
  {
    id: 4,
    auteur: "Pere Jean-Baptiste",
    avatar: "JB",
    date: "Il y a 3 jours",
    contenu: "Homelie du dimanche : « Vous etes la lumiere du monde » (Mt 5,14). Que notre vie soit un temoignage vivant de la foi chretienne.",
    likes: 67,
    commentaires: 12,
    type: "homelie",
  },
  {
    id: 5,
    auteur: "Mouvement des Jeunes",
    avatar: "MJ",
    date: "Il y a 5 jours",
    contenu: "🙏 Camp de jeunes du 20 au 25 juillet a Popenguine. Inscriptions ouvertes ! Contactez le secretariat paroissial pour plus d'infos.",
    likes: 89,
    commentaires: 21,
    type: "evenement",
  },
];

const MESSES = [
  { jour: "Lundi - Vendredi", heure: "06h30", type: "Messe quotidienne" },
  { jour: "Samedi", heure: "07h00", type: "Messe matinale" },
  { jour: "Samedi", heure: "18h30", type: "Messe vesperale" },
  { jour: "Dimanche", heure: "07h00", type: "1ere messe" },
  { jour: "Dimanche", heure: "09h30", type: "Messe principale" },
  { jour: "Dimanche", heure: "11h00", type: "Messe en français" },
  { jour: "Dimanche", heure: "18h30", type: "Messe du soir" },
];

const typeColor = (type) => {
  switch (type) {
    case "annonce": return { bg: "#e3f2fd", text: "#1565c0", label: "Annonce" };
    case "evenement": return { bg: "#e8f5e9", text: "#2e7d32", label: "Evenement" };
    case "homelie": return { bg: `${OR}20`, text: "#8a6e1e", label: "Homelie" };
    default: return { bg: "#f3e5f5", text: "#6a1b9a", label: "Information" };
  }
};

export default function ParishDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState("publications");
  const [likees, setLikees] = useState([]);
  const [suivie, setSuivie] = useState(false);

  const paroisse = paroisses.find(p => p.id === parseInt(id)) || paroisses[0];

  const toggleLike = (pubId) => {
    setLikees(prev => prev.includes(pubId) ? prev.filter(i => i !== pubId) : [...prev, pubId]);
  };

  const ouvrirItineraire = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${paroisse.lat},${paroisse.lng}`, '_blank');
  };

  const ONGLETS = [
    { id: "publications", label: "Publications" },
    { id: "messes", label: "Horaires messes" },
    { id: "infos", label: "Infos" },
  ];

  return (
    <AppShell>
      <div style={{ background: "#f7f5f0", minHeight: "100vh", paddingBottom: 80 }}>

        {/* HEADER */}
        <div style={{ background: VERT, padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 20, color: "#fff" }} />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: OR, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{paroisse.diocese}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{paroisse.nom}</div>
            </div>
            <button
              onClick={() => setSuivie(p => !p)}
              style={{ background: suivie ? OR : "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: suivie ? VERT : "#fff", fontWeight: 700, fontSize: 12 }}>
              <i className={`ti ${suivie ? "ti-heart-filled" : "ti-heart"}`} style={{ fontSize: 14 }} />
              {suivie ? "Suivi" : "Suivre"}
            </button>
          </div>

          {/* Infos rapides */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-map-pin" style={{ fontSize: 13, color: OR }} />
              <span style={{ fontSize: 12, color: "#fff" }}>{paroisse.ville}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-clock" style={{ fontSize: 13, color: OR }} />
              <span style={{ fontSize: 12, color: "#fff" }}>{paroisse.horaires}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-building-church" style={{ fontSize: 13, color: OR }} />
              <span style={{ fontSize: 12, color: "#fff" }}>{paroisse.type}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={ouvrirItineraire} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <i className="ti ti-map-pin" style={{ fontSize: 16 }} /> Itineraire
            </button>
            <button onClick={() => window.open(`tel:${paroisse.phone}`, '_self')} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <i className="ti ti-phone" style={{ fontSize: 16 }} /> Appeler
            </button>
            <button style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: OR, color: VERT, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <i className="ti ti-hand-finger" style={{ fontSize: 16 }} /> Don
            </button>
          </div>

          {/* Onglets */}
          <div style={{ display: "flex", gap: 0 }}>
            {ONGLETS.map(tab => (
              <button key={tab.id} onClick={() => setOnglet(tab.id)}
                style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 700, color: onglet === tab.id ? OR : "rgba(255,255,255,0.5)", borderBottom: onglet === tab.id ? `2px solid ${OR}` : "2px solid transparent", transition: "all 0.2s" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 16px 0" }}>

          {/* PUBLICATIONS */}
          {onglet === "publications" && (
            <div>
              {PUBLICATIONS_FICTIVES.map(pub => {
                const tc = typeColor(pub.type);
                const estLike = likees.includes(pub.id);
                return (
                  <div key={pub.id} style={{ background: "#fff", borderRadius: 16, marginBottom: 12, border: "1px solid #e8e4dc", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ padding: "14px 14px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: VERT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: OR }}>{pub.avatar}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: VERT }}>{pub.auteur}</div>
                          <div style={{ fontSize: 11, color: "#bbb" }}>{pub.date}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: tc.bg, color: tc.text }}>{tc.label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "#2a2a2a", lineHeight: 1.6 }}>{pub.contenu}</p>
                    </div>
                    <div style={{ display: "flex", borderTop: "1px solid #f0ece4", padding: "8px 14px" }}>
                      <button onClick={() => toggleLike(pub.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: estLike ? "#e53935" : "#999", fontWeight: 600, fontSize: 13 }}>
                        <i className={`ti ${estLike ? "ti-heart-filled" : "ti-heart"}`} style={{ fontSize: 16 }} />
                        {pub.likes + (estLike ? 1 : 0)}
                      </button>
                      <button style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "#999", fontWeight: 600, fontSize: 13 }}>
                        <i className="ti ti-message-circle" style={{ fontSize: 16 }} />
                        {pub.commentaires}
                      </button>
                      <button style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "#999", fontWeight: 600, fontSize: 13 }}>
                        <i className="ti ti-share" style={{ fontSize: 16 }} />
                        Partager
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* HORAIRES MESSES */}
          {onglet === "messes" && (
            <div>
              <div style={{ background: VERT, borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ti ti-clock" style={{ fontSize: 22, color: OR }} />
                <div>
                  <div style={{ color: OR, fontWeight: 700, fontSize: 14 }}>Horaires des messes</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{paroisse.nom}</div>
                </div>
              </div>
              {MESSES.map((m, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 8, border: "1px solid #e8e4dc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: VERT }}>{m.jour}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{m.type}</div>
                  </div>
                  <div style={{ background: OR, color: VERT, fontWeight: 800, fontSize: 14, padding: "6px 14px", borderRadius: 10 }}>{m.heure}</div>
                </div>
              ))}
            </div>
          )}

          {/* INFOS */}
          {onglet === "infos" && (
            <div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "16px", border: "1px solid #e8e4dc", marginBottom: 12 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: VERT }}>Informations generales</h3>
                {[
                  { icon: "ti-building-church", label: "Type", valeur: paroisse.type },
                  { icon: "ti-map-pin", label: "Ville", valeur: paroisse.ville },
                  { icon: "ti-bible", label: "Diocese", valeur: paroisse.diocese },
                  { icon: "ti-clock", label: "Horaires d'ouverture", valeur: paroisse.horaires },
                  { icon: "ti-phone", label: "Telephone", valeur: paroisse.phone },
                  { icon: "ti-walk", label: "Distance", valeur: paroisse.distance },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < 5 ? "1px solid #f0ece4" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${VERT}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: VERT }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#bbb", marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#2a2a2a" }}>{item.valeur}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: "16px", border: "1px solid #e8e4dc" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: VERT }}>Groupes et mouvements</h3>
                {["Chorale Sainte-Cecile", "Mouvement des Jeunes Catholiques", "Legion de Marie", "Confrerie du Saint-Sacrement", "Caritas Paroissiale"].map((g, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: i < 4 ? "1px solid #f0ece4" : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: OR, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#2a2a2a" }}>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
