import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppShell from "../../components/AppShell";

const VERT  = "#1e2d14";
const OR    = "#c8a84b";
const CREME = "#f5f5f0";
const BOGOLAN = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';

const LANGUES = [
  { code: "fr",    nom: "Français",   flag: "🇫🇷", speechLang: "fr-FR" },
  { code: "en",    nom: "Anglais",    flag: "🇬🇧", speechLang: "en-US" },
  { code: "es",    nom: "Espagnol",   flag: "🇪🇸", speechLang: "es-ES" },
  { code: "pt",    nom: "Portugais",  flag: "🇵🇹", speechLang: "pt-PT" },
  { code: "it",    nom: "Italien",    flag: "🇮🇹", speechLang: "it-IT" },
  { code: "wo",    nom: "Wolof",     flag: "🇸🇳", speechLang: "fr-FR" },
  { code: "sw",    nom: "Swahili",    flag: "🇰🇪", speechLang: "sw-KE" },
  { code: "ha",    nom: "Haoussa",    flag: "🇳🇬", speechLang: "ha-NG" },
  { code: "yo",    nom: "Yoruba",     flag: "🇳🇬", speechLang: "yo-NG" },
  { code: "am",    nom: "Amharique",  flag: "🇪🇹", speechLang: "am-ET" },
  { code: "ln",    nom: "Lingala",    flag: "🇨🇩", speechLang: "fr-FR" },
  { code: "zu",    nom: "Zulu",       flag: "🇿🇦", speechLang: "zu-ZA" },
  { code: "tw",    nom: "Twi",        flag: "🇬🇭", speechLang: "ak-GH" },
];

