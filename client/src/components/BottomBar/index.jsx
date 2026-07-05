import { useState, useEffect } from "react";
import LiveScreen from "../../pages/Live/LiveScreen";

// ── Icônes SVG inline ──────────────────────────────────────────────────────────

const IconHome = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
      fill={active ? "#c8a96e" : "none"}
      stroke={active ? "#c8a96e" : "currentColor"}
      strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const IconAnnonces = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      fill={active ? "rgba(200,169,110,0.3)" : "none"}
      stroke={active ? "#c8a96e" : "currentColor"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke={active ? "#c8a96e" : "currentColor"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLive = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" fill={active ? "#c8a96e" : "none"} stroke={active ? "#c8a96e" : "currentColor"} strokeWidth="1.8" />
    <path d="M6.34 6.34C4.23 8.45 4.23 15.55 6.34 17.66M17.66 6.34C19.77 8.45 19.77 15.55 17.66 17.66" stroke={active ? "#c8a96e" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9.17 9.17C8.27 10.07 8.27 13.93 9.17 14.83M14.83 9.17C15.73 10.07 15.73 13.93 14.83 14.83" stroke={active ? "#c8a96e" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconPrieres = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L9 9H2L7.5 13.5L5.5 21L12 17L18.5 21L16.5 13.5L22 9H15L12 2Z"
      fill={active ? "rgba(200,169,110,0.3)" : "none"}
      stroke={active ? "#c8a96e" : "currentColor"}
      strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const IconProfil = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" fill={active ? "rgba(200,169,110,0.3)" : "none"} stroke={active ? "#c8a96e" : "currentColor"} strokeWidth="1.8" />
    <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke={active ? "#c8a96e" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// ── Données de navigation ─────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "home",      label: "Accueil",   Icon: IconHome,      badge: null },
  { id: "annonces",  label: "Annonces",  Icon: IconAnnonces,  badge: 3 },
  { id: "live",      label: "Live",      Icon: IconLive,      badge: "LIVE", badgeLive: true },
  { id: "prieres",   label: "Prières",   Icon: IconPrieres,   badge: null },
  { id: "profil",    label: "Profil",    Icon: IconProfil,    badge: null },
];

// ── Pages placeholder ─────────────────────────────────────────────────────────

const PagePlaceholder = ({ title, color, emoji }) => (
  <div style={{
    minHeight: "calc(100vh - 80px)",
    background: "#0d1f14",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    fontFamily: "'Georgia', serif",
  }}>
    <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
    <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>{title}</h2>
    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Page intégrée dans l'app</p>
  </div>
);

// ── Composant BottomBar ───────────────────────────────────────────────────────

function BottomBar({ active, onChange }) {
  const [pressed, setPressed] = useState(null);

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
    }}>
      {/* Blur backdrop */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(10, 20, 14, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(200,169,110,0.15)",
      }} />

      {/* Lueur dorée subtile en haut */}
      <div style={{
        position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
        background: "linear-gradient(90deg, transparent, rgba(200,169,110,0.4), transparent)",
      }} />

      <div style={{
        position: "relative",
        display: "flex", alignItems: "flex-end",
        padding: "8px 8px 20px",
        gap: 0,
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const isPressed = pressed === item.id;

          return (
            <button
              key={item.id}
              onPointerDown={() => setPressed(item.id)}
              onPointerUp={() => { setPressed(null); onChange(item.id); }}
              onPointerLeave={() => setPressed(null)}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4,
                padding: "8px 4px",
                background: "none", border: "none", cursor: "pointer",
                position: "relative",
                transform: isPressed ? "scale(0.88)" : isActive ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
                outline: "none",
              }}
            >
              {/* Indicateur actif (fond arrondi) */}
              {isActive && (
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -60%)",
                  width: 44, height: 34,
                  borderRadius: 12,
                  background: "rgba(200,169,110,0.12)",
                  border: "1px solid rgba(200,169,110,0.2)",
                }} />
              )}

              {/* Badge */}
              {item.badge && (
                <div style={{
                  position: "absolute", top: 4, right: "calc(50% - 16px)",
                  background: item.badgeLive
                    ? "linear-gradient(135deg, #e53935, #c62828)"
                    : "linear-gradient(135deg, #c8a96e, #a07840)",
                  color: "#fff",
                  fontSize: item.badgeLive ? 8 : 10,
                  fontWeight: 800,
                  padding: item.badgeLive ? "2px 5px" : "1px 5px",
                  borderRadius: 20,
                  letterSpacing: item.badgeLive ? 0.5 : 0,
                  minWidth: 16,
                  textAlign: "center",
                  boxShadow: item.badgeLive ? "0 0 8px rgba(229,57,53,0.5)" : "none",
                  animation: item.badgeLive ? "pulseLive 1.5s ease-in-out infinite" : "none",
                }}>
                  {item.badge}
                </div>
              )}

              {/* Icône */}
              <div style={{
                color: isActive ? "#c8a96e" : "rgba(255,255,255,0.35)",
                position: "relative", zIndex: 1,
                transition: "color 0.2s",
              }}>
                <item.Icon active={isActive} />
              </div>

              {/* Label */}
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "#c8a96e" : "rgba(255,255,255,0.35)",
                letterSpacing: isActive ? 0.3 : 0,
                transition: "all 0.2s",
                fontFamily: "'Georgia', serif",
                position: "relative", zIndex: 1,
              }}>
                {item.label}
              </span>

              {/* Point actif sous le label */}
              {isActive && (
                <div style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "#c8a96e",
                  boxShadow: "0 0 6px rgba(200,169,110,0.8)",
                  position: "relative", zIndex: 1,
                }} />
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes pulseLive {
          0%, 100% { box-shadow: 0 0 8px rgba(229,57,53,0.5); }
          50% { box-shadow: 0 0 16px rgba(229,57,53,0.9); }
        }
      `}</style>
    </div>
  );
}

// ── App principale avec navigation ───────────────────────────────────────────

export default function AppNavigation() {
  const [activePage, setActivePage] = useState("home");
  const [prevPage, setPrevPage] = useState(null);

  const handleNav = (page) => {
    setPrevPage(activePage);
    setActivePage(page);
  };

  const pages = {
    home:     <PagePlaceholder title="Accueil" emoji="🏠" />,
    annonces: <PagePlaceholder title="Annonces" emoji="🔔" />,
    live:     <LiveScreen />,
    prieres:  <PagePlaceholder title="Prières" emoji="🙏" />,
    profil:   <PagePlaceholder title="Profil" emoji="👤" />,
  };

  return (
    <div style={{ background: "#0d1f14", minHeight: "100vh", fontFamily: "'Georgia', serif" }}>

      {/* Page content avec transition */}
      <div
        key={activePage}
        style={{
          animation: "fadeSlideIn 0.25s ease forwards",
          paddingBottom: 90,
        }}
      >
        {pages[activePage]}
      </div>

      <BottomBar active={activePage} onChange={handleNav} />

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Export du seul BottomBar pour intégration dans l'app existante ────────────
// Si tu veux juste le composant BottomBar sans la démo :
//
// export { BottomBar };
//
// Puis dans ton App.jsx :
// import { BottomBar } from "./components/BottomBar";
// <BottomBar active={currentRoute} onChange={navigate} />
