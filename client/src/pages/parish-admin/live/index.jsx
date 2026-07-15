import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, Track, RoomEvent } from 'livekit-client';
import { io } from 'socket.io-client';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const FILTRES_CSS = {
  aucun: 'none',
  adoucir: 'brightness(1.06) contrast(0.95) saturate(1.05) blur(0.4px)',
  lumiere: 'brightness(1.28)',
  contraste: 'contrast(1.3)',
};

export default function AdminLive() {
  const navigate = useNavigate();
  const token = localStorage.getItem('jb_admin_token');
  const BASE = import.meta.env.VITE_API_URL || '/api';

  const [etat, setEtat] = useState('verification'); // verification | config | direct | pause
  const [titre, setTitre] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [bruitReduction, setBruitReduction] = useState(true);
  const [filtreActif, setFiltreActif] = useState('aucun');
  const [confirm, setConfirm] = useState(false);
  const [erreur, setErreur] = useState('');
  const [liveId, setLiveId] = useState(null);
  const [duree, setDuree] = useState(0);
  const [demarrage, setDemarrage] = useState(false);
  const [resume, setResume] = useState(null);
  const [parishLogoUrl, setParishLogoUrl] = useState(null);
  const [rosterListe, setRosterListe] = useState([]);
  const [showInviter, setShowInviter] = useState(false);
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [guestMicOn, setGuestMicOn] = useState(true);
  const [guestCameraOn, setGuestCameraOn] = useState(true);
  const [invitesEnvoyes, setInvitesEnvoyes] = useState([]);
  const [guestConnecte, setGuestConnecte] = useState(null);

  const [viewerCountReel, setViewerCountReel] = useState(0);
  const [likeTotal, setLikeTotal] = useState(0);
  const [messagesChat, setMessagesChat] = useState([]);
  const [texteMessage, setTexteMessage] = useState('');

  const roomRef = useRef(null);
  const hiddenVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const dureeIntervalRef = useRef(null);
  const liveIdRef = useRef(null);
  const enDirectRef = useRef(false);
  const socketRef = useRef(null);
  const facingRef = useRef('user');
  const filtreActifRef = useRef('aucun');
  const rafRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const videoPubRef = useRef(null);
  const guestVideoRef = useRef(null);
  const parishLogoImgRef = useRef(null);
  const cameraOnRef = useRef(true);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const audioDataRef = useRef(null);
  const micAnalysisStreamRef = useRef(null);

  useEffect(function() { cameraOnRef.current = cameraOn; }, [cameraOn]);

  useEffect(function() { filtreActifRef.current = filtreActif; }, [filtreActif]);

  async function recupererParishId() {
    const res = await fetch(BASE + '/users/me', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    const u = data && data.data && (data.data.user || data.data);
    return u && u.parishId && (u.parishId._id || u.parishId);
  }

  // ---- Apercu camera (allume avant meme de lancer le direct) ----
  function dessinerBoucle() {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;

      if (cameraOnRef.current) {
        if (hiddenVideoRef.current && hiddenVideoRef.current.readyState >= 2) {
          ctx.filter = FILTRES_CSS[filtreActifRef.current] || 'none';
          ctx.drawImage(hiddenVideoRef.current, 0, 0, w, h);
        }
      } else {
        ctx.filter = 'none';
        ctx.fillStyle = '#0C0A06';
        ctx.fillRect(0, 0, w, h);

        let niveau = 0;
        if (analyserRef.current && audioDataRef.current) {
          analyserRef.current.getByteFrequencyData(audioDataRef.current);
          let somme = 0;
          for (let i = 0; i < audioDataRef.current.length; i++) somme += audioDataRef.current[i];
          niveau = somme / audioDataRef.current.length / 255;
        }

        const cx = w / 2;
        const cy = h / 2;
        const rayonBase = Math.min(w, h) * 0.14;

        for (let i = 0; i < 3; i++) {
          const rayon = rayonBase + i * 22 + niveau * 40;
          ctx.beginPath();
          ctx.arc(cx, cy, rayon, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(200,168,75,' + Math.max(0, 0.5 - i * 0.15 - niveau * 0.1) + ')';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        if (parishLogoImgRef.current && parishLogoImgRef.current.complete && parishLogoImgRef.current.naturalWidth > 0) {
          const taille = rayonBase * 2.4;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, rayonBase, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(parishLogoImgRef.current, cx - taille / 2, cy - taille / 2, taille, taille);
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(200,168,75,0.5)';
          ctx.font = (rayonBase) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', cx, cy);
        }
      }
    }
    rafRef.current = requestAnimationFrame(dessinerBoucle);
  }

  async function demarrerCameraPreview() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingRef.current }, audio: false });
      cameraStreamRef.current = stream;
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = stream;
        await hiddenVideoRef.current.play();
      }
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings ? track.getSettings() : {};
      if (canvasRef.current) {
        canvasRef.current.width = settings.width || 720;
        canvasRef.current.height = settings.height || 1280;
      }
      if (!rafRef.current) dessinerBoucle();
    } catch (e) {
      console.log('Apercu camera:', e.message);
      setErreur('Impossible d acceder a la camera. Verifiez les autorisations du navigateur.');
    }
  }

  function arreterCameraPreview() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      cameraStreamRef.current = null;
    }
  }

  async function demarrerAnalyseAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micAnalysisStreamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) { console.log('Analyse audio:', e.message); }
  }

  function arreterAnalyseAudio() {
    if (micAnalysisStreamRef.current) {
      micAnalysisStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      micAnalysisStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(function() {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }

  async function retournerCamera() {
    facingRef.current = facingRef.current === 'user' ? 'environment' : 'user';
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingRef.current }, audio: false });
      cameraStreamRef.current = stream;
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = stream;
        await hiddenVideoRef.current.play();
      }
    } catch (e) { console.log('Retourner camera:', e.message); }
  }

  async function chargerLogoParoisse() {
    try {
      const parishId = await recupererParishId();
      if (!parishId) return;
      const res = await fetch(BASE + '/parishes/' + parishId);
      const data = await res.json();
      const p = data && data.data && data.data.parish;
      if (p && p.logoUrl) {
        setParishLogoUrl(p.logoUrl);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = p.logoUrl;
        parishLogoImgRef.current = img;
      }
    } catch (e) { console.log('Logo paroisse:', e.message); }
  }

  useEffect(function() {
    demarrerCameraPreview();
    chargerLogoParoisse();
    return function() { arreterCameraPreview(); };
  }, []);

  // ---- Verification au chargement : direct deja actif ou en pause ? ----
  useEffect(function() {
    async function verifier() {
      try {
        const parishId = await recupererParishId();
        if (!parishId) { setEtat('config'); return; }

        const res = await fetch(BASE + '/live/parish/' + parishId + '/active', { headers: { Authorization: 'Bearer ' + token } });
        if (res.status === 404) { setEtat('config'); return; }
        const data = await res.json();
        const session = data && data.data && data.data.session;
        if (!session) { setEtat('config'); return; }

        setLiveId(session._id);
        liveIdRef.current = session._id;
        setTitre(session.title || '');
        const secondesEcoulees = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
        setDuree(Math.max(0, secondesEcoulees));
        connecterSocket(parishId, session._id);

        if (session.isPaused) {
          setEtat('pause');
        } else {
          await publierFlux(session._id);
          setEtat('direct');
        }
      } catch (e) {
        console.log('Verification live:', e.message);
        setEtat('config');
      }
    }
    verifier();
  }, []);

  // ---- Pause automatique si on quitte la page / change d'onglet ----
  useEffect(function() {
    function gererVisibilite() {
      if (document.hidden && enDirectRef.current && liveIdRef.current) {
        mettreEnPauseAutomatique();
      }
    }
    function gererFermeture() {
      if (enDirectRef.current && liveIdRef.current) {
        navigator.sendBeacon && navigator.sendBeacon(
          BASE + '/live/' + liveIdRef.current + '/pause',
          new Blob([JSON.stringify({})], { type: 'application/json' })
        );
      }
    }
    document.addEventListener('visibilitychange', gererVisibilite);
    window.addEventListener('pagehide', gererFermeture);
    return function() {
      document.removeEventListener('visibilitychange', gererVisibilite);
      window.removeEventListener('pagehide', gererFermeture);
    };
  }, []);

  useEffect(function() {
    return function() {
      if (roomRef.current) roomRef.current.disconnect();
      clearInterval(dureeIntervalRef.current);
    };
  }, []);

  // ---- Socket.io (spectateurs, reactions, chat identifie) ----
  function connecterSocket(parishId, sessionId) {
    if (socketRef.current) return;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : window.location.origin;
    const socket = io(socketUrl, { auth: { token: token } });
    socketRef.current = socket;

    socket.on('connect', function() {
      socket.emit('room:join', { parishId: parishId, liveId: sessionId });
    });
    socket.on('live:viewerCount', function(data) {
      if (data.liveId === sessionId) setViewerCountReel(data.count);
    });
    socket.on('live:reaction', function(data) {
      if (data.liveId === sessionId) setLikeTotal(function(c) { return c + 1; });
    });
    socket.on('chat:message:admin', function(data) {
      if (data.liveId === sessionId) {
        setMessagesChat(function(prev) { return prev.slice(-30).concat([{ id: data.id, type: 'chat', nom: data.nom, texte: data.texte }]); });
      }
    });
    socket.on('live:reaction:admin', function(data) {
      if (data.liveId === sessionId) {
        setMessagesChat(function(prev) { return prev.slice(-30).concat([{ id: 'r-' + Date.now() + Math.random(), type: 'reaction', nom: data.nom, reactionType: data.type }]); });
      }
    });
    socket.on('live:gift:admin', function(data) {
      if (data.liveId === sessionId) {
        setMessagesChat(function(prev) { return prev.slice(-30).concat([{ id: 'g-' + Date.now() + Math.random(), type: 'gift', nom: data.expediteur, cadeau: data.cadeau, emoji: data.emoji }]); });
      }
    });
    socket.on('live:roster', function(data) {
      if (data.liveId === sessionId) setRosterListe(data.roster || []);
    });
    socket.on('live:guest:joined', function(data) {
      if (data.liveId === sessionId) {
        setGuestConnecte({ nom: data.nom, userId: data.userId });
        setGuestMicOn(true);
        setGuestCameraOn(true);
        setMessagesChat(function(prev) { return prev.slice(-30).concat([{ id: 'j-' + Date.now(), type: 'gift', nom: data.nom, cadeau: 'a rejoint le direct', emoji: '' }]); });
      }
    });
    socket.on('live:guest:removed', function(data) {
      if (data.liveId === sessionId) {
        setShowGuestMenu(false);
        setInvitesEnvoyes(function(prev) { return prev.filter(function(uid) { return uid !== data.userId; }); });
        setGuestConnecte(function(prev) {
          const nomInvite = prev ? prev.nom : 'Le fidele';
          setMessagesChat(function(prevMsgs) {
            return prevMsgs.slice(-30).concat([{ id: 'd-' + Date.now(), type: 'gift', nom: nomInvite, cadeau: 'est descendu du direct', emoji: '' }]);
          });
          return null;
        });
      }
    });
    socket.on('live:guest:camera:response:received', function(data) {
      if (data.liveId === sessionId && data.accepted) setGuestCameraOn(true);
    });
  }

  function inviterFidele(targetUserId) {
    recupererParishId().then(function(parishId) {
      socketRef.current.emit('live:invite:send', { parishId: parishId, liveId: liveIdRef.current, targetUserId: targetUserId });
    });
    setInvitesEnvoyes(function(prev) { return prev.concat([targetUserId]); });
  }

  function toggleGuestMic() {
    if (!guestConnecte || !guestConnecte.userId) return;
    const nouvelEtat = !guestMicOn;
    recupererParishId().then(function(parishId) {
      socketRef.current.emit('live:guest:control:send', { parishId: parishId, liveId: liveIdRef.current, targetUserId: guestConnecte.userId, action: nouvelEtat ? 'unmute' : 'mute' });
    });
    setGuestMicOn(nouvelEtat);
  }

  function toggleGuestCamera() {
    if (!guestConnecte || !guestConnecte.userId) return;
    recupererParishId().then(function(parishId) {
      if (guestCameraOn) {
        socketRef.current.emit('live:guest:control:send', { parishId: parishId, liveId: liveIdRef.current, targetUserId: guestConnecte.userId, action: 'camera-off' });
      } else {
        socketRef.current.emit('live:guest:control:send', { parishId: parishId, liveId: liveIdRef.current, targetUserId: guestConnecte.userId, action: 'camera-request' });
      }
    });
    if (guestCameraOn) setGuestCameraOn(false);
  }

  function faireDescendreInvite() {
    if (!guestConnecte || !guestConnecte.userId) return;
    recupererParishId().then(function(parishId) {
      socketRef.current.emit('live:guest:control:send', { parishId: parishId, liveId: liveIdRef.current, targetUserId: guestConnecte.userId, action: 'kick' });
    });
    setShowGuestMenu(false);
  }

  function deconnecterSocket() {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    setViewerCountReel(0);
    setLikeTotal(0);
    setMessagesChat([]);
  }

  function envoyerMessageAdmin() {
    const txt = texteMessage.trim();
    if (!txt || !socketRef.current || !liveIdRef.current) return;
    recupererParishId().then(function(parishId) {
      socketRef.current.emit('chat:send', { parishId: parishId, liveId: liveIdRef.current, texte: txt });
    });
    setTexteMessage('');
  }

  // ---- Publication du flux (canvas avec effets) vers LiveKit ----
  async function publierFlux(sessionId) {
    const resToken = await fetch(BASE + '/live/' + sessionId + '/token', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    });
    const dataToken = await resToken.json();

    const room = new Room();
    room.on(RoomEvent.TrackSubscribed, function(track) {
      if (track.kind === 'video' && guestVideoRef.current) {
        track.attach(guestVideoRef.current);
      }
    });
    await room.connect(dataToken.data.url, dataToken.data.token);

    if (!canvasRef.current.captureStream) {
      throw new Error('captureStream non supporte par ce navigateur');
    }
    const canvasStream = canvasRef.current.captureStream(30);
    const videoTrack = canvasStream.getVideoTracks()[0];
    const pub = await room.localParticipant.publishTrack(videoTrack, { name: 'camera', source: Track.Source.Camera });
    videoPubRef.current = pub;

    await room.localParticipant.setMicrophoneEnabled(true, {
      noiseSuppression: bruitReduction,
      echoCancellation: true,
      autoGainControl: true,
    });
    demarrerAnalyseAudio();

    roomRef.current = room;
    enDirectRef.current = true;
    dureeIntervalRef.current = setInterval(function() { setDuree(function(d) { return d + 1; }); }, 1000);
  }

  async function lancerLive() {
    setErreur('');
    setDemarrage(true);
    try {
      const parishId = await recupererParishId();
      if (!parishId) { setErreur('Aucune paroisse associee a ce compte.'); setDemarrage(false); return; }

      const resStart = await fetch(BASE + '/live/start', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parishId, title: titre }),
      });
      const dataStart = await resStart.json();
      if (!resStart.ok) { setErreur((dataStart && dataStart.message) || 'Impossible de demarrer le live.'); setDemarrage(false); return; }
      const session = dataStart.data.session;

      await publierFlux(session._id);
      connecterSocket(parishId, session._id);
      setLiveId(session._id);
      liveIdRef.current = session._id;
      setEtat('direct');
      setDemarrage(false);
      setDuree(0);
    } catch (e) {
      console.log('Lancer live:', e.message);
      setErreur('Une erreur est survenue. Verifiez l autorisation de la camera et du micro.');
      setDemarrage(false);
    }
  }

  async function mettreEnPauseAutomatique() {
    enDirectRef.current = false;
    if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
    arreterAnalyseAudio();
    clearInterval(dureeIntervalRef.current);
    try {
      await fetch(BASE + '/live/' + liveIdRef.current + '/pause', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    } catch (e) { console.log('Pause auto:', e.message); }
    setEtat('pause');
  }

  async function mettreEnPause() { await mettreEnPauseAutomatique(); }

  async function reprendreLive() {
    try {
      await fetch(BASE + '/live/' + liveId + '/resume', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
      await publierFlux(liveId);
      setEtat('direct');
    } catch (e) {
      console.log('Reprendre live:', e.message);
      setErreur('Impossible de reprendre le direct.');
    }
  }

  async function terminerLive() {
    let sessionFinale = null;
    try {
      enDirectRef.current = false;
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
      arreterAnalyseAudio();
      clearInterval(dureeIntervalRef.current);
      if (liveId) {
        const res = await fetch(BASE + '/live/' + liveId + '/end', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
        const data = await res.json();
        sessionFinale = data && data.data && data.data.session;
      }
    } catch (e) { console.log('Terminer live:', e.message); }
    finally {
      deconnecterSocket();
      setEtat('config');
      setLiveId(null);
      liveIdRef.current = null;
      setTitre('');
      if (sessionFinale) setResume(sessionFinale);
    }
  }

  function toggleCamera() {
    setCameraOn(function(v) { return !v; });
  }

  async function toggleMic() {
    const nouvelEtat = !micOn;
    setMicOn(nouvelEtat);
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(nouvelEtat, {
        noiseSuppression: bruitReduction,
        echoCancellation: true,
        autoGainControl: true,
      });
    }
  }

  async function toggleBruitReduction() {
    const nouvelEtat = !bruitReduction;
    setBruitReduction(nouvelEtat);
    if (roomRef.current && micOn) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      await roomRef.current.localParticipant.setMicrophoneEnabled(true, {
        noiseSuppression: nouvelEtat,
        echoCancellation: true,
        autoGainControl: true,
      });
    }
  }

  function partagerLive() {
    const url = window.location.origin + '/live/' + liveId;
    if (navigator.share) {
      navigator.share({ title: titre || 'Direct en cours', url: url }).catch(function() {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  }

  function formatDuree(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  const FILTRES = [
    { id: 'aucun', label: 'Aucun', icon: 'ti-ban' },
    { id: 'adoucir', label: 'Adoucir', icon: 'ti-sparkles' },
    { id: 'lumiere', label: 'Lumiere', icon: 'ti-sun' },
    { id: 'contraste', label: 'Contraste', icon: 'ti-contrast' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', height: '100dvh', background: '#050505', position: 'relative', overflow: 'hidden', fontFamily: 'Georgia,serif' }}>

      <video ref={hiddenVideoRef} muted playsInline style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: facingRef.current === 'user' ? 'scaleX(-1)' : 'none' }} />

      {etat === 'verification' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, zIndex: 5 }}>
          Verification...
        </div>
      )}

      {erreur && (
        <div style={{ position: 'absolute', top: 60, left: 12, right: 12, background: 'rgba(180,20,20,0.85)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 11, zIndex: 10 }}>{erreur}</div>
      )}

      {etat === 'config' && (
        <>
          <button onClick={function() { navigate(-1); }} style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}>
            <i className="ti ti-x" style={{ color: '#fff', fontSize: 14 }} />
          </button>

          <div style={{ position: 'absolute', top: 48, left: 10, right: 10, zIndex: 5 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginBottom: 5, letterSpacing: 1 }}>EFFETS</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {FILTRES.map(function(f) {
                const actif = filtreActif === f.id;
                return (
                  <div key={f.id} onClick={function() { setFiltreActif(f.id); }} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: actif ? 'rgba(200,168,75,0.9)' : 'rgba(255,255,255,0.12)', border: actif ? '2px solid ' + OR : '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={'ti ' + f.icon} style={{ color: actif ? VERT : '#fff', fontSize: 15 }} />
                    </div>
                    <span style={{ color: actif ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 7 }}>{f.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 168, left: 10, right: 10, zIndex: 5 }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontSize: 10 }}><i className="ti ti-microphone-2" style={{ fontSize: 13, verticalAlign: -2, marginRight: 5 }} />Reduction de bruit</span>
              <div onClick={function() { setBruitReduction(function(v) { return !v; }); }} style={{ width: 32, height: 18, borderRadius: 10, background: bruitReduction ? OR : 'rgba(255,255,255,0.2)', position: 'relative', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: 2, left: bruitReduction ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 126, left: 10, right: 10, zIndex: 5 }}>
            <input
              value={titre}
              onChange={function(e) { setTitre(e.target.value); }}
              placeholder="Titre du direct..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fff', outline: 'none', fontFamily: 'Georgia,serif', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ position: 'absolute', bottom: 84, left: 10, right: 10, zIndex: 5 }}>
            <div style={{ background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.25)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-shield-check" style={{ color: OR, fontSize: 13 }} />
              <span style={{ color: OR, fontSize: 9 }}>Le direct est modere : propos malsains bloques automatiquement</span>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 16, left: 10, right: 10, zIndex: 5 }}>
            <button
              onClick={function() { if (titre) setConfirm(true); }}
              disabled={demarrage}
              style={{ width: '100%', padding: 14, background: titre ? 'linear-gradient(135deg,#7f0000,#3a0000)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, color: titre ? '#ffcdd2' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: titre ? 'pointer' : 'default' }}
            >
              {demarrage ? 'Demarrage...' : 'Passer en direct'}
            </button>
          </div>
        </>
      )}

      {etat === 'pause' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 5, padding: 24 }}>
          <i className="ti ti-player-pause" style={{ fontSize: 36, color: OR }} />
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>"{titre}"</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Direct en pause</div>
          <button onClick={reprendreLive} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#2E5C3E,#0D3B2E)', border: 'none', borderRadius: 20, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <i className="ti ti-player-play" style={{ fontSize: 15, verticalAlign: -2, marginRight: 4 }} /> Reprendre
          </button>
          <button onClick={terminerLive} style={{ padding: '10px 24px', background: 'rgba(229,57,53,0.15)', border: '1.5px solid rgba(229,57,53,0.4)', borderRadius: 20, color: '#e57373', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            Terminer le direct
          </button>
        </div>
      )}

      {etat === 'direct' && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(12,10,6,0.6)', backgroundImage: BOGOLAN_DARK, borderRadius: '0 0 20px 20px', padding: '10px 12px 9px', zIndex: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: VERT, border: '2px solid ' + OR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {parishLogoUrl
                  ? <img src={parishLogoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <i className="ti ti-user" style={{ fontSize: 16, color: OR }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Vous</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>En direct - {formatDuree(duree)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(200,168,75,0.18)', border: '1px solid rgba(200,168,75,0.4)', borderRadius: 20, padding: '5px 10px', flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e53935' }} />
                <span style={{ color: IVOIRE, fontSize: 11, fontWeight: 700 }}>{viewerCountReel}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 9px', flexShrink: 0 }}>
                <i className="ti ti-heart" style={{ fontSize: 12, color: '#ef9a9a' }} />
                <span style={{ color: IVOIRE, fontSize: 11, fontWeight: 700 }}>{likeTotal}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={function() { setShowInviter(true); }} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-users" style={{ color: '#fff', fontSize: 15 }} />
              </button>
              <button onClick={partagerLive} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-share" style={{ color: '#fff', fontSize: 15 }} />
              </button>
              <button onClick={toggleMic} style={{ width: 34, height: 34, borderRadius: '50%', background: micOn ? 'rgba(129,199,132,0.18)' : 'rgba(229,57,53,0.18)', border: '1.5px solid ' + (micOn ? 'rgba(129,199,132,0.4)' : 'rgba(229,57,53,0.4)'), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className={micOn ? 'ti ti-microphone' : 'ti ti-microphone-off'} style={{ color: micOn ? '#81C784' : '#e57373', fontSize: 15 }} />
              </button>
              <button onClick={toggleCamera} style={{ width: 34, height: 34, borderRadius: '50%', background: cameraOn ? 'rgba(129,199,132,0.18)' : 'rgba(229,57,53,0.18)', border: '1.5px solid ' + (cameraOn ? 'rgba(129,199,132,0.4)' : 'rgba(229,57,53,0.4)'), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className={cameraOn ? 'ti ti-video' : 'ti ti-video-off'} style={{ color: cameraOn ? '#81C784' : '#e57373', fontSize: 15 }} />
              </button>
              <button onClick={retournerCamera} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-camera-rotate" style={{ color: '#fff', fontSize: 15 }} />
              </button>
              <button onClick={mettreEnPause} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(200,168,75,0.22)', border: '1.5px solid rgba(200,168,75,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-player-pause" style={{ color: OR, fontSize: 15 }} />
              </button>
              <button onClick={terminerLive} style={{ width: 34, height: 34, borderRadius: '50%', background: '#e53935', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ti ti-power" style={{ color: '#fff', fontSize: 15 }} />
              </button>
            </div>
          </div>

          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 46, maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 5, zIndex: 4 }}>
            {messagesChat.map(function(m) {
              if (m.type === 'reaction') {
                return (
                  <div key={m.id} style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
                    <span style={{ fontWeight: 700, color: OR }}>{m.nom}</span> a envoye une reaction ({m.reactionType})
                  </div>
                );
              }
              if (m.type === 'gift') {
                return (
                  <div key={m.id} style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '4px 10px', display: 'inline-block', alignSelf: 'flex-start' }}>
                    <span style={{ fontSize: 12, marginRight: 4 }}>{m.emoji}</span>
                    <span style={{ fontWeight: 700, color: OR, fontSize: 9 }}>{m.nom}</span> <span style={{ color: '#fff', fontSize: 9 }}>a envoye {m.cadeau}</span>
                  </div>
                );
              }
              return (
                <div key={m.id} style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '4px 10px', display: 'inline-block', alignSelf: 'flex-start' }}>
                  <span style={{ fontWeight: 700, color: OR, fontSize: 9 }}>{m.nom}</span> <span style={{ color: '#fff', fontSize: 9 }}>{m.texte}</span>
                </div>
              );
            })}
          </div>

          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 5, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              value={texteMessage}
              onChange={function(e) { setTexteMessage(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessageAdmin(); }}
              placeholder="Repondre a un commentaire..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 20, padding: '7px 12px', fontSize: 10, color: '#fff', outline: 'none', fontFamily: 'Georgia,serif' }}
            />
            <button onClick={envoyerMessageAdmin} style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <i className="ti ti-send" style={{ color: VERT, fontSize: 13 }} />
            </button>
          </div>
        </>
      )}

      {guestConnecte && (
        <div onClick={function() { setShowGuestMenu(function(v) { return !v; }); }} style={{ position: 'absolute', right: 8, bottom: 100, width: 70, height: 96, borderRadius: 12, overflow: 'hidden', border: '2px solid ' + OR, zIndex: 6, background: '#000', cursor: 'pointer' }}>
          <video ref={guestVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '2px 4px' }}>
            <span style={{ color: '#fff', fontSize: 6 }}>{guestConnecte.nom}</span>
          </div>
        </div>
      )}

      {showGuestMenu && guestConnecte && (
        <div style={{ position: 'absolute', right: 84, bottom: 100, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 7 }}>
          <button onClick={toggleGuestMic} style={{ width: 34, height: 34, borderRadius: '50%', background: guestMicOn ? 'rgba(16,60,20,0.92)' : 'rgba(90,10,10,0.92)', border: '2px solid ' + (guestMicOn ? '#81C784' : '#e57373'), boxShadow: '0 2px 6px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <i className={guestMicOn ? 'ti ti-microphone' : 'ti ti-microphone-off'} style={{ color: guestMicOn ? '#81C784' : '#e57373', fontSize: 16 }} />
          </button>
          <button onClick={toggleGuestCamera} style={{ width: 34, height: 34, borderRadius: '50%', background: guestCameraOn ? 'rgba(16,60,20,0.92)' : 'rgba(90,10,10,0.92)', border: '2px solid ' + (guestCameraOn ? '#81C784' : '#e57373'), boxShadow: '0 2px 6px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <i className={guestCameraOn ? 'ti ti-video' : 'ti ti-video-off'} style={{ color: guestCameraOn ? '#81C784' : '#e57373', fontSize: 16 }} />
          </button>
          <button onClick={faireDescendreInvite} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(90,10,10,0.92)', border: '2px solid #e57373', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <i className="ti ti-arrow-down" style={{ color: '#e57373', fontSize: 16 }} />
          </button>
        </div>
      )}

      {showInviter && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 20 }} onClick={function() { setShowInviter(false); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: IVOIRE, borderRadius: '20px 20px 0 0', padding: 18, width: '100%', maxHeight: '60%', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 700, color: VERT, marginBottom: 12 }}>Inviter a monter en direct</div>
            {rosterListe.length === 0 && (
              <div style={{ fontSize: 12, color: '#7A6E5E', textAlign: 'center', padding: 20 }}>Aucun fidele connecte pour le moment</div>
            )}
            {rosterListe.map(function(p) {
              const dejaInvite = invitesEnvoyes.indexOf(p.userId) !== -1;
              return (
                <div key={p.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: 12, color: VERT, fontFamily: 'Georgia,serif' }}>{p.nom}</span>
                  <button onClick={function() { inviterFidele(p.userId); }} disabled={dejaInvite} style={{ padding: '6px 14px', background: dejaInvite ? 'rgba(0,0,0,0.06)' : 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 16, color: dejaInvite ? '#9A8E7E' : OR, fontSize: 10, fontWeight: 700, cursor: dejaInvite ? 'default' : 'pointer' }}>
                    {dejaInvite ? 'Invite' : 'Inviter'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {confirm && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: 24 }}>
          <div style={{ background: IVOIRE, borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, textAlign: 'center', marginBottom: 8 }}>Lancer le direct ?</div>
            <div style={{ fontSize: 12, color: '#7A6E5E', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
              "{titre}"<br />Vos fideles seront notifies.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setConfirm(false); }} style={{ flex: 1, padding: 12, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 12, color: '#7A6E5E', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Annuler</button>
              <button onClick={function() { setConfirm(false); lancerLive(); }} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#7f0000,#3a0000)', border: 'none', borderRadius: 12, color: '#ffcdd2', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                Lancer
              </button>
            </div>
          </div>
        </div>
      )}

      {resume && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: 24 }}>
          <div style={{ background: IVOIRE, borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <i className="ti ti-confetti" style={{ fontSize: 30, color: OR }} />
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: VERT, marginTop: 6 }}>Direct termine</div>
              <div style={{ fontSize: 11, color: '#7A6E5E', marginTop: 2 }}>"{resume.title}"</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: VERT }}>{resume.peakViewers || 0}</div>
                <div style={{ fontSize: 8, color: '#7A6E5E' }}>Pic spectateurs</div>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e53935' }}>
                  {resume.reactionCounts ? Object.values(resume.reactionCounts).reduce(function(a, b) { return a + b; }, 0) : 0}
                </div>
                <div style={{ fontSize: 8, color: '#7A6E5E' }}>Reactions</div>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: OR }}>
                  {resume.durationSeconds ? Math.floor(resume.durationSeconds / 60) + ' min' : '-'}
                </div>
                <div style={{ fontSize: 8, color: '#7A6E5E' }}>Duree</div>
              </div>
            </div>
            <button onClick={function() { setResume(null); }} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 12, color: OR, fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