const LIVRES = [
  { id: "Gn",   nom: "Genèse",            testament: "Ancien Testament", chapitres: 50  },
  { id: "Ex",   nom: "Exode",             testament: "Ancien Testament", chapitres: 40  },
  { id: "Lv",   nom: "Lévitique",         testament: "Ancien Testament", chapitres: 27  },
  { id: "Nb",   nom: "Nombres",           testament: "Ancien Testament", chapitres: 36  },
  { id: "Dt",   nom: "Deutéronome",       testament: "Ancien Testament", chapitres: 34  },
  { id: "Jos",  nom: "Josué",             testament: "Ancien Testament", chapitres: 24  },
  { id: "Jg",   nom: "Juges",             testament: "Ancien Testament", chapitres: 21  },
  { id: "Rt",   nom: "Ruth",              testament: "Ancien Testament", chapitres: 4   },
  { id: "1S",   nom: "1 Samuel",          testament: "Ancien Testament", chapitres: 31  },
  { id: "2S",   nom: "2 Samuel",          testament: "Ancien Testament", chapitres: 24  },
  { id: "1R",   nom: "1 Rois",            testament: "Ancien Testament", chapitres: 22  },
  { id: "2R",   nom: "2 Rois",            testament: "Ancien Testament", chapitres: 25  },
  { id: "1Ch",  nom: "1 Chroniques",      testament: "Ancien Testament", chapitres: 29  },
  { id: "2Ch",  nom: "2 Chroniques",      testament: "Ancien Testament", chapitres: 36  },
  { id: "Esd",  nom: "Esdras",            testament: "Ancien Testament", chapitres: 10  },
  { id: "Ne",   nom: "Néhémie",           testament: "Ancien Testament", chapitres: 13  },
  { id: "Tb",   nom: "Tobie",             testament: "Ancien Testament", chapitres: 14  },
  { id: "Jdt",  nom: "Judith",            testament: "Ancien Testament", chapitres: 16  },
  { id: "Est",  nom: "Esther",            testament: "Ancien Testament", chapitres: 10  },
  { id: "1M",   nom: "1 Maccabées",       testament: "Ancien Testament", chapitres: 16  },
  { id: "2M",   nom: "2 Maccabées",       testament: "Ancien Testament", chapitres: 15  },
  { id: "Jb",   nom: "Job",               testament: "Ancien Testament", chapitres: 42  },
  { id: "Ps",   nom: "Psaumes",           testament: "Ancien Testament", chapitres: 150 },
  { id: "Pr",   nom: "Proverbes",         testament: "Ancien Testament", chapitres: 31  },
  { id: "Qo",   nom: "Qohéleth",          testament: "Ancien Testament", chapitres: 12  },
  { id: "Ct",   nom: "Cantique",          testament: "Ancien Testament", chapitres: 8   },
  { id: "Sg",   nom: "Sagesse",           testament: "Ancien Testament", chapitres: 19  },
  { id: "Si",   nom: "Siracide",          testament: "Ancien Testament", chapitres: 51  },
  { id: "Is",   nom: "Isaïe",             testament: "Ancien Testament", chapitres: 66  },
  { id: "Jr",   nom: "Jérémie",           testament: "Ancien Testament", chapitres: 52  },
  { id: "Lm",   nom: "Lamentations",      testament: "Ancien Testament", chapitres: 5   },
  { id: "Ba",   nom: "Baruch",            testament: "Ancien Testament", chapitres: 6   },
  { id: "Ez",   nom: "Ézéchiel",          testament: "Ancien Testament", chapitres: 48  },
  { id: "Dn",   nom: "Daniel",            testament: "Ancien Testament", chapitres: 14  },
  { id: "Os",   nom: "Osée",              testament: "Ancien Testament", chapitres: 14  },
  { id: "Jl",   nom: "Joël",              testament: "Ancien Testament", chapitres: 4   },
  { id: "Am",   nom: "Amos",              testament: "Ancien Testament", chapitres: 9   },
  { id: "Ab",   nom: "Abdias",            testament: "Ancien Testament", chapitres: 1   },
  { id: "Jon",  nom: "Jonas",             testament: "Ancien Testament", chapitres: 4   },
  { id: "Mi",   nom: "Michée",            testament: "Ancien Testament", chapitres: 7   },
  { id: "Na",   nom: "Nahum",             testament: "Ancien Testament", chapitres: 3   },
  { id: "Ha",   nom: "Habacuc",           testament: "Ancien Testament", chapitres: 3   },
  { id: "So",   nom: "Sophonie",          testament: "Ancien Testament", chapitres: 3   },
  { id: "Ag",   nom: "Aggée",             testament: "Ancien Testament", chapitres: 2   },
  { id: "Za",   nom: "Zacharie",          testament: "Ancien Testament", chapitres: 14  },
  { id: "Ml",   nom: "Malachie",          testament: "Ancien Testament", chapitres: 3   },
  { id: "Mt",   nom: "Matthieu",          testament: "Nouveau Testament", chapitres: 28 },
  { id: "Mc",   nom: "Marc",              testament: "Nouveau Testament", chapitres: 16 },
  { id: "Lc",   nom: "Luc",               testament: "Nouveau Testament", chapitres: 24 },
  { id: "Jn",   nom: "Jean",              testament: "Nouveau Testament", chapitres: 21 },
  { id: "Ac",   nom: "Actes",             testament: "Nouveau Testament", chapitres: 28 },
  { id: "Rm",   nom: "Romains",           testament: "Nouveau Testament", chapitres: 16 },
  { id: "1Co",  nom: "1 Corinthiens",     testament: "Nouveau Testament", chapitres: 16 },
  { id: "2Co",  nom: "2 Corinthiens",     testament: "Nouveau Testament", chapitres: 13 },
  { id: "Ga",   nom: "Galates",           testament: "Nouveau Testament", chapitres: 6  },
  { id: "Ep",   nom: "Éphésiens",         testament: "Nouveau Testament", chapitres: 6  },
  { id: "Ph",   nom: "Philippiens",       testament: "Nouveau Testament", chapitres: 4  },
  { id: "Col",  nom: "Colossiens",        testament: "Nouveau Testament", chapitres: 4  },
  { id: "1Th",  nom: "1 Thessaloniciens", testament: "Nouveau Testament", chapitres: 5  },
  { id: "2Th",  nom: "2 Thessaloniciens", testament: "Nouveau Testament", chapitres: 3  },
  { id: "1Tm",  nom: "1 Timothée",        testament: "Nouveau Testament", chapitres: 6  },
  { id: "2Tm",  nom: "2 Timothée",        testament: "Nouveau Testament", chapitres: 4  },
  { id: "Tt",   nom: "Tite",              testament: "Nouveau Testament", chapitres: 3  },
  { id: "Phm",  nom: "Philémon",          testament: "Nouveau Testament", chapitres: 1  },
  { id: "He",   nom: "Hébreux",           testament: "Nouveau Testament", chapitres: 13 },
  { id: "Jc",   nom: "Jacques",           testament: "Nouveau Testament", chapitres: 5  },
  { id: "1P",   nom: "1 Pierre",          testament: "Nouveau Testament", chapitres: 5  },
  { id: "2P",   nom: "2 Pierre",          testament: "Nouveau Testament", chapitres: 3  },
  { id: "1Jn",  nom: "1 Jean",            testament: "Nouveau Testament", chapitres: 5  },
  { id: "2Jn",  nom: "2 Jean",            testament: "Nouveau Testament", chapitres: 1  },
  { id: "3Jn",  nom: "3 Jean",            testament: "Nouveau Testament", chapitres: 1  },
  { id: "Jude", nom: "Jude",              testament: "Nouveau Testament", chapitres: 1  },
  { id: "Ap",   nom: "Apocalypse",        testament: "Nouveau Testament", chapitres: 22 },
];

