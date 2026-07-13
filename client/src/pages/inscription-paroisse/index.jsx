import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const OR = '#C8A84B';
const VERT = '#1e2d14';
const IVOIRE = '#F5F0E8';

const champStyle = { flex: 1, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', background: '#F5F0E8', outline: 'none' };
const uploadStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1.5px dashed rgba(200,168,75,0.5)', borderRadius: 10, padding: 14, background: 'rgba(200,168,75,0.05)', cursor: 'pointer' };

function fichierEnBase64(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function(e) { resolve(e.target.result); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function InscriptionParoissePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [verification, setVerification] = useState('chargement');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fonction, setFonction] = useState('');
  const [phone, setPhone] = useState('');
  const [parishName, setParishName] = useState('');
  const [diocese, setDiocese] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Senegal');
  const [address, setAddress] = useState('');
  const [identityDocUrl, setIdentityDocUrl] = useState(null);
  const [functionDocUrl, setFunctionDocUrl] = useState(null);
  const [password, setPassword] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);

  useEffect(function() {
    async function verifier() {
      if (!token) { setVerification('invalide'); return; }
      try {
        const { invitationApi } = await import('../../services/api');
        await invitationApi.check(token);
        setVerification('valide');
      } catch (e) {
        setVerification('invalide');
      }
    }
    verifier();
  }, [token]);

  async function gererFichier(e, setter) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const base64 = await fichierEnBase64(file);
    setter(base64);
  }

  async function soumettre() {
    setErreur('');
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !password) {
      setErreur('Merci de remplir toutes les informations personnelles obligatoires.');
      return;
    }
    if (!parishName.trim() || !city.trim() || !country.trim()) {
      setErreur('Merci de remplir toutes les informations de la paroisse.');
      return;
    }
    setEnvoi(true);
    try {
      const { invitationApi } = await import('../../services/api');
      await invitationApi.complete(token, {
        firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), fonction: fonction.trim(),
        parishName: parishName.trim(), diocese: diocese.trim(), city: city.trim(), country: country.trim(), address: address.trim(),
        identityDocUrl, functionDocUrl, password,
      });
      setSucces(true);
    } catch (e) {
      setErreur(e.message || 'Une erreur est survenue.');
    } finally {
      setEnvoi(false);
    }
  }

  if (verification === 'chargement') {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', color: '#9A8E7E' }}>Verification du lien...</div>;
  }

  if (verification === 'invalide') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', color: '#9A8E7E', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: VERT, marginBottom: 8 }}>Ce lien est invalide ou a expire</div>
        <div style={{ fontSize: 13 }}>Contactez la personne qui vous a envoye ce lien pour en obtenir un nouveau.</div>
      </div>
    );
  }

  if (succes) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', padding: 20, textAlign: 'center', background: IVOIRE }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: VERT, marginBottom: 10 }}>Demande envoyee</div>
        <div style={{ fontSize: 13, color: '#7A6E5E', marginBottom: 20, maxWidth: 320 }}>Votre compte a ete cree. Votre paroisse sera visible publiquement une fois verifiee par notre equipe.</div>
        <button onClick={function() { navigate('/login'); }} style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 14, color: OR, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Se connecter</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: IVOIRE, paddingBottom: 40 }}>
      <div style={{ background: '#0C0A06', padding: '30px 16px' }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: '#F5EFE4' }}>Inscription d'une paroisse</div>
        <div style={{ fontSize: 10, color: 'rgba(200,168,75,0.6)', marginTop: 4 }}>Jangu Bi - plateforme catholique</div>
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {erreur && (
          <div style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, padding: 10, fontSize: 12, color: '#e53935' }}>{erreur}</div>
        )}

        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e8e4dc' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: VERT, marginBottom: 10, fontFamily: 'Georgia,serif' }}>Vos informations</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={firstName} onChange={function(e) { setFirstName(e.target.value); }} placeholder="Prenom" style={champStyle} />
            <input value={lastName} onChange={function(e) { setLastName(e.target.value); }} placeholder="Nom" style={champStyle} />
          </div>
          <input value={fonction} onChange={function(e) { setFonction(e.target.value); }} placeholder="Fonction : Cure, Vicaire, Secretaire..." style={Object.assign({}, champStyle, { width: '100%', marginBottom: 8, boxSizing: 'border-box' })} />
          <input value={phone} onChange={function(e) { setPhone(e.target.value); }} placeholder="Telephone (ex: +221771234567)" style={Object.assign({}, champStyle, { width: '100%', boxSizing: 'border-box' })} />
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e8e4dc' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: VERT, marginBottom: 10, fontFamily: 'Georgia,serif' }}>Informations de la paroisse</div>
          <input value={parishName} onChange={function(e) { setParishName(e.target.value); }} placeholder="Nom de la paroisse" style={Object.assign({}, champStyle, { width: '100%', marginBottom: 8, boxSizing: 'border-box' })} />
          <input value={diocese} onChange={function(e) { setDiocese(e.target.value); }} placeholder="Diocese de rattachement" style={Object.assign({}, champStyle, { width: '100%', marginBottom: 8, boxSizing: 'border-box' })} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={city} onChange={function(e) { setCity(e.target.value); }} placeholder="Ville" style={champStyle} />
            <input value={country} onChange={function(e) { setCountry(e.target.value); }} placeholder="Pays" style={champStyle} />
          </div>
          <input value={address} onChange={function(e) { setAddress(e.target.value); }} placeholder="Adresse (optionnel)" style={Object.assign({}, champStyle, { width: '100%', boxSizing: 'border-box' })} />
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e8e4dc' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: VERT, marginBottom: 4, fontFamily: 'Georgia,serif' }}>Piece d'identite</div>
          <div style={{ fontSize: 10, color: '#9A8E7E', marginBottom: 8 }}>Carte nationale d'identite ou passeport.</div>
          <label style={uploadStyle}>
            <i className="ti ti-id" style={{ fontSize: 20, color: OR }} />
            <div style={{ fontSize: 10, color: '#8B6020', fontWeight: 700, marginTop: 6 }}>{identityDocUrl ? 'Justificatif ajoute' : 'Ajouter un justificatif'}</div>
            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={function(e) { gererFichier(e, setIdentityDocUrl); }} />
          </label>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e8e4dc' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: VERT, marginBottom: 4, fontFamily: 'Georgia,serif' }}>Fonction paroissiale</div>
          <div style={{ fontSize: 10, color: '#9A8E7E', marginBottom: 8 }}>Mandat, carte de pretre. Optionnel, accelere la verification.</div>
          <label style={uploadStyle}>
            <i className="ti ti-file-certificate" style={{ fontSize: 20, color: OR }} />
            <div style={{ fontSize: 10, color: '#8B6020', fontWeight: 700, marginTop: 6 }}>{functionDocUrl ? 'Justificatif ajoute' : 'Ajouter un justificatif'}</div>
            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={function(e) { gererFichier(e, setFunctionDocUrl); }} />
          </label>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e8e4dc' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: VERT, marginBottom: 10, fontFamily: 'Georgia,serif' }}>Definir votre mot de passe</div>
          <input type="password" value={password} onChange={function(e) { setPassword(e.target.value); }} placeholder="Au moins 8 caracteres, majuscule et chiffre" style={Object.assign({}, champStyle, { width: '100%', boxSizing: 'border-box' })} />
        </div>

        <button onClick={soumettre} disabled={envoi} style={{ padding: 13, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 14, color: OR, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {envoi ? 'Envoi...' : 'Soumettre la demande'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#9A8E7E' }}>Votre paroisse sera visible apres verification. Justificatifs visibles par nous seuls.</div>
      </div>
    </div>
  );
}
