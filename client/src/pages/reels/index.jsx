import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { postsApi } from '../../services/api';

function ReelItem({ post, actif, onLike, aimeParMoi }) {
  const videoRef = useRef(null);
  const [enPause, setEnPause] = useState(false);
  const [coeurAnime, setCoeurAnime] = useState(false);
  const dernierTapRef = useRef(0);

  useEffect(function() {
    const v = videoRef.current;
    if (!v) return;
    if (actif) {
      v.currentTime = 0;
      v.play().catch(function() {});
      setEnPause(false);
    } else {
      v.pause();
    }
  }, [actif]);

  function surTap() {
    const maintenant = Date.now();
    if (maintenant - dernierTapRef.current < 300) {
      // Double tap = j'aime
      if (!aimeParMoi) onLike();
      setCoeurAnime(true);
      setTimeout(function() { setCoeurAnime(false); }, 700);
    } else {
      // Simple tap = pause/marche
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) { v.play().catch(function() {}); setEnPause(false); }
      else { v.pause(); setEnPause(true); }
    }
    dernierTapRef.current = maintenant;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000', scrollSnapAlign: 'start', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={surTap}>
      <video ref={videoRef} src={post.videoUrl} loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

      {coeurAnime && (
        <i className="ti ti-heart-filled" style={{ position: 'absolute', fontSize: 90, color: '#fff', opacity: 0.9, pointerEvents: 'none' }} />
      )}

      {enPause && !coeurAnime && (
        <i className="ti ti-player-play-filled" style={{ position: 'absolute', fontSize: 50, color: 'rgba(255,255,255,0.8)', pointerEvents: 'none' }} />
      )}

      <div style={{ position: 'absolute', left: 14, right: 70, bottom: 90, color: '#fff', pointerEvents: 'none' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{post.parishId && post.parishId.name}</div>
        <div style={{ fontSize: 12, lineHeight: 1.4 }}>{post.content}</div>
      </div>

      <div style={{ position: 'absolute', right: 12, bottom: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div onClick={function(e) { e.stopPropagation(); onLike(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
          <i className={aimeParMoi ? 'ti ti-heart-filled' : 'ti ti-heart'} style={{ fontSize: 26, color: aimeParMoi ? '#e53935' : '#fff' }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, marginTop: 2 }}>{(post.likes && post.likes.length) || 0}</span>
        </div>
        <div onClick={function(e) { e.stopPropagation(); navigator.share && navigator.share({ title: post.parishId && post.parishId.name, text: post.content }); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
          <i className="ti ti-share" style={{ fontSize: 24, color: '#fff' }} />
        </div>
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [reels, setReels] = useState([]);
  const [indexActif, setIndexActif] = useState(0);
  const [mesLikes, setMesLikes] = useState({});
  const conteneurRef = useRef(null);

  useEffect(function() {
    postsApi.getAll({ limit: 50 }).then(function(res) {
      const items = (res && res.data && (res.data.items || res.data.data || res.data)) || [];
      const liste = (Array.isArray(items) ? items : []).filter(function(p) { return p.videoUrl; });
      setReels(liste);
      if (postId) {
        const idx = liste.findIndex(function(p) { return String(p._id) === String(postId); });
        if (idx >= 0) setIndexActif(idx);
      }
    }).catch(function(e) { console.log('Reels:', e.message); });
  }, [postId]);

  useEffect(function() {
    const el = conteneurRef.current;
    if (!el || reels.length === 0) return undefined;
    const enfant = el.children[indexActif];
    if (enfant) enfant.scrollIntoView({ block: 'start' });
  }, [reels.length]);

  function surScroll() {
    const el = conteneurRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / window.innerHeight);
    if (idx !== indexActif) setIndexActif(idx);
  }

    function aimer(post) {
    const dejaAime = !!mesLikes[post._id];
    postsApi.like(post._id).catch(function(e) { console.log('Like:', e.message); });
    setMesLikes(function(prev) {
      const next = Object.assign({}, prev);
      if (dejaAime) delete next[post._id];
      else next[post._id] = true;
      return next;
    });
    setReels(function(prev) {
      return prev.map(function(p) {
        if (p._id !== post._id) return p;
        const compteActuel = (p.likes && p.likes.length) || 0;
        const nouveauCompte = dejaAime ? Math.max(0, compteActuel - 1) : compteActuel + 1;
        return { ...p, likes: new Array(nouveauCompte).fill('x') };
      });
    });
  }

  return (
    <AppShell>
      <div ref={conteneurRef} onScroll={surScroll} style={{ height: '100vh', overflowY: 'auto', scrollSnapType: 'y mandatory', background: '#000' }}>
        <div onClick={function() { navigate(-1); }} style={{ position: 'fixed', top: 44, left: 14, zIndex: 10, color: '#fff', fontSize: 20 }}>
          <i className="ti ti-arrow-left" />
        </div>
                {reels.map(function(post, i) {
          return <ReelItem key={post._id} post={post} actif={i === indexActif} onLike={function() { aimer(post); }} aimeParMoi={!!mesLikes[post._id]} />;
        })}
        {reels.length === 0 && (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>Aucune video pour l'instant.</div>
        )}
      </div>
    </AppShell>
  );
}
