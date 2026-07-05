import { useState } from "react";

// ── Données ───────────────────────────────────────────────────────────────────

const DEMANDES = [
  {
    id: 1,
    auteur: "Marie D.",
    initiales: "MD",
    couleur: "#2d5a3d",
    texte: "Pour la guérison de mon mari hospitalisé depuis 3 semaines. Que le Seigneur lui redonne la santé.",
    date: "Il y a 2h",
    paroisse: "Saint-Pierre de Dakar",
    priant: 47,
    jePrie: false,
    categorie: "Maladie",
  },
  {
    id: 2,
    auteur: "Anonyme",
    initiales: "?",
    couleur: "#7a3a3a",
    texte: "Prière pour retrouver un emploi. Cela fait 8 mois que je cherche, je perds espoir.",
    date: "Il y a 5h",
    paroisse: "Sainte-Thérèse de Fann",
    priant: 23,
    jePrie: true,
    categorie: "Travail",
  },
  {
    id: 3,
    auteur: "Jean-Pierre K.",
    initiales: "JK",
    couleur: "#4a6a9a",
    texte: "Pour mes enfants qui passent leurs examens du baccalauréat cette semaine. Que Dieu les guide.",
    date: "Il y a 8h",
    paroisse: "Saint-Paul de Médina",
    priant: 89,
    jePrie: false,
    categorie: "Famille",
  },
  {
    id: 4,
    auteur: "Fatou S.",
    initiales: "FS",
    couleur: "#6a4a2a",
    texte: "Prière pour la paix dans notre communauté. Que les tensions s'apaisent et que l'amour règne.",
    date: "Il y a 1 jour",
    paroisse: "Cathédrale du Souvenir Africain",
    priant: 134,
    jePrie: true,
    categorie: "Paix",
  },
  {
    id: 5,
    auteur: "Abbé Thomas N.",
    initiales: "TN",
    couleur: "#2d5a3d",
    texte: "Intention particulière pour les âmes du purgatoire et les fidèles défunts de nos paroisses.",
    date: "Il y a 2 jours",
    paroisse: "Diocèse de Dakar",
    priant: 201,
    jePrie: false,
    categorie: "Défunts",
    pretre: true,
  },
];

const CATEGORIES = ["Toutes", "Maladie", "Famille", "Travail", "Paix", "Défunts", "Autre"];

const CATEGORIE_COULEURS = {
  Maladie: "#e53935",
  Famille: "#2d5a3d",
  Travail: "#c8a96e",
  Paix: "#4a6a9a",
  Défunts: "#555",
  Autre: "#888",
};

// ── Composant principal ───────────────────────────────────────────────────────

