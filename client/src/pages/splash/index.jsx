import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import sanctuaire from '../../assets/sanctuaire.png';

const FL = [
  { b: 0.55, s: 0,  sat: 1.0 },
  { b: 0.72, s: 18, sat: 1.3 },
  { b: 0.90, s: 38, sat: 1.5 },
  { b: 1.08, s: 62, sat: 1.7 },
  { b: 1.28, s: 90, sat: 2.0 },
];

export default function SplashPage() {
  const nav = useNavigate();
  const { user: u } = useAuth();
  const cR       = useRef(null);
  const flameRef = useRef(null);
  const glowRef  = useRef(null);
  const raysRef  = useRef(null);

  const ini = u ? ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() : 'MD';
  const fl  = u?.faithLevel ?? 0;

  useEffect(() => {
    const s = FL[Math.min(fl, 4)];
    if (cR.current) cR.current.style.filter = 'brightness(' + s.b + ') sepia(' + s.s + '%) saturate(' + s.sat + ')';
  }, [fl]);

  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.06;
      const sx = 1 + Math.sin(t * 1.4) * 0.07;
      const sy = 1 + Math.cos(t * 0.9) * 0.05;
      const glowScale = 1 + Math.sin(t * 0.8) * 0.12;
      const glowOp = 0.6 + Math.sin(t) * 0.2;
      
      if (flameRef.current) flameRef.current.style.transform = 'scaleX(' + sx + ') scaleY(' + sy + ')';
      if (glowRef.current) {
        glowRef.current.style.opacity   = String(glowOp);
        glowRef.current.style.transform = 'scale(' + glowScale + ')';
      }
      // Rayons proportionnels a l intensite du feu
      if (raysRef.current) {
        raysRef.current.style.opacity = String(0.55 + Math.sin(t * 0.8) * 0.15);
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f5f5f0', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, height: '100%', background: '#0C0A06', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Bogolan */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,1) 8px,rgba(200,168,75,1) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,1) 8px,rgba(200,168,75,1) 9px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Rayons derriere l eglise zIndex:0 */}
        <svg ref={raysRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.28, transition: 'opacity 0.1s' }} viewBox="0 0 430 700" preserveAspectRatio="none">
          <defs>
            <radialGradient id="rayGlow" cx="50%" cy="8%" r="85%" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#C8A84B" stopOpacity="0.4"/>
              <stop offset="40%" stopColor="#C8A84B" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="r1" x1="215" y1="55" x2="-500" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8C84B" stopOpacity="0.55"/>
              <stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="r2" x1="215" y1="55" x2="-150" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8C84B" stopOpacity="0.65"/>
              <stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="r3" x1="215" y1="55" x2="60" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8C84B" stopOpacity="0.72"/>
              <stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="r4" x1="215" y1="55" x2="215" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8C84B" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="r5" x1="215" y1="55" x2="370" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8C84B" stopOpacity="0.72"/>
              <stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="r6" x1="215" y1="55" x2="580" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8C84B" stopOpacity="0.65"/>
              <stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="r7" x1="215" y1="55" x2="800" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8C84B" stopOpacity="0.55"/>
              <stop offset="100%" stopColor="#C8A84B" stopOpacity="0"/>
            </linearGradient>
          </defs>

          {/* Halo autour de la flamme */}
          <ellipse cx="215" cy="55" rx="80" ry="60" fill="url(#rayGlow)"/>

          {/* Bandes larges bien espacees */}
          <polygon points="215,55  -600,700  -400,700" fill="url(#r1)"/>
          <polygon points="215,55  -200,700   -30,700" fill="url(#r2)"/>
          <polygon points="215,55    40,700   140,700" fill="url(#r3)"/>
          <polygon points="215,55   185,700   255,700" fill="url(#r4)"/>
          <polygon points="215,55   290,700   390,700" fill="url(#r5)"/>
          <polygon points="215,55   460,700   610,700" fill="url(#r6)"/>
          <polygon points="215,55   700,700   900,700" fill="url(#r7)"/>
        </svg>

        {/* Eglise — par-dessus les rayons */}
        <img ref={cR} src={sanctuaire} alt="Sanctuaire" style={{ position: 'absolute', top: '36%', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '55%', objectFit: 'cover', objectPosition: 'top', zIndex: 1, transition: 'filter 1.4s ease', filter: 'brightness(.65) sepia(0%) saturate(1)' }} />

        {/* Boutons */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 28px 22px', background: 'linear-gradient(to top,rgba(12,10,6,.97) 55%,transparent)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', zIndex: 10 }}>
          <button onClick={() => nav('/register')} style={{ width: '100%', maxWidth: 280, padding: '10px 0', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', color: '#1e2d14', border: 'none', borderRadius: 50, fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 800, letterSpacing: '.04em', cursor: 'pointer' }}>
            Allumer ma flamme
          </button>
          <button onClick={() => nav('/login')} style={{ width: '100%', maxWidth: 280, padding: '9px 0', background: 'transparent', color: 'rgba(245,239,228,.82)', border: '1px solid rgba(245,239,228,.22)', borderRadius: 50, fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, letterSpacing: '.04em', cursor: 'pointer' }}>
            Se connecter
          </button>
        </div>

        {/* Cierge + texte — par-dessus tout */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, zIndex: 4, position: 'relative', flexShrink: 0 }}>

          <svg width="44" height="110" viewBox="0 0 50 140" fill="none" style={{ marginBottom: 8 }}>
            <defs>
              <radialGradient id="flameOut" cx="50%" cy="85%" r="55%">
                <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.95"/>
                <stop offset="45%" stopColor="#FF4500" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#CC2200" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="flameMid" cx="50%" cy="88%" r="50%">
                <stop offset="0%" stopColor="#FFE066" stopOpacity="1"/>
                <stop offset="55%" stopColor="#FFAA00" stopOpacity="0.85"/>
                <stop offset="100%" stopColor="#FF6600" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="flameCore" cx="50%" cy="92%" r="40%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1"/>
                <stop offset="40%" stopColor="#FFF5CC" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#FFE066" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFB830" stopOpacity="0.35"/>
                <stop offset="100%" stopColor="#FF4400" stopOpacity="0"/>
              </radialGradient>
              <linearGradient id="candleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C8B890"/>
                <stop offset="20%" stopColor="#F8F0DC"/>
                <stop offset="50%" stopColor="#EDE0C0"/>
                <stop offset="100%" stopColor="#B8A878"/>
              </linearGradient>
            </defs>
            <ellipse ref={glowRef} cx="25" cy="25" rx="18" ry="14" fill="url(#glowGrad)"/>
            <path d="M25 6 C25 6 15 18 13 28 C11 36 14 43 25 43 C36 43 39 36 37 28 C35 18 25 6 25 6Z" fill="url(#flameOut)" ref={flameRef} style={{ transformOrigin: '25px 43px' }}/>
            <path d="M25 13 C25 13 18 23 17 30 C16 37 18 42 25 42 C32 42 34 37 33 30 C32 23 25 13 25 13Z" fill="url(#flameMid)"/>
            <path d="M25 22 C25 22 20 29 20 34 C20 39 22 42 25 42 C28 42 30 39 30 34 C30 29 25 22 25 22Z" fill="url(#flameCore)"/>
            <rect x="24" y="43" width="2" height="7" rx="1" fill="#2A1A0A"/>
            <path d="M18 50 Q19 47 25 47 Q31 47 32 50 L33 56 Q27 53 25 54 Q23 53 17 56Z" fill="#F0E4C0"/>
            <rect x="17" y="50" width="16" height="85" rx="2" fill="url(#candleGrad)"/>
            <rect x="19" y="52" width="3" height="81" rx="1.5" fill="rgba(255,255,255,0.22)"/>
            <line x1="17" y1="70"  x2="33" y2="70"  stroke="rgba(180,160,100,.15)" strokeWidth="0.5"/>
            <line x1="17" y1="88"  x2="33" y2="88"  stroke="rgba(180,160,100,.12)" strokeWidth="0.5"/>
            <line x1="17" y1="106" x2="33" y2="106" stroke="rgba(180,160,100,.1)"  strokeWidth="0.5"/>
            <text x="25" y="84"  textAnchor="middle" fontFamily="Georgia,serif" fontSize="8" fontWeight="700" fill="rgba(120,80,20,0.55)">{ini[0] || 'M'}</text>
            <text x="25" y="96" textAnchor="middle" fontFamily="Georgia,serif" fontSize="8" fontWeight="700" fill="rgba(120,80,20,0.55)">{ini[1] || 'D'}</text>
            <rect x="14" y="133" width="22" height="5" rx="2.5" fill="#B8A878" opacity="0.6"/>
          </svg>

          <div style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700, color: '#F5EFE4', letterSpacing: '.18em', marginBottom: 2, textAlign: 'center', textShadow: '0 0 30px rgba(200,168,75,.3)' }}>JANGU BI</div>
          <div style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontSize: 11.5, color: 'rgba(245,239,228,.45)', textAlign: 'center', lineHeight: 1.75, padding: '0 18px' }}>
            Votre foi, votre Eglise,<br />votre communaute — toujours avec vous.
          </div>
        </div>

      </div>
    </div>
  );
}
