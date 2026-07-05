import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', ...props
}) {
  const base = 'btn';
  const variants = {
    primary: 'btn-primary',
    ghost:   'btn-ghost',
    danger:  'btn-danger',
  };
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: '',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <><span className="spinner w-4 h-4" /><span>Chargement…</span></>
        : children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <input
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-mist">{hint}</p>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, glow = false, className = '' }) {
  return (
    <div className={`${glow ? 'card-glow' : 'card'} ${className}`}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STATUS = {
  SUCCESS:   'badge-success',
  FAILED:    'badge-danger',
  PENDING:   'badge-warning',
  INITIATED: 'badge-muted',
  REFUNDED:  'badge-gold',
  CANCELLED: 'badge-muted',
};

export function Badge({ children, status, className = '' }) {
  const cls = status ? BADGE_STATUS[status] || 'badge-muted' : 'badge-muted';
  return <span className={`${cls} ${className}`}>{children}</span>;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return <div className={`spinner ${sizes[size]} ${className}`} />;
}

// ── PageLoader ────────────────────────────────────────────────────────────────
export function PageLoader({ message = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <Spinner size="lg" />
      <p className="text-mist text-sm">{message}</p>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4 gap-4">
      {icon && <div className="text-5xl mb-2">{icon}</div>}
      <h3 className="font-display text-xl text-ivory">{title}</h3>
      {description && <p className="text-mist text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Toast System ──────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const TOAST_STYLES = {
    success: 'bg-success/20 border-success/40 text-green-300',
    error:   'bg-danger/20 border-danger/40 text-red-300',
    info:    'bg-charcoal border-forest-light/40 text-ivory',
    warning: 'bg-warning/20 border-warning/40 text-yellow-300',
  };

  const TOAST_ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container — fixed bottom on mobile */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                        backdrop-blur-md w-full max-w-sm shadow-deep
                        animate-fade-up pointer-events-auto
                        ${TOAST_STYLES[t.type]}`}
          >
            <span className="text-base flex-shrink-0">{TOAST_ICONS[t.type]}</span>
            <p className="text-sm font-body">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ── StatCard (admin dashboard) ─────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, glow = false }) {
  return (
    <Card glow={glow} className="flex items-start gap-4">
      {icon && (
        <div className={`p-3 rounded-xl ${glow ? 'bg-gold/20 text-gold' : 'bg-forest-light/30 text-mist'}`}>
          <span className="text-xl">{icon}</span>
        </div>
      )}
      <div>
        <p className="text-xs text-mist uppercase tracking-widest mb-1">{label}</p>
        <p className={`font-display text-2xl font-semibold ${glow ? 'text-gold' : 'text-ivory'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-mist mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
