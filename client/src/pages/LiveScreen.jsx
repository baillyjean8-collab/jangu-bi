import { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "../components/layout";

const VERT = "#1e2d14";
const OR   = "#c8a84b";

// ─── Données des cadeaux catholiques ───────────────────────────
const GIFTS = [
  { name: "Amen",           emoji: "🙏", price: 100  },
  { name: "Alléluia",       emoji: "✨", price: 300  },
  { name: "Hosanna",        emoji: "🌿", price: 400  },
  { name: "Paix du Christ", emoji: "☮️", price: 250  },
  { name: "Cierge",         emoji: "🕯️", price: 200  },
  { name: "Chapelet",       emoji: "📿", price: 500  },
  { name: "Rosaire",        emoji: "💟", price: 600  },
  { name: "Encens",         emoji: "🌫️", price: 750  },
  { name: "Ange gardien",   emoji: "😇", price: 800  },
  { name: "Croix",          emoji: "✝️", price: 1000 },
  { name: "Vierge Marie",   emoji: "👑", price: 1200 },
  { name: "Cœur Immaculé",  emoji: "❤️", price: 1500 },
  { name: "Bible",          emoji: "📖", price: 1500 },
  { name: "Calice",         emoji: "🏆", price: 2000 },
  { name: "Colombe",        emoji: "🕊️", price: 3000 },
  { name: "Hostie",         emoji: "⭐", price: 5000 },
];

// Mots interdits — filtre côté client (doublon du filtre serveur)
const BANNED_WORDS = [
  "merde","putain","fuck","shit","con","idiot","salop",
  "satan","haram","blasphème","diable","enfer","crétin",
];

// ─── Styles inline (pas de dépendance CSS externe) ─────────────
const S = {
  wrap: {
    position: "relative", width: "100%", height: "calc(100vh - 64px)",
    maxHeight: 720,
    background: `linear-gradient(180deg, ${VERT} 0%, #2e4622 55%, ${VERT} 100%)`,
    overflow: "hidden", fontFamily: "sans-serif", userSelect: "none",
    borderRadius: 16,
  },
  // ── Topbar ───────────────────────────────────────────────────
  topbar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 12px",
  },
  hostInfo: { display: "flex", alignItems: "center", gap: 8 },
  hostAv: {
    width: 38, height: 38, borderRadius: "50%", background: VERT,
    border: `2px solid ${OR}`, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 13, fontWeight: 700, color: OR,
    flexShrink: 0,
  },
  hostName: { color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.3 },
  hostSub:  { color: "rgba(255,255,255,.55)", fontSize: 10 },
  followBtn: {
    background: OR, border: "none", borderRadius: 14, color: VERT,
    padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer",
  },
  // ── Stats row ────────────────────────────────────────────────
  statsRow: {
    position: "absolute", top: 58, left: 12, zIndex: 20,
    display: "flex", alignItems: "center", gap: 8,
  },
  statPill: {
    background: "rgba(0,0,0,.4)", borderRadius: 10, padding: "4px 9px",
    display: "flex", alignItems: "center", gap: 5, color: "#fff", fontSize: 11,
    cursor: "pointer", border: "1px solid rgba(200,168,75,0.25)",
  },
  liveDot: { width: 6, height: 6, borderRadius: "50%", background: "#e53935" },
  // ── Admin strip ──────────────────────────────────────────────
  adminStrip: {
    position: "absolute", top: 56, left: 0, right: 0, zIndex: 25,
    background: "rgba(30,45,20,.95)", borderBottom: `0.5px solid ${OR}55`,
    padding: "5px 10px", display: "flex", alignItems: "center", gap: 5,
  },
  adminBtn: (danger, off) => ({
    background: danger || off ? "rgba(229,57,53,.15)" : "rgba(200,168,75,.15)",
    border: `0.5px solid ${danger || off ? "rgba(229,57,53,.4)" : "rgba(200,168,75,.4)"}`,
    borderRadius: 6, padding: "4px 8px",
    color: danger || off ? "#f09595" : OR,
    fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
    whiteSpace: "nowrap",
  }),
  // ── Comments overlay ─────────────────────────────────────────
  commentsOverlay: {
    position: "absolute", bottom: 100, left: 10, width: "60%",
    display: "flex", flexDirection: "column", gap: 5,
    pointerEvents: "none", zIndex: 15,
  },
  ovCmt: (pinned) => ({
    position: "relative", background: "rgba(255,255,255,.94)", color: VERT,
    borderRadius: 10, padding: "5px 8px", fontSize: 11, lineHeight: 1.4,
    wordBreak: "break-word", pointerEvents: "all",
    border: pinned ? `1px solid ${OR}` : "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  }),
  pinLabel: {
    fontSize: 9, color: OR, display: "flex", alignItems: "center",
    gap: 3, marginBottom: 2, fontWeight: 700,
  },
  cmtActions: {
    position: "absolute", right: -2, top: -2,
    background: VERT, border: `0.5px solid ${OR}55`,
    borderRadius: 8, padding: "4px 6px", display: "flex",
    flexDirection: "column", gap: 3, zIndex: 50, minWidth: 115,
  },
  caBtn: (danger) => ({
    background: "transparent", border: "none",
    color: danger ? "#f09595" : "rgba(255,255,255,.85)",
    fontSize: 10, cursor: "pointer", padding: "3px 5px", borderRadius: 4,
    display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
    textAlign: "left",
  }),
  // ── Gifts drawer ─────────────────────────────────────────────
  giftsDrawer: (state) => ({
    position: "absolute", top: 0, bottom: 0, right: 0, zIndex: 30,
    width: state === "closed" ? 0 : state === "q1" ? 105 : 295,
    overflow: "hidden",
    transition: "width .28s cubic-bezier(.4,0,.2,1)",
  }),
  giftsInnerWrap: {
    position: "absolute", top: 0, bottom: 0, right: 0, width: 295,
    background: "#f5f5f0",
    borderLeft: `0.5px solid ${OR}55`,
    display: "flex", flexDirection: "column",
  },
  drawerHandle: {
    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
    zIndex: 35, background: VERT,
    border: `0.5px solid ${OR}55`, borderRight: "none",
    borderRadius: "8px 0 0 8px", padding: "7px 4px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
  },
  dhBtn: {
    background: "transparent", border: "none",
    color: OR, cursor: "pointer",
    padding: 2, display: "flex", fontSize: 14,
  },
  dhSep: { width: 16, height: 0.5, background: `${OR}44` },
  giftsHeader: {
    padding: "10px 10px 6px", display: "flex", alignItems: "center",
    justifyContent: "space-between", flexShrink: 0,
    borderBottom: "0.5px solid #e4e4e7",
    background: "#ffffff",
  },
  giftsHeaderTitle: {
    fontSize: 12, color: VERT, fontWeight: 800, display: "flex", alignItems: "center", gap: 5,
  },
  giftsList: (expanded) => ({
    flex: 1, overflowY: "auto", padding: 8,
    display: "grid",
    gridTemplateColumns: expanded ? "1fr 1fr" : "1fr",
    gap: 6, alignContent: "flex-start",
  }),
  giftItem: {
    background: "#ffffff", border: "1px solid #e4e4e7",
    borderRadius: 10, padding: "8px 4px", textAlign: "center", cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },
  giEmoji: { fontSize: 22, display: "block", marginBottom: 3 },
  giName:  { fontSize: 9, color: "#71717A", display: "block", marginBottom: 2, lineHeight: 1.2, fontWeight: 600 },
  giPrice: { fontSize: 9, fontWeight: 800, color: OR },
  // ── Bottom bar ───────────────────────────────────────────────
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    padding: "7px 10px 14px",
    background: "linear-gradient(to top, rgba(30,45,20,0.85), transparent)",
  },
  inputRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 9 },
  commentInput: {
    flex: 1, background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.3)", borderRadius: 20,
    padding: "8px 14px", fontSize: 12, color: VERT, outline: "none",
  },
  sendBtn: {
    background: OR, border: "none", borderRadius: "50%",
    width: 34, height: 34, display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", flexShrink: 0, color: VERT,
  },
  actionsRow: {
    display: "flex", alignItems: "center", justifyContent: "space-around",
  },
  actBtn: (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    cursor: "pointer", background: "none", border: "none", flex: 1,
    color: active ? OR : "#fff",
  }),
  actIcon: (active) => ({
    fontSize: 22, color: active ? OR : "#fff",
    textShadow: "0 1px 4px rgba(0,0,0,.6)",
  }),
  actLabel: { color: "rgba(255,255,255,.85)", fontSize: 10, fontWeight: 600 },
  // ── Total fin de live ────────────────────────────────────────
  totalEnd: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)", zIndex: 60,
    background: "#ffffff", border: `1px solid ${OR}55`,
    borderRadius: 16, padding: "22px 26px", textAlign: "center", minWidth: 210,
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
  },
  // ── Misc ─────────────────────────────────────────────────────
  modWarn: {
    position: "absolute", bottom: 115, left: 10, right: 10, zIndex: 40,
    background: "rgba(229,57,53,.92)", borderRadius: 10, padding: "8px 12px",
    fontSize: 11, color: "#fff", display: "flex", alignItems: "center", gap: 6,
    fontWeight: 600,
  },
  blockedToast: {
    position: "absolute", top: "45%", left: "50%",
    transform: "translate(-50%,-50%)", zIndex: 55,
    background: "#ffffff", border: "1px solid #e53935",
    borderRadius: 14, padding: "16px 24px", fontSize: 12,
    color: VERT, textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
  },
};

