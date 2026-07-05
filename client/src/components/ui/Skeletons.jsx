/**
 * Skeleton Loaders — JANGU BI
 *
 * Affichés pendant le chargement des données pour éviter
 * les sauts de layout (CLS) et améliorer la perception de vitesse.
 */

// ── Base skeleton ──────────────────────────────────────────────────────────────
function Skel({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-lg bg-forest-light/20 ${className}`}
      style={{
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

// ── Keyframes injectés une seule fois ─────────────────────────────────────────
const STYLE_ID = 'skeleton-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.5; }
      50%       { opacity: 1;   }
    }
  `;
  document.head.appendChild(style);
}

// ── Skeleton carte paroisse ────────────────────────────────────────────────────
export function ParishCardSkeleton() {
  return (
    <div className="card flex items-start gap-3">
      <Skel className="w-14 h-14 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skel className="h-4 w-3/4" />
        <Skel className="h-3 w-1/2" />
        <div className="flex gap-4 pt-2 mt-2 border-t border-forest-light/20">
          <Skel className="h-3 w-12" />
          <Skel className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

// ── Skeleton liste paroisses ───────────────────────────────────────────────────
export function ParishListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ParishCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Skeleton carte live ────────────────────────────────────────────────────────
export function LiveCardSkeleton() {
  return (
    <div className="card-glow space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skel className="h-3 w-16" />
          <Skel className="h-5 w-full" />
          <Skel className="h-3 w-32" />
        </div>
        <Skel className="w-12 h-12 rounded-xl flex-shrink-0" />
      </div>
      <div className="flex justify-between pt-2 border-t border-forest-light/20">
        <Skel className="h-3 w-24" />
        <Skel className="h-3 w-16" />
      </div>
    </div>
  );
}

// ── Skeleton profil ────────────────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Skel className="w-16 h-16 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skel className="h-5 w-40" />
          <Skel className="h-3 w-48" />
          <div className="flex gap-2">
            <Skel className="h-5 w-16 rounded-full" />
            <Skel className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <Skel className="h-10 w-full rounded-xl mb-6" />
      {/* Content */}
      <div className="card space-y-4">
        <Skel className="h-4 w-48" />
        <div className="grid grid-cols-2 gap-3">
          <Skel className="h-12 rounded-xl" />
          <Skel className="h-12 rounded-xl" />
        </div>
        <Skel className="h-12 rounded-xl" />
        <Skel className="h-12 rounded-xl" />
        <Skel className="h-12 rounded-xl" />
      </div>
    </div>
  );
}

// ── Skeleton dashboard admin ───────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="card flex items-start gap-4">
            <Skel className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skel className="h-3 w-20" />
              <Skel className="h-6 w-28" />
            </div>
          </div>
        ))}
      </div>
      <div className="card space-y-3">
        <Skel className="h-4 w-32" />
        {[1,2,3].map(i => (
          <div key={i} className="flex justify-between py-2 border-b border-forest-light/20">
            <div className="space-y-1">
              <Skel className="h-3 w-32" />
              <Skel className="h-3 w-24" />
            </div>
            <div className="space-y-1 items-end">
              <Skel className="h-3 w-20" />
              <Skel className="h-4 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton donation history ──────────────────────────────────────────────────
export function DonationSkeleton({ count = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <Skel className="h-3 w-32" />
            <Skel className="h-3 w-24" />
          </div>
          <div className="space-y-1 items-end">
            <Skel className="h-4 w-20" />
            <Skel className="h-4 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
