import { useState } from "react";
import AppShell from "../../components/AppShell";
import waveLogo from "../../assets/wave.webp";
import orangeLogo from "../../assets/orange-money.png";
import freeLogo from "../../assets/free-money.png";
import visaLogo from "../../assets/visa-mastercard.webp";

function formatFCFA(n) { return n.toLocaleString('fr-FR') + ' FCFA'; }

const VERT = "#1e2d14";
const OR = "#c8a84b";
const DARK = "#0C0A06";
const IVOIRE = "#F5F0E8";
const BOGOLAN = "repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.045) 8px,rgba(200,168,75,0.045) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.045) 8px,rgba(200,168,75,0.045) 9px)";
const DBOG = "repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)";

const CAMPAIGNS = [
  {
    id: 1,
    title: "Restauration de l'eglise Saint-Pierre",
    parish: "Saint-Pierre — Dakar",
    description: "La toiture de notre eglise centenaire necessite une restauration urgente pour proteger ce patrimoine spirituel batie en 1925. Les infiltrations d'eau menacent les fresques et les vitraux historiques.",
    cureMessage: "Grace a votre generosite, nous pourrons preserver ce lieu de priere pour les generations futures. Que Dieu vous benisse pour votre soutien.",
    cureName: "Pere Benoit",
    category: "Travaux",
    goal: 15000000,
    raised: 9750000,
    donors: 142,
    likes: 248,
    daysLeft: 18,
    urgent: true,
    hasVideo: true,
    icon: "church",
    color: "#B45309",
    colorDark: "#7c3f06",
    parishPhoto: null,
    recentDonors: [
      { name: "Marie D.", initials: "MD", amount: 5000, anon: false },
      { name: "Un fidele", initials: "?", amount: 10000, anon: true },
      { name: "Jean F.", initials: "JF", amount: 2500, anon: false },
    ],
  },
  {
    id: 2,
    title: "Fonds de solidarite familiale",
    parish: "Diocese de Thies",
    description: "Aider les familles dans le besoin : ecole, sante, alimentation. Chaque don change une vie. Cette annee, plus de 60 familles ont ete soutenues grace a votre generosite.",
    cureMessage: "Chaque don, meme modeste, redonne espoir a une famille de notre diocese. Merci de marcher avec nous sur ce chemin de charite.",
    cureName: "Mgr Augustin",
    category: "Solidarite",
    goal: 5000000,
    raised: 3200000,
    donors: 87,
    likes: 156,
    daysLeft: 30,
    urgent: false,
    hasVideo: false,
    icon: "hand-heart",
    color: "#065F46",
    colorDark: "#043d2e",
    parishPhoto: null,
    recentDonors: [
      { name: "Awa S.", initials: "AS", amount: 3000, anon: false },
      { name: "Un fidele", initials: "?", amount: 7500, anon: true },
    ],
  },
];

function getPaymentMethods() {
  return [
    { id: "wave", label: "Wave", sub: "Ouvre l'app Wave", bg: "#1BC5F2", logo: waveLogo, deeplink: "wave://" },
    { id: "orange", label: "Orange Money", sub: "Ouvre l'app Orange Money", bg: "#FF6D00", logo: orangeLogo, deeplink: "orangemoney://", invert: true },
    { id: "free", label: "Free Money", sub: "Ouvre l'app Free Money", bg: "#fff", logo: freeLogo, deeplink: "freemoney://", border: true },
    { id: "card", label: "Carte bancaire", sub: "Visa, Mastercard", bg: "#0D3B2E", logo: visaLogo, deeplink: null },
  ];
}
const PAYMENT_METHODS = getPaymentMethods();

const CATEGORIES = ["Tous", "Travaux", "Solidarite", "Formation"];

const fmt = (n) => new Intl.NumberFormat("fr-SN").format(n);
const pct = (raised, goal) => Math.min(100, Math.round((raised / goal) * 100));

