import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, RoomEvent } from 'livekit-client';
import { io } from 'socket.io-client';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

export default function AdminLive() {
  const navigate = useNavigate();
  const token = localStorage.getItem('jb_admin_token');
  const BASE = import.meta.env.VITE_API_URL || '/api';

  const [etat, setEtat]         = useState('verification'); // verification | config | direct | pause
  const [titre, setTitre]       = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [confirm, setConfirm]   = useState(false);
  const [erreur, setErreur]     = useState('');
  const [liveId, setLiveId]     = useState(null);
  const [duree, setDuree]       = useState(0);
  const [demarrage, setDemarrage] = useState(false);

  const [viewerCountReel, setViewerCountReel] = useState(0);
  const [likeTotal, setLikeTotal] = useState(0);
  const [messagesChat, setMessagesChat] = useState([]);

  const roomRef = useRef(null);
  const videoRef = useRef(null);
  const dureeIntervalRef = useRef(null);
  const liveIdRef = useRef(null);
  const enDirectRef = useRef(false);
  const socketRef = useRef(null);

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
    socket.on('chat:message', function(data) {
      if (data.liveId === sessionId) setMessagesChat(function(prev) { return prev.slice(-20).concat([data]); });
    });
  }

  function deconnecterSocket() {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    setViewerCountReel(0);
    setLikeTotal(0);
    setMessagesChat([]);
  }

  async function recupererParishId() {
    const res = await fetch(BASE + '/users/me', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    const u = data && data.data && (data.data.user || data.data);
    return u && u.parishId && (u.parishId._id || u.parishId);
  }

  // Verification au chargement : un direct est-il deja actif (ou en pause) pour cette paroisse ?
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
          await reconnecter(session._id);
          setEtat('direct');
        }
      } catch (e) {
        console.log('Verification live:', e.message);
        setEtat('config');
      }
    }
    verifier();
  }, []);

  // Pause automatique si l'onglet passe en arriere-plan ou si la page se ferme,
  // pendant qu'un direct est en cours (pas deja en pause).
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

  async function reconnecter(sessionId) {
    const resToken = await fetch(BASE + '/live/' + sessionId + '/token', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    });
    const dataToken = await resToken.json();
    const room = new Room();
    await room.connect(dataToken.data.url, dataToken.data.token);
    await room.localParticipant.setCameraEnabled(true);
    await room.localParticipant.setMicrophoneEnabled(true);
    const camPub = room.localParticipant.videoTrackPublications.values().next().value;
    if (camPub && camPub.track && videoRef.current) camPub.track.attach(videoRef.current);
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

      await reconnecter(session._id);
      connecterSocket(parishId, session._id);
      setLiveId(session._id);
      liveIdRef.current = session._id;
      setEtat('direct');
      setDemarrage(false);
      setDuree(0);
    } catch (e) {
      console.log('Lancer live:', e.message);
      setErreur('Une erreur est survenue. Verifiez l autorisation de la camera.');
      setDemarrage(false);
    }
  }

  async function mettreEnPauseAutomatique() {
    enDirectRef.current = false;
    if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
    clearInterval(dureeIntervalRef.current);
    try {
      await fetch(BASE + '/live/' + liveIdRef.current + '/pause', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    } catch (e) { console.log('Pause auto:', e.message); }
    setEtat('pause');
  }

  async function mettreEnPause() {
    await mettreEnPauseAutomatique();
  }

  async function reprendreLive() {
    try {
      await fetch(BASE + '/live/' + liveId + '/resume', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
      await reconnecter(liveId);
      setEtat('direct');
    } catch (e) {
      console.log('Reprendre live:', e.message);
      setErreur('Impossible de reprendre le direct.');
    }
  }

  async function terminerLive() {
    try {
      enDirectRef.current = false;
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
      clearInterval(dureeIntervalRef.current);
      if (liveId) {
        await fetch(BASE + '/live/' + liveId + '/end', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
      }
    } catch (e) { console.log('Terminer live:', e.message); }
    finally {
      deconnecterSocket();
      setEtat('config');
      setLiveId(null);
      liveIdRef.current = null;
      setTitre('');
    }
  }

  async function toggleCamera() {
    const nouvelEtat = !cameraOn;
    setCameraOn(nouvelEtat);
    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(nouvelEtat);
      if (nouvelEtat) {
        const camPub = roomRef.current.localParticipant.videoTrackPublications.values().next().value;
        if (camPub && camPub.track && videoRef.current) camPub.track.attach(videoRef.current);
      }
    }
  }

  function formatDuree(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  return (
    <AdminShell>
      <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 16px', borderRadius: '0 0 24px 24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Gestion Live</div>
          {etat === 'direct' && <div style={{ background: '#e53935', borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'white' }}>EN DIRECT - {formatDuree(duree)}</div>}
          {etat === 'pause' && <div style={{ background: '#8B6020', borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'white' }}>EN PAUSE</div>}
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {etat === 'verification' && (
          <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Verification...</div>
        )}

        {erreur && (
          <div style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, padding: 10, fontSize: 11, color: '#e53935' }}>{erreur}</div>
        )}

        {etat === 'config' && (
          <>
            <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 12 }}>Configuration du live</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 4 }}>Titre du live</div>
                <input
                  value={titre}
                  onChange={function(e) { setTitre(e.target.value); }}
                  placeholder="Ex: Messe dominicale en direct..."
                  style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.2)', borderRadius: 10, padding: '9px 12px', fontSize: 11, color: VERT, fontFamily: 'Georgia,serif', outline: 'none', boxSizing: 'border-box', background: '#FAFAF8' }}
                />
              </div>
            </div>

            <div style={{ background: 'rgba(200,168,75,0.06)', border: '1px solid rgba(200,168,75,0.15)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: '#8B6020', lineHeight: 1.6, fontFamily: 'Georgia,serif' }}>
                Une fois le live lance, votre camera et votre micro seront actives et vos fideles pourront regarder en direct. Si vous quittez la page, le direct se met automatiquement en pause.
              </div>
            </div>

            <button
              onClick={function() { if (titre) setConfirm(true); }}
              disabled={demarrage}
              style={{ width: '100%', padding: 14, background: titre ? 'linear-gradient(135deg,#7f0000,#3a0000)' : 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 14, color: titre ? '#ffcdd2' : '#9A8E7E', fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: titre ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <i className="ti ti-broadcast" style={{ fontSize: 18 }} />
              {demarrage ? 'Demarrage...' : 'Lancer le live'}
            </button>
          </>
        )}

        {etat === 'pause' && (
          <>
            <div style={{ background: 'linear-gradient(135deg,#1e2d14,#0a140a)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <i className="ti ti-player-pause" style={{ fontSize: 32, color: OR, marginBottom: 10, display: 'block' }} />
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 700, color: IVOIRE, marginBottom: 4 }}>"{titre}"</div>
              <div style={{ fontSize: 11, color: 'rgba(245,239,228,0.6)' }}>Direct en pause - vos fideles voient un message d'attente</div>
            </div>

            <button onClick={reprendreLive} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#2E5C3E,#0D3B2E)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="ti ti-player-play" style={{ fontSize: 18 }} />
              Reprendre le direct
            </button>

            <button onClick={terminerLive} style={{ width: '100%', padding: 13, background: 'rgba(229,57,53,0.08)', border: '1.5px solid rgba(229,57,53,0.3)', borderRadius: 14, color: '#e53935', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
              Terminer le direct
            </button>
          </>
        )}

        {etat === 'direct' && (
          <>
            <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', aspectRatio: '9 / 12', position: 'relative' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }} />
              {!cameraOn && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-video-off" style={{ fontSize: 32, color: 'rgba(200,168,75,0.4)' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: VERT }}>{viewerCountReel}</div>
                <div style={{ fontSize: 8, color: '#7A6E5E' }}>Spectateurs</div>
              </div>
              <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e53935' }}>{likeTotal}</div>
                <div style={{ fontSize: 8, color: '#7A6E5E' }}>Reactions</div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, padding: 12, border: '1px solid rgba(0,0,0,0.06)', maxHeight: 160, overflowY: 'auto' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 8 }}>Commentaires en direct</div>
              {messagesChat.length === 0 && <div style={{ fontSize: 10, color: '#9A8E7E' }}>Aucun commentaire pour le moment</div>}
              {messagesChat.map(function(m) {
                return (
                  <div key={m.id} style={{ fontSize: 10, color: VERT, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: OR }}>{m.nom}</span> {m.texte}
                  </div>
                );
              })}
            </div>

            <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 10 }}>Controles</div>
              <button onClick={toggleCamera} style={{ width: '100%', padding: 10, background: cameraOn ? 'rgba(16,185,129,0.1)' : 'rgba(229,57,53,0.08)', border: cameraOn ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 11, color: cameraOn ? '#065F46' : '#e53935', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>
                <i className={cameraOn ? 'ti ti-video' : 'ti ti-video-off'} style={{ fontSize: 13, verticalAlign: -2 }} /> {cameraOn ? 'Camera activee' : 'Camera desactivee'}
              </button>
            </div>

            <button onClick={mettreEnPause} style={{ width: '100%', padding: 13, background: 'rgba(200,168,75,0.1)', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 14, color: '#8B6020', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
              <i className="ti ti-player-pause" style={{ fontSize: 14, verticalAlign: -2 }} /> Mettre en pause
            </button>

            <button onClick={terminerLive} style={{ width: '100%', padding: 13, background: 'rgba(229,57,53,0.08)', border: '1.5px solid rgba(229,57,53,0.3)', borderRadius: 14, color: '#e53935', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
              Terminer le live
            </button>
          </>
        )}
      </div>

      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: IVOIRE, borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, textAlign: 'center', marginBottom: 8 }}>Lancer le live ?</div>
            <div style={{ fontSize: 12, color: '#7A6E5E', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
              "{titre}"<br />Votre camera et votre micro vont s'activer.
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
    </AdminShell>
  );
}
