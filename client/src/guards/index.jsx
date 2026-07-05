import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Full-page loader while session restores ────────────────────────────────────
function SessionLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-forest">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-forest-light border-t-gold animate-spin" />
        <p className="text-mist text-sm font-body">Restoration de la session…</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * Waits for session restore before deciding (avoids flash redirects).
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <SessionLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/**
 * PublicRoute — redirects authenticated users away from auth pages.
 */
export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <SessionLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

/**
 * RoleGuard — restricts a route to specific roles.
 * Must be nested inside ProtectedRoute.
 */
export function RoleGuard({ roles, children, fallback = '/' }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}
