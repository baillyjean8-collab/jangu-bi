import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { messagesApi } from '../../services/api';

const VERT = '#1e2d14';
const OR = '#C8A84B';

function getInitiales(parish) {
  if (!parish || !parish.name) return '??';
  return parish.name.substring(0, 2).toUpperCase();
}

function formatHeure(date) {
  if (!date) return '';
  const d = new Date(date);
  const maintenant = new Date();
  if (d.toDateString() === maintenant.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return 'hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function chargerConversations() {
    try {
      const data = await messagesApi.getAll();
      if (data && data.data) setConversations(data.data);
    } catch (e) { console.log('Conversations:', e.message); }
    finally { setLoadingList(false); }
  }

  async function ouvrirConversation(conv) {
    setActive(conv);
    setLoadingThread(true);
    navigate('/messages/' + conv._id, { replace: true });
    try {
      const data = await messagesApi.getOne(conv._id);
      if (data && data.data) setMessages(data.data.messages || []);
      chargerConversations();
    } catch (e) { console.log('Messages:', e.message); }
    finally { setLoadingThread(false); }
  }

  function retourListe() {
    setActive(null);
    setMessages([]);
    navigate('/messages', { replace: true });
  }

  async function envoyerMessage() {
    if (!texte.trim() || !active) return;
    setEnvoi(true);
    try {
      const data = await messagesApi.send(active._id, texte.trim());
      if (data && data.data && data.data.message) {
        setMessages(function(prev) { return prev.concat([data.data.message]); });
        setTexte('');
      }
    } catch (e) { console.log('Envoyer:', e.message); }
    finally { setEnvoi(false); }
  }

  useEffect(function() { chargerConversations(); }, []);

  useEffect(function() {
    if (conversationId && conversations.length > 0 && !active) {
      const conv = conversations.find(function(c) { return c._id === conversationId; });
      if (conv) ouvrirConversation(conv);
    }
  }, [conversationId, conversations]);

  if (active) {
    const parish = active.parishId;
    return (
      <AppShell hideNav>
        <div style={{ background: VERT, padding: '44px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={retourListe} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
          </button>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: VERT, flexShrink: 0 }}>{getInitiales(parish)}</div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 700, color: 'white' }}>{parish ? parish.name : 'Paroisse'}</div>
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 300, background: '#F5F0E8' }}>
          {loadingThread && <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>}
          {!loadingThread && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 12 }}>Aucun message pour le moment</div>
          )}
          {messages.map(function(m) {
            const estMoi = m.senderType === 'user';
            return (
              <div key={m._id} style={{ alignSelf: estMoi ? 'flex-end' : 'flex-start', maxWidth: '75%', background: estMoi ? OR : 'white', color: estMoi ? VERT : '#2a2a2a', fontSize: 12, padding: '8px 12px', borderRadius: estMoi ? '14px 14px 3px 14px' : '14px 14px 14px 3px', border: estMoi ? 'none' : '1px solid rgba(0,0,0,0.06)' }}>
                {m.text}
              </div>
            );
          })}
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: '#F5F0E8', padding: '10px 16px 24px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={texte} onChange={function(e) { setTexte(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessage(); }} placeholder="Ecrire un message..." style={{ flex: 1, border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 20, padding: '10px 14px', fontSize: 12, color: VERT, fontFamily: 'Georgia,serif', outline: 'none', background: 'white' }} />
          <button onClick={envoyerMessage} disabled={envoi || !texte.trim()} style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <i className="ti ti-send" style={{ fontSize: 16, color: VERT }} />
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ background: VERT, padding: '44px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
        </button>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 900, color: 'white' }}>Messages</div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, background: '#F5F0E8', minHeight: '60vh' }}>
        {loadingList && <div style={{ textAlign: 'center', padding: 30, color: '#9A8E7E', fontFamily: 'Georgia,serif' }}>Chargement...</div>}
        {!loadingList && conversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9A8E7E', fontFamily: 'Georgia,serif', fontSize: 13 }}>Aucune conversation pour le moment.<br />Envoyez un message depuis la page d'une paroisse.</div>
        )}
        {conversations.map(function(conv) {
          const parish = conv.parishId;
          const nonLu = conv.unreadUser > 0;
          return (
            <div key={conv._id} onClick={function() { ouvrirConversation(conv); }} style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: VERT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: OR, flexShrink: 0 }}>{getInitiales(parish)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: nonLu ? 700 : 600, color: VERT, fontFamily: 'Georgia,serif' }}>{parish ? parish.name : 'Paroisse'}</div>
                <div style={{ fontSize: 10, color: '#9A8E7E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMessage || 'Nouvelle conversation'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 9, color: '#9A8E7E' }}>{formatHeure(conv.lastMessageAt)}</span>
                {nonLu && <span style={{ background: '#E24B4A', color: '#fff', fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{conv.unreadUser}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