function lireVerset(texte, speechLang) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = speechLang;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function VueLivres({ onSelectLivre, recherche, setRecherche }) {
  const testaments = ["Ancien Testament", "Nouveau Testament"];
  const filtres = LIVRES.filter(l =>
    l.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    l.id.toLowerCase().includes(recherche.toLowerCase())
  );
  const testamentsFiltres = testaments.filter(t => filtres.some(l => l.testament === t));

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#fff", borderRadius: 12, padding: "10px 14px",
        border: "1px solid #e4e4e7", marginBottom: 16,
      }}>
        <i className="ti ti-search" style={{ fontSize: 16, color: "#999" }} />
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher un livre..."
          style={{
            border: "none", outline: "none", fontSize: 14,
            fontFamily: "sans-serif", color: "#1a1a1a",
            background: "transparent", flex: 1,
          }}
        />
        {recherche && (
          <span onClick={() => setRecherche("")} style={{ cursor: "pointer", color: "#999", fontSize: 18 }}>×</span>
        )}
      </div>
      {testamentsFiltres.map(testament => (
        <div key={testament} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ height: 2, width: 20, background: OR, borderRadius: 2 }} />
            <h3 style={{
              margin: 0, fontSize: 11, fontWeight: 800, color: VERT,
              textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "sans-serif",
            }}>{testament}</h3>
            <div style={{ flex: 1, height: 2, background: "#e4e4e7", borderRadius: 2 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {filtres.filter(l => l.testament === testament).map(livre => (
              <div key={livre.id}
                onClick={() => onSelectLivre(livre)}
                style={{
                  background: "#fff", borderRadius: 12, padding: "10px 8px",
                  border: "1px solid #e4e4e7", cursor: "pointer", textAlign: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = OR}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e4e4e7"}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: OR, fontFamily: "sans-serif", marginBottom: 3 }}>
                  {livre.id}
                </div>
                <div style={{ fontSize: 11, color: VERT, fontFamily: "sans-serif", lineHeight: 1.3 }}>
                  {livre.nom}
                </div>
                <div style={{ fontSize: 10, color: "#bbb", fontFamily: "sans-serif", marginTop: 3 }}>
                  {livre.chapitres} ch.
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VueChapitres({ livre, onSelectChapitre, onRetour }) {
  return (
    <div>
      <button onClick={onRetour} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        color: VERT, fontWeight: 700, fontSize: 14,
        fontFamily: "sans-serif", marginBottom: 16, padding: 0,
      }}>
        <i className="ti ti-arrow-left" style={{ fontSize: 18, color: OR }} />
        Retour aux livres
      </button>
      <div style={{
        background: VERT, borderRadius: 14, padding: "14px 16px",
        marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
      }}>
        <i className="ti ti-book" style={{ fontSize: 22, color: OR }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "sans-serif" }}>
            {livre.nom}
          </div>
          <div style={{ fontSize: 11, color: OR, fontFamily: "sans-serif" }}>
            {livre.chapitres} chapitres · {livre.testament}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {Array.from({ length: livre.chapitres }, (_, i) => i + 1).map(ch => (
          <div key={ch}
            onClick={() => onSelectChapitre(ch)}
            style={{
              background: "#fff", borderRadius: 10,
              border: "1px solid #e4e4e7", padding: "12px 0",
              textAlign: "center", cursor: "pointer",
              fontSize: 15, fontWeight: 700, color: VERT,
              fontFamily: "sans-serif", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = OR; e.currentTarget.style.color = VERT; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = VERT; }}
          >
            {ch}
          </div>
        ))}
      </div>
    </div>
  );
}

function VueTexte({ livre, chapitre, onRetour, onChangerChapitre }) {
  const [versets, setVersets] = useState([]);
  const [versetsTrads, setVersetsTrads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrad, setLoadingTrad] = useState(false);
  const [erreur, setErreur] = useState(false);
  const [langue, setLangue] = useState("fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [versetLu, setVersetLu] = useState(null);
  const [lecture, setLecture] = useState(false);

  const langueObj = LANGUES.find(l => l.code === langue) || LANGUES[0];

  useEffect(() => {
    setLoading(true);
    setErreur(false);
    setVersets([]);
    setVersetsTrads([]);
    setLangue("fr");

    async function charger() {
      try {
        const idMap = {
          "Gn":"gn","Ex":"ex","Lv":"lv","Nb":"nm","Dt":"dt","Jos":"js","Jg":"jdg",
          "Rt":"ru","1S":"1sm","2S":"2sm","1R":"1ki","2R":"2ki","1Ch":"1ch","2Ch":"2ch",
          "Esd":"ezr","Ne":"ne","Est":"es","Jb":"job","Ps":"ps","Pr":"pr","Qo":"ec",
          "Ct":"so","Is":"is","Jr":"je","Lm":"la","Ez":"eze","Dn":"da","Os":"ho",
          "Jl":"joe","Am":"am","Ab":"ob","Jon":"jon","Mi":"mic","Na":"na","Ha":"hab",
          "So":"zep","Ag":"hag","Za":"zec","Ml":"mal","Mt":"mt","Mc":"mr","Lc":"lu",
          "Jn":"joh","Ac":"ac","Rm":"ro","1Co":"1co","2Co":"2co","Ga":"ga","Ep":"eph",
          "Ph":"php","Col":"col","1Th":"1th","2Th":"2th","1Tm":"1ti","2Tm":"2ti",
          "Tt":"tit","Phm":"phm","He":"heb","Jc":"jas","1P":"1pe","2P":"2pe",
          "1Jn":"1jo","2Jn":"2jo","3Jn":"3jo","Jude":"jude","Ap":"re"
        };
        const apiId = idMap[livre.id] || livre.id.toLowerCase();
        const url = `https://raw.githubusercontent.com/MaatheusGois/bible/main/versions/fr/apee/${apiId}/${apiId}.json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Livre non disponible");
        const data = await res.json();
        const chapData = data.chapters[chapitre - 1];
        if (!chapData || chapData.length === 0) throw new Error("Chapitre vide");
        const vs = chapData.map((texte, i) => ({ num: i + 1, texte }));
        setVersets(vs);
        setLoading(false);
      } catch (err) {
        setErreur(true);
        setLoading(false);
      }
    }
    charger();
  }, [livre.id, chapitre]);

  async function traduire(codeLangue) {
    if (codeLangue === "fr") {
      setVersetsTrads([]);
      setLangue("fr");
      setShowLangMenu(false);
      return;
    }
    setLoadingTrad(true);
    setShowLangMenu(false);
    setLangue(codeLangue);
    try {
      const traductions = await Promise.all(
        versets.map(async v => {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${codeLangue}&dt=t&q=${encodeURIComponent(v.texte)}`);
          const data = await res.json();
          return { num: v.num, texte: data[0].map(x=>x[0]).join("") || v.texte };
        })
      );
      setVersetsTrads(traductions);
    } catch {
      setVersetsTrads([]);
    }
    setLoadingTrad(false);
  }

  function parler(texte, lang, onEnd) {
    window.speechSynthesis.cancel();
    const lancer = () => {
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = lang;
      u.rate = 0.85;
      if (onEnd) u.onend = onEnd;
      window.speechSynthesis.speak(u);
    };
    const voix = window.speechSynthesis.getVoices();
    if (voix.length === 0) {
      window.speechSynthesis.onvoiceschanged = lancer;
      window.speechSynthesis.getVoices();
    } else {
      setTimeout(lancer, 100);
    }
  }

  function lire(texte, num) {
    if (versetLu === num) {
      window.speechSynthesis.cancel();
      setVersetLu(null);
      setLecture(false);
      return;
    }
    window.speechSynthesis.cancel();
    setVersetLu(num);
    setLecture(true);
    parler(texte, langueObj.speechLang, () => { setVersetLu(null); setLecture(false); });
  }

  function lireTout() {
    window.speechSynthesis.cancel();
    if (lecture) { setLecture(false); setVersetLu(null); return; }
    const vs = versetsTrads.length ? versetsTrads : versets;
    const texteComplet = vs.map(v => v.texte).join(". ");
    setLecture(true);
    parler(texteComplet, langueObj.speechLang, () => { setLecture(false); setVersetLu(null); });
  }

  const versetsAffiches = versetsTrads.length ? versetsTrads : versets;

  return (
    <div>
      <button onClick={onRetour} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        color: VERT, fontWeight: 700, fontSize: 14,
        fontFamily: "sans-serif", marginBottom: 16, padding: 0,
      }}>
        <i className="ti ti-arrow-left" style={{ fontSize: 18, color: OR }} />
        {livre.nom}
      </button>

      {/* Header chapitre */}
      <div style={{
        background: VERT, borderRadius: 14, padding: "14px 16px",
        marginBottom: 12, display: "flex", alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "sans-serif" }}>
            {livre.nom}
          </div>
          <div style={{ fontSize: 13, color: OR, fontFamily: "sans-serif" }}>
            Chapitre {chapitre}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {chapitre > 1 && (
            <button onClick={() => onChangerChapitre(chapitre - 1)} style={{
              background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: 8, padding: "6px 10px", color: "#fff",
              cursor: "pointer", fontSize: 13, fontFamily: "sans-serif",
            }}>← Préc.</button>
          )}
          {chapitre < livre.chapitres && (
            <button onClick={() => onChangerChapitre(chapitre + 1)} style={{
              background: OR, border: "none", borderRadius: 8,
              padding: "6px 10px", color: VERT,
              cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "sans-serif",
            }}>Suiv. →</button>
          )}
        </div>
      </div>

      {/* Barre langue + audio */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 14, alignItems: "center",
      }}>
        {/* Sélecteur langue */}
        <div style={{ position: "relative", flex: 1 }}>
          <button
            onClick={() => setShowLangMenu(m => !m)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              background: "#fff", border: `1px solid ${showLangMenu ? OR : "#e4e4e7"}`,
              borderRadius: 10, padding: "8px 12px", cursor: "pointer",
              fontSize: 13, fontFamily: "sans-serif", color: VERT, fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 18 }}>{langueObj.flag}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{langueObj.nom}</span>
            <span style={{ fontSize: 10, color: "#999" }}>▼</span>
          </button>
          {showLangMenu && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
              background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 100,
              maxHeight: 240, overflowY: "auto",
            }}>
              {LANGUES.map(l => (
                <div key={l.code}
                  onClick={() => traduire(l.code)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", cursor: "pointer",
                    background: langue === l.code ? "#f0f7f0" : "transparent",
                    borderBottom: "1px solid #f5f5f5",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{l.flag}</span>
                  <span style={{ fontSize: 13, color: VERT, fontFamily: "sans-serif", fontWeight: langue === l.code ? 700 : 400 }}>
                    {l.nom}
                  </span>
                  {langue === l.code && <span style={{ marginLeft: "auto", color: OR, fontSize: 14 }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton lire tout */}
        <button onClick={lireTout} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: lecture ? OR : "#fff",
          border: `1px solid ${OR}`,
          borderRadius: 10, padding: "8px 14px",
          cursor: "pointer", fontSize: 13, fontWeight: 700,
          color: lecture ? VERT : OR, fontFamily: "sans-serif",
          flexShrink: 0,
        }}>
          {lecture ? "⏹ Stop" : "▶ Écouter"}
        </button>
      </div>

      {loadingTrad && (
        <div style={{ textAlign: "center", padding: "12px 0", color: OR, fontSize: 13, fontFamily: "sans-serif" }}>
          Traduction en cours...
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#999", fontFamily: "sans-serif" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid #e4e4e7`,
            borderTop: `3px solid ${OR}`, borderRadius: "50%",
            margin: "0 auto 12px", animation: "spin 1s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ margin: 0, fontSize: 14 }}>Chargement du texte sacré...</p>
        </div>
      ) : erreur ? (
        <div style={{
          background: "#fff8e1", borderRadius: 12, padding: 20,
          textAlign: "center", fontFamily: "sans-serif",
        }}>
          <i className="ti ti-wifi-off" style={{ fontSize: 32, color: OR, marginBottom: 10 }} />
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: VERT, fontSize: 15 }}>
            Chapitre non disponible
          </p>
          <p style={{ margin: 0, color: "#888", fontSize: 13 }}>
            Vérifiez votre connexion internet.
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px", border: "1px solid #e4e4e7" }}>
          {versetsAffiches.map((v, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, marginBottom: 14, paddingBottom: 14,
              borderBottom: i < versetsAffiches.length - 1 ? "0.5px solid #f0ece0" : "none",
              background: versetLu === v.num ? "#fffbf0" : "transparent",
              borderRadius: 8, padding: "6px 4px",
              transition: "background 0.2s",
            }}>
              <span style={{
                minWidth: 22, fontSize: 11, fontWeight: 800,
                color: OR, fontFamily: "sans-serif", paddingTop: 3, flexShrink: 0,
              }}>{v.num}</span>
              <p style={{
                margin: 0, fontSize: 15, color: "#1a1a1a",
                lineHeight: 1.8, fontFamily: "Georgia, serif", flex: 1,
              }}>{v.texte}</p>
              <button
                onClick={() => lire(v.texte, v.num)}
                title="Écouter ce verset"
                style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  border: "none",
                  background: versetLu === v.num ? OR : "rgba(30,45,20,0.08)",
                  color: versetLu === v.num ? VERT : "#666",
                  cursor: "pointer", fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >{versetLu === v.num ? "⏹" : "▶"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BiblePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vue, setVue] = useState("livres");
  const [livreActif, setLivreActif] = useState(null);
  const [chapitreActif, setChapitreActif] = useState(null);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const livreId = params.get("livre");
    const chapNum = parseInt(params.get("chapitre"));
    if (livreId && chapNum) {
      const livre = LIVRES.find(l => l.id === livreId);
      if (livre) {
        setLivreActif(livre);
        setChapitreActif(chapNum);
        setVue("texte");
      }
    }
  }, []);

  return (
    <AppShell>
      <div style={{ background: CREME, minHeight: "100vh" }}>
        <header style={{
          background: "#fff", borderBottom: "1px solid #e4e4e7",
          padding: "16px", position: "sticky", top: 0, zIndex: 99,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button
            onClick={() => {
              if (vue === "texte") { setVue("chapitres"); return; }
              if (vue === "chapitres") { setVue("livres"); return; }
              navigate(-1);
            }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 22, color: VERT }} />
          </button>
          <div style={{
            background: VERT, border: `2px solid ${OR}`, borderRadius: "50%",
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className="ti ti-book" style={{ fontSize: 16, color: OR }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: VERT, fontFamily: "sans-serif" }}>
              Bible de Jérusalem
            </div>
            <div style={{ fontSize: 11, color: "#999", fontFamily: "sans-serif" }}>
              {vue === "livres"    && "73 livres"}
              {vue === "chapitres" && livreActif?.nom}
              {vue === "texte"     && `${livreActif?.nom} · Ch. ${chapitreActif}`}
            </div>
          </div>
        </header>

        <div style={{ padding: 16, paddingBottom: 100 }}>
          {vue === "livres" && (
            <VueLivres
              onSelectLivre={l => { setLivreActif(l); setRecherche(""); setVue("chapitres"); }}
              recherche={recherche}
              setRecherche={setRecherche}
            />
          )}
          {vue === "chapitres" && livreActif && (
            <VueChapitres
              livre={livreActif}
              onSelectChapitre={ch => { setChapitreActif(ch); setVue("texte"); }}
              onRetour={() => setVue("livres")}
            />
          )}
          {vue === "texte" && livreActif && chapitreActif && (
            <VueTexte
              livre={livreActif}
              chapitre={chapitreActif}
              onRetour={() => setVue("chapitres")}
              onChangerChapitre={ch => setChapitreActif(ch)}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
