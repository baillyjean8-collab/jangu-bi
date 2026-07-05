import { useState } from 'react';

export default function ParoissesPage() {
  const [activeFilter, setActiveFilter] = useState('Tous');

  const villes = ['Tous', 'Dakar', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor'];
  
  const paroisses = [
    {
      nom: 'Cathédrale du Souvenir Africain',
      diocese: 'Archidiocèse de Dakar',
      adresse: 'Boulevard de la République, Dakar',
      prochaineMesse: '18h30',
      image: 'https://images.unsplash.com/photo-1548625361-155deee25938?w=500',
      distance: '1.2 km'
    },
    {
      nom: 'Paroisse Saint Joseph de Médina',
      diocese: 'Archidiocèse de Dakar',
      adresse: 'Avenue Blaise Diagne, Dakar',
      prochaineMesse: '19h00',
      image: 'https://images.unsplash.com/photo-1545232979-8bf34eb9757b?w=500',
      distance: '3.5 km'
    },
    {
      nom: 'Paroisse Sainte Anne',
      diocese: 'Diocèse de Thiès',
      adresse: 'Quartier Dixième, Thiès',
      prochaineMesse: '07h00 (Demain)',
      image: 'https://images.unsplash.com/photo-1515706886582-54c73c5eaf41?w=500',
      distance: '62 km'
    }
  ];

  return (
    <div style={{ 
      padding: '16px 16px 40px 16px', 
      background: '#FAFAFA',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      minHeight: '100vh'
    }}>
      
      {/* TITRE ET BARRE DE RECHERCHE DE TYPE PINTEREST */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800', color: '#064E3B', letterSpacing: '-0.5px' }}>
          Découvrir les Paroisses
        </h2>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '16px', fontSize: '16px' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Rechercher une église, un diocèse..." 
            style={{
              width: '100%',
              padding: '14px 14px 14px 44px',
              borderRadius: '16px',
              border: '1px solid #E4E4E7',
              background: '#FFFFFF',
              fontSize: '14px',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
            }}
          />
        </div>
      </div>

      {/* FILTRES HORIZONTAUX SQUIRCLE (Style Instagram/Pinterest) */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '16px',
        scrollbarWidth: 'none' 
      }}>
        {villes.map((ville) => (
          <button
            key={ville}
            onClick={() => setActiveFilter(ville)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === ville ? '#064E3B' : '#F4F4F5',
              color: activeFilter === ville ? '#DFB15B' : '#71717A',
              fontWeight: '600',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {ville}
          </button>
        ))}
      </div>

      {/* LISTE DES CARTES PAROISSES (Inspiration : Airbnb UI) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {paroisses.map((paroisse, idx) => (
          <div 
            key={idx} 
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E4E4E7',
              overflow: 'hidden',
              boxShadow: '0 6px 18px rgba(0,0,0,0.02)',
              position: 'relative'
            }}
          >
            {/* Image de la Paroisse avec Badge Distance */}
            <div style={{ width: '100%', height: '160px', position: 'relative' }}>
              <img src={paroisse.image} alt={paroisse.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#064E3B'
              }}>
                📍 {paroisse.distance}
              </span>
            </div>

            {/* Corps de la carte */}
            <div style={{ padding: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#DFB15B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {paroisse.diocese}
              </span>
              <h3 style={{ margin: '4px 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#18181B', lineHeight: '1.3' }}>
                {paroisse.nom}
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#71717A' }}>
                {paroisse.adresse}
              </p>

              {/* Encadré Prochaine Messe Style Info-Gare épuré */}
              <div style={{
                background: '#ECFDF5',
                borderRadius: '14px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>🕒</span>
                  <span style={{ fontSize: '12px', color: '#064E3B', fontWeight: '600' }}>Prochaine messe</span>
                </div>
                <span style={{ fontSize: '13px', color: '#064E3B', fontWeight: '800' }}>{paroisse.prochaineMesse}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}