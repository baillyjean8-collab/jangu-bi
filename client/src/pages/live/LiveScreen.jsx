import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent } from 'livekit-client';
import { contientMotInterdit, sauvegarderAvertissement, compteRestreint, messageRestriction } from '../../utils/jb-filtre';

const CADEAUX = [
  { id:1,  emoji:"🌹", nom:"Rose",           prix:10   },
  { id:2,  emoji:"🕯️", nom:"Bougie",         prix:25   },
  { id:3,  emoji:"✝️", nom:"Croix",           prix:50   },
  { id:4,  emoji:"📿", nom:"Chapelet",        prix:75   },
  { id:5,  emoji:"⛪", nom:"Église",          prix:100  },
  { id:6,  emoji:"👑", nom:"Couronne",        prix:200  },
  { id:7,  emoji:"🙏", nom:"Amen",            prix:100  },
  { id:8,  emoji:"✨", nom:"Alléluia",        prix:300  },
  { id:9,  emoji:"🌟", nom:"Hosanna",         prix:400  },
  { id:10, emoji:"☮️", nom:"Paix du Christ",  prix:250  },
  { id:11, emoji:"🕯️", nom:"Cierge",          prix:200  },
  { id:12, emoji:"🌸", nom:"Rosaire",         prix:600  },
  { id:13, emoji:"🪔", nom:"Encens",          prix:750  },
  { id:14, emoji:"😇", nom:"Ange gardien",    prix:800  },
  { id:15, emoji:"👸", nom:"Vierge Marie",    prix:1200 },
  { id:16, emoji:"❤️", nom:"Coeur Immaculé", prix:1500 },
  { id:17, emoji:"📖", nom:"Bible",           prix:1500 },
  { id:18, emoji:"🏆", nom:"Calice",          prix:2000 },
  { id:19, emoji:"🕊️", nom:"Colombe",         prix:3000 },
  { id:20, emoji:"⚜️", nom:"Hostie",          prix:5000 },
];

const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';
const OR   = '#C8A84B';
const VERT = '#1e2d14';
const MAX_MOTS = 30;

// Données mock du live
const LIVE_MOCK = {
  id: '1',
  titre: 'Messe dominicale en direct',
  paroisse: 'Paroisse Sacré-Cœur',
  pretre: 'Père Jean-Baptiste Diop',
  initiales: 'SC',
  enLigne: 153,
  likes: 342,
  participants: [
    { id: 'p1', nom: 'Marie D.',  initiales: 'MD', bg: '#1a3a2a', border: 'rgba(200,168,75,0.3)', micOn: true  },
    { id: 'p2', nom: 'Joseph K.', initiales: 'JK', bg: '#1a1a3a', border: 'rgba(255,255,255,0.1)', micOn: false },
  ],
};

const PROFILS_COULEURS = [
  { bg: 'linear-gradient(135deg,#C8A84B,#8B6020)', col: '#C8A84B', tc: '#1e2d14' },
  { bg: 'linear-gradient(135deg,#81C784,#2e7d32)', col: '#81C784', tc: 'white'   },
  { bg: 'linear-gradient(135deg,#90CAF9,#1565C0)', col: '#90CAF9', tc: 'white'   },
  { bg: 'linear-gradient(135deg,#ce93d8,#6a1b9a)', col: '#ce93d8', tc: 'white'   },
  { bg: 'linear-gradient(135deg,#ef9a9a,#c62828)', col: '#ef9a9a', tc: 'white'   },
];

const NOMS_AUTO = ['Marie F.','Joseph D.','Thérèse N.','Amadou D.','Fatou M.'];
const MSG_AUTO  = [
  'Amen ! Merci pour ce direct',
  'Je prie avec vous depuis Thiès 🙏',
  'Gloire à Dieu !',
  'Que Dieu vous bénisse tous',
  'Merci pour ce partage 🙌',
];

// ── Cœur animé ──────────────────────────────────────────────────────────────
function HeartAnim({ x, y, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: 'absolute', left: x, top: y, fontSize: 28, pointerEvents: 'none', zIndex: 15,
      animation: 'jb-heart-pop 0.9s ease-out forwards',
    }}>❤️</div>
  );
}

