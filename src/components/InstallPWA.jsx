import { useState, useEffect, useRef } from 'react';
import './InstallPWA.css';

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

export default function InstallPWA() {
  const [show, setShow] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem('pwa_dismissed')) return;

    if (isIOS()) {
      // En iOS no hay evento beforeinstallprompt — mostramos instrucciones
      setTimeout(() => setIosMode(true) || setShow(true), 3000);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    if (outcome === 'accepted') setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa_dismissed', '1');
  };

  if (!show || dismissed) return null;

  return (
    <div className="install-pwa">
      <div className="install-pwa__icon">
        <img src="/logo.png" alt="COSMOS" />
      </div>
      <div className="install-pwa__text">
        <strong>Instalar COSMOS</strong>
        {iosMode ? (
          <span>Toca <b>Compartir</b> → <b>Agregar a pantalla de inicio</b></span>
        ) : (
          <span>Descarga la app y úsala sin navegador</span>
        )}
      </div>
      {!iosMode && (
        <button className="install-pwa__btn" onClick={handleInstall}>
          Instalar
        </button>
      )}
      <button className="install-pwa__close" onClick={handleDismiss} aria-label="Cerrar">✕</button>
    </div>
  );
}
