import React, { useState } from 'react';
import AppShell from '../../components/AppShell';
import waveLogo    from '../../assets/wave.webp';
import orangeLogo  from '../../assets/orange-money.png';
import freeLogo    from '../../assets/free-money.png';
import visaLogo    from '../../assets/visa-mastercard.webp';


// ── Liste des paroisses enregistrées ────────────────────────────────────────
const PAROISSES_LISTE = [
  'Paroisse Saint-Pierre – Dakar',
  'Paroisse Sacré-Cœur – Dakar Plateau',
  'Paroisse Notre-Dame de Lourdes – Dakar',
  'Paroisse Sainte-Anne – Ziguinchor',
  'Paroisse Saint-Joseph – Thiès',
  'Paroisse Immaculée Conception – Kaolack',
  'Paroisse Saint-Paul – Saint-Louis',
  'Paroisse Sainte-Thérèse – Mbour',
  'Paroisse Saint-François – Louga',
  'Paroisse Notre-Dame de Fatima – Touba',
  'Paroisse Saint-Jean – Rufisque',
  'Paroisse Sainte-Marie – Ziguinchor',
  'Paroisse Saint-Michel – Diourbel',
  'Paroisse Christ-Roi – Tambacounda',
  'Paroisse Saint-Luc – Kolda',
];

// Libellés des champs selon le type d'acte
const CHAMPS_ACTE = {
  bapteme:   { event:'Baptême',      dateLabel:'Date du baptême',       lieuLabel:'Paroisse du baptême'    },
  confirm:   { event:'Confirmation', dateLabel:'Date de confirmation',   lieuLabel:'Paroisse de confirmation'},
  communion: { event:'Communion',    dateLabel:'Date de 1ère communion', lieuLabel:'Paroisse de communion'  },
  parrain:   { event:'Baptême',      dateLabel:'Date du baptême concerné',lieuLabel:'Paroisse du baptême'  },
  sepulture: { event:'Sépulture',    dateLabel:'Date du décès',          lieuLabel:"Paroisse concernee"     },
  mariage:   { event:'Mariage',      dateLabel:'Date du mariage',        lieuLabel:'Paroisse du mariage'    },
  transfert: { event:'Transfert',    dateLabel:"Date d'inscription",     lieuLabel:"Paroisse d'origine"     },
};

