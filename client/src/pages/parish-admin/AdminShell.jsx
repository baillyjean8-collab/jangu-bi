const IVOIRE  = '#F5F0E8';
const BOGOLAN = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';

// Navbar admin retiree : le profil (page paroisse) est desormais l'unique
// point d'entree de navigation. Ces pages sont atteintes depuis ses boutons
// et on y revient via la fleche "retour" deja presente en haut de chaque ecran.
export default function AdminShell({ children }) {
  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: IVOIRE, backgroundImage: BOGOLAN, position: 'relative' }}>
      {children}
    </div>
  );
}
