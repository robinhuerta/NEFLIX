import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import './AuthScreen.css';

const AuthScreen = ({ onAuth }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onAuth(result.user);
    } catch (err) {
      setError('No se pudo iniciar sesión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Estrellas de fondo */}
      <div className="auth-screen__stars">
        {[...Array(60)].map((_, i) => (
          <span key={i} className="auth-screen__star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            '--delay': `${Math.random() * 4}s`,
            '--size': `${1 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      <div className="auth-screen__card">
        <div className="auth-screen__logo">COSMOS</div>
        <p className="auth-screen__tagline">Tu universo de entretenimiento</p>

        <div className="auth-screen__divider" />

        <h2 className="auth-screen__title">Bienvenido</h2>
        <p className="auth-screen__subtitle">Inicia sesión para continuar</p>

        <button
          className="auth-screen__google-btn"
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading ? (
            <span className="auth-screen__spinner" />
          ) : (
            <svg className="auth-screen__google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
        </button>

        {error && <p className="auth-screen__error">{error}</p>}

        <p className="auth-screen__footer">
          Al continuar aceptas los términos de uso de COSMOS
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
