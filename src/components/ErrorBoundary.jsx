import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#0B0B0F', color: 'white', gap: '1.5rem', textAlign: 'center', padding: '2rem'
        }}>
          <svg viewBox="0 0 24 24" fill="#7B61FF" width="64" height="64">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Algo salió mal</h1>
          <p style={{ color: '#aaa', maxWidth: '400px', margin: 0 }}>
            {this.state.error ? `Error: ${this.state.error.message}` : 'Ocurrió un error inesperado.'}
          </p>
          <p style={{ color: '#666', fontSize: '0.8rem', maxWidth: '400px', margin: 0 }}>
            Por favor recarga la página para continuar.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'white', color: 'black', border: 'none', borderRadius: '4px',
              padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
