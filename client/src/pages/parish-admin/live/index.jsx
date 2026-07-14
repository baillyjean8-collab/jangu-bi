import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, RoomEvent } from 'livekit-client';
import AdminShell from '../AdminShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

export default function AdminLive() {
  const navigate = useNavigate();
  const token = localStorage.getItem('jb_admin_token');
  const BASE = import.meta.env.VITE_API_URL || '/api';

  const [enLive, setEnLive]     = useState(false);
  const [demarrage, setDemarrage] = useState(false);
  const [titre, setTitre]       = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [confirm, setConfirm]   = useState(false);
  const [erreur, setErreur]     = useState('');
  const [liveId, setLiveId]     = useState(null);
  const [duree, setDuree]       = useState(0);

  const roomRef = useRef(null);
  const videoRef = useRef(null);
  const dureeIntervalRef = useRef(null);

  const [verificationInitiale, setVerificationInitiale] = useState(true);

  useEffect(function() {
    return function() {
      if (roomRef.current) roomRef.current.disconnect();
      clearInterval(dureeIntervalRef.current);
    };
  }, []);

  // Au chargement de la page, verifie si un direct est deja actif pour cette
  // paroisse (ex: la page a ete rafraichie ou fermee sans cliquer "Terminer").
  // Si oui, on reprend l'etat "en direct" au lieu de reafficher la config.
  useEffect(function() {
    async function reprendreSiActif() {
      try {
        const parishId = await recupererParishId();
        if (!parishId) { setVerificationInitiale(false); return; }

        const resActif = await fetch(BASE + '/live/parish/' + parishId + '/active', { headers: { Authorization: 'Bearer ' + token } });
        if (resActif.status === 404) { setVerificationInitiale(false); return; }
        const dataActif = await resActif.json();
        const session = dataActif && dataActif.data && dataActif.data.session;
        if (!session) { setVerificationInitiale(false); return; }

        const resToken = await fetch(BASE + '/live/' + session._id + '/token', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        });
        const dataToken = await resToken.json();
        if (!resToken.ok) { setVerificationInitiale(false); return; }

        const room = new Room();
        await room.connect(dataToken.data.url, dataToken.data.token);
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
        const camPub = room.localParticipant.videoTrackPublications.values().next().value;
        if (camPub && camPub.track && videoRef.current) camPub.track.attach(videoRef.current);

        roomRef.current = room;
        setLiveId(session._id);
        setTitre(session.title || '');
        setEnLive(true);

        const secondesEcoulees = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
        setDuree(Math.max(0, secondesEcoulees));
        dureeIntervalRef.current = setInterval(function() { setDuree(function(d) { return d + 1; }); }, 1000);
      } catch (e) {
        console.log('Reprise live:', e.message);
      } finally {
        setVerificationInitiale(false);
      }
    }
    reprendreSiActif();
  }, []);

  async function recupererParishId() {
    const res = await fetch(BASE + '/users/me', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    const u = data && data.data && (data.data.user || data.data);
    return u && u.parishId && (u.parishId._id || u.parishId);
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

      const resToken = await fetch(BASE + '/live/' + session._id + '/token', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      const dataToken = await resToken.json();
      if (!resToken.ok) { setErreur('Impossible de rejoindre le live.'); setDemarrage(false); return; }

      const room = new Room();
      await room.connect(dataToken.data.url, dataToken.data.token);
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);

      const camPub = room.localParticipant.videoTrackPublications.values().next().value;
      if (camPub && camPub.track && videoRef.current) {
        camPub.track.attach(videoRef.current);
      }

      roomRef.current = room;
      setLiveId(session._id);
      setEnLive(true);
      setDemarrage(false);
      setDuree(0);
      dureeIntervalRef.current = setInterval(function() { setDuree(function(d) { return d + 1; }); }, 1000);
    } catch (e) {
      console.log('Lancer live:', e.message);
      setErreur('Une erreur est survenue. Verifiez l autorisation de la camera.');
      setDemarrage(false);
    }
  }

  async function terminerLive() {
    try {
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
      clearInterval(dureeIntervalRef.current);
      if (liveId) {
        await fetch(BASE + '/live/' + liveId + '/end', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        });
      }
    } catch (e) { console.log('Terminer live:', e.message); }
    finally {
      setEnLive(false);
      setLiveId(null);
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
          {enLive && <div style={{ background: '#e53935', borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'white' }}>EN DIRECT - {formatDuree(duree)}</div>}
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {verificationInitiale && (
          <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Verification...</div>
        )}

        {!verificationInitiale && erreur && (
          <div style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, padding: 10, fontSize: 11, color: '#e53935' }}>{erreur}</div>
        )}

        {!verificationInitiale && !enLive ? (
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
                Une fois le live lance, votre camera et votre micro seront actives et vos fideles pourront regarder en direct.
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
        ) : !verificationInitiale ? (
          <>
            <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', aspectRatio: '9 / 12', position: 'relative' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }} />
              {!cameraOn && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-video-off" style={{ fontSize: 32, color: 'rgba(200,168,75,0.4)' }} />
                </div>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, color: VERT, marginBottom: 10 }}>Controles</div>
              <button onClick={toggleCamera} style={{ width: '100%', padding: 10, background: cameraOn ? 'rgba(16,185,129,0.1)' : 'rgba(229,57,53,0.08)', border: cameraOn ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 11, color: cameraOn ? '#065F46' : '#e53935', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700 }}>
                <i className={cameraOn ? 'ti ti-video' : 'ti ti-video-off'} style={{ fontSize: 13, verticalAlign: -2 }} /> {cameraOn ? 'Camera activee' : 'Camera desactivee'}
              </button>
            </div>

            <div style={{ background: 'rgba(200,168,75,0.06)', border: '1px solid rgba(200,168,75,0.15)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: '#8B6020', lineHeight: 1.6, fontFamily: 'Georgia,serif' }}>
                Les commentaires, reactions et demandes de montee en direct arrivent dans une prochaine mise a jour. Pour l'instant, vous diffusez la video en direct a vos fideles.
              </div>
            </div>

            <button onClick={terminerLive} style={{ width: '100%', padding: 13, background: 'rgba(229,57,53,0.08)', border: '1.5px solid rgba(229,57,53,0.3)', borderRadius: 14, color: '#e53935', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
              Terminer le live
            </button>
          </>
        ) : null}
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
