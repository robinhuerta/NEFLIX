import { useEffect, useState } from 'react';
import './CosmosIntro.css';

const CosmosIntro = ({ onDone }) => {
  const [phase, setPhase] = useState('black'); // black → flash → logo → hold → fadeout

  useEffect(() => {
    // Sonido cinemático fuerte
    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2046/2046-preview.mp3');
    sound.volume = 1.0;

    const t1 = setTimeout(() => {
      sound.play().catch(() => {});
      setPhase('flash');
    }, 300);

    const t2 = setTimeout(() => setPhase('logo'),  700);
    const t3 = setTimeout(() => setPhase('hold'),  1400);
    const t4 = setTimeout(() => setPhase('fadeout'), 3200);
    const t5 = setTimeout(() => onDone(), 4000);

    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
      sound.pause();
    };
  }, [onDone]);

  return (
    <div className={`ci ci--${phase}`}>
      {/* Estrellas */}
      <div className="ci__stars">
        {[...Array(80)].map((_, i) => (
          <span key={i} className="ci__star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            '--d': `${Math.random() * 3}s`,
            '--s': `${1 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      {/* Flash central */}
      <div className="ci__flash" />

      {/* Shockwave */}
      <div className="ci__shockwave" />
      <div className="ci__shockwave ci__shockwave--2" />

      {/* Rayos de luz */}
      <div className="ci__rays">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="ci__ray" style={{ '--angle': `${i * 30}deg` }} />
        ))}
      </div>

      {/* Logo */}
      <div className="ci__logo-wrap">
        <div className="ci__logo">COSMOS</div>
        <div className="ci__tagline">Tu universo de entretenimiento</div>
      </div>
    </div>
  );
};

export default CosmosIntro;