// ── Cadeau animé ─────────────────────────────────────────────────────────────
function GiftAnim({ emoji, x, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: 'absolute', bottom: 65, left: x, fontSize: 22, pointerEvents: 'none', zIndex: 14,
      animation: 'jb-gift-float 2.2s ease-out forwards',
    }}>{emoji}</div>
  );
}

// ── Bulle commentaire ────────────────────────────────────────────────────────
function CommentBubble({ profil, initiales, nom, texte, onMention, isJoin }) {
  if (isJoin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <span style={{ fontSize: 9, color: 'rgba(200,168,75,0.55)', fontFamily: 'Georgia,serif', fontStyle: 'italic' }}>
          👤 {texte}
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', background: profil.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 700, color: profil.tc, flexShrink: 0,
        border: `1.5px solid ${profil.col}55`,
      }}>{initiales}</div>
      <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: '4px 9px' }}>
        <span
          onClick={() => onMention(nom)}
          style={{ fontSize: 8, color: profil.col, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif' }}
        >{nom} </span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)', fontFamily: 'Georgia,serif' }}>{texte}</span>
      </div>
    </div>
  );
}

export default function LiveScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const live = LIVE_MOCK;

  const [sessionReelle, setSessionReelle] = useState(null);
  const [connexionVideo, setConnexionVideo] = useState('chargement');
  const videoRef = useRef(null);
  const roomRef = useRef(null);

  useEffect(function() {
    let annule = false;
    async function connecter() {
      try {
        const { liveApi } = await import('../../services/api');
        const dataSession = await liveApi.getOne(id);
        if (annule) return;
        const session = dataSession && dataSession.data && dataSession.data.session;
        if (session) setSessionReelle(session);

        const dataToken = await liveApi.getToken(id);
        if (annule) return;
        const room = new Room();
        room.on(RoomEvent.TrackSubscribed, function(track) {
          if (track.kind === 'video' && videoRef.current) track.attach(videoRef.current);
        });
        await room.connect(dataToken.data.url, dataToken.data.token);
        roomRef.current = room;

        room.remoteParticipants.forEach(function(participant) {
          participant.videoTrackPublications.forEach(function(pub) {
            if (pub.track && videoRef.current) pub.track.attach(videoRef.current);
          });
        });

        setConnexionVideo('connecte');
      } catch (e) {
        console.log('Connexion live:', e.message);
        if (!annule) setConnexionVideo('erreur');
      }
    }
    connecter();
    return function() {
      annule = true;
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
    };
  }, [id]);

  const [likeCount,  setLikeCount]  = useState(live.likes);
  const [commentaire, setCommentaire] = useState('');
  const [commentaires, setCommentaires] = useState([]);
  const [hearts,  setHearts]  = useState([]);
  const [cadeaux, setCadeaux] = useState([]);
  const [recording, setRecording] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [fondEcran, setFondEcran]   = useState(null);   // null = profil, 'color' = couleur, 'image' = image
  const [cameraOn, setCameraOn]     = useState(false);
  const [speakingId, setSpeakingId] = useState('host'); // qui a la parole
  const [showCadeauxDrawer, setShowCadeauxDrawer] = useState(false);
  const [closingDrawer, setClosingDrawer] = useState(false);
  const [avertissement, setAvertissement] = useState('');
  const [chrono, setChrono]           = useState(0);        // secondes depuis début
  const [banniereMsg, setBanniereMsg] = useState(null);     // bannière cadeau/rejoins
  const [msgEpingle, setMsgEpingle]   = useState('🙏 Bienvenue ! Messe dominicale en direct depuis la Cathédrale Notre-Dame de Dakar');

  const scrollRef  = useRef(null);
  const recRef     = useRef(null);
  const heartIdRef = useRef(0);
  const cadeauIdRef = useRef(0);
  const autoRef    = useRef(0);

  // Auto-scroll commentaires
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [commentaires]);

  // Chrono live
  useEffect(() => {
    const iv = setInterval(() => setChrono(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  function formatChrono(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  function afficherBanniere(msg, duree = 3000) {
    setBanniereMsg(msg);
    setTimeout(() => setBanniereMsg(null), duree);
  }

  // Commentaires automatiques
  useEffect(() => {
    const iv = setInterval(() => {
      // Parfois afficher "a rejoint"
      if (Math.random() > 0.7) {
        const nomRejoint = NOMS_AUTO[Math.floor(Math.random() * NOMS_AUTO.length)];
        setCommentaires(prev => [...prev.slice(-30), {
          id: Date.now() + 'join',
          profil: { bg: 'rgba(200,168,75,0.1)', col: 'rgba(200,168,75,0.6)', tc: '#1e2d14' },
          initiales: '👤',
          nom: '',
          texte: nomRejoint + ' a rejoint le live',
          isJoin: true,
        }]);
      }
      const idx = autoRef.current % NOMS_AUTO.length;
      const profil = PROFILS_COULEURS[idx % PROFILS_COULEURS.length];
      const nom    = NOMS_AUTO[idx];
      const texte  = MSG_AUTO[idx % MSG_AUTO.length];
      const init   = nom.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
      setCommentaires(prev => [...prev.slice(-30), { id: Date.now() + Math.random(), profil, initiales: init, nom, texte }]);
      if (Math.random() > 0.5) setLikeCount(c => c + 1);
      if (Math.random() > 0.7) {
        const cadeau = CADEAUX[Math.floor(Math.random() * 5)];
        const envoyeur = NOMS_AUTO[Math.floor(Math.random() * NOMS_AUTO.length)];
        lancerCadeau(cadeau.emoji, 'Un fidèle');
      }
      autoRef.current++;
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  // ── Likes ──────────────────────────────────────────────────────────────────
  const incLike = useCallback(() => setLikeCount(c => c + 1), []);

  function handleEcranClick(e) {
    incLike();
    const rect = e.currentTarget.getBoundingClientRect();
    const id   = ++heartIdRef.current;
    const x    = e.clientX - rect.left + (-15 + Math.random() * 30);
    const y    = e.clientY - rect.top  + (-10 + Math.random() * 20);
    setHearts(prev => [...prev, { id, x, y }]);
  }

  function removeHeart(id) { setHearts(prev => prev.filter(h => h.id !== id)); }

  // ── Cadeaux ────────────────────────────────────────────────────────────────
  function closeDrawer() {
    setClosingDrawer(true);
    setTimeout(() => {
      setShowCadeauxDrawer(false);
      setClosingDrawer(false);
    }, 280);
  }

  function lancerCadeau(emoji, envoyeur = 'Un fidèle') {
    // Vibration courte sur mobile
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    const id = ++cadeauIdRef.current;
    const x  = 10 + Math.random() * 55 + '%';
    setCadeaux(prev => [...prev, { id, emoji, x }]);
    // Bannière cadeau
    const nomCadeau = CADEAUX.find(c => c.emoji === emoji)?.nom || 'cadeau';
    afficherBanniere(`${emoji} Un fidèle a offert ${nomCadeau}`, 3500);
  }
  function removeCadeau(id) { setCadeaux(prev => prev.filter(c => c.id !== id)); }

  // ── Commentaire ────────────────────────────────────────────────────────────
  function limitWords(val) {
    const mots = val.split(/s+/).filter(Boolean);
    return mots.length > MAX_MOTS ? mots.slice(0, MAX_MOTS).join(' ') : val;
  }

  function envoyerCommentaire() {
    const txt = commentaire.trim();
    if (!txt) return;
    if (compteRestreint()) {
      setAvertissement('🚫 Compte restreint — commentaires suspendus.');
      setTimeout(() => setAvertissement(''), 5000);
      return;
    }
    if (contientMotInterdit(txt)) {
      const nvx = sauvegarderAvertissement(txt);
      setAvertissement(messageRestriction(nvx));
      setTimeout(() => setAvertissement(''), 5000);
      return;
    }
    const profil = PROFILS_COULEURS[0];
    setCommentaires(prev => [...prev.slice(-30), {
      id: Date.now(), profil, initiales: 'MD', nom: 'Marie D.', texte: txt,
    }]);
    setCommentaire('');
    setAvertissement('');
  }

  function mentionner(nom) {
    setCommentaire('@' + nom + ' ');
  }

  // ── Micro vocal ────────────────────────────────────────────────────────────
  function toggleMic() {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url  = URL.createObjectURL(blob);
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;const sr = SR ? new SR() : null;
        if (sr) {
          sr.lang = 'fr-FR';
          sr.onresult = ev => setCommentaire(prev => limitWords(prev + ev.results[0][0].transcript));
          sr.start();
        }
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    }).catch(() => {});
  }

  // ── Styles globaux (injectés une fois) ────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes jb-heart-pop {
        0%  { opacity:0; transform:scale(0); }
        30% { opacity:1; transform:scale(1.5); }
        100%{ opacity:0; transform:scale(0.8) translateY(-55px); }
      }
      @keyframes jb-gift-float {
        0%  { opacity:0; transform:translateY(0) scale(0.5); }
        20% { opacity:1; transform:translateY(-15px) scale(1.1); }
        80% { opacity:1; }
        100%{ opacity:0; transform:translateY(-80px); }
      }
      @keyframes jb-slide-up {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }
      @keyframes jb-speaking {
        0%,100% { box-shadow: 0 0 0 2px rgba(200,168,75,0.3); }
        50%      { box-shadow: 0 0 0 6px rgba(200,168,75,0.7), 0 0 20px rgba(200,168,75,0.3); }
      }
      @keyframes jb-slide-down {
        from { transform: translateY(0); }
        to   { transform: translateY(100%); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', height: '100dvh', background: '#050505', position: 'relative', overflow: 'hidden', fontFamily: 'Georgia,serif' }}>

      {/* ── BANNIÈRE CADEAU/REJOINT ── */}
      {banniereMsg && (
        <div style={{ position: 'absolute', bottom: 75, left: 10, right: 10, transform: 'none', zIndex: 20, background: 'rgba(10,10,6,0.85)', border: '1px solid rgba(200,168,75,0.4)', borderRadius: 20, padding: '8px 16px', whiteSpace: 'nowrap', animation: 'jb-slide-up 0.3s ease-out' }}>
          <span style={{ fontSize: 12, color: '#F5F0E8', fontFamily: 'Georgia,serif' }}>{banniereMsg}</span>
        </div>
      )}

      {/* Message épinglé — réservé admin */}

      {/* Animations overlay */}
      {hearts.map(h => <HeartAnim key={h.id} x={h.x} y={h.y} onDone={() => removeHeart(h.id)} />)}
      {cadeaux.map(cadeau => <GiftAnim key={cadeau.id} emoji={cadeau.emoji} x={cadeau.x} onDone={() => removeCadeau(cadeau.id)} />)}

      {/* ── FOND VIDÉO ── */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#0a1a0f,#040404)' }} />

      {/* ── ZONE VIDÉO CLIQUABLE ── */}
      <div
        onClick={handleEcranClick}
        style={{ position: 'absolute', top: 100, left: 0, right: 110, bottom: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1,
          background: fondEcran === 'color1' ? 'linear-gradient(135deg,#1e2d14,#0C0A06)' :
                      fondEcran === 'color2' ? 'linear-gradient(135deg,#1a1a4e,#0a0a2a)' :
                      fondEcran === 'color3' ? 'linear-gradient(135deg,#2d1a0a,#1a0a00)' :
                      'transparent',
        }}
      >
        {/* Photo profil ou caméra */}
        {connexionVideo === 'connecte' && (
          <video ref={videoRef} autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {connexionVideo !== 'connecte' && (
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1e2d14,#0C0A06)',
            border: `2.5px solid ${OR}80`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-building-church" style={{ fontSize: 42, color: 'rgba(200,168,75,0.5)' }} />
          </div>
        )}
        {connexionVideo === 'chargement' && (
          <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: 'rgba(200,168,75,0.6)' }}>Connexion au direct...</div>
        )}
        {connexionVideo === 'erreur' && (
          <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: '#e57373' }}>Le direct n'a pas pu se charger</div>
        )}

      </div>

      {/* ── PARTICIPANTS (colonne fixe à droite) ── */}
      <div style={{ position: 'absolute', top: 105, right: 52, width: 62, bottom: 62, display: 'flex', flexDirection: 'column', gap: 5, padding: '4px 0', zIndex: 2 }}>
        {Array.from({length: 5}).map((_, idx) => {
          const p = live.participants[idx];
          return p ? (
            <div key={p.id} onClick={() => setSpeakingId(p.id)} style={{ flex: 1, borderRadius: 10, background: p.bg, border: speakingId === p.id ? `2px solid ${OR}` : `1.5px solid ${p.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 60, animation: speakingId === p.id ? 'jb-speaking 1.5s ease-in-out infinite' : 'none', cursor: 'pointer' }}>
              <i className="ti ti-user" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 8px 8px', padding: '2px 4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.8)' }}>{p.nom}</span>
                <i className={`ti ti-microphone${p.micOn ? '' : '-off'}`} style={{ fontSize: 7, color: p.micOn ? '#81C784' : '#e57373' }} />
              </div>
            </div>
          ) : (
            <div key={'empty-'+idx} style={{ flex: 1, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1.5px dashed rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.12)', textAlign: 'center', lineHeight: 1.4 }}>{idx+1}</span>
            </div>
          );
        })}
      </div>

      {/* ── ICÔNES ACTION (colonne fixe extrême droite) ── */}
      <div style={{ position: 'absolute', right: 4, top: 0, bottom: 62, width: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6, zIndex: 2, paddingBottom: 70 }}>
        <div onClick={() => { incLike(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,154,154,0.15)', border: '1px solid rgba(239,154,154,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-heart" style={{ fontSize: 18, color: '#ef9a9a' }} />
          </div>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)', fontFamily: 'Georgia,serif' }}>J'aime</span>
        </div>
        <div onClick={() => setShowWaitlist(w => !w)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(200,168,75,0.12)', border: `1px solid ${OR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-hand-stop" style={{ fontSize: 18, color: OR }} />
            </div>
            <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: 'white' }}>3</div>
          </div>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)' }}>Demande</span>
        </div>
        <div onClick={() => { if(showCadeauxDrawer) closeDrawer(); else setShowCadeauxDrawer(true); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-gift" style={{ fontSize: 18, color: OR }} />
          </div>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)' }}>Dons</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-share" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
          </div>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)' }}>Partager</span>
        </div>
      </div>

      {/* ── HEADER (fixe en haut) ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, padding: '36px 10px 10px', background: '#0C0A06', backgroundImage: BOGOLAN_DARK, borderRadius: '0 0 20px 20px', border: '1px solid rgba(200,168,75,0.25)', borderTop: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: 6 }}>
          <button onClick={() => navigate(-1)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 14, color: 'white' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, justifyContent: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1e2d14,#0C0A06)', border: `1.5px solid ${OR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: OR, flexShrink: 0 }}>
              {live.initiales}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{(sessionReelle && sessionReelle.parishId && sessionReelle.parishId.name) || live.paroisse}</span>
          </div>
          <button style={{ background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 20, padding: '3px 10px', fontSize: 9, color: '#1e2d14', fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>+ Suivre</button>
          <div style={{ background: '#e53935', borderRadius: 6, padding: '2px 7px', fontSize: 8, fontWeight: 700, color: 'white', flexShrink: 0 }}>● LIVE</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(200,168,75,0.18)', border: '1px solid rgba(200,168,75,0.45)', borderRadius: 20, padding: '4px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e53935', boxShadow: '0 0 6px #e53935' }} />
            <span style={{ fontSize: 10, color: '#F5F0E8', fontWeight: 700 }}>{live.enLigne} en ligne</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '2px 9px' }}>
            <i className="ti ti-heart" style={{ fontSize: 11, color: '#ef9a9a', filter: 'drop-shadow(0 0 4px rgba(239,154,154,0.8))' }} />
            <span style={{ fontSize: 10, color: '#F5F0E8', fontWeight: 700 }}>{likeCount}</span>
          </div>
        </div>
      </div>

      {/* ── COMMENTAIRES (flottent sur la vidéo, au-dessus de la barre) ── */}
      <div style={{ position: 'absolute', left: 0, right: 112, bottom: 62, height: 200, zIndex: 3, pointerEvents: 'auto' }}>
        <div
          ref={scrollRef}
          style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '8px 10px', gap: 4 }}
        >
          {commentaires.map(com => (
            <CommentBubble key={com.id} profil={com.profil} initiales={com.initiales} nom={com.nom} texte={com.texte} onMention={mentionner} isJoin={com.isJoin} />
          ))}
          {avertissement && (
            <div style={{ padding: '6px 10px', background: 'rgba(180,20,20,0.12)', border: '1px solid rgba(180,20,20,0.3)', borderRadius: 10, fontSize: 10, color: '#c0392b' }}>
              {avertissement}
            </div>
          )}
        </div>
      </div>

      {/* ── BARRE BAS (fixe en bas) ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4, background: '#0C0A06', backgroundImage: BOGOLAN_DARK, borderTop: '1.5px solid rgba(200,168,75,0.35)', padding: '8px 12px 16px', display: 'flex', gap: 7, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B6020)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#1e2d14', flexShrink: 0, border: `1.5px solid ${OR}99` }}>MD</div>
        <input
          value={commentaire}
          onChange={e => setCommentaire(limitWords(e.target.value))}
          onKeyDown={e => e.key === 'Enter' && envoyerCommentaire()}
          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 22, padding: '8px 12px', fontSize: 10, color: 'rgba(255,255,255,0.85)', outline: 'none', fontFamily: 'Georgia,serif' }}
        />
        <button onClick={toggleMic} style={{ width: 32, height: 32, borderRadius: '50%', background: recording ? 'rgba(229,115,115,0.2)' : 'rgba(129,199,132,0.15)', border: `1.5px solid ${recording ? 'rgba(229,115,115,0.4)' : 'rgba(129,199,132,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <i className="ti ti-microphone" style={{ fontSize: 14, color: recording ? '#e57373' : '#81C784' }} />
        </button>
        <button onClick={envoyerCommentaire} style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <i className="ti ti-send" style={{ fontSize: 13, color: '#1e2d14' }} />
        </button>
      </div>

      {/* ── DRAWER CADEAUX ── */}
      {showCadeauxDrawer && (
        <>
          <div onClick={closeDrawer} style={{ position: 'absolute', inset: 0, zIndex: 29 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, background: '#0C0A06', backgroundImage: BOGOLAN_DARK, borderTop: `1.5px solid ${OR}40`, borderRadius: '20px 20px 0 0', padding: '14px 12px 24px', animation: closingDrawer ? 'jb-slide-down 0.28s ease-in forwards' : 'jb-slide-up 0.28s ease-out forwards' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(200,168,75,0.3)', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: OR }}>Envoyer un cadeau</div>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
              {CADEAUX.map(cadeau => (
                <div key={cadeau.id} onClick={() => { lancerCadeau(cadeau.emoji); closeDrawer(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '8px 4px', borderRadius: 12, background: 'rgba(200,168,75,0.06)', border: '1px solid rgba(200,168,75,0.1)' }}>
                  <div style={{ fontSize: 24 }}>{cadeau.emoji}</div>
                  <div style={{ fontSize: 8, color: 'rgba(245,240,232,0.7)', textAlign: 'center' }}>{cadeau.nom}</div>
                  <div style={{ fontSize: 8, color: OR, fontWeight: 700 }}>{cadeau.prix} F</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── LISTE ATTENTE ── */}
      {showWaitlist && (
        <div style={{ position: 'absolute', right: 52, bottom: 160, background: 'rgba(10,10,10,0.97)', border: `1px solid ${OR}50`, borderRadius: 14, padding: 12, width: 170, zIndex: 25 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: OR, marginBottom: 10 }}>🕐 En attente (3)</div>
          {['Thérèse N.','Amadou D.','Fatou M.'].map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < 2 ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: PROFILS_COULEURS[i+2].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 700, color: PROFILS_COULEURS[i+2].tc }}>
                  {n.split(' ').map(x=>x[0]).join('')}
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>{n}</span>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: OR, animation: `jb-pulse 1.2s infinite ${j*0.4}s` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}