// ─── Composant principal ────────────────────────────────────────
export default function LiveScreen({ liveData = {}, currentUser = {}, isAdmin = false }) {
  // Données live
  const [viewers,    setViewers]    = useState(liveData.viewers    ?? 140);
  const [likes,      setLikes]      = useState(liveData.likes      ?? 0);
  const [shareCount, setShareCount] = useState(liveData.shares     ?? 0);
  const [cmtCount,   setCmtCount]   = useState(liveData.comments   ?? 0);

  // Cadeaux & total
  const [giftCounts,   setGiftCounts]   = useState({});
  const [totalDons,    setTotalDons]    = useState(0);

  // UI
  const [drawerState,  setDrawerState]  = useState("closed"); // "closed"|"q1"|"q3"
  const [comments,     setComments]     = useState([]);
  const [pinnedId,     setPinnedId]     = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [inputText,    setInputText]    = useState("");
  const [showAdmin,    setShowAdmin]    = useState(false);
  const [micOn,        setMicOn]        = useState(true);
  const [vidOn,        setVidOn]        = useState(true);
  const [likeFloats,   setLikeFloats]   = useState([]);
  const [showModWarn,  setShowModWarn]  = useState(false);
  const [blockedToast, setBlockedToast] = useState(null);
  const [showTotal,    setShowTotal]    = useState(false);
  const [hoveredCmt,   setHoveredCmt]   = useState(null);
  const [liveEnded,    setLiveEnded]    = useState(false);

  const cmtIdRef   = useRef(0);
  const overlayRef = useRef(null);

  // ── Modération automatique ──────────────────────────────────
  const isClean = useCallback((text) => {
    const lower = text.toLowerCase();
    return !BANNED_WORDS.some((w) => lower.includes(w));
  }, []);

  // ── Ajouter un commentaire ──────────────────────────────────
  const addComment = useCallback((user, text, type = "user") => {
    if (blockedUsers.includes(user)) return;
    const id = `c${++cmtIdRef.current}`;
    const entry = { id, user, text, type, ts: Date.now() };
    setComments((prev) => {
      const next = [...prev, entry];
      return next.length > 7 ? next.slice(next.length - 7) : next;
    });
    if (type === "user") setCmtCount((n) => n + 1);
    // Auto-expiration (sauf messages système épinglés)
    if (type !== "system") {
      setTimeout(() => {
        setComments((prev) => prev.filter((c) => c.id !== id || c.id === pinnedId));
      }, 9000);
    }
  }, [blockedUsers, pinnedId]);

  // ── Simuler l'activité live (remplacer par Socket.io en prod) ──
  useEffect(() => {
    const msgs = [
      { u: "Marie N.",    t: "🙏 Seigneur, merci pour ce live" },
      { u: "Jean-Paul K.",t: "✝️ Alléluia ! Quelle grâce" },
      { u: "Céleste B.",  t: "Hosanna ! Béni soit le Seigneur" },
      { u: "Fatou D.",    t: "Amen amen amen !" },
      { u: "Pierre M.",   t: "Que la paix du Christ soit avec vous" },
    ];
    let i = 0;
    const next = () => {
      if (i < msgs.length) {
        setTimeout(() => { addComment(msgs[i].u, msgs[i].t); i++; next(); },
          1800 + Math.random() * 1000);
      }
    };
    setTimeout(next, 800);
    // Compteur spectateurs animé
    const vInterval = setInterval(() => {
      setViewers((v) => Math.max(100, v + Math.floor(Math.random() * 6) - 2));
    }, 2500);
    return () => clearInterval(vInterval);
  }, []); // eslint-disable-line

  // ── Like ─────────────────────────────────────────────────────
  const handleLike = useCallback(() => {
    setLikes((n) => n + 1);
    const floatId = Date.now();
    setLikeFloats((prev) => [...prev, floatId]);
    setTimeout(() => setLikeFloats((prev) => prev.filter((f) => f !== floatId)), 1300);
  }, []);

  // ── Partager ─────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    setShareCount((n) => n + 1);
    addComment("Système", "🔗 Live partagé", "system");
  }, [addComment]);

  // ── Envoyer commentaire ──────────────────────────────────────
  const sendComment = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    if (!isClean(text)) {
      setShowModWarn(true);
      setTimeout(() => setShowModWarn(false), 3500);
      setInputText("");
      return;
    }
    addComment(currentUser.name ?? "Vous", text);
    setInputText("");
  }, [inputText, isClean, addComment, currentUser]);

  // ── Don ──────────────────────────────────────────────────────
  const sendGift = useCallback((gift) => {
    setTotalDons((t) => t + gift.price);
    setGiftCounts((prev) => ({ ...prev, [gift.name]: (prev[gift.name] ?? 0) + 1 }));
    setLikes((n) => n + 2);
    addComment(
      currentUser.name ?? "Vous",
      `${gift.emoji} a offert ${gift.name}`,
      "gift"
    );
  }, [addComment, currentUser]);

  // ── Tiroir ───────────────────────────────────────────────────
  const toggleDrawer = () =>
    setDrawerState((s) => (s === "closed" ? "q1" : "closed"));
  const expandDrawer = () =>
    setDrawerState((s) => (s === "q1" ? "q3" : s));
  const collapseDrawer = () => setDrawerState("closed");

  // ── Modération ───────────────────────────────────────────────
  const pinComment = useCallback((id) => {
    setPinnedId((prev) => (prev === id ? null : id));
  }, []);

  const deleteComment = useCallback((id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const blockUser = useCallback((user, id) => {
    setBlockedUsers((prev) => [...prev, user]);
    deleteComment(id);
    setBlockedToast(user);
    setTimeout(() => setBlockedToast(null), 2800);
  }, [deleteComment]);

  // ── Fin du live ──────────────────────────────────────────────
  const endLive = useCallback(() => {
    collapseDrawer();
    setLiveEnded(true);
    addComment("Système", "🙏 Live terminé · Que Dieu vous bénisse", "system");
    setTimeout(() => setShowTotal(true), 1000);
  }, [addComment]);

  // ── Couleur selon type de commentaire ───────────────────────
  const userColor  = (type) =>
    type === "gift" ? OR : type === "system" ? "#71717A" : VERT;

  return (
    <AppShell>
      <div style={{ background: "#f5f5f0", minHeight: "100vh" }}>
        {/* Header */}
        <header style={{
          background: "#ffffff", borderBottom: "1px solid #e4e4e7",
          padding: "16px", position: "sticky", top: 0, zIndex: 99,
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <div style={{ background: VERT, border: `2px solid ${OR}`, borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16 }}>📡</span>
          </div>
          <span style={{ color: VERT, fontWeight: 800, fontSize: 18 }}>
            JANGU <span style={{ color: OR }}>BI</span>
          </span>
        </header>

        <div style={{ padding: 16 }}>
    <div style={S.wrap}>

      {/* ── Vidéo placeholder ────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: OR }}>
        <span style={{ fontSize: 48 }}>📡</span>
        <span style={{ fontSize: 13, opacity: 0.9, fontWeight: 700 }}>
          {liveData.title ?? "Messe dominicale du dimanche"}
        </span>
        <span style={{ fontSize: 11, opacity: 0.6, color: "#fff" }}>
          {liveData.celebrant ?? "Père Jean-Baptiste Diallo"} · {liveData.parish ?? "Sacré-Cœur, Dakar"}
        </span>
      </div>

      {/* ── Topbar ───────────────────────────────────────────── */}
      <div style={S.topbar}>
        <div style={S.hostInfo}>
          <div style={S.hostAv}>{(liveData.parishCode ?? "SC")}</div>
          <div>
            <div style={S.hostName}>{liveData.parishName ?? "Paroisse Sacré-Cœur"}</div>
            <div style={S.hostSub}>{liveData.city ?? "Dakar"} · Live</div>
          </div>
          <button style={S.followBtn}>+ Suivre</button>
        </div>
        {isAdmin && (
          <button
            style={{ ...S.statPill, cursor: "pointer" }}
            onClick={() => setShowAdmin((v) => !v)}
            aria-label="Admin"
          >
            ⚙️
          </button>
        )}
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div style={S.statsRow}>
        {/* spectateurs */}
        <div style={S.statPill}>
          <div style={S.liveDot} />
          <span>{viewers.toLocaleString()} en ligne</span>
        </div>
        {/* likes */}
        <div style={{ ...S.statPill, cursor: "pointer" }} onClick={handleLike}>
          <span>❤️</span>
          <span>{likes.toLocaleString()}</span>
        </div>
        {/* commentaires */}
        <div style={S.statPill}>
          <span>💬</span>
          <span>{cmtCount.toLocaleString()}</span>
        </div>
        {/* partages */}
        <div style={S.statPill}>
          <span>↗️</span>
          <span>{shareCount.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Admin strip ──────────────────────────────────────── */}
      {isAdmin && showAdmin && (
        <div style={S.adminStrip}>
          <button style={S.adminBtn(false, !micOn)} onClick={() => setMicOn((v) => !v)}>
            {micOn ? "🎙️ Micro" : "🔇 Micro"}
          </button>
          <button style={S.adminBtn(false, !vidOn)} onClick={() => setVidOn((v) => !v)}>
            {vidOn ? "📹 Vidéo" : "🚫 Vidéo"}
          </button>
          <button style={S.adminBtn(false, false)} onClick={() => addComment("Système", "👤 Invité ajouté", "system")}>
            👤 Inviter
          </button>
          <button style={S.adminBtn(true, false)} onClick={endLive}>
            ⏹ Fin du live
          </button>
        </div>
      )}

      {/* ── Comments overlay ─────────────────────────────────── */}
      <div style={S.commentsOverlay} ref={overlayRef}>
        {/* Commentaire épinglé en premier */}
        {[...comments].sort((a, b) => (b.id === pinnedId ? 1 : 0) - (a.id === pinnedId ? 1 : 0))
          .map((c) => (
          <div
            key={c.id}
            style={S.ovCmt(c.id === pinnedId)}
            onMouseEnter={() => setHoveredCmt(c.id)}
            onMouseLeave={() => setHoveredCmt(null)}
          >
            {c.id === pinnedId && (
              <div style={S.pinLabel}>📌 Épinglé par l'admin</div>
            )}
            <span style={{ fontWeight: 800, color: userColor(c.type), marginRight: 4 }}>
              {c.user}
            </span>
            {c.text}

            {/* Actions modération — visibles au hover pour admin/modérateurs */}
            {isAdmin && hoveredCmt === c.id && (
              <div style={S.cmtActions}>
                <button style={S.caBtn(false)} onClick={() => pinComment(c.id)}>
                  📌 {c.id === pinnedId ? "Désépingler" : "Épingler"}
                </button>
                <button style={S.caBtn(false)} onClick={() => deleteComment(c.id)}>
                  🗑 Supprimer
                </button>
                <button style={S.caBtn(true)} onClick={() => blockUser(c.user, c.id)}>
                  🚫 Bloquer {c.user.split(" ")[0]}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Likes flottants ──────────────────────────────────── */}
      {likeFloats.map((id) => (
        <div key={id} style={{
          position: "absolute", fontSize: 22, zIndex: 50, pointerEvents: "none",
          left: `${30 + Math.random() * 50}%`, bottom: 110,
          animation: "floatUp 1.2s ease-out forwards",
        }}>❤️</div>
      ))}

      {/* ── Tiroir cadeaux ───────────────────────────────────── */}
      <div style={S.giftsDrawer(drawerState)}>
        <div style={S.giftsInnerWrap}>
          {/* 2 flèches */}
          <div style={S.drawerHandle}>
            <button
              style={S.dhBtn}
              onClick={expandDrawer}
              aria-label="Agrandir à 3/4"
              title="Agrandir"
            >‹</button>
            <div style={S.dhSep} />
            <button
              style={S.dhBtn}
              onClick={collapseDrawer}
              aria-label="Fermer le tiroir"
              title="Fermer"
            >›</button>
          </div>

          <div style={S.giftsHeader}>
            <span style={S.giftsHeaderTitle}>🎁 Offrir un don</span>
          </div>

          <div style={S.giftsList(drawerState === "q3")}>
            {GIFTS.map((g) => (
              <div
                key={g.name}
                style={S.giftItem}
                onClick={() => sendGift(g)}
              >
                <span style={S.giEmoji}>{g.emoji}</span>
                <span style={S.giName}>{g.name}</span>
                <span style={S.giPrice}>{g.price.toLocaleString()} FCFA</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Total fin de live ────────────────────────────────── */}
      {showTotal && (
        <div style={S.totalEnd}>
          <div style={{ fontSize: 11, color: "#71717A", marginBottom: 6, fontWeight: 600 }}>
            Total collecté pendant ce live
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: VERT, marginBottom: 8 }}>
            {totalDons.toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: 11, color: "#71717A", lineHeight: 1.6 }}>
            {Object.entries(giftCounts)
              .filter(([, count]) => count > 0)
              .map(([name, count]) => {
                const g = GIFTS.find((x) => x.name === name);
                return `${g.emoji} ${name} ×${count}`;
              })
              .join(" · ") || "Aucun don reçu"}
          </div>
          <button
            style={{ marginTop: 16, background: VERT, border: "none", borderRadius: 10, color: OR, padding: "9px 24px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            onClick={() => setShowTotal(false)}
          >
            Fermer
          </button>
        </div>
      )}

      {/* ── Barre du bas ─────────────────────────────────────── */}
      <div style={S.bottomBar}>
        {/* Input commentaire */}
        <div style={S.inputRow}>
          <input
            style={S.commentInput}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendComment()}
            placeholder="Votre commentaire…"
            maxLength={200}
          />
          <button style={S.sendBtn} onClick={sendComment} aria-label="Envoyer">
            ➤
          </button>
        </div>

        {/* Actions row : ❤️ | 💬 | Dons | Partager */}
        <div style={S.actionsRow}>
          <button style={S.actBtn(false)} onClick={handleLike} aria-label="Aimer">
            <span style={S.actIcon(false)}>❤️</span>
            <span style={S.actLabel}>{likes.toLocaleString()}</span>
          </button>

          <button style={S.actBtn(false)} aria-label="Commentaires">
            <span style={S.actIcon(false)}>💬</span>
            <span style={S.actLabel}>{cmtCount.toLocaleString()}</span>
          </button>

          <button
            style={S.actBtn(drawerState !== "closed")}
            onClick={toggleDrawer}
            aria-label="Dons"
          >
            <span style={{ ...S.actIcon(false), color: drawerState !== "closed" ? OR : "#fff" }}>🎁</span>
            <span style={S.actLabel}>Dons</span>
          </button>

          <button style={S.actBtn(false)} onClick={handleShare} aria-label="Partager">
            <span style={S.actIcon(false)}>↗️</span>
            <span style={S.actLabel}>{shareCount.toLocaleString()}</span>
          </button>
        </div>
      </div>

      {/* ── Avertissement modération ─────────────────────────── */}
      {showModWarn && (
        <div style={S.modWarn}>
          🛡 Message supprimé — langage non conforme à cet espace catholique.
        </div>
      )}

      {/* ── Toast blocage ────────────────────────────────────── */}
      {blockedToast && (
        <div style={S.blockedToast}>
          🚫<br />
          <strong>{blockedToast}</strong><br />
          <span style={{ fontSize: 10, color: "#71717A" }}>
            ne peut plus commenter ce live
          </span>
        </div>
      )}

      {/* ── Animation cœurs (keyframe CSS globale) ───────────── */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-90px) scale(1.5); }
        }
      `}</style>
    </div>
        </div>
      </div>
    </AppShell>
  );
}

/*
 * ─── UTILISATION ────────────────────────────────────────────────
 *
 * Props :
 *   liveData    — objet depuis l'API/Socket.io :
 *     { _id, title, celebrant, parishName, parishCode, city, viewers, likes, shares, comments }
 *   currentUser — objet JWT décodé : { _id, name, role }
 *   isAdmin     — boolean : true si role === 'admin' | 'moderateur'
 *
 * Exemple d'import dans App.jsx ou le routeur :
 *
 *   import LiveScreen from "./LiveScreen";
 *
 *   <LiveScreen
 *     liveData={liveSession}
 *     currentUser={user}
 *     isAdmin={user.role === "admin" || user.role === "moderateur"}
 *   />
 *
 * Socket.io — brancher dans useEffect :
 *   socket.on("comment",  (c) => addComment(c.user, c.text, c.type));
 *   socket.on("gift",     (g) => sendGift(g));
 *   socket.on("viewers",  (n) => setViewers(n));
 *   socket.on("like",     ()  => setLikes((n) => n + 1));
 *   socket.on("share",    ()  => setShareCount((n) => n + 1));
 *   socket.on("liveEnd",  ()  => endLive());
 * ────────────────────────────────────────────────────────────────
 */
