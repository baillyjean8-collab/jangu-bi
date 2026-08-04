/**
 * client/src/components/live/GiftSendAnimation.jsx
 *
 * Rejoue l'animation d'un cadeau envoyé pendant un live.
 * Usage dans LiveScreen.jsx :
 *
 *   import GiftSendAnimation from '../../components/live/GiftSendAnimation';
 *   import { findGiftByCode } from '../../data/giftsCatalog';
 *   ...
 *   const [activeGift, setActiveGift] = useState(null); // { gift, senderName }
 *
 *   // sur reception socket 'live:gift' :
 *   socket.on('live:gift', (data) => {
 *     const gift = findGiftByCode(data.giftCode);
 *     if (gift) setActiveGift({ gift, senderName: data.senderNameSnapshot });
 *   });
 *   ...
 *   {activeGift && (
 *     <GiftSendAnimation
 *       gift={activeGift.gift}
 *       senderName={activeGift.senderName}
 *       onComplete={() => setActiveGift(null)}
 *     />
 *   )}
 *
 * L'animation se joue une fois puis appelle onComplete — le parent est
 * responsable de démonter le composant (ou de vider activeGift).
 */
import { useEffect, useRef } from 'react';
import './GiftSendAnimation.css';

function tierFromPrice(prix) {
  if (prix >= 7000) return 'mythic';
  if (prix >= 3000) return 'legend';
  if (prix >= 1000) return 'high';
  if (prix >= 200) return 'mid';
  return 'simple';
}

const HEIGHT_BY_TIER = { simple: 80, mid: 92, high: 104, legend: 118, mythic: 132 };

