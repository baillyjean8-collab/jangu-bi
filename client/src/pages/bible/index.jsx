const NOM_ANGLAIS = {
  "Gn":"Genesis","Ex":"Exodus","Lv":"Leviticus","Nb":"Numbers","Dt":"Deuteronomy",
  "Jos":"Joshua","Jg":"Judges","Rt":"Ruth","1S":"I Samuel","2S":"II Samuel",
  "1R":"I Kings","2R":"II Kings","1Ch":"I Chronicles","2Ch":"II Chronicles",
  "Esd":"Ezra","Ne":"Nehemiah","Tb":"Tobit","Jdt":"Judith","Est":"Esther",
  "1M":"I Maccabees","2M":"II Maccabees","Jb":"Job","Ps":"Psalms","Pr":"Proverbs",
  "Qo":"Ecclesiastes","Ct":"Song of Solomon","Sg":"Wisdom","Si":"Sirach",
  "Is":"Isaiah","Jr":"Jeremiah","Lm":"Lamentations","Ba":"Baruch","Ez":"Ezekiel",
  "Dn":"Daniel","Os":"Hosea","Jl":"Joel","Am":"Amos","Ab":"Obadiah","Jon":"Jonah",
  "Mi":"Micah","Na":"Nahum","Ha":"Habakkuk","So":"Zephaniah","Ag":"Haggai",
  "Za":"Zechariah","Ml":"Malachi","Mt":"Matthew","Mc":"Mark","Lc":"Luke","Jn":"John",
  "Ac":"Acts","Rm":"Romans","1Co":"I Corinthians","2Co":"II Corinthians",
  "Ga":"Galatians","Ep":"Ephesians","Ph":"Philippians","Col":"Colossians",
  "1Th":"I Thessalonians","2Th":"II Thessalonians","1Tm":"I Timothy","2Tm":"II Timothy",
  "Tt":"Titus","Phm":"Philemon","He":"Hebrews","Jc":"James","1P":"I Peter",
  "2P":"II Peter","1Jn":"I John","2Jn":"II John","3Jn":"III John","Jude":"Jude",
  "Ap":"Revelation of John"
};

let bibleCrampon = null;

async function chargerBibleComplete() {
  if (bibleCrampon) return bibleCrampon;
  try {
    const cached = localStorage.getItem('jb_crampon_cache_v1');
    if (cached) { bibleCrampon = JSON.parse(cached); return bibleCrampon; }
  } catch {}
  const res = await fetch('https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/FreCrampon.json');
  if (!res.ok) throw new Error('Bible indisponible');
  const data = await res.json();
  bibleCrampon = data;
  try { localStorage.setItem('jb_crampon_cache_v1', JSON.stringify(data)); } catch {}
  return data;
}
