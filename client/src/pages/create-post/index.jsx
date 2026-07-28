import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../context/AuthContext';
import { postsApi, storiesApi } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const VERT = '#1e2d14';
const OR   = '#C8A84B';
const IVOIRE = '#F5F0E8';

const TYPES_PUB = [
  { id: 'NORMAL',      label: 'Publication', color: 'rgba(200,168,75,0.15)', tc: '#8B6020' },
  { id: 'ANNONCE',     label: 'Annonce',     color: '#e3f2fd',              tc: '#1565c0' },
  { id: 'INSCRIPTION', label: 'Inscription', color: 'rgba(21,101,192,0.1)', tc: '#1565C0' },
  { id: 'COLLECTE',    label: 'Collecte',    color: 'rgba(200,168,75,0.15)',tc: '#8B6020' },
  { id: 'EVENEMENT',   label: 'Evenement',   color: '#e8f5e9',              tc: '#2e7d32' },
  { id: 'MEDIA',       label: 'Media',       color: 'rgba(183,28,28,0.08)', tc: '#b71c1c' },
];

const FILTRES = [
  { id: 'normal',     label: 'Normal',     css: 'none' },
  { id: 'vif',        label: 'Vif',        css: 'saturate(1.6) contrast(1.05)' },
  { id: 'chaleureux', label: 'Chaleureux', css: 'sepia(0.35) saturate(1.2)' },
  { id: 'nb',         label: 'N&B',        css: 'grayscale(1)' },
  { id: 'contraste',  label: 'Contraste',  css: 'contrast(1.4)' },
];

const CADRES = [
  { id: 'original', label: 'Originale', ratio: 'nature' },
  { id: 'libre',    label: 'Forme libre', ratio: null },
  { id: 'carre',    label: '1:1',      ratio: 1 },
  { id: 'portrait', label: '4:5',      ratio: 0.8 },
  { id: 'story',    label: '9:16',     ratio: 0.5625 },
  { id: 'paysage',  label: '16:9',     ratio: 1.7778 },
];