// ── Composant AutoComplete Paroisse ──────────────────────────────────────────
function AutoCompleteParoisse({ value, onChange }) {
  const [query, setQuery]       = React.useState(value || '');
  const [suggestions, setSugg]  = React.useState([]);
  const [open, setOpen]         = React.useState(false);
  const [focused, setFocused]   = React.useState(false);

  React.useEffect(() => {
    if (query.length === 0) {
      // Afficher toutes les paroisses si champ vide et en focus
      setSugg(focused ? PAROISSES_LISTE : []);
    } else {
      const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      const results = PAROISSES_LISTE.filter(p =>
        p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q)
      );
      setSugg(results);
    }
    setOpen(true);
  }, [query, focused]);

  function selectionner(p) {
    setQuery(p);
    onChange(p);
    setSugg([]);
    setOpen(false);
  }

  return (
    <div style={{ position:'relative', marginBottom:8 }}>
      <div style={{ position:'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setTimeout(() => { setFocused(false); setOpen(false); }, 200)}
          placeholder="Rechercher une paroisse..."
          style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 38px 11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:'#1e2d14', background:'#faf8f4', outline:'none' }}
        />
        <i className="ti ti-search" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#C8A84B' }} />
      </div>
      {open && suggestions.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1.5px solid rgba(200,168,75,0.3)', borderRadius:12, zIndex:100, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', maxHeight:200, overflowY:'auto', marginTop:4 }}>
          {suggestions.map((p, i) => (
            <div key={i} onMouseDown={() => selectionner(p)} style={{ padding:'11px 14px', fontSize:12, color:'#1e2d14', cursor:'pointer', fontFamily:'Georgia,serif', borderBottom: i < suggestions.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none', background:'white', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#fffbf0'}
              onMouseLeave={e => e.currentTarget.style.background='white'}
            >
              <i className="ti ti-building-church" style={{ fontSize:12, color:'#C8A84B', marginRight:8 }} />
              {p}
            </div>
          ))}
          {query.length > 0 && !PAROISSES_LISTE.includes(query) && (
            <div onMouseDown={() => selectionner(query)} style={{ padding:'10px 14px', fontSize:11, color:'#7A6E5E', cursor:'pointer', fontFamily:'Georgia,serif', background:'#faf8f4', borderTop:'1px solid rgba(0,0,0,0.05)' }}>
              <i className="ti ti-plus" style={{ fontSize:11, color:'#C8A84B', marginRight:8 }} />
              Utiliser "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const OR    = '#C8A84B';
const VERT  = '#1e2d14';
const IVOIRE = '#F5F0E8';
const BOGOLAN = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';
const BOGOLAN_DARK = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.07) 8px,rgba(200,168,75,0.07) 9px)';

const SERVICES = [
  { id:'messe',     titre:'Demande de messe',          prix:4000,  icon:'⛪', bg:'#E8F5E9', type:'messe' },
  { id:'bapteme',   titre:'Extrait de baptême',         prix:250,   icon:'💧', bg:'#E3F2FD', type:'acte'  },
  { id:'mariage',   titre:'Dossier de mariage',         prix:250,   icon:'💍', bg:'#FCE4EC', type:'acte'  },
  { id:'confirm',   titre:'Cert. de confirmation',      prix:250,   icon:'🔥', bg:'#FFF8E1', type:'acte'  },
  { id:'communion', titre:'Cert. de communion',         prix:250,   icon:'🍞', bg:'#F3E5F5', type:'acte'  },
  { id:'sepulture', titre:'Cert. de sépulture',         prix:250,   icon:'🌿', bg:'#E8F5E9', type:'acte'  },
  { id:'parrain',   titre:'Attestation parrain/marraine', prix:250, icon:'👥', bg:'#E3F2FD', type:'acte'  },
  { id:'transfert', titre:'Transfert de paroisse',      prix:250,   icon:'↗️', bg:'#FFF8E1', type:'acte'  },
];

const MODES = [
  { id:'wave',   label:'Wave',          sous:'Paiement instantané via Wave',   logo:waveLogo,   bg:'#1A56DB', ussd:'*878#' },
  { id:'orange', label:'Orange Money',  sous:"Via l'application Orange",       logo:orangeLogo, bg:'#FF6D00', ussd:'#144#' },
  { id:'free',   label:'Free Money',    sous:"Via l'application Free",         logo:freeLogo,   bg:'#10B981', ussd:'*555#' },
  { id:'carte',  label:'Carte bancaire',sous:'Visa / Mastercard',              logo:visaLogo,   bg:'#6366F1', ussd:null    },
];

function genRef() { return 'JB-' + Date.now().toString().slice(-8); }

// ── Formulaire carte bancaire ────────────────────────────────────────────────
function FormulaireCarteModal({ montant, onPayer, onRetour }) {
  const [num, setNum]  = useState('');
  const [exp, setExp]  = useState('');
  const [cvv, setCvv]  = useState('');
  const [nom, setNom]  = useState('');
  const [save, setSave] = useState(false);
  const valide = num.replace(/s/g,'').length===16 && exp.length===5 && cvv.length===3 && nom.length>2;
  const fmtNum = v => v.replace(/D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExp = v => { const d=v.replace(/D/g,'').slice(0,4); return d.length>2?d.slice(0,2)+'/'+d.slice(2):d; };
  const inp = { width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:13, color:VERT, background:'#faf8f4', outline:'none', marginBottom:8 };
  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ background:'linear-gradient(135deg,#1e2d14,#0C0A06)', borderRadius:16, padding:'18px 18px 14px', marginBottom:14, color:'white' }}>
        <div style={{ fontSize:10, opacity:.5, letterSpacing:'.1em', marginBottom:12 }}>CARTE BANCAIRE</div>
        <div style={{ fontSize:16, letterSpacing:'.18em', fontWeight:700, marginBottom:14, minHeight:22 }}>{num || '•••• •••• •••• ••••'}</div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, opacity:.7 }}>
          <span>{nom || 'NOM DU TITULAIRE'}</span>
          <span>{exp || 'MM/AA'}</span>
        </div>
      </div>
      <input style={inp} placeholder="Numéro de carte (16 chiffres)" value={num} onChange={e=>setNum(fmtNum(e.target.value))} maxLength={19} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <input style={{...inp, marginBottom:8}} placeholder="MM/AA" value={exp} onChange={e=>setExp(fmtExp(e.target.value))} maxLength={5} />
        <input style={{...inp, marginBottom:8}} placeholder="CVV" value={cvv} onChange={e=>setCvv(e.target.value.replace(/D/g,'').slice(0,3))} maxLength={3} />
      </div>
      <input style={inp} placeholder="Nom du titulaire" value={nom} onChange={e=>setNom(e.target.value)} />
      <div onClick={()=>setSave(!save)} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:16 }}>
        <div style={{ width:18, height:18, borderRadius:6, border:'1.5px solid', borderColor:save?OR:'#ccc', background:save?OR:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {save && <i className="ti ti-check" style={{ fontSize:12, color:VERT }} />}
        </div>
        <span style={{ fontSize:11, color:'#7A6E5E', fontFamily:'Georgia,serif' }}>Enregistrer cette carte pour mes prochains paiements</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
        <i className="ti ti-shield-check" style={{ fontSize:13, color:OR }} />
        <span style={{ fontSize:9, color:'#9A8E7E' }}>Paiement sécurisé — Chiffrement SSL 256 bits</span>
      </div>
      <button onClick={()=>valide&&onPayer()} style={{ width:'100%', padding:14, background:valide?'linear-gradient(135deg,#C8A84B,#8B6020)':'#e4e4e7', border:'none', borderRadius:14, color:valide?VERT:'#aaa', fontWeight:700, fontSize:14, fontFamily:'Georgia,serif', cursor:valide?'pointer':'default', marginBottom:10 }}>
        Payer {montant.toLocaleString('fr-SN')} FCFA ✦
      </button>
      <button onClick={onRetour} style={{ width:'100%', padding:12, background:'none', border:'1.5px solid #e5e0d5', borderRadius:14, color:'#7A6E5E', fontFamily:'Georgia,serif', fontSize:12, cursor:'pointer' }}>
        Retour
      </button>
    </div>
  );
}

