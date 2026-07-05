import { Component } from 'react';

/**
 * ErrorBoundary — capture les erreurs React non gérées.
 * Sans ça, une erreur JS fait planter toute l'app en écran blanc.
 *
 * Usage :
 *   <ErrorBoundary>
 *     <MonComposant />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // En production, envoyer à un service de monitoring (Sentry, etc.)
    console.error('[ErrorBoundary] Erreur capturée:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0D3B2E',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 32,
            marginBottom: 20,
          }}
        >
          🕊️
        </div>

        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 24, fontWeight: 700,
            color: '#FAF7F0', marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Une erreur inattendue est survenue
        </h1>

        <p style={{ color: '#8FA89E', fontSize: 14, textAlign: 'center', maxWidth: 300, marginBottom: 24, lineHeight: 1.6 }}>
          Nous sommes désolés pour ce désagrément. Retournez à l'accueil pour continuer.
        </p>

        {/* Détails en développement */}
        {isDev && this.state.error && (
          <div
            style={{
              background: '#081F18', border: '1px solid #1A5C46',
              borderRadius: 12, padding: '12px 16px',
              maxWidth: 400, width: '100%', marginBottom: 20,
              overflowX: 'auto',
            }}
          >
            <p style={{ color: '#C0392B', fontSize: 12, fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
            </p>
            {this.state.errorInfo?.componentStack && (
              <p style={{ color: '#475569', fontSize: 11, fontFamily: 'monospace', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo.componentStack.slice(0, 400)}…
              </p>
            )}
          </div>
        )}

        <button
          onClick={this.handleReset}
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A0832A)',
            color: '#0D3B2E', border: 'none',
            borderRadius: 12, padding: '12px 32px',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
          }}
        >
          ↩ Retour à l'accueil
        </button>
      </div>
    );
  }
}
