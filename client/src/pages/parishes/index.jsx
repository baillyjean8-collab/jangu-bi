import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';

const OR      = '#C8A84B';
const VERT    = '#1e2d14';
const IVOIRE  = '#F5F0E8';
const BOGOLAN      = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

// Couleurs d'avatar par initiales
const AVATAR_COLORS = [
  'linear-gradient(135deg,#1e2d14,#0C0A06)',
  'linear-gradient(135deg,#1565C0,#0a2a5e)',
  'linear-gradient(135deg,#6a1b9a,#2d0050)',
  'linear-gradient(135deg,#b71c1c,#4a0000)',
  'linear-gradient(135deg,#0d47a1,#002171)',
  'linear-gradient(135deg,#1b5e20,#0a2e0a)',
  'linear-gradient(135deg,#4a148c,#1a0030)',
  'linear-gradient(135deg,#004d40,#001a15)',
  'linear-gradient(135deg,#e65100,#6e2700)',
  'linear-gradient(135deg,#880e4f,#3a0020)',
];

function getAvatarColor(nom) {
  let hash = 0;
  for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitiales(nom) {
  return nom.replace(/^(Paroisse|Cathédrale|Chapelle|Abbaye|Sanctuaire|Notre-Dame|Saint|Sainte)\s*/i, '')
    .split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

const paroisses = [
  { id: 1,  nom: "Cathédrale Notre-Dame des Victoires", ville: "Dakar",          region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Cathédrale", horaires: "07h – 19h",   phone: "+221 33 889 06 00", distance: "1.2 km",   ouvert: true, messes: ["07h00","09h00","11h00","18h30"], coords: { lat: 14.6937, lng: -17.4441 } },
  { id: 2,  nom: "Paroisse Sacré-Cœur",                 ville: "Dakar",          region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Paroisse",   horaires: "06h – 20h",   phone: "+221 33 821 12 34", distance: "3.1 km",   ouvert: true, messes: ["06h30","09h00","11h00","19h00"], coords: { lat: 14.6857, lng: -17.4357 } },
  { id: 3,  nom: "Paroisse Saint-Joseph",               ville: "Dakar",          region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Paroisse",   horaires: "06h30 – 19h", phone: "+221 33 822 15 60", distance: "3.5 km",   ouvert: true, messes: ["06h30","09h00","11h00","18h00"], coords: { lat: 14.6877, lng: -17.4420 } },
  { id: 4,  nom: "Paroisse Sainte-Thérèse",             ville: "Dakar",          region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Paroisse",   horaires: "06h – 19h30", phone: "+221 33 821 09 87", distance: "4.0 km",   ouvert: true, messes: ["06h00","09h00","11h30","18h30"], coords: { lat: 14.6900, lng: -17.4390 } },
  { id: 5,  nom: "Paroisse Saint-François-d'Assise",    ville: "Médina, Dakar",  region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Paroisse",   horaires: "06h – 19h",   phone: "+221 33 823 14 22", distance: "4.2 km",   ouvert: true, messes: ["06h00","09h00","11h00","18h00"], coords: { lat: 14.6920, lng: -17.4410 } },
  { id: 6,  nom: "Paroisse Saint-Paul",                 ville: "Grand Dakar",    region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Paroisse",   horaires: "06h – 19h",   phone: "+221 33 824 11 55", distance: "5.0 km",   ouvert: true, messes: ["06h00","09h00","11h00","18h00"], coords: { lat: 14.7150, lng: -17.4450 } },
  { id: 7,  nom: "Paroisse Saint-Pierre",               ville: "Yoff, Dakar",    region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Paroisse",   horaires: "06h30 – 19h", phone: "+221 33 820 33 44", distance: "12.0 km",  ouvert: true, messes: ["06h30","09h00","11h00","18h00"], coords: { lat: 14.7500, lng: -17.4900 } },
  { id: 8,  nom: "Paroisse Christ-Roi",                 ville: "HLM, Dakar",     region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Paroisse",   horaires: "07h – 19h",   phone: "+221 33 825 44 77", distance: "6.3 km",   ouvert: true, messes: ["07h00","09h00","11h00","18h00"], coords: { lat: 14.7200, lng: -17.4470 } },
  { id: 15, nom: "Notre-Dame de la Délivrande",         ville: "Popenguine",     region: "Thiès",       diocese: "Archidiocèse de Dakar",  type: "Sanctuaire", horaires: "07h – 18h",   phone: "+221 33 957 71 02", distance: "78.0 km",  ouvert: true, messes: ["07h00","10h00","17h00"],         coords: { lat: 14.5200, lng: -17.0000 } },
  { id: 17, nom: "Abbaye Notre-Dame de Keur Moussa",    ville: "Keur Moussa",    region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Abbaye",     horaires: "06h – 17h",   phone: "+221 33 959 52 62", distance: "40.0 km",  ouvert: true, messes: ["06h30","10h00","17h00"],         coords: { lat: 14.8100, lng: -17.1500 } },
  { id: 19, nom: "Cathédrale Sainte-Anne",              ville: "Thiès",          region: "Thiès",       diocese: "Diocèse de Thiès",       type: "Cathédrale", horaires: "07h – 19h",   phone: "+221 33 951 10 22", distance: "70.0 km",  ouvert: true, messes: ["07h00","09h00","11h00","18h30"], coords: { lat: 14.7896, lng: -16.9356 } },
  { id: 25, nom: "Cathédrale Saint-Louis",              ville: "Saint-Louis",    region: "Saint-Louis", diocese: "Diocèse de Saint-Louis", type: "Cathédrale", horaires: "07h – 18h",   phone: "+221 33 961 10 44", distance: "265.0 km", ouvert: true, messes: ["07h00","09h00","11h00","18h00"], coords: { lat: 16.0179, lng: -16.5017 } },
  { id: 30, nom: "Cathédrale Saint-Théophile",          ville: "Kaolack",        region: "Kaolack",     diocese: "Diocèse de Kaolack",     type: "Cathédrale", horaires: "07h – 18h30", phone: "+221 33 941 10 77", distance: "195.0 km", ouvert: true, messes: ["07h00","09h00","11h00","18h00"], coords: { lat: 14.1500, lng: -16.0720 } },
  { id: 35, nom: "Cathédrale Saint-Antoine-de-Padoue",  ville: "Ziguinchor",     region: "Ziguinchor",  diocese: "Diocèse de Ziguinchor",  type: "Cathédrale", horaires: "07h – 19h",   phone: "+221 33 991 10 88", distance: "458.0 km", ouvert: true, messes: ["07h00","09h00","11h00","18h00"], coords: { lat: 12.5602, lng: -16.2730 } },
  { id: 44, nom: "Cathédrale Marie Reine de l'Univers", ville: "Tambacounda",    region: "Tambacounda", diocese: "Diocèse de Tambacounda", type: "Cathédrale", horaires: "07h – 18h30", phone: "+221 33 981 10 22", distance: "468.0 km", ouvert: true, messes: ["07h00","09h00","11h00","18h00"], coords: { lat: 13.7700, lng: -13.6700 } },
  { id: 18, nom: "Église Saint-Charles-Borromée",       ville: "Île de Gorée",   region: "Dakar",       diocese: "Archidiocèse de Dakar",  type: "Chapelle",   horaires: "08h – 17h",   phone: "+221 33 821 00 00", distance: "3.0 km",   ouvert: true, messes: ["08h00","11h00"],                 coords: { lat: 14.6690, lng: -17.3980 } },
];

const REGIONS  = ['Tous', 'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Fatick'];
const TYPES    = ['Tous', 'Cathédrale', 'Paroisse', 'Chapelle', 'Abbaye', 'Sanctuaire'];

function Chip({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
      borderRadius: 20, fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap',
      fontFamily: 'Georgia,serif', fontWeight: 700, flexShrink: 0,
      background: active ? VERT : 'white',
      color: active ? IVOIRE : '#5A5045',
      border: active ? 'none' : '1px solid rgba(0,0,0,0.08)',
      transition: 'all .2s',
    }}>
      {label}
    </div>
  );
}

function ParoisseCard({ p, suivi, onToggleSuivi, onClick }) {
  const initiales = getInitiales(p.nom);
  const avatarBg  = p.photo ? 'none' : getAvatarColor(p.nom);

  return (
    <div onClick={onClick} style={{
      background: 'white', borderRadius: 16, padding: '12px 12px 10px',
      border: suivi ? `1.5px solid rgba(200,168,75,0.35)` : '1px solid rgba(0,0,0,0.06)',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Avatar rond */}
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: avatarBg, border: `2px solid ${OR}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden',
        }}>
          {p.photo
            ? <img src={p.photo} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initiales || <i className="ti ti-building-church" style={{ fontSize: 19, color: OR }} />
          }
        </div>

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif', lineHeight: 1.3, marginRight: 6 }}>
              {p.nom}
            </div>
            <span style={{ fontSize: 9, color: p.distance ? OR : '#7A6E5E', fontWeight: 700, flexShrink: 0 }}>
              {p.distance || ''}
            </span>
          </div>
          <div style={{ fontSize: 9, color: '#7A6E5E', marginBottom: 5, fontFamily: 'Georgia,serif' }}>
            {p.ville} · {p.diocese}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ background: '#e8f5e9', color: VERT, padding: '2px 7px', borderRadius: 20, fontSize: 8, fontWeight: 700, fontFamily: 'Georgia,serif' }}>
              {p.type}
            </span>
            {p.ouvert && (
              <span style={{ background: 'rgba(200,168,75,0.12)', color: '#8B6020', padding: '2px 7px', borderRadius: 20, fontSize: 8, fontWeight: 700, fontFamily: 'Georgia,serif' }}>
                ✓ {p.horaires}
              </span>
            )}
            {p.messes?.length > 0 && (
              <span style={{ background: '#f0ece4', color: '#5A5045', padding: '2px 7px', borderRadius: 8, fontSize: 8, fontFamily: 'Georgia,serif' }}>
                {p.messes.slice(0, 3).join(' · ')}{p.messes.length > 3 ? ` +${p.messes.length - 3}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Boutons action */}
      <div style={{ display: 'flex', gap: 7, marginTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 8 }}>
        <button
          onClick={e => { e.stopPropagation(); window.open(`https://maps.google.com/?q=${p.coords?.lat},${p.coords?.lng}`); }}
          style={{ flex: 1, padding: 7, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 9, fontSize: 9, color: '#5A5045', cursor: 'pointer', fontFamily: 'Georgia,serif' }}
        >
          <i className="ti ti-map" style={{ fontSize: 10 }} /> Itinéraire
        </button>
        <button
          onClick={e => { e.stopPropagation(); window.open(`tel:${p.phone}`); }}
          style={{ flex: 1, padding: 7, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 9, fontSize: 9, color: '#5A5045', cursor: 'pointer', fontFamily: 'Georgia,serif' }}
        >
          <i className="ti ti-phone" style={{ fontSize: 10 }} /> Appeler
        </button>
        <button
          onClick={e => { e.stopPropagation(); onToggleSuivi(p.id); }}
          style={{
            flex: 1, padding: 7, border: 'none', borderRadius: 9, fontSize: 9,
            cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 700,
            background: suivi ? 'linear-gradient(135deg,#C8A84B,#8B6020)' : '#f0ece4',
            color: suivi ? VERT : VERT,
          }}
        >
          {suivi ? '✓ Suivi' : '+ Suivre'}
        </button>
      </div>
    </div>
  );
}

// ── Composant carte Leaflet ──────────────────────────────────────────────────
function MapView({ paroisses, suivis, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) return; // Déjà initialisée

    // Charger Leaflet dynamiquement
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [14.6928, -17.4467],
        zoom: 8,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      // Ajouter marqueurs
      paroisses.forEach(p => {
        if (!p.coords?.lat || !p.coords?.lng) return;
        const estSuivi = suivis.has(p.id);
        const icon = L.divIcon({
          html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${estSuivi ? '#C8A84B' : '#1e2d14'};
            border:2px solid ${estSuivi ? '#8B6020' : '#C8A84B'};
            display:flex;align-items:center;justify-content:center;
            font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);
          ">⛪</div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([p.coords.lat, p.coords.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:Georgia,serif;min-width:160px;">
            <div style="font-weight:700;font-size:12px;color:#1e2d14;margin-bottom:4px;">${p.nom}</div>
            <div style="font-size:10px;color:#7A6E5E;margin-bottom:6px;">${p.ville} · ${p.type}</div>
            ${p.ouvert ? '<span style="background:rgba(200,168,75,0.15);color:#8B6020;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;">✓ ' + p.horaires + '</span>' : ''}
          </div>
        `);
        marker.on('click', () => onSelect(p.id));
      });

      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={mapRef} style={{
      width: '100%',
      height: 'calc(100vh - 200px)',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(200,168,75,0.2)',
    }} />
  );
}

export function ParishesPage() {
  const navigate = useNavigate();
  const [region,       setRegion]       = useState('Tous');
  const [type,         setType]         = useState('Tous');
  const [recherche,    setRecherche]    = useState('');
  const [showSearch,   setShowSearch]   = useState(false);
  const [suivis,       setSuivis]       = useState(new Set([1, 2, 3]));
  const [vue,          setVue]          = useState('liste');

  function toggleSuivi(id) {
    setSuivis(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtrees = useMemo(() => {
    return paroisses.filter(p => {
      if (region !== 'Tous' && p.region !== region) return false;
      if (type   !== 'Tous' && p.type   !== type)   return false;
      if (recherche && !p.nom.toLowerCase().includes(recherche.toLowerCase()) && !p.ville.toLowerCase().includes(recherche.toLowerCase())) return false;
      return true;
    });
  }, [region, type, recherche]);

  const paroisseSuivie = filtrees.filter(p => suivis.has(p.id));
  const autresParoisses = filtrees.filter(p => !suivis.has(p.id));

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE, backgroundImage: BOGOLAN, paddingBottom: 90 }}>

        {/* ── HEADER ── */}
        <div style={{ background: '#0C0A06', backgroundImage: BOGOLAN_DARK, padding: '44px 14px 12px', borderRadius: '0 0 24px 24px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: IVOIRE }}>Paroisses</div>
              <div style={{ fontSize: 9, color: 'rgba(200,168,75,0.6)', marginTop: 1 }}>
                {filtrees.length} lieux de culte au Sénégal
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              {/* Loupe */}
              <button
                onClick={() => setShowSearch(s => !s)}
                style={{ width: 34, height: 34, borderRadius: '50%', background: showSearch ? 'rgba(200,168,75,0.25)' : 'rgba(200,168,75,0.12)', border: `1px solid rgba(200,168,75,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <i className="ti ti-search" style={{ fontSize: 15, color: OR }} />
              </button>
              {/* Vue liste/carte */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 2 }}>
                {['liste', 'carte'].map(v => (
                  <button key={v} onClick={() => setVue(v)} style={{ padding: '4px 11px', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: 'Georgia,serif', fontWeight: 700, background: vue === v ? OR : 'transparent', color: vue === v ? VERT : 'rgba(245,240,232,0.4)', textTransform: 'capitalize' }}>
                    {v === 'liste' ? 'Liste' : 'Carte'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          {showSearch && (
            <div style={{ marginBottom: 8 }}>
              <input
                autoFocus
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                placeholder="Rechercher une paroisse, ville..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: IVOIRE, outline: 'none', fontFamily: 'Georgia,serif' }}
              />
            </div>
          )}

          {/* Chips région */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {REGIONS.map(r => (
              <Chip key={r} label={r} active={region === r} onClick={() => setRegion(r)} />
            ))}
          </div>
        </div>

        {/* Stats compactes inline */}
        <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-bell" style={{ fontSize: 12, color: OR }} />
            <span style={{ fontSize: 10, color: '#7A6E5E', fontFamily: 'Georgia,serif' }}>
              <strong style={{ color: VERT }}>{suivis.size}</strong> suivies
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-building-church" style={{ fontSize: 12, color: '#7A6E5E' }} />
            <span style={{ fontSize: 10, color: '#7A6E5E', fontFamily: 'Georgia,serif' }}>
              <strong style={{ color: VERT }}>7</strong> diocèses
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-check" style={{ fontSize: 12, color: OR }} />
            <span style={{ fontSize: 10, color: '#7A6E5E', fontFamily: 'Georgia,serif' }}>
              <strong style={{ color: OR }}>{filtrees.filter(p => p.ouvert).length}</strong> ouvertes
            </span>
          </div>
        </div>

        {/* Chips type */}
        <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TYPES.map(t => (
            <Chip key={t} label={t} active={type === t} onClick={() => setType(t)} />
          ))}
        </div>

        {/* Liste ou Carte */}
        {vue === 'carte' ? (
          <div style={{ padding: '0 14px' }}>
            <MapView
              paroisses={filtrees}
              suivis={suivis}
              onSelect={id => navigate(`/parishes/${id}`)}
            />
          </div>
        ) : (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Paroisses suivies */}
          {paroisseSuivie.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: VERT, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Georgia,serif' }}>
                <i className="ti ti-bell" style={{ fontSize: 11, color: OR }} /> Paroisse{paroisseSuivie.length > 1 ? 's' : ''} suivie{paroisseSuivie.length > 1 ? 's' : ''}
              </div>
              {paroisseSuivie.map(p => (
                <ParoisseCard key={p.id} p={p} suivi onToggleSuivi={toggleSuivi} onClick={() => navigate(`/parishes/${p.id}`)} />
              ))}
            </>
          )}

          {/* Autres paroisses */}
          {autresParoisses.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: VERT, fontFamily: 'Georgia,serif', marginTop: paroisseSuivie.length > 0 ? 4 : 0 }}>
                {paroisseSuivie.length > 0 ? 'Paroisses suivantes' : 'Toutes les paroisses'}
              </div>
              {autresParoisses.map(p => (
                <ParoisseCard key={p.id} p={p} suivi={false} onToggleSuivi={toggleSuivi} onClick={() => navigate(`/parishes/${p.id}`)} />
              ))}
            </>
          )}

          {filtrees.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>
              Aucune paroisse trouvée
            </div>
          )}
        </div>
        )}

      </div>
    </AppShell>
  );
}