function ParishAvatar({ size = 42, campaign }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      border: `2px solid ${OR}`, overflow: "hidden",
      background: campaign.parishPhoto ? "none" : `linear-gradient(135deg, ${VERT}, ${DARK})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {campaign.parishPhoto ? (
        <img src={campaign.parishPhoto} alt={campaign.parish} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke={OR} strokeWidth="1.5">
          <path d="M12 2L4 8v13h16V8l-8-6z" />
          <path d="M9 21v-7h6v7" />
        </svg>
      )}
    </div>
  );
}

export default function DonatePage() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [view, setView] = useState("list"); // list | detail | amount | payment | code | success
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(2500);
  const [customAmount, setCustomAmount] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [totalDonated, setTotalDonated] = useState(12500);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [saveCard, setSaveCard] = useState(false);

  const filtered = activeCategory === "Tous" ? CAMPAIGNS : CAMPAIGNS.filter(c => c.category === activeCategory);
  const finalAmount = customAmount ? (parseInt(customAmount) || 0) : selectedAmount;

  function openDetail(campaign) {
    setSelectedCampaign(campaign);
    setView("detail");
  }
  function openAmount() {
    setSelectedAmount(2500);
    setCustomAmount("");
    setAnonymous(false);
    setView("amount");
  }
  function openPayment() {
    setView("payment");
  }
  function pay(method) {
    setSelectedMethod(method);
    if (method.id === "card") {
      setView("card-form");
    } else if (method.deeplink) {
      setView("code");
    } else {
      setTotalDonated(prev => prev + finalAmount);
      setView("success");
    }
  }
  function submitCard() {
    setTotalDonated(prev => prev + finalAmount);
    setView("success");
  }
  function formatCardNumber(v) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }
  const cardValid = cardNumber.replace(/\s/g, "").length === 16 && cardExpiry.length === 5 && cardCvv.length === 3 && cardName.trim().length > 2;
  function confirmManual() {
    setTotalDonated(prev => prev + finalAmount);
    setView("success");
  }
  function backToList() {
    setView("list");
    setSelectedCampaign(null);
  }

  const QUICK_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

  return (
    <AppShell>
      <div style={{ background: IVOIRE, minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>

        {/* ── VUE LISTE ── */}
        {view === "list" && (
          <div>
            <div style={{ background: DARK, backgroundImage: DBOG, padding: "38px 16px 14px", borderRadius: "0 0 22px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <i className="ti ti-feather" style={{ fontSize: 18, color: OR }} />
                <span style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: IVOIRE }}>Collectes & Dons</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(200,168,75,0.65)", marginBottom: 10 }}>Soutenez votre communaute paroissiale</div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 2 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: OR }}>{CAMPAIGNS.length}</span>
                  <span style={{ fontSize: 9, color: "rgba(245,239,228,0.45)" }}>{CAMPAIGNS.length > 1 ? "collectes actives" : "collecte active"}</span>
                </div>
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(200,168,75,0.3)" }} />
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: OR }}>{(CAMPAIGNS.reduce((s, c) => s + c.raised, 0) / 1000000).toFixed(1)}M</span>
                  <span style={{ fontSize: 9, color: "rgba(245,239,228,0.45)" }}>FCFA collectes au total</span>
                </div>
              </div>


            </div>

            <div style={{ padding: 14, paddingBottom: 90 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                    padding: "6px 14px", borderRadius: 20, border: activeCategory === cat ? "none" : "1px solid #e4e4e7",
                    background: activeCategory === cat ? VERT : "white", color: activeCategory === cat ? OR : "#7A6E5E",
                    fontSize: 11, fontWeight: activeCategory === cat ? 700 : 400, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0,
                  }}>{cat}</button>
                ))}
              </div>

              {filtered.map(campaign => (
                <div key={campaign.id} onClick={() => openDetail(campaign)} style={{
                  background: "white", borderRadius: 16, overflow: "hidden", marginBottom: 12, cursor: "pointer",
                  border: campaign.urgent ? `1.5px solid ${OR}` : "1px solid #e4e4e7",
                }}>
                  <div style={{
                    position: "relative", height: 130,
                    background: `linear-gradient(135deg, ${campaign.color}, ${campaign.colorDark})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2">
                      {campaign.icon === "church"
                        ? <><path d="M12 2L4 8v13h16V8l-8-6z"/><path d="M9 21v-7h6v7"/></>
                        : <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      }
                    </svg>
                    {campaign.urgent && (
                      <span style={{ position: "absolute", top: 10, left: 10, background: "#e53935", color: "white", fontSize: 8, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>URGENT</span>
                    )}
                    {campaign.hasVideo && (
                      <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "3px 8px", fontSize: 9, color: "white" }}>▶ Video</span>
                    )}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 9, background: "rgba(200,168,75,0.12)", color: "#8B6020", borderRadius: 10, padding: "2px 7px", fontWeight: 700 }}>{campaign.category}</span>
                      <span style={{ fontSize: 9, color: "#999" }}>⏱ {campaign.daysLeft}j</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: VERT, marginBottom: 5, fontFamily: "Georgia,serif" }}>{campaign.title}</div>
                    <div style={{ fontSize: 11, color: "#7A6E5E", marginBottom: 10, lineHeight: 1.5 }}>{campaign.description.slice(0, 80)}...</div>
                    <div style={{ height: 6, background: "#f0ece4", borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ width: `${pct(campaign.raised, campaign.goal)}%`, height: "100%", background: `linear-gradient(to right, #8B6020, ${OR})`, borderRadius: 10 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 12 }}>
                      <span style={{ color: VERT, fontWeight: 700 }}>{fmt(campaign.raised)} FCFA</span>
                      <span style={{ color: "#999" }}>sur {fmt(campaign.goal)}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openDetail(campaign); }} style={{
                      width: "100%", padding: 11, background: `linear-gradient(135deg, ${OR}, #8B6020)`,
                      border: "none", borderRadius: 24, color: VERT, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif",
                    }}>Faire un don ✦</button>
                  </div>
                </div>
              ))}

              <div style={{ background: DARK, backgroundImage: DBOG, borderRadius: 14, padding: 16, textAlign: "center", marginTop: 6 }}>
                <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 12, color: "rgba(245,239,228,0.8)", lineHeight: 1.7, marginBottom: 8 }}>
                  « Donnez, et vous recevrez : c'est une mesure bien pleine, tassee, secouee, debordante, qu'on versera dans le pan de votre vetement. »
                </div>
                <div style={{ fontSize: 10, color: OR, fontWeight: 700 }}>Luc 6, 38</div>
              </div>
            </div>
          </div>
        )}

        {/* ── VUE DETAIL ── */}
        {view === "detail" && selectedCampaign && (
          <div>
            <div style={{ padding: "44px 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={backToList} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", color: "#666", cursor: "pointer", flexShrink: 0 }}>←</button>
              <ParishAvatar size={38} campaign={selectedCampaign} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: VERT, fontFamily: "Georgia,serif" }}>{selectedCampaign.parish}</div>
                <div style={{ fontSize: 10, color: "#999" }}>Collecte de dons</div>
              </div>
              {selectedCampaign.urgent && <span style={{ background: "#e53935", color: "white", fontSize: 8, fontWeight: 700, padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>URGENT</span>}
            </div>

            <div style={{ position: "relative", height: 180, background: `linear-gradient(135deg, ${selectedCampaign.color}, ${selectedCampaign.colorDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2">
                {selectedCampaign.icon === "church"
                  ? <><path d="M12 2L4 8v13h16V8l-8-6z"/><path d="M9 21v-7h6v7"/></>
                  : <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                }
              </svg>
              {selectedCampaign.hasVideo && <div style={{ position: "absolute", bottom: 10, right: 14, background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "3px 8px", fontSize: 9, color: "white" }}>▶ Video 0:42</div>}
            </div>

            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 6 }}>{selectedCampaign.title}</div>
              <div style={{ fontSize: 12, color: "#3a3a3a", lineHeight: 1.6, marginBottom: 12 }}>{selectedCampaign.description}</div>

              <div style={{ background: "white", border: "1px solid rgba(200,168,75,0.3)", borderRadius: 14, padding: 11, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: VERT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: OR, fontWeight: 700 }}>
                    {selectedCampaign.cureName.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: VERT }}>{selectedCampaign.cureName}, cure</div>
                </div>
                <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 10, color: "#5a5a5a", lineHeight: 1.5 }}>« {selectedCampaign.cureMessage} »</div>
              </div>

              <div style={{ height: 6, background: "#f0ece4", borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${pct(selectedCampaign.raised, selectedCampaign.goal)}%`, height: "100%", background: `linear-gradient(to right, #8B6020, ${OR})`, borderRadius: 10 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 12 }}>
                <span style={{ color: VERT, fontWeight: 700 }}>{fmt(selectedCampaign.raised)} FCFA</span>
                <span style={{ color: "#999" }}>sur {fmt(selectedCampaign.goal)} · {selectedCampaign.donors} donateurs</span>
              </div>

              <div style={{ display: "flex", gap: 8, padding: "8px 0", borderTop: "1px solid #e8e4dc", borderBottom: "1px solid #e8e4dc", marginBottom: 12 }}>
                <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: 6, background: "none", border: "none", color: "#666", fontSize: 11, cursor: "pointer" }}>
                  <i className="ti ti-heart" style={{ fontSize: 14 }} /> {selectedCampaign.likes}
                </button>
                <button onClick={() => navigator.share?.({ title: selectedCampaign.title, text: selectedCampaign.description })} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: 6, background: "none", border: "none", color: "#666", fontSize: 11, cursor: "pointer" }}>
                  <i className="ti ti-share" style={{ fontSize: 14 }} /> Partager
                </button>
              </div>

              <div style={{ fontSize: 9, color: "#999", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>Donateurs recents</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {selectedCampaign.recentDonors.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: d.anon ? "#999" : OR, display: "flex", alignItems: "center", justifyContent: "center", fontSize: d.anon ? 9 : 8, fontWeight: 700, color: d.anon ? "white" : VERT }}>
                      {d.anon ? <i className="ti ti-eye-off" style={{ fontSize: 10 }} /> : d.initials}
                    </div>
                    <span style={{ fontSize: 10, color: VERT, flex: 1, fontStyle: d.anon ? "italic" : "normal" }}>{d.name}</span>
                    <span style={{ fontSize: 10, color: "#8B6020", fontWeight: 700 }}>{fmt(d.amount)} FCFA</span>
                  </div>
                ))}
              </div>

              <button onClick={openAmount} style={{ width: "100%", padding: 13, background: `linear-gradient(135deg, ${OR}, #8B6020)`, border: "none", borderRadius: 26, color: VERT, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}>Faire un don ✦</button>
            </div>
          </div>
        )}

        {/* ── VUE MONTANT ── */}
        {view === "amount" && selectedCampaign && (
          <div>
            <div style={{ background: DARK, backgroundImage: DBOG, padding: "44px 16px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setView("detail")} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.25)", color: OR, cursor: "pointer" }}>←</button>
              <div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: IVOIRE }}>Faire un don</div>
                <div style={{ fontSize: 10, color: "rgba(200,168,75,0.6)" }}>{selectedCampaign.parish}</div>
              </div>
            </div>
            <div style={{ padding: "24px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 6, fontSize: 11, color: "#999" }}>Etape 1 sur 2</div>
              <div style={{ textAlign: "center", marginBottom: 20, fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: VERT }}>Choisissez un montant</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
                {QUICK_AMOUNTS.map(amt => (
                  <button key={amt} onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }} style={{
                    padding: "14px 0", borderRadius: 12,
                    border: selectedAmount === amt && !customAmount ? `2px solid ${OR}` : "1.5px solid #e4e4e7",
                    background: selectedAmount === amt && !customAmount ? "rgba(200,168,75,0.1)" : "white",
                    fontSize: 14, fontWeight: 700, color: selectedAmount === amt && !customAmount ? "#8B6020" : VERT, cursor: "pointer",
                  }}>{fmt(amt)}</button>
                ))}
              </div>

              <input
                type="text" placeholder="Ou montant libre en FCFA" value={customAmount}
                onChange={e => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #e4e4e7", borderRadius: 12, fontSize: 14, textAlign: "center", marginBottom: 18, boxSizing: "border-box" }}
              />

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, padding: "10px 12px", background: "white", borderRadius: 10, border: "1px solid #e4e4e7", cursor: "pointer" }}>
                <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 11, color: "#666" }}>Faire un don anonyme (votre nom ne sera pas affiche publiquement)</span>
              </label>

              <button onClick={openPayment} disabled={!finalAmount} style={{
                width: "100%", padding: 15, background: finalAmount ? `linear-gradient(135deg, ${OR}, #8B6020)` : "#e4e4e7",
                border: "none", borderRadius: 26, color: finalAmount ? VERT : "#999", fontWeight: 800, fontSize: 14, cursor: finalAmount ? "pointer" : "default", fontFamily: "Georgia,serif",
              }}>Continuer ✦ →</button>
            </div>
          </div>
        )}

        {/* ── VUE PAIEMENT ── */}
        {view === "payment" && selectedCampaign && (
          <div>
            <div style={{ background: DARK, backgroundImage: DBOG, padding: "44px 16px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setView("amount")} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.25)", color: OR, cursor: "pointer" }}>←</button>
              <div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: IVOIRE }}>Faire un don</div>
                <div style={{ fontSize: 10, color: "rgba(200,168,75,0.6)" }}>{selectedCampaign.parish}</div>
              </div>
            </div>
            <div style={{ padding: "24px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 6, fontSize: 11, color: "#999" }}>Etape 2 sur 2</div>
              <div style={{ textAlign: "center", marginBottom: 18, fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: VERT }}>Mode de paiement</div>
              <div style={{ textAlign: "center", marginBottom: 22, padding: 10, background: "rgba(200,168,75,0.08)", borderRadius: 10, border: "1px solid rgba(200,168,75,0.2)" }}>
                <span style={{ fontSize: 11, color: "#7A6E5E" }}>Montant </span>
                <span style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: VERT }}>{fmt(finalAmount)}</span>
                <span style={{ fontSize: 11, color: "#7A6E5E" }}> FCFA</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => pay(m)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "white", border: "1.5px solid #e4e4e7", borderRadius: 14, cursor: "pointer", width: "100%" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: m.bg, border: m.border ? "1px solid #f0f0f0" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", padding: 7 }}>
                      <img src={m.logo} alt={m.label} style={{ width: "100%", height: "100%", objectFit: "contain", filter: m.invert ? "brightness(0) invert(1)" : "none" }} />
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: VERT }}>{m.label}</div>
                      <div style={{ fontSize: 10, color: "#999" }}>{m.sub}</div>
                    </div>
                    <span style={{ color: OR, fontSize: 16 }}>→</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, padding: "10px 14px", background: "rgba(30,150,30,0.06)", borderRadius: 10, border: "1px solid rgba(30,150,30,0.15)" }}>
                <i className="ti ti-lock" style={{ fontSize: 13, color: "#2d7a2d" }} />
                <span style={{ fontSize: 10, color: "#2d7a2d" }}>Paiement securise — vos donnees ne sont jamais stockees</span>
              </div>
            </div>
          </div>
        )}

        {/* ── VUE FORMULAIRE CARTE BANCAIRE ── */}
        {view === "card-form" && selectedCampaign && (
          <div>
            <div style={{ background: DARK, backgroundImage: DBOG, padding: "44px 16px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setView("payment")} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.25)", color: OR, cursor: "pointer" }}>←</button>
              <div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: IVOIRE }}>Carte bancaire</div>
                <div style={{ fontSize: 10, color: "rgba(200,168,75,0.6)" }}>{fmt(finalAmount)} FCFA</div>
              </div>
            </div>
            <div style={{ padding: "20px 18px" }}>

              {/* Apercu visuel de la carte */}
              <div style={{ background: "linear-gradient(135deg, #0D3B2E, #1e2d14)", borderRadius: 16, padding: 18, marginBottom: 22, color: "white", position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <i className="ti ti-credit-card" style={{ fontSize: 24, color: OR }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>CARTE</span>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 16, letterSpacing: 2, marginBottom: 14, color: cardNumber ? "white" : "rgba(255,255,255,0.3)" }}>
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                  <span style={{ color: cardName ? "white" : "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{cardName || "NOM DU TITULAIRE"}</span>
                  <span style={{ color: cardExpiry ? "white" : "rgba(255,255,255,0.4)" }}>{cardExpiry || "MM/AA"}</span>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: "#999", fontWeight: 700, letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>NUMERO DE CARTE</label>
                <input
                  type="text" placeholder="0000 0000 0000 0000" value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #e4e4e7", borderRadius: 12, fontSize: 14, boxSizing: "border-box", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "#999", fontWeight: 700, letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>EXPIRATION</label>
                  <input
                    type="text" placeholder="MM/AA" value={cardExpiry}
                    onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                    style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #e4e4e7", borderRadius: 12, fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "#999", fontWeight: 700, letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>CVV</label>
                  <input
                    type="text" placeholder="123" value={cardCvv}
                    onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #e4e4e7", borderRadius: 12, fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 10, color: "#999", fontWeight: 700, letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>NOM DU TITULAIRE</label>
                <input
                  type="text" placeholder="Comme indique sur la carte" value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #e4e4e7", borderRadius: 12, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "10px 12px", background: "white", borderRadius: 10, border: "1px solid #e4e4e7", cursor: "pointer" }}>
                <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 11, color: "#666" }}>Enregistrer cette carte pour mes prochains dons</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, padding: "10px 14px", background: "rgba(30,150,30,0.06)", borderRadius: 10, border: "1px solid rgba(30,150,30,0.15)" }}>
                <i className="ti ti-shield-lock" style={{ fontSize: 14, color: "#2d7a2d" }} />
                <span style={{ fontSize: 10, color: "#2d7a2d" }}>Paiement chiffre et securise — conforme PCI-DSS</span>
              </div>

              <button onClick={submitCard} disabled={!cardValid} style={{
                width: "100%", padding: 15, background: cardValid ? `linear-gradient(135deg, ${OR}, #8B6020)` : "#e4e4e7",
                border: "none", borderRadius: 26, color: cardValid ? VERT : "#999", fontWeight: 800, fontSize: 14, cursor: cardValid ? "pointer" : "default", fontFamily: "Georgia,serif",
              }}>Payer {fmt(finalAmount)} FCFA ✦</button>
            </div>
          </div>
        )}

        {/* ── VUE CODE DE SECOURS ── */}
        {view === "code" && selectedMethod && (
          <div style={{ background: DARK, backgroundImage: DBOG, padding: "80px 24px", textAlign: "center", minHeight: "100vh" }}>
            <i className="ti ti-device-mobile-x" style={{ fontSize: 36, color: OR, marginBottom: 14, display: "block" }} />
            <div style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: OR, marginBottom: 10 }}>Application {selectedMethod.label} non detectee</div>
            <div style={{ fontSize: 11, color: "rgba(245,239,228,0.6)", lineHeight: 1.7, marginBottom: 20 }}>
              Composez ce code USSD depuis votre telephone pour valider votre don de <span style={{ color: OR, fontWeight: 700 }}>{fmt(finalAmount)}</span> FCFA
            </div>
            <div style={{ background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.3)", borderRadius: 14, padding: 18, marginBottom: 20 }}>
              <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: OR, letterSpacing: 1 }}>#144*1*{finalAmount}#</div>
            </div>
            <button onClick={confirmManual} style={{ width: "100%", padding: 13, background: `linear-gradient(135deg, ${OR}, #8B6020)`, border: "none", borderRadius: 24, color: VERT, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 10 }}>J'ai valide le paiement ✓</button>
            <button onClick={() => setView("payment")} style={{ background: "none", border: "none", color: "rgba(200,168,75,0.6)", fontSize: 11, cursor: "pointer" }}>← Choisir un autre mode</button>
          </div>
        )}

        {/* ── VUE SUCCES ── */}
        {view === "success" && selectedCampaign && (
          <div style={{ background: DARK, backgroundImage: DBOG, padding: "80px 24px", textAlign: "center", minHeight: "100vh" }}>
            <i className="ti ti-heart-filled" style={{ fontSize: 44, color: OR, marginBottom: 16, display: "block" }} />
            <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: OR, marginBottom: 8 }}>Merci pour votre don</div>
            <div style={{ fontSize: 12, color: "rgba(245,239,228,0.6)", lineHeight: 1.7, marginBottom: 6 }}>
              {anonymous ? "Un fidele" : "Marie Diallo"} a donne {fmt(finalAmount)} FCFA {selectedMethod ? `via ${selectedMethod.label}` : ""}
            </div>
            <div style={{ fontSize: 11, color: "rgba(245,239,228,0.5)", marginBottom: 24 }}>Que Dieu vous benisse pour votre generosite.</div>
            <button onClick={backToList} style={{ padding: "11px 24px", background: "rgba(200,168,75,0.15)", border: "1px solid rgba(200,168,75,0.4)", borderRadius: 24, color: OR, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Retour aux dons</button>
          </div>
        )}

      </div>
    </AppShell>
  );
}
