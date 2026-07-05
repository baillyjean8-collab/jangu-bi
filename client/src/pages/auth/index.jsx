import { useState, useLocation, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { AuthShell } from '../../components/layout';
import { Button, Input, useToast } from '../../components/ui';

function extractError(err) {
  const data = err?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    return Object.values(data.errors)[0];
  }
  return data?.message || 'Une erreur est survenue';
}

// ── Paroisses catholiques du Sénégal (toutes les 7 diocèses) ─────────────────
const PAROISSES_SENEGAL = [
  // Archidiocèse de Dakar
  'Cathédrale du Souvenir Africain (Dakar-Plateau)',
  'Paroisse Saint-Joseph (Médina)',
  'Paroisse Saint-Dominique (Université)',
  'Paroisse Sainte-Thérèse de l\'Enfant-Jésus (Grand Dakar)',
  'Paroisse Saints Martyrs de l\'Ouganda',
  'Paroisse Saint-Pierre (Baobabs)',
  'Paroisse Saint-Paul (Grand-Yoff)',
  'Paroisse Saint-Christophe (Yoff)',
  'Paroisse Notre-Dame des Anges (Ouakam)',
  'Paroisse Sainte-Joséphine Bakhita (Hann)',
  'Paroisse Saint Jean Bosco (Nord Foire)',
  'Paroisse Marie-Immaculée (Parcelles Assainies)',
  'Paroisse Saint Jean-Paul II (Pikine-Guédiawaye)',
  'Paroisse Notre-Dame du Cap-Vert (Pikine)',
  'Paroisse Saint Abraham (Guédiawaye)',
  'Paroisse Notre-Dame de la Paix (Diamaguène)',
  'Paroisse Saint François d\'Assise (Keur Massar)',
  'Paroisse Sainte Agnès (Rufisque)',
  'Paroisse Saint-Luc (Bargny)',
  'Paroisse Notre-Dame de Fatima (Sébikhotane)',
  'Paroisse Saint-Louis de Gonzague (Mbour)',
  'Paroisse Sainte-Anne (Joal)',
  'Paroisse Saint-Joseph (Saly)',
  'Paroisse Notre-Dame de la Paix (Thiadiaye)',
  'Paroisse Marie-Médiatrice (Ndiaganiao)',
  'Paroisse Sacré-Cœur (Ngasobil)',
  'Paroisse Notre-Dame de la Délivrande (Popenguine)',
  'Paroisse Saint-Pierre (Diohine)',
  'Paroisse Saint-Jean (Fatick)',
  'Paroisse Sainte-Geneviève (Nguékhokh)',
  'Paroisse L\'Enfant-Jésus de Prague (Tivaouane-Peulh)',
  'Paroisse Saint Jude (Cité Gendarmerie)',
  'Paroisse Saint Michel Archange (Sandiara)',
  // Diocèse de Thiès
  'Cathédrale Saint-Jean-Baptiste (Thiès)',
  'Paroisse Sainte-Anne (Thiès)',
  'Paroisse Saint-Pierre (Thiès)',
  'Paroisse Notre-Dame de Lourdes (Thiès)',
  'Paroisse Saint-Joseph (Thiès)',
  'Paroisse Sacré-Cœur (Diourbel)',
  'Paroisse Saint-François (Touba)',
  'Paroisse Notre-Dame (Louga)',
  'Paroisse Sainte-Marie (Mbacké)',
  // Diocèse de Saint-Louis
  'Cathédrale Sainte-Anne (Saint-Louis)',
  'Paroisse Saint-Joseph (Saint-Louis)',
  'Paroisse Notre-Dame (Saint-Louis)',
  'Paroisse Sainte-Thérèse (Matam)',
  'Paroisse Saint-Pierre (Podor)',
  'Paroisse Saint-Jean (Richard-Toll)',
  // Diocèse de Kaolack
  'Cathédrale de l\'Immaculée Conception (Kaolack)',
  'Paroisse Saint-Joseph (Kaolack)',
  'Paroisse Sainte-Marie (Kaffrine)',
  'Paroisse Saint-Pierre (Nioro du Rip)',
  'Paroisse Saint-François (Gossas)',
  // Diocèse de Ziguinchor
  'Cathédrale Sainte-Marie (Ziguinchor)',
  'Paroisse Saint-Joseph (Ziguinchor)',
  'Paroisse Saint-Pierre (Ziguinchor)',
  'Paroisse Notre-Dame de la Paix (Bignona)',
  'Paroisse Saint-Joseph (Oussouye)',
  'Paroisse Sainte-Anne (Sédhiou)',
  'Paroisse Notre-Dame (Cap Skirring)',
  'Paroisse Saint-Jean (Thionck-Essyl)',
  'Paroisse Sainte-Marie (Kabrousse)',
  // Diocèse de Tambacounda
  'Cathédrale Sainte-Marie (Tambacounda)',
  'Paroisse Saint-Joseph (Tambacounda)',
  'Paroisse Notre-Dame (Kédougou)',
  'Paroisse Sacré-Cœur (Bakel)',
  // Diocèse de Kolda
  'Cathédrale Saint-Jean-Baptiste (Kolda)',
  'Paroisse Saint-Joseph (Kolda)',
  'Paroisse Notre-Dame (Vélingara)',
  'Paroisse Sainte-Thérèse (Diaobé)',
].sort();

