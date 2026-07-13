import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';

const VERT = '#1e2d14';
const OR = '#C8A84B';

function determinerTypeFichier(mime) {
  if (!mime) return 'document';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [peutGerer, setPeutGerer] = useState(false);
  const [estMembre, setEstMembre] = useState(false);
  const [onglet, setOnglet] = useState('publications');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texte, setTexte] = useState('');
  const [visibilite, setVisibilite] = useState('public');
  const [publication, setPublication] = useState(false);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [texteMessage, setTexteMessage] = useState('');
  const [fichierEnAttente, setFichierEnAttente] = useState(null);
  const [envoiMessage, setEnvoiMessage] = useState(false);

  async function charger() {
    try {
      const { groupApi } = await import('../../services/api');
      const dataGroup = await groupApi.getOne(id);
      if (dataGroup && dataGroup.data) {
        setGroup(dataGroup.data.group);
        setPeutGerer(!!dataGroup.data.peutGerer);
        setEstMembre(!!dataGroup.data.estMembre);
      }
      const dataPosts = await groupApi.getPosts(id);
      if (dataPosts && dataPosts.data) setPosts(dataPosts.data);
    } catch (e) { console.log('Groupe:', e.message); }
    finally { setLoading(false); }
  }

  useEffect(function() { charger(); }, [id]);

  async function chargerMessages() {
    setLoadingMessages(true);
    try {
      const { groupApi } = await import('../../services/api');
      const data = await groupApi.getMessages(id);
      if (data && data.data) setMessages(data.data);
    } catch (e) { console.log('Messages groupe:', e.message); }
    finally { setLoadingMessages(false); }
  }

  useEffect(function() {
    if (onglet === 'discussion' && estMembre) chargerMessages();
  }, [onglet, estMembre]);

  async function publier() {
    if (!texte.trim()) return;
    setPublication(true);
    try {
      const { groupApi } = await import('../../services/api');
      await groupApi.createPost(id, { content: texte.trim(), visibility: visibilite });
      setTexte('');
      charger();
    } catch (e) { console.log('Publier:', e.message); }
    finally { setPublication(false); }
  }

  function choisirFichier(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      setFichierEnAttente({
        dataUrl: ev.target.result,
        type: determinerTypeFichier(file.type),
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function envoyerMessage() {
    if (!texteMessage.trim() && !fichierEnAttente) return;
    setEnvoiMessage(true);
    try {
      const { groupApi } = await import('../../services/api');
      await groupApi.sendMessage(id, {
        text: texteMessage.trim(),
        fileUrl: fichierEnAttente ? fichierEnAttente.dataUrl : null,
        fileType: fichierEnAttente ? fichierEnAttente.type : null,
        fileName: fichierEnAttente ? fichierEnAttente.name : null,
      });
      setTexteMessage('');
      setFichierEnAttente(null);
      chargerMessages();
    } catch (e) { console.log('Envoyer message groupe:', e.message); }
    finally { setEnvoiMessage(false); }
  }

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Groupe introuvable</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ background: VERT, padding: '44px 16px 0' }}>
        <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: group.type === 'prive' ? 'rgba(0,0,0,0.3)' : 'rgba(200,168,75,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={group.type === 'prive' ? 'ti ti-lock' : 'ti ti-world'} style={{ fontSize: 20, color: OR }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 800, color: '#fff' }}>{group.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(200,168,75,0.7)' }}>{group.type === 'prive' ? 'Groupe prive' : 'Page publique'} - {group.memberCount || 0} membres</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          <button onClick={function() { setOnglet('publications'); }} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: onglet === 'publications' ? OR : 'rgba(255,255,255,0.5)', borderBottom: onglet === 'publications' ? '2px solid ' + OR : '2px solid transparent' }}>Publications</button>
          {estMembre && (
            <button onClick={function() { setOnglet('discussion'); }} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: onglet === 'discussion' ? OR : 'rgba(255,255,255,0.5)', borderBottom: onglet === 'discussion' ? '2px solid ' + OR : '2px solid transparent' }}>Discussion</button>
          )}
        </div>
      </div>

      {onglet === 'publications' && (
        <div style={{ padding: '16px', background: '#F5F0E8', minHeight: '60vh' }}>
          {peutGerer && (
            <div style={{ background: 'white', borderRadius: 14, padding: 12, marginBottom: 16, border: '1px solid #e8e4dc' }}>
              <textarea value={texte} onChange={function(e) { setTexte(e.target.value); }} placeholder={'Publier dans ' + group.name + '...'} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', height: 70, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                {group.type === 'prive' ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div onClick={function() { setVisibilite('prive'); }} style={{ padding: '5px 10px', borderRadius: 20, fontSize: 10, cursor: 'pointer', background: visibilite === 'prive' ? VERT : 'rgba(0,0,0,0.05)', color: visibilite === 'prive' ? OR : '#7A6E5E', fontWeight: 700 }}>Membres seulement</div>
                    <div onClick={function() { setVisibilite('public'); }} style={{ padding: '5px 10px', borderRadius: 20, fontSize: 10, cursor: 'pointer', background: visibilite === 'public' ? OR : 'rgba(0,0,0,0.05)', color: visibilite === 'public' ? VERT : '#7A6E5E', fontWeight: 700 }}>Public</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: '#9A8E7E' }}>Visible par tous</div>
                )}
                <button onClick={publier} disabled={publication || !texte.trim()} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 20, color: OR, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Publier</button>
              </div>
            </div>
          )}

          {posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>Aucune publication pour le moment</div>
          )}
          {posts.map(function(p) {
            return (
              <div key={p._id} style={{ background: 'white', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e8e4dc' }}>
                <div style={{ fontSize: 12, color: '#3a3a3a', lineHeight: 1.5, marginBottom: 6 }}>{p.content}</div>
                {p.visibility === 'prive' && (
                  <span style={{ fontSize: 8, background: 'rgba(30,45,20,0.08)', color: VERT, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>Membres seulement</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {onglet === 'discussion' && estMembre && (
        <>
          <div style={{ padding: '14px 16px', background: '#F5F0E8', minHeight: '55vh', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingMessages && <div style={{ textAlign: 'center', padding: 20, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>}
            {!loadingMessages && messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 12 }}>Aucun message pour le moment. Lancez la discussion !</div>
            )}
            {messages.map(function(m) {
              const auteur = m.senderId;
              return (
                <div key={m._id} style={{ background: 'white', borderRadius: 12, padding: '8px 12px', border: '1px solid #e8e4dc', maxWidth: '85%' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: OR, marginBottom: 3 }}>{auteur ? (auteur.firstName + ' ' + auteur.lastName) : 'Membre'}</div>
                  {m.text && <div style={{ fontSize: 12, color: '#2a2a2a', lineHeight: 1.4 }}>{m.text}</div>}
                  {m.fileUrl && m.fileType === 'image' && (
                    <img src={m.fileUrl} alt={m.fileName || 'image'} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6, display: 'block' }} />
                  )}
                  {m.fileUrl && m.fileType === 'video' && (
                    <video src={m.fileUrl} controls style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6, display: 'block' }} />
                  )}
                  {m.fileUrl && m.fileType === 'document' && (
                    <a href={m.fileUrl} download={m.fileName || 'fichier'} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: VERT, textDecoration: 'none' }}>
                      <i className="ti ti-file" style={{ fontSize: 14 }} /> {m.fileName || 'Telecharger le fichier'}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ position: 'sticky', bottom: 0, background: '#F5F0E8', padding: '10px 16px 20px' }}>
            {fichierEnAttente && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 10, padding: '6px 10px', marginBottom: 8, border: '1px solid #e8e4dc' }}>
                <i className={fichierEnAttente.type === 'image' ? 'ti ti-photo' : fichierEnAttente.type === 'video' ? 'ti ti-video' : 'ti ti-file'} style={{ fontSize: 15, color: OR }} />
                <div style={{ flex: 1, fontSize: 11, color: VERT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fichierEnAttente.name}</div>
                <i onClick={function() { setFichierEnAttente(null); }} className="ti ti-x" style={{ fontSize: 14, color: '#e53935', cursor: 'pointer' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={choisirFichier} />
              <button onClick={function() { fileRef.current && fileRef.current.click(); }} style={{ width: 38, height: 38, borderRadius: '50%', background: 'white', border: '1.5px solid rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <i className="ti ti-paperclip" style={{ fontSize: 16, color: OR }} />
              </button>
              <input value={texteMessage} onChange={function(e) { setTexteMessage(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessage(); }} placeholder="Ecrire un message..." style={{ flex: 1, border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 20, padding: '10px 14px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', outline: 'none', background: 'white' }} />
              <button onClick={envoyerMessage} disabled={envoiMessage || (!texteMessage.trim() && !fichierEnAttente)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <i className="ti ti-send" style={{ fontSize: 16, color: OR }} />
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