export default function CreatePostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const [chargementEdition, setChargementEdition] = useState(!!editId);
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const dragRef = useRef({ actif: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const conteneurMediaRef = useRef(null);

  const [typePub, setTypePub]     = useState('NORMAL');
  const [texte, setTexte]         = useState('');
  const [publishing, setPublishing] = useState(false);
  const [erreur, setErreur]       = useState('');
  const [aussiEnStory, setAussiEnStory] = useState(false);
  const [placesLimitees, setPlacesLimitees] = useState(false);
  const [capaciteMax, setCapaciteMax] = useState(50);
  const [autoriserAnnulation, setAutoriserAnnulation] = useState(true);
  const [inscriptionDebut, setInscriptionDebut] = useState('');
  const [inscriptionFin, setInscriptionFin] = useState('');
  const [estPayant, setEstPayant] = useState(false);
  const [tarifParPersonne, setTarifParPersonne] = useState(1000);

  useEffect(function() {
    if (!editId) return;
    async function chargerPourEdition() {
      try {
        const res = await postsApi.getOne(editId);
        const post = res && res.data && res.data.post;
        if (!post) { setErreur('Publication introuvable.'); return; }
        setTexte(post.content || '');
        setTypePub(post.type || 'NORMAL');
        const imagesExistantes = (post.imageUrls && post.imageUrls.length) ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []);
        if (imagesExistantes.length > 0) {
          setMediaItems(imagesExistantes.map(function(url) {
            return { url: url, kind: 'image', local: false, dejaHeberge: true };
          }));
        } else if (post.videoUrl) {
          setMediaItems([{ url: post.videoUrl, kind: 'video', local: false, dejaHeberge: true }]);
        }
        if (post.eventCapacity != null) {
          setPlacesLimitees(true);
          setCapaciteMax(post.eventCapacity);
        }
        setAutoriserAnnulation(post.autoriserAnnulation !== false);
        if (post.inscriptionDebut) setInscriptionDebut(new Date(post.inscriptionDebut).toISOString().slice(0, 16));
        if (post.inscriptionFin) setInscriptionFin(new Date(post.inscriptionFin).toISOString().slice(0, 16));
        if (post.eventFeeAmount != null && post.eventFeeAmount > 0) {
          setEstPayant(true);
          setTarifParPersonne(post.eventFeeAmount);
        }
      } catch (e) {
        setErreur(e.message || 'Impossible de charger la publication a modifier.');
      } finally {
        setChargementEdition(false);
      }
    }
    chargerPourEdition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const [mediaItems, setMediaItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activePanel, setActivePanel] = useState(null); // 'filtres' | 'ajuster' | 'recadrer' | 'texte' | null
  const [editionOuverte, setEditionOuverte] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const texteRef = useRef(null);
  const imgCropRef = useRef(null);
  const [cropTemp, setCropTemp] = useState(null);
  const [aspectActuel, setAspectActuel] = useState(undefined);
  const [reglageChoisi, setReglageChoisi] = useState('luminosite');

  const initiales = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'MD';
  const activeMedia = mediaItems[activeIndex] || null;

  function retirerMedia(i) {
    setMediaItems(function(prev) {
      return prev.filter(function(_, idx) { return idx !== i; });
    });
    setActiveIndex(function(prev) {
      if (i < prev) return prev - 1;
      if (i === prev) return Math.max(0, prev - 1);
      return prev;
    });
  }
  const yAMediaLocal = mediaItems.some(function(m) { return m.local; });

  function ratioEffectif(m) {
    if (!m) return 1;
    if (m.craftedRatio) return m.craftedRatio; // un vrai recadrage a deja ete effectue
    return m.ratio || 1;
  }

  // Une photo remplit tout le cadre (cover) tant qu'aucun recadrage precis n'a
  // encore ete effectue et qu'on zoome dessus. Des qu'un recadrage reel existe,
  // la photo est deja exactement a la bonne forme : plus besoin de la couper.
  function doitRemplirLeCadre(m) {
    if (!m) return false;
    if (m.craftedRatio) return false;
    return m.zoom > 1;
  }

  function objectFitPour(m) {
    return doitRemplirLeCadre(m) ? 'cover' : 'contain';
  }

  function limiterOffset(offsetXFrac, offsetYFrac, zoom) {
    const marge = Math.max(zoom - 1, 0) / 2;
    const clamp = function(v) { return Math.max(-marge, Math.min(marge, v)); };
    return { x: clamp(offsetXFrac), y: clamp(offsetYFrac) };
  }

  function demanderQuitter() {
    if (texte.trim() || mediaItems.length > 0) {
      setShowLeaveConfirm(true);
    } else {
      navigate(-1);
    }
  }

  function ouvrirSelecteurFichiers() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function redimensionnerEnBase64(file) {
    return new Promise(function(resolve, reject) {
      if (file.type.startsWith('video/')) {
        uploadToCloudinary(file, 'video')
          .then(function(url) { resolve({ url: url, kind: 'video', local: false }); })
          .catch(function() { resolve({ url: URL.createObjectURL(file), kind: 'video', local: true }); });
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = function() {
        const MAX = 1280;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * (MAX / w)); w = MAX; }
          else { w = Math.round(w * (MAX / h)); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        resolve({ url: canvas.toDataURL('image/jpeg', 0.82), kind: 'image', local: false });
      };
      img.onerror = function() {
        URL.revokeObjectURL(objectUrl);
        resolve({ url: objectUrl, kind: 'image', local: true });
      };
      img.src = objectUrl;
    });
  }

  async function surFichiersChoisis(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const resultats = await Promise.all(files.map(redimensionnerEnBase64));
    const nouveaux = resultats.map(function(r) {
      return {
        url: r.url,
        kind: r.kind,
        filtre: 'normal',
        brightness: 100,
        contrast: 100,
        saturation: 100,
        local: r.local,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        cadre: 'original',
        texteAjoute: '',
      };
    });
    setMediaItems(function(prev) {
      const next = [...prev, ...nouveaux];
      setActiveIndex(prev.length);
      return next;
    });
    e.target.value = '';
    setEditionOuverte(true);
  }

  function retirerMediaActif() {
    setMediaItems(function(prev) {
      const next = prev.filter(function(_, i) { return i !== activeIndex; });
      setActiveIndex(0);
      return next;
    });
    if (mediaItems.length <= 1) setEditionOuverte(false);
  }

  function changerBrightness(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, brightness: valeur }; });
    });
  }

  function changerContrast(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, contrast: valeur }; });
    });
  }

  function changerSaturation(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, saturation: valeur }; });
    });
  }

  function appliquerAjustementAuto() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, brightness: 104, contrast: 112, saturation: 118 }; });
    });
  }

  function reinitialiserAjustements() {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) { return i !== activeIndex ? m : { ...m, brightness: 100, contrast: 100, saturation: 100 }; });
    });
  }

  function choisirCadre(cadreId) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, cadre: cadreId };
      });
    });
    const img = imgCropRef.current;
    if (!img) return;
    const cw = img.width, ch = img.height;
        if (cadreId === 'libre') {
      setAspectActuel(undefined);
      setCropTemp({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
      return;
    }
    const cadre = CADRES.find(function(c) { return c.id === cadreId; });
    const aspect = cadreId === 'original' ? (cw / ch) : cadre.ratio;
    setAspectActuel(aspect);
    const nouveauCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, cw, ch),
      cw, ch
    );
    setCropTemp(nouveauCrop);
  }

  // Initialise l'outil de recadrage a l'ouverture : reprend le recadrage deja
  // enregistre s'il existe, sinon propose l'image entiere (comme "Originale").
  function onImageLoadForCrop(e) {
    const img = e.currentTarget;
    imgCropRef.current = img;
    const cw = img.width, ch = img.height;
    if (activeMedia && activeMedia.cropPct) {
      setCropTemp(activeMedia.cropPct);
      const cadreActuel = CADRES.find(function(c) { return c.id === activeMedia.cadre; });
      if (activeMedia.cadre === 'libre') setAspectActuel(undefined);
      else if (activeMedia.cadre === 'original') setAspectActuel(cw / ch);
      else setAspectActuel(cadreActuel ? cadreActuel.ratio : undefined);
    } else {
      setAspectActuel(cw / ch);
      setCropTemp(centerCrop(makeAspectCrop({ unit: '%', width: 100 }, cw / ch, cw, ch), cw, ch));
    }
  }

  function surCropChange(_pixelCrop, percentCrop) {
    setCropTemp(percentCrop);
  }

  function surCropComplete(_pixelCrop, percentCrop) {
    const img = imgCropRef.current;
    if (!img || !percentCrop || !percentCrop.width) return;
    const ratioNaturel = img.naturalWidth / img.naturalHeight;
    const craftedRatio = (percentCrop.width / percentCrop.height) * ratioNaturel;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        return i !== activeIndex ? m : { ...m, cropPct: percentCrop, craftedRatio: craftedRatio };
      });
    });
  }
  // Texte ecrit directement sur la photo (au lieu d'un modal separe).
  function surTexteBlur(e) {
    const nouveauTexte = e.target.textContent;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, texteAjoute: nouveauTexte };
      });
    });
  }

  useEffect(function() {
    if (texteRef.current) {
      texteRef.current.textContent = (activeMedia && activeMedia.texteAjoute) || '';
    }
  }, [activeIndex, editionOuverte]);

  useEffect(function() {
    if (activePanel === 'texte' && texteRef.current) {
      texteRef.current.focus();
    }
  }, [activePanel]);

  function demarrerGlisser(e) {
    if (!activeMedia) return;
    if (!doitRemplirLeCadre(activeMedia)) return;
    const point = e.touches ? e.touches[0] : e;
    dragRef.current = { actif: true, startX: point.clientX, startY: point.clientY, baseX: activeMedia.offsetX, baseY: activeMedia.offsetY };
  }

  function bougerGlisser(e) {
    if (!dragRef.current.actif) return;
    const el = conteneurMediaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const dxFrac = (point.clientX - dragRef.current.startX) / rect.width;
    const dyFrac = (point.clientY - dragRef.current.startY) / rect.height;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        const limite = limiterOffset(dragRef.current.baseX + dxFrac, dragRef.current.baseY + dyFrac, Math.max(m.zoom, 1));
        return { ...m, offsetX: limite.x, offsetY: limite.y };
      });
    });
  }

  function arreterGlisser() {
    dragRef.current.actif = false;
  }

  function changerZoom(valeur) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        const limite = limiterOffset(m.offsetX, m.offsetY, valeur);
        return { ...m, zoom: valeur, offsetX: limite.x, offsetY: limite.y };
      });
    });
  }

  function choisirFiltre(filtreId) {
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        return { ...m, filtre: filtreId };
      });
    });
  }

  function calculerFiltreCss(m) {
    if (!m) return 'none';
    const parts = [];
    const f = FILTRES.find(function(x) { return x.id === m.filtre; });
    if (f && f.css !== 'none') parts.push(f.css);
    const b = m.brightness != null ? m.brightness : 100;
    const c = m.contrast != null ? m.contrast : 100;
    const s = m.saturation != null ? m.saturation : 100;
    if (b !== 100 || c !== 100 || s !== 100) {
      parts.push('brightness(' + b + '%) contrast(' + c + '%) saturate(' + s + '%)');
    }
    return parts.length ? parts.join(' ') : 'none';
  }

  function styleFiltreActif() {
    return calculerFiltreCss(activeMedia);
  }

  function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function appliquerBrightnessSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp255(data[i] * facteur);
      data[i + 1] = clamp255(data[i + 1] * facteur);
      data[i + 2] = clamp255(data[i + 2] * facteur);
    }
  }
  function appliquerContrasteSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp255((data[i] - 128) * facteur + 128);
      data[i + 1] = clamp255((data[i + 1] - 128) * facteur + 128);
      data[i + 2] = clamp255((data[i + 2] - 128) * facteur + 128);
    }
  }
  function appliquerSaturationSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      data[i] = clamp255(lum + (r - lum) * facteur);
      data[i + 1] = clamp255(lum + (g - lum) * facteur);
      data[i + 2] = clamp255(lum + (b - lum) * facteur);
    }
  }
  function appliquerGrayscaleSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const gris = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = clamp255(r + (gris - r) * facteur);
      data[i + 1] = clamp255(g + (gris - g) * facteur);
      data[i + 2] = clamp255(b + (gris - b) * facteur);
    }
  }
  function appliquerSepiaSurPixels(data, facteur) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      data[i] = clamp255(r + (sr - r) * facteur);
      data[i + 1] = clamp255(g + (sg - g) * facteur);
      data[i + 2] = clamp255(b + (sb - b) * facteur);
    }
  }

  function appliquerFiltresSurCanvas(ctx, largeur, hauteur, m) {
    const imageData = ctx.getImageData(0, 0, largeur, hauteur);
    const data = imageData.data;

    if (m.filtre === 'vif') {
      appliquerSaturationSurPixels(data, 1.6);
      appliquerContrasteSurPixels(data, 1.05);
    } else if (m.filtre === 'chaleureux') {
      appliquerSepiaSurPixels(data, 0.35);
      appliquerSaturationSurPixels(data, 1.2);
    } else if (m.filtre === 'nb') {
      appliquerGrayscaleSurPixels(data, 1);
    } else if (m.filtre === 'contraste') {
      appliquerContrasteSurPixels(data, 1.4);
    }

    const b = m.brightness != null ? m.brightness : 100;
    const c = m.contrast != null ? m.contrast : 100;
    const s = m.saturation != null ? m.saturation : 100;
    if (b !== 100) appliquerBrightnessSurPixels(data, b / 100);
    if (c !== 100) appliquerContrasteSurPixels(data, c / 100);
    if (s !== 100) appliquerSaturationSurPixels(data, s / 100);

    ctx.putImageData(imageData, 0, 0);
  }

  function graverImageFinale(m) {
    return new Promise(function(resolve, reject) {
      if (m.kind !== 'image') { resolve(m.url); return; }
      const img = new Image();
      img.onload = function() {
        const naturalW = img.naturalWidth, naturalH = img.naturalHeight;

        let sx = 0, sy = 0, sw = naturalW, sh = naturalH;
        if (m.cropPct && m.cropPct.width) {
          sx = (m.cropPct.x / 100) * naturalW;
          sy = (m.cropPct.y / 100) * naturalH;
          sw = (m.cropPct.width / 100) * naturalW;
          sh = (m.cropPct.height / 100) * naturalH;
        }

        const outputW = Math.round(sw);
        const outputH = Math.round(sh);

        const canvas = document.createElement('canvas');
        canvas.width = outputW;
        canvas.height = outputH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputW, outputH);

        appliquerFiltresSurCanvas(ctx, outputW, outputH, m);

        if (m.texteAjoute) {
          const tailleFonte = Math.round(outputW * 0.06);
          ctx.font = tailleFonte + 'px Georgia, serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 2;

          const maxLargeur = outputW * 0.82;
          const mots = m.texteAjoute.split(' ');
          const lignes = [];
          let ligneActuelle = '';
          mots.forEach(function(mot) {
            const test = ligneActuelle ? ligneActuelle + ' ' + mot : mot;
            if (ctx.measureText(test).width > maxLargeur && ligneActuelle) {
              lignes.push(ligneActuelle);
              ligneActuelle = mot;
            } else {
              ligneActuelle = test;
            }
          });
          if (ligneActuelle) lignes.push(ligneActuelle);

          const interligne = tailleFonte * 1.25;
          const departY = outputH / 2 - ((lignes.length - 1) * interligne) / 2;
          lignes.forEach(function(ligne, i) {
            ctx.fillText(ligne, outputW / 2, departY + i * interligne);
          });
        }

        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = function() { reject(new Error("Impossible de graver l'image.")); };
      img.src = m.url;
    });
  }

  function enregistrerRatio(largeur, hauteur) {
    if (!largeur || !hauteur) return;
    setMediaItems(function(prev) {
      return prev.map(function(m, i) {
        if (i !== activeIndex) return m;
        if (m.ratio) return m;
        return { ...m, ratio: largeur / hauteur };
      });
    });
  }

  const premiereImage = mediaItems.find(function(m) { return m.kind === 'image'; });

  async function publier() {
    if (!texte.trim()) {
      setErreur('Ecrivez au moins une phrase avant de publier.');
      return;
    }
    setPublishing(true);
    setErreur('');
        try {
      if (editId) {
        const imagesExistantesGardees = mediaItems.filter(function(m) { return m.kind === 'image' && m.dejaHeberge; }).map(function(m) { return m.url; });
        const imagesNouvelles = mediaItems.filter(function(m) { return m.kind === 'image' && !m.dejaHeberge && !m.local; });
        const imagesNouvellesGravees = await Promise.all(imagesNouvelles.map(graverImageFinale));
        const toutesLesImages = imagesExistantesGardees.concat(imagesNouvellesGravees);
        const videoExistante = mediaItems.find(function(m) { return m.kind === 'video' && m.dejaHeberge; });

        await postsApi.update(editId, {
          content: texte.trim(),
          type: typePub,
          imageUrl: toutesLesImages[0] || null,
          imageUrls: toutesLesImages,
          videoUrl: videoExistante ? videoExistante.url : (toutesLesImages.length ? null : undefined),
          eventCapacity: (typePub === 'EVENEMENT' && placesLimitees) ? capaciteMax : null,
          autoriserAnnulation: typePub === 'EVENEMENT' ? autoriserAnnulation : undefined,
          inscriptionDebut: (typePub === 'EVENEMENT' && inscriptionDebut) ? inscriptionDebut : undefined,
          inscriptionFin: (typePub === 'EVENEMENT' && inscriptionFin) ? inscriptionFin : undefined,
          eventFeeAmount: (typePub === 'EVENEMENT' && estPayant) ? tarifParPersonne : undefined,
        });
        navigate(-1);
        return;
      }

      const imagesAEnvoyer = mediaItems.filter(function(m) { return m.kind === 'image' && !m.local; });
      const imagesGravees = await Promise.all(imagesAEnvoyer.map(graverImageFinale));
      const videoValide = mediaItems.find(function(m) { return m.kind === 'video' && !m.local; });

      await postsApi.create({
        content: texte.trim(),
        type: typePub,
        imageUrl: imagesGravees[0],
        imageUrls: imagesGravees,
        videoUrl: videoValide ? videoValide.url : undefined,
        eventCapacity: (typePub === 'EVENEMENT' && placesLimitees) ? capaciteMax : null,
        autoriserAnnulation: typePub === 'EVENEMENT' ? autoriserAnnulation : undefined,
        inscriptionDebut: (typePub === 'EVENEMENT' && inscriptionDebut) ? inscriptionDebut : undefined,
        inscriptionFin: (typePub === 'EVENEMENT' && inscriptionFin) ? inscriptionFin : undefined,
        eventFeeAmount: (typePub === 'EVENEMENT' && estPayant) ? tarifParPersonne : undefined,
      });

      if (aussiEnStory && premiereImage && !premiereImage.local) {
        try {
          const imageStoryGravee = await graverImageFinale(premiereImage);
          await storiesApi.create({ imageUrl: imageStoryGravee, caption: texte.trim() });
        } catch (e) {
          console.log('Story:', e.message);
        }
      }

      navigate(-1);
    } catch (e) {
      setErreur(e?.message || 'Une erreur est survenue, veuillez reessayer.');
    } finally {
      setPublishing(false);
    }
  }

  function transformActif(m) {
    if (doitRemplirLeCadre(m)) {
      return 'translate(' + ((m.offsetX || 0) * 100) + '%,' + ((m.offsetY || 0) * 100) + '%) scale(' + Math.max(m.zoom, 1) + ')';
    }
    return 'none';
  }

  function rendreMedia() {
    if (!activeMedia) return null;
    const fit = 'cover';
    return (
      <>
        {activeMedia.kind === 'video' ? (
          <video src={activeMedia.url} style={{ width: '100%', height: '100%', objectFit: fit, background: '#000', transform: transformActif(activeMedia), filter: styleFiltreActif() }} muted loop autoPlay playsInline />
        ) : (
          <img src={activeMedia.url} alt="media" style={{ width: '100%', height: '100%', objectFit: fit, background: '#000', transform: transformActif(activeMedia), filter: styleFiltreActif() }} />
        )}

        <div
          ref={texteRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={surTexteBlur}
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            color: '#fff', fontWeight: 700, fontSize: 22, textAlign: 'center', minWidth: 30,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)', padding: '8px 20px', zIndex: 4,
            fontFamily: 'Georgia,serif', outline: 'none', cursor: 'text',
            border: activePanel === 'texte' ? '1.5px dashed rgba(255,255,255,0.5)' : 'none',
            borderRadius: 8,
          }}
        />
        {!activeMedia.texteAjoute && activePanel === 'texte' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 22, fontFamily: 'Georgia,serif', pointerEvents: 'none', zIndex: 3 }}>
            Ecrire un texte…
          </div>
        )}
      </>
    );
  }

  function rendreControles() {
        if (!activeMedia) return null;
    return (
      <>
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={function() { if (activeIndex > 0) setActiveIndex(activeIndex - 1); }}
              disabled={activeIndex === 0}
              style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', fontSize: 16, zIndex: 12, opacity: activeIndex === 0 ? 0.3 : 1 }}
            >‹</button>
            <button
              onClick={function() { if (activeIndex < mediaItems.length - 1) setActiveIndex(activeIndex + 1); }}
              disabled={activeIndex === mediaItems.length - 1}
              style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', fontSize: 16, zIndex: 12, opacity: activeIndex === mediaItems.length - 1 ? 0.3 : 1 }}
            >›</button>
          </>
        )}


                {/* Colonne complete, icones seules sans libelle, dans l'ordre exact de la
            maquette de reference. Seuls Ajuster/Texte/Filtres/Cadrer sont relies a
            une vraie fonction pour l'instant ; les autres sont presents visuellement,
            en attente d'une future fonctionnalite. */}
        <div style={{ position: 'absolute', top: 56, right: 12, display: 'flex', flexDirection: 'column', gap: 18, zIndex: 12, alignItems: 'center' }}>
          <div onClick={function() { setActivePanel(activePanel === 'ajuster' ? null : 'ajuster'); }} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activePanel === 'ajuster' ? OR : '#fff', fontSize: 20 }}>
            <i className="ti ti-settings" />
          </div>

          <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: '#fff', fontSize: 20, opacity: 0.55 }}>
            <i className="ti ti-share" />
          </div>

          <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />

          <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: '#fff', fontSize: 20, opacity: 0.55 }}>
            <i className="ti ti-camera-rotate" />
          </div>

          <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: '#fff', fontSize: 20, opacity: 0.55 }}>
            <i className="ti ti-movie" />
          </div>

          <div onClick={function() { setActivePanel(activePanel === 'texte' ? null : 'texte'); }} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeMedia.texteAjoute || activePanel === 'texte' ? OR : '#fff', fontSize: 17, fontWeight: 700 }}>
            Aa
          </div>

          <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: '#fff', fontSize: 20, opacity: 0.55 }}>
            <i className="ti ti-mood-smile" />
          </div>

          <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: '#fff', fontSize: 20, opacity: 0.55 }}>
            <i className="ti ti-sparkles" />
          </div>

          <div onClick={function() { setActivePanel(activePanel === 'filtres' ? null : 'filtres'); }} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activePanel === 'filtres' ? OR : '#fff', fontSize: 20 }}>
            <i className="ti ti-circles" />
          </div>

          <div onClick={function() { setActivePanel(activePanel === 'recadrer' ? null : 'recadrer'); }} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activePanel === 'recadrer' ? OR : '#fff', fontSize: 20 }}>
            <i className="ti ti-crop" />
          </div>

          <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: '#fff', fontSize: 18, opacity: 0.55 }}>
            <i className="ti ti-chevron-down" />
          </div>
        </div>

        {activePanel === 'filtres' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '26px 10px 10px', display: 'flex', gap: 8, overflowX: 'auto', zIndex: 12 }}>
            {FILTRES.map(function(f) {
              const actif = activeMedia.filtre === f.id;
              return (
                <div key={f.id} onClick={function() { choisirFiltre(f.id); }} style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, backgroundImage: activeMedia.kind === 'image' ? 'url(' + activeMedia.url + ')' : 'none', backgroundColor: '#333', backgroundSize: 'cover', backgroundPosition: 'center', filter: f.css, border: actif ? '2px solid ' + OR : '1.5px solid rgba(255,255,255,0.4)' }} />
                  <div style={{ fontSize: 8, color: '#fff', marginTop: 3 }}>{f.label}</div>
                </div>
              );
            })}
          </div>
        )}

                {activePanel === 'ajuster' && (function() {
          const REGLAGES = [
            { id: 'luminosite', label: 'Luminosite', valeur: activeMedia.brightness, min: 50, max: 150, onChange: changerBrightness },
            { id: 'contraste', label: 'Contraste', valeur: activeMedia.contrast, min: 50, max: 150, onChange: changerContrast },
            { id: 'saturation', label: 'Saturation', valeur: activeMedia.saturation, min: 0, max: 200, onChange: changerSaturation },
          ];
          const actuel = REGLAGES.find(function(r) { return r.id === reglageChoisi; }) || REGLAGES[0];
          return (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '20px 10px 12px', zIndex: 12 }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
                {REGLAGES.map(function(r) {
                  const actif = r.id === reglageChoisi;
                  return (
                    <div key={r.id} onClick={function() { setReglageChoisi(r.id); }} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, background: actif ? OR : 'rgba(255,255,255,0.12)', color: actif ? VERT : '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {r.label}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={actuel.min} max={actuel.max} value={actuel.valeur} onChange={function(e) { actuel.onChange(+e.target.value); }} style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: '#fff', width: 30, textAlign: 'right' }}>{actuel.valeur}</span>
              </div>
            </div>
          );
        })()}

      </>
    );
  }

  function rendreRecadrage() {
    if (!activeMedia || activeMedia.kind !== 'image') return null;
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#000' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, overflow: 'hidden' }}>
          <ReactCrop
            crop={cropTemp}
            onChange={surCropChange}
            onComplete={surCropComplete}
            aspect={aspectActuel}
            keepSelection
          >
            <img
              src={activeMedia.url}
              alt=""
              onLoad={onImageLoadForCrop}
              style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
            />
          </ReactCrop>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 12px 14px', background: '#000' }}>
          {CADRES.map(function(c) {
            const actif = (activeMedia.cadre || 'original') === c.id;
            return (
              <div key={c.id} onClick={function() { choisirCadre(c.id); }} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, background: actif ? OR : 'rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: actif ? VERT : '#fff', whiteSpace: 'nowrap' }}>{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: IVOIRE }}>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={surFichiersChoisis}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '44px 16px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <button onClick={demanderQuitter} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 20, color: VERT }} />
          </button>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: VERT }}>Nouvelle publication</div>
        </div>

        <div style={{ padding: 16 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: VERT }}>
              {initiales}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: VERT }}>{user?.parish?.name || ((user?.firstName || '') + ' ' + (user?.lastName || ''))}</div>
              <div style={{ fontSize: 10, color: '#9A8E7E' }}>Visible par tous les fideles</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#9A8E7E', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>NATURE DE LA PUBLICATION</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {TYPES_PUB.map(function(t) {
              return (
                <div key={t.id} onClick={function() { setTypePub(t.id); }} style={{ padding: '6px 13px', borderRadius: 20, background: typePub === t.id ? t.color : 'rgba(0,0,0,0.04)', border: '1px solid ' + (typePub === t.id ? t.tc + '40' : 'rgba(0,0,0,0.08)'), fontSize: 11, color: typePub === t.id ? t.tc : '#7A6E5E', cursor: 'pointer', fontWeight: typePub === t.id ? 700 : 400 }}>
                  {t.label}
                </div>
              );
            })}
          </div>

          {typePub === 'EVENEMENT' && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
              <div onClick={function() { setPlacesLimitees(function(v) { return !v; }); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: VERT }}>Limiter le nombre de places</div>
                  <div style={{ fontSize: 10, color: '#9A8E7E' }}>Laisse desactive si illimite</div>
                </div>
                <div style={{ width: 42, height: 24, borderRadius: 20, background: placesLimitees ? OR : '#e5e0d5', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: placesLimitees ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              {placesLimitees && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <label style={{ fontSize: 10.5, color: '#9A8E7E', display: 'block', marginBottom: 4 }}>Nombre maximum de places</label>
                  <input
                    type="number"
                    min="1"
                    value={capaciteMax}
                    onChange={function(e) { setCapaciteMax(Math.max(1, +e.target.value || 1)); }}
                    style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '9px 12px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: VERT }}
                  />
                </div>
              )}
            </div>
          )}

          {typePub === 'EVENEMENT' && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
              <div onClick={function() { setAutoriserAnnulation(function(v) { return !v; }); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: VERT }}>Autoriser l'annulation</div>
                  <div style={{ fontSize: 10, color: '#9A8E7E' }}>Desactive : l'inscription devient definitive</div>
                </div>
                <div style={{ width: 42, height: 24, borderRadius: 20, background: autoriserAnnulation ? OR : '#e5e0d5', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: autoriserAnnulation ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
          )}

          {typePub === 'EVENEMENT' && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: VERT, marginBottom: 4 }}>Periode d'inscription</div>
              <div style={{ fontSize: 10, color: '#9A8E7E', marginBottom: 10 }}>Laisse vide pour aucune limite de ce cote</div>
              <label style={{ fontSize: 10.5, color: '#9A8E7E', display: 'block', marginBottom: 4 }}>Ouverture des inscriptions</label>
              <div style={{ width: '100%', overflow: 'hidden', borderRadius: 10, marginBottom: 10 }}>
                <input
                  type="datetime-local"
                  value={inscriptionDebut}
                  onChange={function(e) { setInscriptionDebut(e.target.value); }}
                  style={{ width: '100%', minWidth: 0, maxWidth: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '9px 12px', fontSize: 16, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: VERT, display: 'block' }}
                />
              </div>
              <label style={{ fontSize: 10.5, color: '#9A8E7E', display: 'block', marginBottom: 4 }}>Fermeture des inscriptions</label>
              <div style={{ width: '100%', overflow: 'hidden', borderRadius: 10 }}>
                <input
                  type="datetime-local"
                  value={inscriptionFin}
                  onChange={function(e) { setInscriptionFin(e.target.value); }}
                  style={{ width: '100%', minWidth: 0, maxWidth: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '9px 12px', fontSize: 16, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: VERT, display: 'block' }}
                />
              </div>
            </div>
          )}

          {typePub === 'EVENEMENT' && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
              <div onClick={function() { setEstPayant(function(v) { return !v; }); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: VERT }}>Tarif de participation</div>
                  <div style={{ fontSize: 10, color: '#9A8E7E' }}>Desactive : evenement gratuit</div>
                </div>
                <div style={{ width: 42, height: 24, borderRadius: 20, background: estPayant ? OR : '#e5e0d5', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: estPayant ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              {estPayant && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <label style={{ fontSize: 10.5, color: '#9A8E7E', display: 'block', marginBottom: 4 }}>Montant par personne (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    value={tarifParPersonne}
                    onChange={function(e) { setTarifParPersonne(Math.max(0, +e.target.value || 0)); }}
                    style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.3)', borderRadius: 10, padding: '9px 12px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'Georgia,serif', color: VERT, marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 10, color: '#9A8E7E' }}>
                    Paye via Mobile Money / carte (CinetPay). Fonctionnera une fois le compte marchand configure.
                  </div>
                </div>
              )}
            </div>
          )}

          <textarea
            value={texte}
            onChange={function(e) { setTexte(e.target.value); setErreur(''); }}
            placeholder="Partagez une nouvelle avec vos fideles..."
            style={{ width: '100%', border: '1.5px solid rgba(200,168,75,0.25)', borderRadius: 14, padding: 14, fontSize: 13, color: VERT, fontFamily: 'Georgia,serif', resize: 'none', height: 120, background: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: 18 }}
          />

          <div style={{ fontSize: 11, color: '#9A8E7E', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>MEDIA (OPTIONNEL)</div>

          {mediaItems.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10 }}>
              {mediaItems.map(function(m, i) {
                return (
                  <div key={i} onClick={function() { setActiveIndex(i); }} style={{ position: 'relative', flexShrink: 0, width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: i === activeIndex ? '2px solid ' + OR : '1.5px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}>
                    {m.kind === 'video' ? (
                      <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : (
                      <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <div onClick={function(e) { e.stopPropagation(); retirerMedia(i); }} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <i className="ti ti-x" style={{ fontSize: 10, color: '#fff' }} />
                    </div>
                  </div>
                );
              })}
              <div onClick={ouvrirSelecteurFichiers} style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 10, border: '1.5px dashed rgba(200,168,75,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: OR, fontSize: 20 }}>
                +
              </div>
            </div>
          )}

          {mediaItems.length === 0 && (
            <div onClick={ouvrirSelecteurFichiers} style={{ background: 'rgba(200,168,75,0.06)', border: '1.5px dashed rgba(200,168,75,0.35)', borderRadius: 14, padding: '34px 16px', textAlign: 'center', marginBottom: 12, cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
              <div style={{ fontSize: 12, color: '#8B6020', fontWeight: 700 }}>Ajouter une photo ou une video</div>
              <div style={{ fontSize: 10, color: '#9A8E7E', marginTop: 4 }}>Une ou plusieurs, depuis vos fichiers</div>
            </div>
          )}

          {mediaItems.length > 0 && (
            <div
              onClick={function() { setEditionOuverte(true); }}
              style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 12, background: '#0C0A06', aspectRatio: ratioEffectif(activeMedia) + ' / 1', cursor: 'pointer' }}
            >
              {activeMedia.kind === 'video' ? (
                <video src={activeMedia.url} onLoadedMetadata={function(e) { enregistrerRatio(e.target.videoWidth, e.target.videoHeight); }} style={{ width: '100%', height: '100%', objectFit: objectFitPour(activeMedia), background: '#000', transform: transformActif(activeMedia), filter: styleFiltreActif() }} controls playsInline />
              ) : (
                <img src={activeMedia.url} alt="media" draggable="false" onLoad={function(e) { enregistrerRatio(e.target.naturalWidth, e.target.naturalHeight); }} style={{ width: '100%', height: '100%', objectFit: objectFitPour(activeMedia), background: '#000', transform: transformActif(activeMedia), filter: styleFiltreActif(), pointerEvents: 'none' }} onError={function(e) { e.target.style.opacity = 0.2; }} />
              )}
              {activeMedia.texteAjoute && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', fontWeight: 700, fontSize: 16, textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.6)', padding: '0 14px', fontFamily: 'Georgia,serif' }}>
                  {activeMedia.texteAjoute}
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, padding: '4px 9px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-edit" style={{ fontSize: 11 }} /> Modifier
              </div>
            </div>
          )}

          {yAMediaLocal && (
            <div style={{ fontSize: 10, color: '#8a6d00', background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.25)', borderRadius: 10, padding: '8px 12px', marginBottom: 18 }}>
              Cette video reste en apercu local pour l'instant (trop volumineuse) : elle ne sera pas visible par les autres fideles. Les photos, elles, sont deja envoyees normalement.
            </div>
          )}

          <div onClick={function() { setAussiEnStory(function(v) { return !v; }); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: VERT }}>Publier aussi en story</div>
              <div style={{ fontSize: 10, color: '#9A8E7E' }}>Visible 24h en plus de la publication</div>
            </div>
            <div style={{ width: 42, height: 24, borderRadius: 20, background: aussiEnStory ? OR : '#e5e0d5', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: aussiEnStory ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>

          {erreur && (
            <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, fontSize: 12, color: '#e53935' }}>
              {erreur}
            </div>
          )}

          <button
            onClick={publier}
            disabled={publishing}
            style={{ width: '100%', padding: 14, background: publishing ? 'rgba(200,168,75,0.5)' : 'linear-gradient(135deg,#C8A84B,#8B6020)', border: 'none', borderRadius: 14, color: VERT, fontWeight: 700, fontSize: 14, fontFamily: 'Georgia,serif', cursor: publishing ? 'default' : 'pointer' }}
          >
            {publishing ? (editId ? 'Enregistrement...' : 'Publication en cours...') : (editId ? 'Enregistrer les modifications' : 'Publier')}
          </button>
        </div>
      </div>

      {editionOuverte && activeMedia && (
                <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '44px 16px 6px', position: 'relative', zIndex: 20, flexShrink: 0 }}>
                        <button onClick={function() { setEditionOuverte(false); }} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 17, cursor: 'pointer' }}>‹</button>
            {mediaItems.length > 1 ? (
              <div style={{ display: 'flex', gap: 5 }}>
                {mediaItems.map(function(_, i) {
                  return <span key={i} onClick={function() { setActiveIndex(i); }} style={{ width: i === activeIndex ? 16 : 6, height: 6, borderRadius: 3, background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all .2s', cursor: 'pointer' }} />;
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 12px', opacity: 0.6 }}>
                <span style={{ fontSize: 11 }}>🎵</span>
                <span style={{ fontSize: 10.5, color: '#fff', fontWeight: 700 }}>Ajouter un son</span>
              </div>
            )}
            <span style={{ width: 34 }} />
          </div>
          <div
            ref={conteneurMediaRef}
            onMouseDown={activePanel === 'recadrer' ? undefined : demarrerGlisser} onMouseMove={activePanel === 'recadrer' ? undefined : bougerGlisser} onMouseUp={activePanel === 'recadrer' ? undefined : arreterGlisser} onMouseLeave={activePanel === 'recadrer' ? undefined : arreterGlisser}
            onTouchStart={activePanel === 'recadrer' ? undefined : demarrerGlisser} onTouchMove={activePanel === 'recadrer' ? undefined : bougerGlisser} onTouchEnd={activePanel === 'recadrer' ? undefined : arreterGlisser}
            style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 0, boxSizing: 'border-box', position: 'relative' }}
          >
            {activePanel === 'recadrer' ? rendreRecadrage() : (
              <>
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 0, cursor: doitRemplirLeCadre(activeMedia) ? 'grab' : 'default' }}>
                  {rendreMedia()}
                </div>
                {rendreControles()}
              </>
            )}
          </div>
          <div style={{ padding: '8px 12px 10px', position: 'relative', zIndex: 20, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, alignItems: 'center' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-layout-grid" style={{ color: '#fff', fontSize: 15 }} />
              </div>
              {mediaItems.map(function(m, i) {
                return (
                  <div key={i} onClick={function() { setActiveIndex(i); }} style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', border: i === activeIndex ? '2px solid ' + OR : '1.5px solid rgba(255,255,255,0.3)', flexShrink: 0, cursor: 'pointer' }}>
                    {m.kind === 'video' ? (
                      <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : (
                      <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                );
              })}
              <div onClick={ouvrirSelecteurFichiers} style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px dashed rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', color: OR, fontSize: 16 }}>
                +
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: '5px 14px 5px 5px' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#C8A84B,#8B7030)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: VERT }}>
                  {initiales}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Publication</span>
              </div>
              <button onClick={function() { if (activePanel === 'recadrer') { setActivePanel(null); } else { setEditionOuverte(false); } }} style={{ background: 'linear-gradient(135deg,#C8A84B,#8B6020)', color: VERT, border: 'none', padding: '10px 26px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                Suivant
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span onClick={function() { setEditionOuverte(false); }} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>Annuler</span>
            </div>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 18px', width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 6 }}>Quitter sans publier ?</div>
            <div style={{ fontSize: 12, color: '#7A6E5E', marginBottom: 18, lineHeight: 1.5 }}>Le texte et les photos ajoutes seront perdus.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowLeaveConfirm(false); }} style={{ flex: 1, padding: 11, background: 'linear-gradient(135deg,#1e2d14,#0a140a)', border: 'none', borderRadius: 10, color: OR, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Continuer la publication
              </button>
              <button onClick={function() { navigate(-1); }} style={{ flex: 1, padding: 11, background: 'none', border: '1.5px solid #e5e0d5', borderRadius: 10, color: '#b71c1c', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