// ── Composant SelectParoisse ──────────────────────────────────────────────────
function SelectParoisse({ value, onChange, error }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = PAROISSES_SENEGAL.filter(p =>
    p.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(p) {
    onChange(p);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={ref}>
      <label style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 500,
        color: 'var(--color-text-secondary)', marginBottom: '0.375rem', letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        Paroisse
      </label>

      {/* Champ principal — même style que les Input */}
      <div
        onClick={() => setOpen(o => !o)}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 0.75rem', height: '2.5rem',
background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${error ? 'var(--color-border-danger)' : 'var(--color-border-tertiary)'}`,
          background: 'var(--color-background-primary)',
          cursor: 'pointer', outline: 'none',
          fontSize: '0.9rem',
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {value || 'Sélectionnez votre paroisse'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{
            flexShrink: 0, marginLeft: 8,
            color: 'var(--color-text-secondary)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Liste déroulante */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 200,
          left: 0, right: 0,
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          marginTop: 4,
        }}>
          {/* Champ de recherche */}
          <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border-tertiary)' }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Rechercher une paroisse…"
              style={{
                width: '100%', padding: '0.4rem 0.6rem',
                fontSize: '0.875rem', border: '1px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-md)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Options */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Aucun résultat
              </div>
            )}
            {filtered.map(p => (
              <div
                key={p}
                onMouseDown={() => select(p)}
                style={{
                  padding: '0.55rem 1rem', fontSize: '0.875rem', cursor: 'pointer',
                  background: p === value ? 'var(--color-background-info)' : 'transparent',
                  color: p === value ? 'var(--color-text-info)' : 'var(--color-text-primary)',
                  fontWeight: p === value ? 500 : 400,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (p !== value) e.currentTarget.style.background = 'var(--color-background-secondary)'; }}
                onMouseLeave={e => { if (p !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-danger)' }}>{error}</p>}
      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
        Paroisses catholiques du Sénégal
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════

const COUNTRY_CODES = [
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: '+1',   flag: '🇺🇸', name: 'États-Unis' },
  { code: '+44',  flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: '+245', flag: '🇬🇼', name: 'Guinée-Bissau' },
  { code: '+238', flag: '🇨🇻', name: 'Cap-Vert' },
  { code: '+222', flag: '🇲🇷', name: 'Mauritanie' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+20',  flag: '🇪🇬', name: 'Égypte' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+240', flag: '🇬🇶', name: 'Guinée éq.' },
  { code: '+236', flag: '🇨🇫', name: 'Centrafrique' },
  { code: '+235', flag: '🇹🇩', name: 'Tchad' },
  { code: '+239', flag: '🇸🇹', name: 'São Tomé' },
  { code: '+230', flag: '🇲🇺', name: 'Maurice' },
  { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+34',  flag: '🇪🇸', name: 'Espagne' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+39',  flag: '🇮🇹', name: 'Italie' },
  { code: '+49',  flag: '🇩🇪', name: 'Allemagne' },
  { code: '+31',  flag: '🇳🇱', name: 'Pays-Bas' },
  { code: '+46',  flag: '🇸🇪', name: 'Suède' },
  { code: '+47',  flag: '🇳🇴', name: 'Norvège' },
  { code: '+45',  flag: '🇩🇰', name: 'Danemark' },
];


// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  function set(field) {
    return (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setError(''); };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(form);
      toast({ message: 'Bienvenue, ' + result.user.firstName + ' !', type: 'success' });
      navigate('/');
    } catch (err) {
      if (err?.response?.data?.message?.includes('verified')) {
        navigate('/verify-otp', { state: { userId: err.response.data.data?.userId } });
        return;
      }
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  const S = {
    root: { minHeight: '100vh', background: '#0C0A06', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px)', padding: '48px 20px 40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    title: { fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 700, color: '#F5EFE4', margin: '0 0 4px', textAlign: 'center' },
    sub: { fontSize: 13, color: 'rgba(245,239,228,.45)', margin: '0 0 28px', textAlign: 'center' },
    label: { fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(200,168,75,.7)', display: 'block', marginBottom: 5 },
    inputLight: { width: '100%', background: '#fff', border: '1px solid rgba(200,168,75,.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#1e2d14', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    mb: { marginBottom: 14 },
    btn: { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', color: '#1e2d14', border: 'none', borderRadius: 50, fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginBottom: 16 },
    error: { background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f87171', marginBottom: 14 },
  };

  return (
    <AuthShell>
      <div style={S.root}>
        {/* Bouton retour élégant */}
        <button type="button" onClick={() => navigate('/splash')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </div>
        </button>

        <h1 style={{...S.title, color:'#C8A84B'}}>Connexion</h1>
        <p style={S.sub}>Bon retour parmi nous 🙏</p>
        <form onSubmit={handleSubmit} noValidate>
          <div style={S.mb}>
            <label style={S.label}>Email</label>
            <input style={S.inputLight} type="email" placeholder="votre@email.com" value={form.email} onChange={set('email')} required/>
          </div>
          <div style={S.mb}>
            <label style={S.label}>Mot de passe</label>
            <input style={S.inputLight} type="password" placeholder="••••••••••" value={form.password} onChange={set('password')} required/>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span onClick={() => navigate('/forgot-password')} style={{ fontSize: 12, color: 'rgba(200,168,75,.7)', cursor: 'pointer' }}>Mot de passe oublié ?</span>
          </div>
          {error && <div style={S.error}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(245,239,228,.35)' }}>
            Pas encore de compte ?{' '}
            <span onClick={() => navigate('/register')} style={{ color: '#C8A84B', fontWeight: 600, cursor: 'pointer' }}>S'inscrire</span>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REGISTER PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const countryRef = useRef(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', password: '', confirmPassword: '',
    paroisse: '', ville: '', pays: '',
  });

  useEffect(() => {
    function handleClick(e) {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  );

  function set(field) {
    return (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setError(''); };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await register({
        ...form,
        phone: selectedCountry.code + form.phone,
      });
      toast({ message: 'Compte créé ! Vérifiez votre téléphone.', type: 'success' });
      navigate('/verify-otp', { state: { userId: result?.data?.userId } });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  const S = {
    root: {
      minHeight: '100vh',
      background: '#0C0A06',
      backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px)',
      padding: '32px 20px 40px',
      boxSizing: 'border-box',
    },
    title: { fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 700, color: '#F5EFE4', margin: '0 0 4px' },
    sub: { fontSize: 13, color: 'rgba(245,239,228,.45)', margin: '0 0 24px' },
    label: { fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(200,168,75,.7)', display: 'block', marginBottom: 5 },
    input: { width: '100%', background: '#1e2d14', border: '1px solid rgba(200,168,75,.2)', borderRadius: 10, padding: '11px 13px', fontSize: 13, color: '#F5EFE4', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    inputLight: { width: '100%', background: '#fff', border: '1px solid rgba(200,168,75,.3)', borderRadius: 10, padding: '11px 13px', fontSize: 13, color: '#1e2d14', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    mb: { marginBottom: 14 },
    btn: { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', color: '#1e2d14', border: 'none', borderRadius: 50, fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginBottom: 16 },
    error: { background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f87171', marginBottom: 14 },
  };

  return (
    <AuthShell>
      <div style={S.root}>
        <h1 style={{...S.title, color:'#C8A84B'}}>Créer un compte</h1>
        <p style={S.sub}>Rejoignez votre communauté spirituelle</p>

        {/* Bouton retour élégant */}
        <button type="button" onClick={() => navigate('/splash')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </div>
        </button>

        <form onSubmit={handleSubmit} noValidate>

          {/* Prénom + Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Prénom</label>
              <input style={S.input} placeholder="Amadou" value={form.firstName} onChange={set('firstName')} required/>
            </div>
            <div>
              <label style={S.label}>Nom</label>
              <input style={S.input} placeholder="Diallo" value={form.lastName} onChange={set('lastName')} required/>
            </div>
          </div>

          {/* Email */}
          <div style={S.mb}>
            <label style={S.label}>Email</label>
            <input style={S.inputLight} type="email" placeholder="votre@email.com" value={form.email} onChange={set('email')} required/>
          </div>

          {/* Téléphone avec indicatif */}
          <div style={S.mb}>
            <label style={S.label}>Téléphone</label>
            <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
              {/* Sélecteur indicatif */}
              <div ref={countryRef} style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  onClick={() => { setCountryOpen(o => !o); setCountrySearch(''); }}
                  style={{ background: '#1e2d14', border: '1px solid rgba(200,168,75,' + (countryOpen ? '.5)' : '.2)'), borderRadius: countryOpen ? '10px 10px 0 0' : 10, padding: '11px 10px', fontSize: 12, color: 'rgba(245,239,228,.7)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 90 }}
                >
                  {selectedCountry.flag} {selectedCountry.code} <span style={{ color: 'rgba(200,168,75,.6)' }}>{countryOpen ? '▴' : '▾'}</span>
                </div>
                {countryOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, background: '#0C0A06', border: '1px solid rgba(200,168,75,.3)', borderTop: 'none', borderRadius: '0 0 10px 10px', width: 200, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,.6)' }}>
                    <div style={{ padding: 8, borderBottom: '1px solid rgba(200,168,75,.1)' }}>
                      <input
                        autoFocus
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        placeholder="🔍 Rechercher un pays..."
                        style={{ width: '100%', background: '#1e2d14', border: '1px solid rgba(200,168,75,.2)', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#F5EFE4', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                      {filteredCountries.map((c, i) => (
                        <div key={i} onClick={() => { setSelectedCountry(c); setCountryOpen(false); }}
                          style={{ padding: '9px 12px', fontSize: 12, color: 'rgba(245,239,228,.7)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderTop: i > 0 ? '1px solid rgba(200,168,75,.06)' : 'none', background: selectedCountry.code === c.code ? 'rgba(200,168,75,.08)' : 'transparent' }}
                        >
                          {c.flag} {c.name} <span style={{ marginLeft: 'auto', color: 'rgba(200,168,75,.5)' }}>{c.code}</span>
                        </div>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div style={{ padding: '12px', fontSize: 12, color: 'rgba(245,239,228,.3)', textAlign: 'center' }}>Aucun résultat</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Numéro */}
              <input style={{ ...S.input, flex: 1 }} placeholder="77 123 45 67" value={form.phone} onChange={set('phone')} type="tel"/>
            </div>
          </div>

          {/* Paroisse */}
          <div style={S.mb}>
            <label style={S.label}>Paroisse</label>
            <select style={{width:'100%',background:'#1e2d14',border:'1px solid rgba(200,168,75,.2)',borderRadius:10,padding:'11px 13px',fontSize:13,color:form.paroisse?'#F5EFE4':'rgba(245,239,228,.4)',outline:'none',boxSizing:'border-box',fontFamily:'inherit'}} value={form.paroisse} onChange={set('paroisse')}>
              <option value="">Sélectionnez votre paroisse</option>
              {PAROISSES_SENEGAL.map((p,i) => <option key={i} value={p} style={{background:'#1e2d14',color:'#F5EFE4'}}>{p}</option>)}
            </select>
            <p style={{ fontSize: 10, color: 'rgba(245,239,228,.3)', margin: '4px 0 0' }}>Paroisses catholiques du Sénégal</p>
          </div>

          {/* Ville + Pays */}
          <div style={S.mb}>
            <label style={S.label}>Localisation</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input style={S.input} placeholder="Ville" value={form.ville} onChange={set('ville')}/>
              <input style={S.input} placeholder="Pays" value={form.pays} onChange={set('pays')}/>
            </div>
          </div>

          {/* Mot de passe */}
          <div style={S.mb}>
            <label style={S.label}>Mot de passe</label>
            <input style={{ ...S.inputLight, marginBottom: 8 }} type="password" placeholder="••••••••••" value={form.password} onChange={set('password')} required/>
            <input style={S.inputLight} type="password" placeholder="Confirmer le mot de passe" value={form.confirmPassword} onChange={set('confirmPassword')} required/>
            <p style={{ fontSize: 10, color: 'rgba(245,239,228,.3)', margin: '4px 0 0' }}>Doit contenir majuscule, minuscule et chiffre</p>
          </div>

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(245,239,228,.35)' }}>
            Déjà un compte ?{' '}
            <span onClick={() => navigate('/login')} style={{ color: '#C8A84B', fontWeight: 600, cursor: 'pointer' }}>Se connecter</span>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VERIFY OTP PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function VerifyOtpPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation ? useLocation() : {};
  const userId = location?.state?.userId;

  const S = {
    root: { minHeight: '100vh', background: '#0C0A06', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px)', padding: '48px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    title: { fontFamily: 'Georgia,serif', fontSize: 24, fontWeight: 700, color: '#F5EFE4', margin: '0 0 8px', textAlign: 'center' },
    sub: { fontSize: 13, color: 'rgba(245,239,228,.45)', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.6 },
    label: { fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(200,168,75,.7)', display: 'block', marginBottom: 5 },
    input: { width: '100%', background: '#fff', border: '1px solid rgba(200,168,75,.3)', borderRadius: 10, padding: '14px', fontSize: 20, color: '#1e2d14', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'Georgia,serif' },
    btn: { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', color: '#1e2d14', border: 'none', borderRadius: 50, fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 800, cursor: 'pointer' },
    error: { background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f87171', marginBottom: 14 },
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) { setError('Session expirée. Veuillez vous reconnecter.'); return; }
    setLoading(true); setError('');
    try {
      await authApi.verifyOtp({ userId, otp });
      toast({ message: 'Compte vérifié ! Bienvenue !', type: 'success' });
      navigate('/login');
    } catch (err) {
      setError(extractError(err));
    } finally { setLoading(false); }
  }

  return (
    <AuthShell>
      <div style={S.root}>
        <h1 style={S.title}>Vérification</h1>
        <p style={S.sub}>Entrez le code reçu par SMS sur votre téléphone</p>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Code OTP</label>
            <input style={S.input} type="text" maxLength={6} placeholder="000000" value={otp} onChange={e => { setOtp(e.target.value); setError(''); }} required/>
          </div>
          {error && <div style={S.error}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1, marginBottom: 16 }}>
            {loading ? 'Vérification...' : 'Vérifier mon compte'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(245,239,228,.35)' }}>
            Pas reçu le code ?{' '}
            <span style={{ color: '#C8A84B', fontWeight: 600, cursor: 'pointer' }}>Renvoyer</span>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const S = {
    root: { minHeight: '100vh', background: '#0C0A06', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.025) 8px,rgba(200,168,75,0.025) 9px)', padding: '48px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    title: { fontFamily: 'Georgia,serif', fontSize: 24, fontWeight: 700, color: '#F5EFE4', margin: '0 0 8px', textAlign: 'center' },
    sub: { fontSize: 13, color: 'rgba(245,239,228,.45)', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.6 },
    label: { fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(200,168,75,.7)', display: 'block', marginBottom: 5 },
    input: { width: '100%', background: '#fff', border: '1px solid rgba(200,168,75,.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#1e2d14', outline: 'none', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', color: '#1e2d14', border: 'none', borderRadius: 50, fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 800, cursor: 'pointer' },
    error: { background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f87171', marginBottom: 14 },
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      toast({ message: 'Instructions envoyées par email.', type: 'success' });
    } catch (err) {
      setError(extractError(err));
    } finally { setLoading(false); }
  }

  if (sent) return (
    <AuthShell>
      <div style={S.root}>
        <h1 style={S.title}>Email envoyé ✓</h1>
        <p style={S.sub}>Consultez votre boîte mail et suivez les instructions pour réinitialiser votre mot de passe.</p>
        <button onClick={() => navigate('/login')} style={S.btn}>Retour à la connexion</button>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell>
      <div style={S.root}>
        <h1 style={S.title}>Mot de passe oublié</h1>
        <p style={S.sub}>Entrez votre email et nous vous enverrons les instructions pour réinitialiser votre mot de passe.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="votre@email.com" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required/>
          </div>
          {error && <div style={S.error}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1, marginBottom: 16 }}>
            {loading ? 'Envoi...' : 'Envoyer les instructions'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(245,239,228,.35)' }}>
            <span onClick={() => navigate('/login')} style={{ color: '#C8A84B', fontWeight: 600, cursor: 'pointer' }}>← Retour à la connexion</span>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
