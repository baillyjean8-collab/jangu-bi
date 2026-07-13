import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';

const VERT = '#1e2d14';
const OR = '#C8A84B';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [peutGerer, setPeutGerer] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texte, setTexte] = useState('');
  const [visibilite, setVisibilite] = useState('public');
  const [publication, setPublication] = useState(false);

  async function charger() {
    try {
      const { groupApi } = await import('../../services/api');
      const dataGroup = await groupApi.getOne(id);
      if (dataGroup && dataGroup.data) {
        setGroup(dataGroup.data.group);
        setPeutGerer(!!dataGroup.data.peutGerer);
      }
      const dataPosts = await groupApi.getPosts(id);
      if (dataPosts && dataPosts.data) setPosts(dataPosts.data);
    } catch (e) { console.log('Groupe:', e.message); }
    finally { setLoading(false); }
  }

  useEffect(function() { charger(); }, [id]);

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
      <div style={{ background: VERT, padding: '44px 16px 20px' }}>
        <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 20, color: OR }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: group.type === 'prive' ? 'rgba(0,0,0,0.3)' : 'rgba(200,168,75,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={group.type === 'prive' ? 'ti ti-lock' : 'ti ti-world'} style={{ fontSize: 20, color: OR }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 800, color: '#fff' }}>{group.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(200,168,75,0.7)' }}>{group.type === 'prive' ? 'Groupe prive' : 'Page publique'} - {group.memberCount || 0} membres</div>
          </div>
        </div>
      </div>

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
    </AppShell>
  );
}
