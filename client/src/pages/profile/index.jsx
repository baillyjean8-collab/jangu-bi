import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { postsApi } from '../../services/api';

const BOGOLAN = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.05) 8px,rgba(200,168,75,0.05) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.05) 8px,rgba(200,168,75,0.05) 9px)';
const FAITH_STEPS = ['Disciple', 'Apotre', 'Pelerin', 'Temoin', 'Lumiere'];
const TABS = ['Profil', 'Dons', 'Mes demandes', 'Inscription', 'Parametres'];

// Composant editeur photo avec zoom/recadrage
function PhotoEditor({ src, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const SIZE = 260;

  useEffect(() => {
    imgRef.current.onload = () => drawCanvas();
    imgRef.current.src = src;
  }, [src]);

  useEffect(() => { drawCanvas(); }, [scale, offset]);

  function drawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current.complete) return;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE/2, SIZE/2, SIZE/2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const ratio = Math.max(SIZE / img.width, SIZE / img.height);
    const w = img.width * ratio * scale;
    const h = img.height * ratio * scale;
    const x = (SIZE - w) / 2 + offset.x;
    const y = (SIZE - h) / 2 + offset.y;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(SIZE/2, SIZE/2, SIZE/2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#C8A84B';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  function getXY(e) {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    e.preventDefault();
    const p = getXY(e);
    setDragging(true);
    setLastPos(p);
  }

  function onMove(e) {
    e.preventDefault();
    if (!dragging) return;
    const p = getXY(e);
    const dx = p.x - lastPos.x;
    const dy = p.y - lastPos.y;
    setLastPos(p);
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }

  function onEnd() { setDragging(false); }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/jpeg', 0.92));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20 }}>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, color: '#F5EFE4' }}>Ajuster la photo</div>
      <div style={{ fontSize: 11, color: 'rgba(245,239,228,.4)', marginTop: -14 }}>Glissez pour recadrer</div>

      <canvas
        ref={canvasRef}
        width={SIZE} height={SIZE}
        style={{ borderRadius: '50%', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none', boxShadow: '0 0 0 4px rgba(200,168,75,.2), 0 8px 32px rgba(0,0,0,.5)' }}
        onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      />

      <div style={{ width: 260, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, color: 'rgba(200,168,75,.6)' }}>A</span>
        <input
          type="range" min="0.5" max="3" step="0.01" value={scale}
          onChange={e => setScale(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: '#C8A84B', height: 4 }}
        />
        <span style={{ fontSize: 20, color: '#C8A84B' }}>A</span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onCancel} style={{ padding: '11px 26px', background: 'transparent', border: '1px solid rgba(245,239,228,.2)', borderRadius: 50, color: 'rgba(245,239,228,.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Annuler</button>
        <button onClick={handleSave} style={{ padding: '11px 30px', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', border: 'none', borderRadius: 50, color: '#0C0A06', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Valider</button>
      </div>
    </div>
  );
}

export default function ProfilePage() {

  useEffect(() => {
    async function loadProfile() {
      try {
        const { userApi } = await import('../../services/api');
        const data = await userApi.getMe();
        if (data && data.data) {
          const u = data.data;
          if (typeof setNom === 'function') setNom((u.firstName || '') + ' ' + (u.lastName || ''));
          if (typeof setPhone === 'function') setPhone(u.phone || '');
        }
      } catch(e) {
        console.log('Profile API:', e.message);
      }
    }
    loadProfile();
  }, []);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
    const [mesInscriptions, setMesInscriptions] = useState([]);
  const [chargementInscriptions, setChargementInscriptions] = useState(false);
  const [annulationEnCours, setAnnulationEnCours] = useState(null);

  async function annulerUneInscription(registrationId) {
    setAnnulationEnCours(registrationId);
    try {
      await postsApi.annulerInscriptionParId(registrationId);
      setMesInscriptions(function(prev) { return prev.filter(function(i) { return i._id !== registrationId; }); });
    } catch (e) {
      console.log('Annulation inscription:', e.message);
    } finally {
      setAnnulationEnCours(null);
    }
  }

  useEffect(function() {
    if (activeTab !== 3) return;
    setChargementInscriptions(true);
    postsApi.getMesInscriptions().then(function(res) {
      setMesInscriptions((res && res.data && res.data.inscriptions) || []);
    }).catch(function(e) {
      console.log('Mes inscriptions:', e.message);
    }).finally(function() {
      setChargementInscriptions(false);
    });
  }, [activeTab]);

  useEffect(function() {
    if (!user) return;
    if (user.role === 'super_admin') {
      navigate('/admin', { replace: true });
      return;
    }
    if (user.role === 'parish_admin' && user.parishId) {
      navigate('/parishes/' + user.parishId, { replace: true });
    }
  }, [user, navigate]);
  const [rawPhoto, setRawPhoto] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const photo    = user?.profilePhoto || user?.avatarUrl || null;
  const prenom   = user?.firstName || 'Marie';
  const nom      = user?.lastName  || 'Diallo';
  const initiales = ((prenom[0] || 'M') + (nom[0] || 'D')).toUpperCase();
  const paroisse = user?.paroisse  || 'Saint-Pierre de Dakar';
  const ville    = user?.ville     || 'Dakar';
  const pays     = user?.pays      || 'Senegal';
  const email    = user?.email     || 'admin@jangubi.com';
  const phone    = user?.phone     || '+221 77 123 45 67';
  const since    = 'janvier 2023';
  const [editionInfos, setEditionInfos] = useState(false);
  const [dateNaissance, setDateNaissance] = useState(user?.dateNaissance ? user.dateNaissance.slice(0, 10) : '');
  const [sexe, setSexe] = useState(user?.sexe || '');
  const [enregistrementInfos, setEnregistrementInfos] = useState(false);
  const [erreurInfos, setErreurInfos] = useState('');

  useEffect(function() {
    setDateNaissance(user?.dateNaissance ? user.dateNaissance.slice(0, 10) : '');
    setSexe(user?.sexe || '');
  }, [user]);

      async function enregistrerInfosPersonnelles() {
    const payload = {};
    if (dateNaissance) payload.dateNaissance = dateNaissance;
    if (sexe) payload.sexe = sexe;
    if (Object.keys(payload).length === 0) {
      setErreurInfos('Renseigne au moins un des deux champs avant d\'enregistrer.');
      return;
    }
    setEnregistrementInfos(true);
    setErreurInfos('');
    try {
      const { userApi } = await import('../../services/api');
      const res = await userApi.updateMe(payload);
      if (updateUser && res && res.data && res.data.user) updateUser(res.data.user);
      setEditionInfos(false);
    } catch (e) {
      setErreurInfos(e.message || 'Erreur inconnue lors de l\'enregistrement.');
    } finally {
      setEnregistrementInfos(false);
    }
  }
  const faithLevel = Math.min(user?.faithLevel ?? 1, 4);
  const faithDays  = user?.faithDays ?? 34;
  const progress   = (faithLevel / 4) * 100;

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setRawPhoto(ev.target.result);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);
  }

  async function handleSavePhoto(cropped) {
    setShowEditor(false);
    setRawPhoto(null);
    if (updateUser) updateUser({ profilePhoto: cropped, avatarUrl: cropped });
    else {
      localStorage.setItem('jangubi_profile_photo', cropped);
    }
    try {
      const { userApi } = await import('../../services/api');
      await userApi.updateMe({ avatarUrl: cropped });
    } catch (e) {
      console.log('Sauvegarde photo profil:', e.message);
    }
  }

  return (
    <AppShell>
      {showEditor && rawPhoto && (
        <PhotoEditor src={rawPhoto} onSave={handleSavePhoto} onCancel={() => { setShowEditor(false); setRawPhoto(null); }}/>
      )}

      <div style={{ minHeight: '100vh', background: '#F5F0E8', backgroundImage: BOGOLAN, display: 'flex', flexDirection: 'column' }}>

        {/* HEADER IVOIRE */}
        <div style={{ background: '#F5F0E8', padding: '44px 16px 14px', flexShrink: 0 }}>

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: '#0D2B1F' }}>Mon Profil</div>
          </div>

          {/* Photo + infos + cierge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ width: 64, height: 64, borderRadius: '50%', background: photo ? 'transparent' : 'linear-gradient(135deg,#C8A84B,#8B7030)', border: '2.5px solid rgba(200,168,75,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, color: '#0C0A06', boxShadow: '0 3px 12px rgba(200,168,75,.2)', overflow: 'hidden', cursor: 'pointer' }}
              >
                {photo
                  ? <img src={photo} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : initiales
                }
              </div>
              <div onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', background: '#0D3B2E', border: '2px solid #F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 9 }}>📷</div>
              <div style={{ position: 'absolute', top: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#4ADE80', border: '2px solid #F5F0E8' }} />
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: '#0D2B1F', marginBottom: 2 }}>{prenom} {nom}</div>
              <div style={{ fontSize: 11, color: '#0D3B2E', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>⛪ {paroisse}</div>
              <div style={{ fontSize: 10, color: '#7A6E5E' }}>Membre depuis {since}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>🕯️</span>
              <span style={{ fontSize: 9, color: '#C8A84B', fontWeight: 700 }}>{faithDays}J</span>
            </div>
          </div>

          {/* ZONE NOIRE BOGOLAN */}
          <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, borderRadius: 14, padding: 12, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,168,75,.08),transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(200,168,75,.7)', marginBottom: 8 }}>✦ Mon Chemin de Foi</div>
              <div style={{ position: 'relative', marginBottom: 6 }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: progress + '%', height: '100%', background: 'linear-gradient(to right,#C8A84B,#E8C86A)', borderRadius: 4 }} />
                </div>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                  {FAITH_STEPS.map((_, i) => (
                    <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i <= faithLevel ? '#C8A84B' : 'rgba(255,255,255,.1)', border: '2px solid #0C0A06', marginTop: -3, boxShadow: i <= faithLevel ? '0 0 5px #C8A84B' : 'none' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                {FAITH_STEPS.map((s, i) => (
                  <span key={i} style={{ fontSize: 8, color: i <= faithLevel ? '#C8A84B' : 'rgba(245,239,228,.25)', fontWeight: i <= faithLevel ? 700 : 400 }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                {[{ v: '12', l: 'Dons' }, { v: '48k F', l: 'Total' }, { v: '34', l: 'Lives' }, { v: '5', l: 'Intentions' }].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(200,168,75,.08)', border: '1px solid rgba(200,168,75,.15)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: s.v.length > 3 ? 13 : 16, fontWeight: 700, color: '#C8A84B' }}>{s.v}</div>
                    <div style={{ fontSize: 8, color: 'rgba(245,239,228,.4)', marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ background: '#F5F0E8', borderBottom: '1px solid rgba(0,0,0,.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map((tab, i) => (
              <div key={i} onClick={() => { if (i === 4) { navigate('/settings'); } else { setActiveTab(i); } }} style={{ padding: '10px 14px', fontSize: 11, fontWeight: i === activeTab ? 700 : 400, color: i === activeTab ? '#0D3B2E' : '#7A6E5E', borderBottom: i === activeTab ? '2.5px solid #C8A84B' : '2.5px solid transparent', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' }}>{tab}</div>
            ))}
          </div>
        </div>

        {/* CONTENU */}
        <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeTab === 0 && (
            <>
              <div style={{ background: 'white', borderRadius: 14, padding: '12px 14px', boxShadow: '0 2px 10px rgba(13,59,46,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 700, color: '#0D2B1F' }}>Informations personnelles</div>
                  <div onClick={() => setEditionInfos(function(v) { return !v; })} style={{ fontSize: 10.5, color: '#8B6020', fontWeight: 700, cursor: 'pointer' }}>
                    {editionInfos ? 'Annuler' : '✏️ Modifier'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: editionInfos ? 12 : 0 }}>
                  {[
                    { icon: '👤', label: 'Prenom', value: prenom },
                    { icon: '👤', label: 'Nom', value: nom },
                    { icon: '✉️', label: 'Email', value: email },
                    { icon: '📱', label: 'Telephone', value: phone },
                    { icon: '📍', label: 'Ville', value: ville },
                    { icon: '🌍', label: 'Pays', value: pays },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 9, color: '#7A6E5E' }}>{item.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0D2B1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                  {!editionInfos && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>🎂</span>
                        <div>
                          <div style={{ fontSize: 9, color: '#7A6E5E' }}>Date de naissance</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#0D2B1F' }}>{dateNaissance ? new Date(dateNaissance).toLocaleDateString('fr-FR') : 'Non renseignee'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>⚧</span>
                        <div>
                          <div style={{ fontSize: 9, color: '#7A6E5E' }}>Sexe</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#0D2B1F' }}>{sexe === 'femme' ? 'Femme' : sexe === 'homme' ? 'Homme' : 'Non renseigne'}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {editionInfos && (
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                    <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 4 }}>Date de naissance</div>
                                                            <div style={{ width: '100%', overflow: 'hidden', borderRadius: 10, marginBottom: 10 }}>
                      <input
                        type="date"
                        value={dateNaissance}
                        onChange={function(e) { setDateNaissance(e.target.value); }}
                        style={{ width: '100%', minWidth: 0, maxWidth: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '8px 10px', fontSize: 16, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: '#0D2B1F', display: 'block' }}
                      />
                    </div>
                    <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 4 }}>Sexe</div>
                    <select
                      value={sexe}
                      onChange={function(e) { setSexe(e.target.value); }}
                      style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '8px 10px', fontSize: 12, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: '#0D2B1F', marginBottom: 12, background: '#fff' }}
                    >
                      <option value="">-- Choisir --</option>
                      <option value="homme">Homme</option>
                      <option value="femme">Femme</option>
                                        </select>
                    {erreurInfos && (
                      <div style={{ fontSize: 11, color: '#e53935', marginBottom: 10 }}>{erreurInfos}</div>
                    )}
                    <button
                      onClick={enregistrerInfosPersonnelles}
                      disabled={enregistrementInfos}
                      style={{ width: '100%', padding: 10, background: 'linear-gradient(135deg,#C8A84B,#8B7030)', border: 'none', borderRadius: 10, color: '#0D2B1F', fontWeight: 700, fontSize: 12, cursor: enregistrementInfos ? 'default' : 'pointer' }}
                    >
                      {enregistrementInfos ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, borderRadius: 14, padding: 14, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(200,168,75,.06),transparent)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>✝️</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontSize: 12, color: '#F5EFE4', lineHeight: 1.65, marginBottom: 6 }}>
                    « Vous etes la lumiere du monde. Que votre lumiere brille devant les hommes. »
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#C8A84B' }}>Matthieu 5, 14.16</div>
                </div>
              </div>
            </>
          )}
          {activeTab === 1 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 36 }}>🚧</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, color: '#7A6E5E', textAlign: 'center' }}>Section {TABS[activeTab]} bientot disponible</div>
            </div>
          )}

          {activeTab === 2 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 36 }}>📄</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, color: '#7A6E5E', textAlign: 'center' }}>Aucune demande pour l'instant</div>
            </div>
          )}

          {activeTab === 3 && (
            <>
              {chargementInscriptions && (
                <div style={{ textAlign: 'center', padding: 30, fontSize: 13, color: '#7A6E5E' }}>Chargement...</div>
              )}
              {!chargementInscriptions && mesInscriptions.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: '30px 0' }}>
                  <div style={{ fontSize: 36 }}>🎟️</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, color: '#7A6E5E', textAlign: 'center' }}>Aucune inscription pour l'instant</div>
                </div>
              )}
              {!chargementInscriptions && mesInscriptions.map(function(ins) {
                const evt = ins.postId;
                return (
                  <div key={ins._id} style={{ background: 'white', borderRadius: 14, padding: '12px 14px', boxShadow: '0 2px 10px rgba(13,59,46,.06)' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0D2B1F', fontFamily: 'Georgia,serif', marginBottom: 4 }}>
                      {evt && evt.content ? evt.content : 'Evenement'}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#7A6E5E', marginBottom: 2 }}>
                      {(ins.participants || []).length} personne(s) inscrite(s)
                    </div>
                    <div style={{ fontSize: 9.5, color: '#9A8E7E' }}>
                    Inscrit le {ins.createdAt ? new Date(ins.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' }) : ''}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