export default function DemandesPage() {
  const [demandes, setDemandes] = useState(DEMANDES);
  const [filtre, setFiltre] = useState("Toutes");
  const [showFormulaire, setShowFormulaire] = useState(false);
  const [anonyme, setAnonyme] = useState(false);
  const [partager, setPartager] = useState(true);
  const [categorieForm, setCategorieForm] = useState("Famille");
  const [texteForm, setTexteForm] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const demandesFiltrees = filtre === "Toutes"
    ? demandes
    : demandes.filter((d) => d.categorie === filtre);

  const togglePriere = (id) => {
    setDemandes((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, jePrie: !d.jePrie, priant: d.jePrie ? d.priant - 1 : d.priant + 1 }
          : d
      )
    );
  };

  const handleSubmit = () => {
    if (!texteForm.trim()) return;
    const nouvelle = {
      id: Date.now(),
      auteur: anonyme ? "Anonyme" : "Moi",
      initiales: anonyme ? "?" : "M",
      couleur: "#2d5a3d",
      texte: texteForm,
      date: "À l'instant",
      paroisse: "Saint-Pierre de Dakar",
      priant: 0,
      jePrie: false,
      categorie: categorieForm,
    };
    setDemandes((prev) => [nouvelle, ...prev]);
    setTexteForm("");
    setShowFormulaire(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  // ── Écran succès ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0d1f14",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 32, fontFamily: "'Georgia', serif", textAlign: "center",
      }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🕊️</div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
          Intention déposée
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.7, maxWidth: 280 }}>
          Votre intention a été confiée à la communauté. Des frères et sœurs prient déjà avec vous.
        </p>
        <div style={{
          marginTop: 28, background: "rgba(200,169,110,0.1)",
          border: "1px solid rgba(200,169,110,0.3)", borderRadius: 16, padding: 20, maxWidth: 300,
        }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontStyle: "italic", lineHeight: 1.7, margin: 0 }}>
            « Là où deux ou trois se trouvent réunis en mon nom, je suis au milieu d'eux. »
          </p>
          <p style={{ color: "#c8a96e", fontSize: 12, marginTop: 8 }}>Matthieu 18, 20</p>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          style={{
            marginTop: 28, padding: "14px 32px", borderRadius: 14,
            background: "linear-gradient(135deg, #2d5a3d, #1a3a2a)",
            color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}
        >
          Voir les intentions
        </button>
      </div>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────────────────────
  if (showFormulaire) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1f14", fontFamily: "'Georgia', serif" }}>
        <div style={{
          background: "linear-gradient(180deg, #1a3a2a, #0d1f14)",
          padding: "48px 20px 24px",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
        }}>
          <button
            onClick={() => setShowFormulaire(false)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 16 }}
          >
            ← Retour
          </button>
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>
            🕊️ Déposer une intention
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6 }}>
            Confiez votre intention à la communauté en prière.
          </p>
        </div>

        <div style={{ padding: "24px 16px 100px" }}>
          {/* Catégorie */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 10 }}>
              Catégorie
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.filter(c => c !== "Toutes").map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategorieForm(cat)}
                  style={{
                    padding: "8px 14px", borderRadius: 20,
                    border: `1px solid ${categorieForm === cat ? CATEGORIE_COULEURS[cat] || "#c8a96e" : "rgba(255,255,255,0.15)"}`,
                    background: categorieForm === cat ? `${CATEGORIE_COULEURS[cat]}22` || "rgba(200,169,110,0.15)" : "transparent",
                    color: categorieForm === cat ? "#fff" : "rgba(255,255,255,0.4)",
                    fontSize: 13, cursor: "pointer", fontWeight: categorieForm === cat ? 600 : 400,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Texte */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 10 }}>
              Votre intention
            </label>
            <textarea
              value={texteForm}
              onChange={(e) => setTexteForm(e.target.value)}
              placeholder="Écrivez votre intention de prière ici... Soyez aussi précis ou discret que vous le souhaitez."
              rows={6}
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
                padding: 16, color: "#fff", fontSize: 15, lineHeight: 1.7,
                resize: "none", outline: "none", boxSizing: "border-box",
                fontFamily: "'Georgia', serif",
              }}
            />
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "right", marginTop: 4 }}>
              {texteForm.length}/500
            </div>
          </div>

          {/* Options */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: 16, marginBottom: 24,
          }}>
            {[
              { label: "Rester anonyme", desc: "Votre nom ne sera pas affiché", state: anonyme, set: setAnonyme },
              { label: "Partager avec la communauté", desc: "Visible par tous les membres", state: partager, set: setPartager },
            ].map((opt) => (
              <div key={opt.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 14 }}>{opt.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{opt.desc}</div>
                </div>
                <div
                  onClick={() => opt.set(!opt.state)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                    background: opt.state ? "#2d5a3d" : "rgba(255,255,255,0.15)",
                    transition: "background 0.3s", position: "relative", flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3,
                    left: opt.state ? 23 : 3, transition: "left 0.3s",
                  }} />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!texteForm.trim()}
            style={{
              width: "100%", padding: 16, borderRadius: 14,
              background: texteForm.trim()
                ? "linear-gradient(135deg, #c8a96e, #a07840)"
                : "rgba(255,255,255,0.08)",
              color: texteForm.trim() ? "#fff" : "rgba(255,255,255,0.3)",
              border: "none", fontSize: 16, fontWeight: 700, cursor: texteForm.trim() ? "pointer" : "default",
            }}
          >
            🕊️ Déposer l'intention
          </button>
        </div>
      </div>
    );
  }

  // ── Vue principale ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0d1f14", fontFamily: "'Georgia', serif", maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #1a3a2a, #0d1f14)",
        padding: "48px 20px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(200,169,110,0.04)" }} />

        <div style={{ position: "relative" }}>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
            🕊️ Intentions de prière
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 20px" }}>
            {demandes.reduce((s, d) => s + d.priant, 0).toLocaleString()} personnes en prière
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { val: demandes.length, label: "intentions" },
              { val: demandes.filter(d => d.jePrie).length, label: "mes prières" },
              { val: demandes.filter(d => d.categorie === "Maladie").length, label: "malades" },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "10px 8px", textAlign: "center",
              }}>
                <div style={{ color: "#c8a96e", fontSize: 18, fontWeight: 700 }}>{s.val}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bouton déposer */}
      <div style={{ padding: "16px 16px 0" }}>
        <button
          onClick={() => setShowFormulaire(true)}
          style={{
            width: "100%", padding: 16, borderRadius: 14,
            background: "linear-gradient(135deg, #c8a96e, #a07840)",
            color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>🕊️</span>
          Déposer une intention de prière
        </button>
      </div>

      {/* Filtres catégories */}
      <div style={{
        overflowX: "auto", whiteSpace: "nowrap",
        padding: "14px 16px 0", display: "flex", gap: 8,
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltre(cat)}
            style={{
              display: "inline-block",
              padding: "7px 14px", borderRadius: 20,
              border: `1px solid ${filtre === cat ? (CATEGORIE_COULEURS[cat] || "#c8a96e") : "rgba(255,255,255,0.12)"}`,
              background: filtre === cat ? `${CATEGORIE_COULEURS[cat] || "#c8a96e"}22` : "transparent",
              color: filtre === cat ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize: 13, cursor: "pointer", fontWeight: filtre === cat ? 700 : 400,
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Liste des demandes */}
      <div style={{ padding: "16px 16px 100px" }}>
        {demandesFiltrees.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🕊️</div>
            <p>Aucune intention dans cette catégorie</p>
          </div>
        )}

        {demandesFiltrees.map((d) => (
          <div key={d.id} style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${d.jePrie ? "rgba(200,169,110,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 16, padding: 18, marginBottom: 12,
          }}>
            {/* Auteur + meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: `${d.couleur}33`, border: `1px solid ${d.couleur}66`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {d.initiales}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{d.auteur}</span>
                  {d.pretre && (
                    <span style={{
                      background: "rgba(200,169,110,0.2)", color: "#c8a96e",
                      fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>
                      Prêtre
                    </span>
                  )}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
                  {d.paroisse} · {d.date}
                </div>
              </div>
              <div style={{
                background: `${CATEGORIE_COULEURS[d.categorie] || "#888"}22`,
                border: `1px solid ${CATEGORIE_COULEURS[d.categorie] || "#888"}44`,
                color: CATEGORIE_COULEURS[d.categorie] || "#888",
                fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                textTransform: "uppercase", flexShrink: 0,
              }}>
                {d.categorie}
              </div>
            </div>

            {/* Texte intention */}
            <p style={{
              color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.7,
              fontStyle: "italic", margin: "0 0 14px",
              borderLeft: "3px solid rgba(200,169,110,0.3)", paddingLeft: 12,
            }}>
              « {d.texte} »
            </p>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => togglePriere(d.id)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  background: d.jePrie
                    ? "linear-gradient(135deg, rgba(200,169,110,0.25), rgba(200,169,110,0.1))"
                    : "rgba(255,255,255,0.05)",
                  border: d.jePrie ? "1px solid rgba(200,169,110,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  color: d.jePrie ? "#c8a96e" : "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: d.jePrie ? 700 : 400, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <span>{d.jePrie ? "🙏" : "🤲"}</span>
                {d.jePrie ? "Je prie" : "Prier"}
              </button>

              <div style={{
                color: "rgba(255,255,255,0.4)", fontSize: 13,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span>🙏</span>
                <span style={{ fontWeight: 600, color: d.jePrie ? "#c8a96e" : "rgba(255,255,255,0.5)" }}>
                  {d.priant}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Verset de clôture */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, padding: 20, textAlign: "center", marginTop: 8,
        }}>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            ✝ Promesse du Seigneur
          </div>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, fontStyle: "italic", lineHeight: 1.7, margin: "0 0 8px" }}>
            « La prière fervente du juste a une grande efficacité. »
          </p>
          <p style={{ color: "#c8a96e", fontSize: 12, margin: 0 }}>Jacques 5, 16</p>
        </div>
      </div>
    </div>
  );
}