// ── Écran USSD (app non détectée) ───────────────────────────────────────────
function EcranUSSD({ mode, montant, onValide, onRetour }) {
  return (
    <div style={{ padding:20, textAlign:'center' }}>
      <div style={{ width:70, height:70, borderRadius:'50%', background:mode.bg+'22', border:'2px solid '+mode.bg+'55', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
        <img src={mode.logo} alt={mode.label} style={{ width:42, height:30, objectFit:'contain', borderRadius:6 }} />
      </div>
      <div style={{ fontSize:14, fontWeight:700, color:VERT, marginBottom:8 }}>Composer le code USSD</div>
      <div style={{ fontSize:11, color:'#7A6E5E', lineHeight:1.6, marginBottom:16 }}>
        Si vous n'avez pas l'application {mode.label}, composez ce code depuis votre téléphone :
      </div>
      <div style={{ background:'#0C0A06', borderRadius:14, padding:'14px 20px', marginBottom:16, display:'inline-block' }}>
        <div style={{ fontSize:24, fontWeight:900, color:OR, letterSpacing:'.15em' }}>{mode.ussd}</div>
        <div style={{ fontSize:10, color:'rgba(200,168,75,0.5)', marginTop:4 }}>Montant : {montant.toLocaleString('fr-SN')} FCFA</div>
      </div>
      <div style={{ fontSize:10, color:'#9A8E7E', marginBottom:20, lineHeight:1.6 }}>
        Composez le code, suivez les instructions et validez. Revenez ici après confirmation.
      </div>
      <button onClick={onValide} style={{ width:'100%', padding:14, background:'linear-gradient(135deg,#C8A84B,#8B6020)', border:'none', borderRadius:14, color:VERT, fontWeight:700, fontSize:14, fontFamily:'Georgia,serif', cursor:'pointer', marginBottom:10 }}>
        J'ai validé le paiement ✦
      </button>
      <button onClick={onRetour} style={{ width:'100%', padding:12, background:'none', border:'1.5px solid #e5e0d5', borderRadius:14, color:'#7A6E5E', fontFamily:'Georgia,serif', fontSize:12, cursor:'pointer' }}>
        Retour
      </button>
    </div>
  );
}

export default function DemandesPage() {
  const [etape, setEtape] = useState('liste'); // liste | rdv | formulaire | paiement | ussd | carte | succes | succes-rdv
  const [serviceActif, setServiceActif] = useState(null);
  const [pourQui, setPourQui] = useState('moi');
  const [modeSelectionne, setModeSelectionne] = useState(null);
  const [ref] = useState(genRef());
  const [filtre, setFiltre] = useState('tout');
  const [paroisse, setParoisse]         = useState('');
  const [paroisseRdv, setParoisseRdv]   = useState('');
  const [paroisseMesse, setParoisseMesse] = useState('');
  const [pretreOfficiant, setPretreOfficiant] = useState('');
  const [dateMesse, setDateMesse] = useState('');
  const [momentMesse, setMomentMesse] = useState('peu_importe');
  const [dateEvt, setDateEvt]     = useState('');
  const [nomPrenom, setNomPrenom] = useState('');
  const [formAutre, setFormAutre] = useState({ nom:'', lien:'', tel:'', info:'' });
  const [intention, setIntention] = useState('');
  const [rdvMotif, setRdvMotif] = useState('Confession');
  const [rdvMessage, setRdvMessage] = useState('');

  const servicesFiltres = SERVICES.filter(s => {
    if (filtre==='tout') return true;
    if (filtre==='messe') return s.id==='messe';
    if (filtre==='sacrement') return ['bapteme','confirm','communion','sepulture','parrain'].includes(s.id);
    if (filtre==='rdv') return false;
    return true;
  });

  const hdr = (titre, retour, sous) => (
    <div style={{ background:'#0C0A06', backgroundImage:BOGOLAN_DARK, padding:'44px 16px 18px', borderRadius:'0 0 24px 24px', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={()=>setEtape(retour)} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize:20, color:OR }} />
        </button>
        <div style={{ fontFamily:'Georgia,serif', fontSize:16, fontWeight:900, color:IVOIRE }}>{titre}</div>
      </div>
      {sous && <div style={{ fontSize:10, color:'rgba(245,240,232,0.4)', marginTop:6 }}>{sous}</div>}
    </div>
  );

  // ── LISTE ──────────────────────────────────────────────────────────────────
  if (etape==='liste') return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:IVOIRE, backgroundImage:BOGOLAN, paddingBottom:90 }}>
        <div style={{ background:'#0C0A06', backgroundImage:BOGOLAN_DARK, padding:'44px 16px 18px', borderRadius:'0 0 24px 24px', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:900, color:IVOIRE }}>
              Actes <span style={{ color:OR }}>&</span> Demandes
            </div>
            <div style={{ background:'rgba(200,168,75,0.15)', borderRadius:20, padding:'3px 12px', fontSize:9, color:OR, fontWeight:700, letterSpacing:'.06em' }}>
              {SERVICES.length + 1} SERVICES
            </div>
          </div>
          <div style={{ fontSize:10, color:'rgba(245,240,232,0.4)', marginBottom:12 }}>Démarches administratives auprès de votre paroisse</div>
          <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
            {[['tout','Tout'],['messe','Messe'],['sacrement','Sacrements'],['rdv','Rendez-vous']].map(([id,label])=>(
              <div key={id} onClick={()=>setFiltre(id)} style={{
                background: filtre===id ? 'rgba(200,168,75,0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid ' + (filtre===id ? 'rgba(200,168,75,0.4)' : 'rgba(255,255,255,0.1)'),
                borderRadius:20, padding:'4px 13px', fontSize:9, color: filtre===id ? OR : 'rgba(245,240,232,0.55)',
                fontWeight: filtre===id ? 700 : 400, whiteSpace:'nowrap', cursor:'pointer',
              }}>{label}</div>
            ))}
          </div>
        </div>

        <div style={{ padding:'0 12px' }}>
          {/* Rendez-vous prêtre */}
          {(filtre==='tout'||filtre==='rdv') && (
            <div onClick={()=>setEtape('rdv')} style={{ background:'linear-gradient(135deg,rgba(200,168,75,0.1),rgba(200,168,75,0.03))', border:'1.5px solid rgba(200,168,75,0.28)', borderRadius:16, padding:15, marginBottom:10, cursor:'pointer', display:'flex', alignItems:'center', gap:13 }}>
              <div style={{ width:44, height:44, borderRadius:13, background:'rgba(200,168,75,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📅</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:VERT, marginBottom:2 }}>Rendez-vous avec un prêtre</div>
                <div style={{ fontSize:10, color:'#7A6E5E' }}>Confession, conseil spirituel, entretien pastoral...</div>
                <span style={{ display:'inline-block', marginTop:5, padding:'2px 10px', borderRadius:20, fontSize:9, fontWeight:700, background:'rgba(16,185,129,0.12)', color:'#065F46' }}>Gratuit</span>
              </div>
              <i className="ti ti-chevron-right" style={{ fontSize:15, color:OR }} />
            </div>
          )}

          {/* Grille services */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:14 }}>
            {servicesFiltres.map(s=>(
              <div key={s.id} onClick={()=>{setServiceActif(s);setPourQui('moi');setEtape('formulaire');}} style={{ background:'white', borderRadius:15, padding:14, border:'1px solid rgba(0,0,0,0.06)', cursor:'pointer' }}>
                <div style={{ width:40, height:40, borderRadius:11, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:9 }}>{s.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:VERT, marginBottom:3 }}>{s.titre}</div>
                <div style={{ fontSize:10, color:OR, fontWeight:700 }}>{s.prix.toLocaleString('fr-SN')} FCFA</div>
              </div>
            ))}
          </div>

          {/* Demandes en cours */}
          <div style={{ fontFamily:'Georgia,serif', fontSize:13, fontWeight:700, color:VERT, marginBottom:9 }}>Mes demandes en cours</div>
          {[
            { icon:'💧', bg:'#E3F2FD', titre:'Extrait de baptême', date:'28 juin 2026', statut:'En cours', sc:'#FFF8E1', st:'#8B6020' },
            { icon:'⛪', bg:'#E8F5E9', titre:'Demande de messe',   date:'25 juin 2026', statut:'Validée',  sc:'rgba(16,185,129,0.12)', st:'#065F46' },
          ].map((d,i)=>(
            <div key={i} style={{ background:'white', borderRadius:14, padding:13, border:'1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:11, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:d.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{d.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:VERT }}>{d.titre}</div>
                <div style={{ fontSize:9, color:'#7A6E5E', marginTop:2 }}>Envoyée le {d.date}</div>
              </div>
              <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:9, fontWeight:700, background:d.sc, color:d.st }}>{d.statut}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );

  // ── RENDEZ-VOUS ────────────────────────────────────────────────────────────
  if (etape==='rdv') return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:IVOIRE, backgroundImage:BOGOLAN, paddingBottom:90 }}>
        {hdr('Rendez-vous avec un prêtre','liste','Gratuit — Sujet à disponibilité')}
        <div style={{ padding:'0 12px' }}>
          <div style={{ background:'white', borderRadius:16, padding:16, marginBottom:10, border:'1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:10 }}>Motif du rendez-vous</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              {['🙏 Confession','💬 Conseil spirituel','💒 Préparation mariage','✏️ Autre motif'].map(m=>(
                <div key={m} onClick={()=>setRdvMotif(m)} style={{ border:'1.5px solid '+(rdvMotif===m?OR:'#e5e0d5'), background:rdvMotif===m?'#fffbf0':'white', borderRadius:12, padding:10, textAlign:'center', cursor:'pointer', fontSize:10, fontWeight:rdvMotif===m?700:400, color:rdvMotif===m?'#8B6020':'#5A5045', transition:'all .2s' }}>
                  {m}
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:7 }}>Date souhaitée</div>
            <input type="date" style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:12 }} />
            <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:6 }}>Paroisse souhaitée</div>
            <AutoCompleteParoisse value={paroisseRdv} onChange={setParoisseRdv} />
            <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:7, marginTop:4 }}>Créneau préféré</div>
            <select style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:12 }}>
              <option>Matin (8h – 12h)</option><option>Après-midi (14h – 18h)</option><option>Soir (18h – 20h)</option>
            </select>
            <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:7 }}>Message (optionnel)</div>
            <textarea value={rdvMessage} onChange={e=>setRdvMessage(e.target.value)} placeholder="Décrivez brièvement le sujet si vous le souhaitez..." rows={3} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', resize:'none' }} />
          </div>
          <button onClick={()=>setEtape('succes-rdv')} style={{ width:'100%', padding:14, background:'linear-gradient(135deg,#C8A84B,#8B6020)', border:'none', borderRadius:14, color:VERT, fontWeight:700, fontSize:14, fontFamily:'Georgia,serif', cursor:'pointer' }}>
            Envoyer la demande ✦
          </button>
          <div style={{ textAlign:'center', fontSize:9, color:'#9A8E7E', marginTop:8 }}>La paroisse vous confirmera par SMS ou appel</div>
        </div>
      </div>
    </AppShell>
  );

  // ── FORMULAIRE DEMANDE ─────────────────────────────────────────────────────
  if (etape==='formulaire' && serviceActif) return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:IVOIRE, backgroundImage:BOGOLAN, paddingBottom:90 }}>
        {hdr(serviceActif.titre, 'liste')}
        <div style={{ padding:'0 12px' }}>
          <div style={{ background:'rgba(200,168,75,0.08)', borderRadius:12, padding:'10px 14px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#7A6E5E' }}>Montant</span>
            <span style={{ fontSize:16, fontWeight:900, color:OR }}>{serviceActif.prix.toLocaleString('fr-SN')} FCFA</span>
          </div>

          {/* Pour qui */}
          <div style={{ background:'white', borderRadius:16, padding:16, marginBottom:10, border:'1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:12, fontWeight:700, color:VERT, marginBottom:11 }}>Cette demande est pour :</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[['moi','👤','Moi-même','Infos auto-remplies'],['autre','👥','Une autre personne','Saisir les infos']].map(([id,ic,lab,sub])=>(
                <div key={id} onClick={()=>setPourQui(id)} style={{ border:'1.5px solid '+(pourQui===id?OR:'#e5e0d5'), background:pourQui===id?'#fffbf0':'white', borderRadius:12, padding:12, textAlign:'center', cursor:'pointer' }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{ic}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:pourQui===id?'#8B6020':'#5A5045' }}>{lab}</div>
                  <div style={{ fontSize:9, color:'#9A8E7E', marginTop:2 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ background:'white', borderRadius:16, padding:16, marginBottom:12, border:'1px solid rgba(0,0,0,0.06)' }}>
            {serviceActif.id === 'messe' ? (
              /* ── MESSE : intention uniquement ── */
              <>
                {pourQui === 'moi' && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:10, background:'#F5F0E8', borderRadius:10, marginBottom:12 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:VERT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:OR, flexShrink:0 }}>MD</div>
                    <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:700, color:VERT }}>Marie Diallo</div><div style={{ fontSize:9, color:'#7A6E5E' }}>+221 77 XXX XX XX</div></div>
                    <span style={{ padding:'2px 10px', borderRadius:20, fontSize:9, fontWeight:700, background:'rgba(200,168,75,0.15)', color:'#8B6020' }}>Auto-rempli</span>
                  </div>
                )}
                {pourQui === 'autre' && (
                  <>
                    <input placeholder="Nom et prénom" value={nomPrenom} onChange={e=>setNomPrenom(e.target.value)} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:8 }} />
                    <input placeholder="Lien de parenté (ex: père, ami...)" value={formAutre.lien||''} onChange={e=>setFormAutre({...formAutre,lien:e.target.value})} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:8 }} />
                    <input placeholder="Téléphone de contact" value={formAutre.tel||''} onChange={e=>setFormAutre({...formAutre,tel:e.target.value})} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:8 }} />
                  </>
                )}
                {/* Date souhaitee */}
                <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:6 }}>Date souhaitée (optionnel)</div>
                <input
                  type="date"
                  value={dateMesse}
                  onChange={e => setDateMesse(e.target.value)}
                  style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:6 }}
                />
                <div style={{ fontSize:9, color:'#9A8E7E', marginBottom:12, fontStyle:'italic' }}>
                  Laissez vide si vous n avez pas de date précise. Le prêtre intégrera votre intention dans la prochaine messe disponible.
                </div>

                {/* Moment prefere */}
                <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:8 }}>Moment préféré</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginBottom:14 }}>
                  {[
                    { id:'matin',        label:'Matin',        icon:'🌅', sub:'Avant 12h' },
                    { id:'soir',         label:'Soir',         icon:'🌙', sub:'Après 17h' },
                    { id:'peu_importe',  label:'Peu importe',  icon:'🕊️', sub:'Au choix du prêtre' },
                  ].map(m => (
                    <div
                      key={m.id}
                      onClick={() => setMomentMesse(m.id)}
                      style={{
                        border: '1.5px solid ' + (momentMesse === m.id ? OR : '#e5e0d5'),
                        background: momentMesse === m.id ? '#fffbf0' : 'white',
                        borderRadius: 12, padding: '10px 6px',
                        textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 3 }}>{m.icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: momentMesse === m.id ? '#8B6020' : '#5A5045' }}>{m.label}</div>
                      <div style={{ fontSize: 8, color: '#9A8E7E', marginTop: 2, lineHeight: 1.3 }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:6 }}>Paroisse pour la célébration</div>
                <AutoCompleteParoisse value={paroisseMesse} onChange={setParoisseMesse} />
                <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:7, marginTop:4 }}>Intention de messe</div>
                <textarea value={intention} onChange={e=>setIntention(e.target.value)}
                  placeholder="Pour le repos de l'âme de... / Pour la guérison de..."
                  rows={3} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', resize:'none' }} />
              </>
            ) : (
              /* ── ACTES : nom + date + paroisse ── */
              <>
                <div style={{ background:'rgba(200,168,75,0.06)', border:'1px solid rgba(200,168,75,0.15)', borderRadius:10, padding:'10px 12px', marginBottom:12, fontSize:10, color:'#7A6E5E', lineHeight:1.6 }}>
                  <i className="ti ti-info-circle" style={{ color:'#C8A84B', marginRight:6 }} />
                  Ces informations permettront à la paroisse concernée de retrouver votre acte dans ses registres.
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:6 }}>Nom et prénom complet</div>
                <input placeholder="Ex: Marie Agnès Diallo" value={nomPrenom} onChange={e=>setNomPrenom(e.target.value)} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:12 }} />
                <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:6 }}>
                  {CHAMPS_ACTE[serviceActif.id]?.dateLabel || "Date de l evenement"}
                </div>
                <input type="date" value={dateEvt} onChange={e=>setDateEvt(e.target.value)} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:12 }} />
                <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:6 }}>
                  {CHAMPS_ACTE[serviceActif.id]?.lieuLabel || "Paroisse concernee"}
                </div>
                <AutoCompleteParoisse value={paroisse} onChange={setParoisse} />
                <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:6, marginTop:4 }}>
                  Prêtre officiant (optionnel)
                </div>
                <input
                  placeholder="Ex: Père Jean-Baptiste Diop (si vous vous en souvenez)"
                  value={pretreOfficiant}
                  onChange={e => setPretreOfficiant(e.target.value)}
                  style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:8 }}
                />
                <div style={{ fontSize:9, color:'#9A8E7E', marginBottom:10, fontStyle:'italic' }}>
                  Cette information est facultative mais aide la paroisse à retrouver l'acte plus rapidement.
                </div>
                {pourQui === 'autre' && (
                  <>
                    <div style={{ fontSize:11, fontWeight:700, color:'#7A6E5E', marginBottom:6, marginTop:4 }}>Votre lien avec cette personne</div>
                    <input placeholder="Ex: fils, fille, frère..." value={formAutre.lien||''} onChange={e=>setFormAutre({...formAutre,lien:e.target.value})} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none', marginBottom:8 }} />
                    <input placeholder="Téléphone de contact" value={formAutre.tel||''} onChange={e=>setFormAutre({...formAutre,tel:e.target.value})} style={{ width:'100%', border:'1.5px solid #e5e0d5', borderRadius:12, padding:'11px 14px', fontFamily:'Georgia,serif', fontSize:12, color:VERT, background:'#faf8f4', outline:'none' }} />
                  </>
                )}
              </>
            )}
          </div>
          <button onClick={()=>setEtape('paiement')} style={{ width:'100%', padding:14, background:'linear-gradient(135deg,#C8A84B,#8B6020)', border:'none', borderRadius:14, color:VERT, fontWeight:700, fontSize:14, fontFamily:'Georgia,serif', cursor:'pointer' }}>
            Continuer vers le paiement ✦
          </button>
        </div>
      </div>
    </AppShell>
  );

  // ── PAIEMENT ───────────────────────────────────────────────────────────────
  if (etape==='paiement') return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:IVOIRE, backgroundImage:BOGOLAN, paddingBottom:90 }}>
        {hdr('Paiement', 'formulaire')}
        <div style={{ padding:'0 12px' }}>
          <div style={{ background:'rgba(200,168,75,0.08)', border:'1px solid rgba(200,168,75,0.2)', borderRadius:14, padding:'14px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:9, color:'rgba(12,10,6,0.45)', letterSpacing:'.08em' }}>MONTANT À PAYER</div>
              <div style={{ fontSize:22, fontWeight:900, color:OR, marginTop:2 }}>{serviceActif?.prix.toLocaleString('fr-SN')} FCFA</div>
            </div>
            <div style={{ fontSize:9, color:'#7A6E5E', textAlign:'right' }}>{serviceActif?.titre}</div>
          </div>
          <div style={{ fontSize:10, color:'#7A6E5E', fontWeight:700, marginBottom:10, letterSpacing:'.06em' }}>MODE DE PAIEMENT</div>
          {MODES.map(m=>(
            <div key={m.id} onClick={()=>setModeSelectionne(m)} style={{ display:'flex', alignItems:'center', gap:12, background:'white', border:'1.5px solid '+(modeSelectionne?.id===m.id?OR:'#e5e0d5'), borderRadius:14, padding:'13px 14px', cursor:'pointer', marginBottom:8, transition:'all .2s' }}>
              <img src={m.logo} alt={m.label} style={{ width:44, height:30, objectFit:'contain', borderRadius:7, flexShrink:0, border:'1px solid rgba(0,0,0,0.08)' }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:VERT }}>{m.label}</div>
                <div style={{ fontSize:10, color:'#7A6E5E' }}>{m.sous}</div>
              </div>
              <i className="ti ti-chevron-right" style={{ fontSize:14, color:modeSelectionne?.id===m.id?OR:'#ccc' }} />
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 2px 14px' }}>
            <i className="ti ti-shield-check" style={{ fontSize:13, color:OR }} />
            <span style={{ fontSize:9, color:'#9A8E7E' }}>Paiement sécurisé — Données protégées</span>
          </div>
          <button onClick={()=>{
            if (!modeSelectionne) return;
            if (modeSelectionne.id==='carte') setEtape('carte');
            else {
              try {
                const apps = { wave:'https://wave.com/send', orange:'orangemoney://', free:'freemoney://' };
                window.open(apps[modeSelectionne.id],'_blank');
                setTimeout(()=>setEtape('ussd'), 1500);
              } catch { setEtape('ussd'); }
            }
          }} style={{ width:'100%', padding:14, background:modeSelectionne?'linear-gradient(135deg,#C8A84B,#8B6020)':'#e4e4e7', border:'none', borderRadius:14, color:modeSelectionne?VERT:'#aaa', fontWeight:700, fontSize:14, fontFamily:'Georgia,serif', cursor:modeSelectionne?'pointer':'default' }}>
            {modeSelectionne ? 'Payer avec ' + modeSelectionne.label + ' ✦' : 'Choisir un mode de paiement'}
          </button>
        </div>
      </div>
    </AppShell>
  );

  // ── CARTE BANCAIRE ─────────────────────────────────────────────────────────
  if (etape==='carte') return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:IVOIRE, backgroundImage:BOGOLAN, paddingBottom:90 }}>
        {hdr('Carte bancaire', 'paiement')}
        <FormulaireCarteModal montant={serviceActif?.prix||0} onPayer={()=>setEtape('succes-acte')} onRetour={()=>setEtape('paiement')} />
      </div>
    </AppShell>
  );

  // ── USSD ───────────────────────────────────────────────────────────────────
  if (etape==='ussd') return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:IVOIRE, backgroundImage:BOGOLAN, paddingBottom:90 }}>
        {hdr('Code de paiement', 'paiement')}
        <EcranUSSD mode={modeSelectionne} montant={serviceActif?.prix||0} onValide={()=>setEtape('succes-acte')} onRetour={()=>setEtape('paiement')} />
      </div>
    </AppShell>
  );

  // ── SUCCÈS ACTE ────────────────────────────────────────────────────────────
  if (etape==='succes-acte') return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:IVOIRE, backgroundImage:BOGOLAN, paddingBottom:90 }}>
        <div style={{ padding:'60px 24px', textAlign:'center' }}>
          <div style={{ width:74, height:74, borderRadius:'50%', background:'rgba(200,168,75,0.1)', border:'2px solid #C8A84B', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:30 }}>✦</div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:19, fontWeight:900, color:VERT, marginBottom:7 }}>Demande envoyée</div>
          <div style={{ fontSize:11, color:'#7A6E5E', lineHeight:1.7, marginBottom:20 }}>
            Votre demande a été transmise à la paroisse. Vous recevrez une confirmation sous 24 à 48h.
          </div>
          <div style={{ background:'rgba(200,168,75,0.08)', border:'1px solid rgba(200,168,75,0.2)', borderRadius:14, padding:14, marginBottom:18, textAlign:'left' }}>
            {[['Référence', ref],['Service', serviceActif?.titre],['Date souhaitée', dateMesse || 'Flexible'],['Moment', momentMesse === 'matin' ? 'Matin (avant 12h)' : momentMesse === 'soir' ? 'Soir (après 17h)' : 'Au choix du prêtre'],['Statut','En attente'],['Montant payé', (serviceActif?.prix||0).toLocaleString('fr-SN')+' FCFA']].map(([k,v],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:i<3?8:0 }}>
                <span style={{ fontSize:10, color:'#7A6E5E' }}>{k}</span>
                <span style={{ fontSize:10, fontWeight:700, color:i===3?OR:VERT }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, fontStyle:'italic', color:'#9A8E7E', marginBottom:18 }}>"Que cette intention s'élève comme encens devant Dieu"</div>
          <button onClick={()=>setEtape('liste')} style={{ width:'100%', padding:13, background:'none', border:'1.5px solid #C8A84B', borderRadius:14, color:OR, fontWeight:700, fontSize:13, fontFamily:'Georgia,serif', cursor:'pointer' }}>
            Retour aux demandes
          </button>
        </div>
      </div>
    </AppShell>
  );

  // ── SUCCÈS RDV ─────────────────────────────────────────────────────────────
  if (etape==='succes-rdv') return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:IVOIRE, backgroundImage:BOGOLAN, paddingBottom:90 }}>
        <div style={{ padding:'60px 24px', textAlign:'center' }}>
          <div style={{ width:74, height:74, borderRadius:'50%', background:'rgba(16,185,129,0.1)', border:'2px solid #10B981', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:30 }}>📅</div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:19, fontWeight:900, color:VERT, marginBottom:7 }}>Rendez-vous demandé</div>
          <div style={{ fontSize:11, color:'#7A6E5E', lineHeight:1.7, marginBottom:20 }}>
            Votre demande a été transmise. Le prêtre ou le secrétariat vous contactera pour confirmer.
          </div>
          <div style={{ background:'rgba(200,168,75,0.08)', border:'1px solid rgba(200,168,75,0.2)', borderRadius:14, padding:14, marginBottom:18, textAlign:'left' }}>
            {[['Motif', rdvMotif.replace(/^.+s/,'')],['Statut','En attente de confirmation'],['Tarif','Gratuit']].map(([k,v],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:i<2?8:0 }}>
                <span style={{ fontSize:10, color:'#7A6E5E' }}>{k}</span>
                <span style={{ fontSize:10, fontWeight:700, color:i===2?'#10B981':VERT }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>setEtape('liste')} style={{ width:'100%', padding:13, background:'none', border:'1.5px solid #C8A84B', borderRadius:14, color:OR, fontWeight:700, fontSize:13, fontFamily:'Georgia,serif', cursor:'pointer' }}>
            Retour aux demandes
          </button>
        </div>
      </div>
    </AppShell>
  );

  return null;
}
