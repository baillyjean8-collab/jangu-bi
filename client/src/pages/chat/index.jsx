import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../../components/layout';
import { parishesApi } from '../../api';
import api from '../../api/client';

const chatApi = {
  start:        (parishId)         => api.post('/chat/start', { parishId }),
  myConvs:      ()                 => api.get('/chat/my'),
  getMessages:  (convId)           => api.get(`/chat/${convId}/messages`),
  send:         (data)             => api.post('/chat/message', data),
  markRead:     (convId)           => api.post(`/chat/${convId}/read`),
};

export function ChatPage() {
  const { user } = useAuth();
  const [view, setView]                 = useState('list'); // 'list' | 'new' | 'conv'
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState('');
  const [parishes, setParishes]         = useState([]);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const res = await chatApi.myConvs();
      setConversations(res.data.data?.conversations || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function openConversation(conv) {
    setActiveConv(conv);
    setView('conv');
    try {
      const res = await chatApi.getMessages(conv._id);
      setMessages(res.data.data?.messages || []);
      await chatApi.markRead(conv._id);
    } catch {}
  }

  async function startNewConversation(parish) {
    try {
      const res = await chatApi.start(parish._id);
      const conv = res.data.data?.conversation;
      setActiveConv({ ...conv, parishId: parish });
      setMessages([]);
      setView('conv');
      loadConversations();
    } catch {}
  }

  async function sendMessage(fileUrl, fileType, fileName) {
    if (!text.trim() && !fileUrl) return;
    try {
      const res = await chatApi.send({
        conversationId: activeConv._id,
        text: text.trim(),
        fileUrl, fileType, fileName,
      });
      setMessages(prev => [...prev, res.data.data?.message]);
      setText('');
      loadConversations();
    } catch {}
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      sendMessage(reader.result, isImage ? 'image' : 'document', file.name);
    };
    reader.readAsDataURL(file);
  }

  function handleCall() {
    alert('📞 Fonctionnalité d\'appel audio — à connecter avec WebRTC ou un service tiers.');
  }

  const filteredParishes = parishes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Vue : liste des conversations ──────────────────────────────────────────
  if (view === 'list') return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>✝️ Messages</h1>
        <button onClick={async () => {
          setView('new');
          const res = await parishesApi.list({ limit: 50 });
          setParishes(res.data.data || []);
        }} style={{ background: '#B8860B', border: 'none', borderRadius: 20, padding: '0.4rem 1rem', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
          + Nouvelle conversation
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Chargement…</p>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✉️</p>
          <p>Aucune conversation</p>
          <p style={{ fontSize: '0.82rem' }}>Commencez par contacter une paroisse</p>
        </div>
      ) : (
        conversations.map(conv => (
          <div key={conv._id} onClick={() => openConversation(conv)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: 12, background: 'var(--color-background-secondary, #1a2332)', marginBottom: '0.5rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2a3a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>⛪</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{conv.parishId?.name || 'Paroisse'}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage || 'Aucun message'}</p>
            </div>
            {conv.unreadUser > 0 && (
              <span style={{ background: '#B8860B', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{conv.unreadUser}</span>
            )}
          </div>
        ))
      )}
    </AppShell>
  );

  // ── Vue : nouvelle conversation ────────────────────────────────────────────
  if (view === 'new') return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Choisir une paroisse</h1>
      </div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Rechercher une paroisse…"
        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 25, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
      />
      {filteredParishes.map(p => (
        <div key={p._id} onClick={() => startNewConversation(p)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: 12, background: 'var(--color-background-secondary, #1a2332)', marginBottom: '0.5rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2a3a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>⛪</div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{p.name}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{p.location?.city}, {p.location?.country}</p>
          </div>
        </div>
      ))}
    </AppShell>
  );

  // ── Vue : conversation ─────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-background-primary, #0f1923)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--color-background-secondary, #1a2332)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={() => { setView('list'); loadConversations(); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2a3a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>⛪</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{activeConv?.parishId?.name || 'Paroisse'}</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>En ligne</p>
        </div>
        <button onClick={handleCall} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }} title="Appel audio">📞</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '2rem' }}>Commencez la conversation 🙏</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderType === 'user';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                background: isMe ? '#B8860B' : 'var(--color-background-secondary, #1a2332)',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '0.6rem 0.85rem',
                border: isMe ? 'none' : '1px solid rgba(255,255,255,0.07)',
              }}>
                {msg.fileType === 'image' && <img src={msg.fileUrl} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: msg.text ? '0.4rem' : 0 }} />}
                {msg.fileType === 'document' && (
                  <a href={msg.fileUrl} download={msg.fileName} style={{ color: isMe ? '#fff' : '#B8860B', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: msg.text ? '0.4rem' : 0 }}>
                    📄 {msg.fileName}
                  </a>
                )}
                {msg.text && <p style={{ margin: 0, fontSize: '0.88rem', color: isMe ? '#fff' : 'var(--color-text-primary)', lineHeight: 1.4 }}>{msg.text}</p>}
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--color-text-secondary)', textAlign: 'right' }}>
                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {msg.readAt && isMe && ' ✓✓'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem 1rem', background: 'var(--color-background-secondary, #1a2332)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <input type="file" ref={fileRef} onChange={handleFile} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" />
        <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', padding: '0.3rem' }}>📎</button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Message…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 25, padding: '0.55rem 1rem', color: 'var(--color-text-primary)', fontSize: '0.88rem', outline: 'none' }}
        />
        <button onClick={() => sendMessage()} style={{ background: '#B8860B', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>➤</button>
      </div>
    </div>
  );
}