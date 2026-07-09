import AppShell from '../../components/AppShell';

const IVOIRE  = '#F5F0E8';
const BOGOLAN = 'repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px),repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(200,168,75,0.04) 8px,rgba(200,168,75,0.04) 9px)';

// Ces pages de gestion utilisent desormais la meme grande navbar que le
// reste de l'application (AppShell), pour rester coherentes et permettre
// de naviguer ailleurs directement sans devoir d'abord revenir au profil.
export default function AdminShell({ children }) {
  return (
    <AppShell>
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100%', background: IVOIRE, backgroundImage: BOGOLAN, position: 'relative' }}>
        {children}
      </div>
    </AppShell>
  );
}