export default function GiftSendAnimation({ gift, senderName, onComplete }) {
  const fxLayerRef = useRef(null);
  const sceneLayerRef = useRef(null);
  const legendFlashRef = useRef(null);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const fxLayer = fxLayerRef.current;
    const sceneLayer = sceneLayerRef.current;
    const legendFlash = legendFlashRef.current;
    if (!fxLayer || !sceneLayer || !gift) return;

    const tier = tierFromPrice(gift.prix);
    const heightBase = HEIGHT_BY_TIER[tier];

    const addTimeout = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timeoutsRef.current.push(id);
      return id;
    };

    function addParticles(n, opts) {
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        el.className = 'gsa-p gsa-go';
        const angle = Math.random() * Math.PI * 2;
        const dist = opts.minDist + Math.random() * opts.spread;
        el.style.setProperty('--dx', `${Math.cos(angle) * dist + (opts.driftX || 0)}px`);
        el.style.setProperty('--dy', `${Math.sin(angle) * dist + (opts.driftY || 0)}px`);
        el.style.setProperty('--rot', `${Math.random() * 360}deg`);
        el.style.setProperty('--sc', opts.endScale || 0.4);
        el.style.animationDuration = `${opts.dur || 1.2}s`;
        el.style.animationDelay = `${(opts.baseDelay || 0) + Math.random() * (opts.delaySpread || 0)}s`;
        el.style.left = opts.originLeft || '50%';
        el.style.top = opts.originTop || '50%';
        Object.assign(el.style, opts.style || {});
        fxLayer.appendChild(el);
      }
    }

    function addRings(n, delayBase = 0) {
      for (let i = 0; i < n; i++) {
        const r = document.createElement('div');
        r.className = 'gsa-ring gsa-go';
        const size = 44 + i * 28;
        r.style.width = `${size}px`;
        r.style.height = `${size}px`;
        r.style.left = `calc(50% - ${size / 2}px)`;
        r.style.top = `calc(46% - ${size / 2}px)`;
        r.style.animationDuration = '1.3s';
        r.style.animationDelay = `${delayBase + i * 0.18}s`;
        fxLayer.appendChild(r);
      }
    }

    function addRays(n, len, delayBase = 0) {
      for (let i = 0; i < n; i++) {
        const ray = document.createElement('div');
        ray.className = 'gsa-ray gsa-go';
        ray.style.left = '50%';
        ray.style.top = '46%';
        ray.style.transform = `rotate(${(360 / n) * i}deg)`;
        ray.style.setProperty('--len', `${len}px`);
        ray.style.animationDuration = '0.9s';
        ray.style.animationDelay = `${delayBase + i * 0.02}s`;
        fxLayer.appendChild(ray);
      }
    }

    function addHalo(sizeMul) {
      const halo = document.createElement('div');
      halo.className = 'gsa-halo gsa-go';
      const hs = heightBase * sizeMul;
      halo.style.width = `${hs}px`;
      halo.style.height = `${hs}px`;
      halo.style.left = `calc(50% - ${hs / 2}px)`;
      halo.style.top = `calc(46% - ${hs / 2}px)`;
      fxLayer.appendChild(halo);
    }

    function addAmbientGlow() {
      const glow = document.createElement('div');
      const sz = heightBase * (tier === 'mythic' ? 2.6 : tier === 'legend' ? 2.2 : 1.8);
      glow.style.position = 'absolute';
      glow.style.left = '50%';
      glow.style.top = '46%';
      glow.style.width = `${sz}px`;
      glow.style.height = `${sz}px`;
      glow.style.transform = 'translate(-50%,-50%)';
      glow.style.borderRadius = '50%';
      glow.style.background =
        'radial-gradient(circle, rgba(200,168,75,0.28) 0%, rgba(200,168,75,0.08) 45%, transparent 72%)';
      glow.style.opacity = '0';
      glow.style.animation = 'gsa-glowpulse 2.4s ease-in-out forwards';
      fxLayer.appendChild(glow);
    }

    function addAppearFlash() {
      const flash = document.createElement('div');
      const sz = heightBase * 0.9;
      flash.style.position = 'absolute';
      flash.style.left = '50%';
      flash.style.top = '46%';
      flash.style.width = `${sz}px`;
      flash.style.height = `${sz}px`;
      flash.style.transform = 'translate(-50%,-50%)';
      flash.style.borderRadius = '50%';
      flash.style.background =
        'radial-gradient(circle, rgba(255,250,230,0.95) 0%, rgba(255,250,230,0) 70%)';
      flash.style.opacity = '0';
      flash.style.animation = 'gsa-appearflash .5s ease-out forwards';
      fxLayer.appendChild(flash);
    }

    function buildImg(src, heightPx, motionClass, extraStyle) {
      const img = document.createElement('img');
      img.src = src;
      img.className = motionClass;
      img.style.position = 'absolute';
      img.style.left = '50%';
      img.style.top = '46%';
      img.style.height = `${heightPx}px`;
      img.style.maxWidth = '190px';
      img.style.objectFit = 'contain';
      img.style.filter = 'drop-shadow(0 4px 10px rgba(0,0,0,.7))';
      if (extraStyle) Object.assign(img.style, extraStyle);
      return img;
    }

    // --- Nettoyage avant de rejouer ---
    fxLayer.innerHTML = '';
    sceneLayer.innerHTML = '';
    legendFlash.classList.remove('gsa-play');
    void legendFlash.offsetWidth;

    addAmbientGlow();
    addAppearFlash();

    const fx = gift.fx;
    const src = gift.image;

    if (fx === 'flame') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-flicker'));
      addParticles(6, { minDist: 5, spread: 14, driftY: -60, dur: 1.7, delaySpread: 0.6, endScale: 0.2, originTop: '25%', style: { width: '4px', height: '4px', borderRadius: '50%', background: '#f0c169' } });
    } else if (fx === 'beam') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-rise'));
      const beam = document.createElement('div');
      beam.style.position = 'absolute';
      beam.style.left = 'calc(50% - 2px)';
      beam.style.top = '0';
      beam.style.bottom = '0';
      beam.style.width = '4px';
      beam.style.background = 'linear-gradient(180deg, rgba(200,168,75,0.9), transparent)';
      beam.style.opacity = '0';
      beam.style.animation = 'gsa-legendflash .9s ease-out .4s forwards';
      fxLayer.appendChild(beam);
    } else if (fx === 'orbit') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-rise'));
      addRings(2);
    } else if (fx === 'mistpulse') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-rise'));
      addRings(3);
      addRings(2, 0.6);
    } else if (fx === 'crownshine') {
      const wrap = document.createElement('div');
      wrap.style.position = 'absolute';
      wrap.style.left = '50%';
      wrap.style.top = '46%';
      wrap.style.transform = 'translate(-50%,-50%)';
      wrap.className = 'gsa-rise';
      wrap.style.overflow = 'hidden';
      wrap.style.height = `${heightBase}px`;
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      const img = document.createElement('img');
      img.src = src;
      img.style.height = '100%';
      img.style.maxWidth = '190px';
      img.style.objectFit = 'contain';
      img.style.filter = 'drop-shadow(0 4px 10px rgba(0,0,0,.7))';
      wrap.appendChild(img);
      const shine = document.createElement('div');
      shine.className = 'gsa-shine gsa-go';
      wrap.appendChild(shine);
      sceneLayer.appendChild(wrap);
      addRings(2);
    } else if (fx === 'swayglow') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-sway'));
      addTimeout(() => {
        const beam = document.createElement('div');
        beam.style.position = 'absolute';
        beam.style.left = 'calc(50% - 2px)';
        beam.style.top = '0';
        beam.style.bottom = '0';
        beam.style.width = '4px';
        beam.style.background = 'linear-gradient(180deg, rgba(200,168,75,0.9), transparent)';
        beam.style.opacity = '0';
        beam.style.animation = 'gsa-legendflash .8s ease-out forwards';
        fxLayer.appendChild(beam);
      }, 900);
    } else if (fx === 'fly') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-fly'));
      addParticles(6, { minDist: 0, spread: 6, driftX: -50, driftY: 8, dur: 1.6, delaySpread: 0.5, endScale: 0.2, style: { width: '6px', height: '3px', borderRadius: '50%', background: '#F4EFE3' } });
    } else if (fx === 'wingsdesc') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-rise'));
      addParticles(6, { minDist: 20, spread: 30, driftY: -20, dur: 1.6, delaySpread: 0.4, endScale: 0.2, style: { width: '3px', height: '3px', borderRadius: '50%', background: '#F4EFE3' } });
    } else if (fx === 'halo') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-rise'));
      addHalo(1.6);
    } else if (fx === 'heartflame') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-heartbeat'));
      addParticles(5, { minDist: 5, spread: 12, driftY: -55, dur: 1.7, delaySpread: 0.5, endScale: 0.2, originTop: '20%', style: { width: '4px', height: '4px', borderRadius: '50%', background: '#f0906c' } });
    } else if (fx === 'fillglow') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-rise'));
      addRings(1);
    } else if (fx === 'bookopen') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-bookopen'));
      addRays(10, heightBase * 1.1, 0.9);
    } else if (fx === 'confrontSingle') {
      sceneLayer.appendChild(buildImg(src, Math.round(heightBase * 1.15), 'gsa-swoop'));
      addTimeout(() => {
        const slash = document.createElement('div');
        slash.style.position = 'absolute';
        slash.style.left = '15%';
        slash.style.top = '20%';
        slash.style.width = '120px';
        slash.style.height = '5px';
        slash.style.background = 'linear-gradient(90deg, transparent, rgba(244,239,227,0.95), rgba(200,168,75,0.8), transparent)';
        slash.style.transform = 'rotate(38deg)';
        slash.style.opacity = '0';
        slash.style.transformOrigin = '0 50%';
        slash.style.animation = 'gsa-legendflash .7s ease-out forwards';
        fxLayer.appendChild(slash);
        addParticles(9, { minDist: 15, spread: 35, driftY: 0, dur: 1.3, delaySpread: 0.15, endScale: 0.2, style: { width: '3px', height: '3px', borderRadius: '50%', background: '#F4EFE3' } });
      }, 500);
    } else if (fx === 'heartbeatRays') {
      sceneLayer.appendChild(buildImg(src, Math.round(heightBase * 1.1), 'gsa-heartbeat'));
      addRays(10, heightBase * 0.9, 0.3);
    } else if (fx === 'riseGentle') {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-rise'));
      addRings(2);
      addParticles(6, { minDist: 15, spread: 30, driftY: 25, dur: 1.9, delaySpread: 0.5, endScale: 0.35, style: { width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle,#F4EFE3,#d8c9a3)' } });
    } else if (fx === 'sunburst') {
      sceneLayer.appendChild(buildImg(src, Math.round(heightBase * 1.1), 'gsa-heartbeat'));
      addRays(16, 170);
      addRings(4);
      addParticles(14, { minDist: 0, spread: 0, driftX: 0, driftY: 130, dur: 2.2, delaySpread: 0.6, endScale: 0.5, originTop: '-10%', style: { width: '5px', height: '8px', borderRadius: '1px', background: '#C8A84B' } });
      legendFlash.classList.add('gsa-play');
    } else if (fx === 'emerge') {
      sceneLayer.appendChild(buildImg(src, Math.round(heightBase * 1.15), 'gsa-emerge'));
      addRays(16, 170);
      addRings(4);
      legendFlash.classList.add('gsa-play');
    } else if (fx === 'lettersAmen' || fx === 'lettersAlleluia' || fx === 'lettersHosanna') {
      const letters = gift.letters || [];
      const n = letters.length;
      const gap = fx === 'lettersAmen' ? 34 : fx === 'lettersAlleluia' ? 26 : 30;
      const letterHeight = fx === 'lettersAmen' ? 44 : fx === 'lettersAlleluia' ? 36 : 38;
      const totalW = n * gap;
      letters.forEach((letterSrc, i) => {
        const el = document.createElement('img');
        el.src = letterSrc;
        el.className = 'gsa-letterdrop';
        el.style.position = 'absolute';
        el.style.left = `calc(50% - ${totalW / 2}px + ${i * gap}px)`;
        el.style.top = '46%';
        el.style.height = `${letterHeight}px`;
        el.style.filter = 'drop-shadow(0 3px 8px rgba(0,0,0,.7))';
        el.style.animationDelay = `${i * (fx === 'lettersAlleluia' ? 0.09 : 0.1)}s`;
        sceneLayer.appendChild(el);
      });
      addRays(8, heightBase * 1.1, 0.5);
    } else {
      sceneLayer.appendChild(buildImg(src, heightBase, 'gsa-rise'));
      addRings(2);
    }

    if ((tier === 'legend' || tier === 'mythic') && !['sunburst', 'emerge'].includes(fx)) {
      legendFlash.classList.add('gsa-play');
    }

    // Fin d'animation -> notifie le parent pour démonter le composant.
    // 2.6s = duree de la banniere, la plus longue transition utilisee.
    const endTimeout = addTimeout(() => {
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      clearTimeout(endTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gift]);

  if (!gift) return null;

  return (
    <div className="gsa-stage">
      <div ref={legendFlashRef} className="gsa-legend-flash" />
      <div ref={fxLayerRef} className="gsa-fx-layer" />
      <div ref={sceneLayerRef} className="gsa-scene-layer" />
      <div className="gsa-banner gsa-banner-play">
        <div className="gsa-banner-txt">
          <b>{senderName}</b> a offert : <span>{gift.nom}</span>
        </div>
        <div className="gsa-banner-prix">{gift.prix.toLocaleString('fr-FR')} F</div>
      </div>
    </div>
  );
}
