import { useEffect, useState } from 'react';
import './CosmosIntro.css';

const CosmosIntro = ({ onDone }) => {
  const [phase, setPhase] = useState('black'); // black → flash → logo → hold → fadeout

  useEffect(() => {
    const playBraam = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(1.4, ctx.currentTime + 0.05);
        masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
        masterGain.connect(ctx.destination);

        // Bass boom profundo
        [55, 58, 110].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = i === 2 ? 'sine' : 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + 2);
          g.gain.setValueAtTime(i === 2 ? 0.4 : 0.8, ctx.currentTime);
          osc.connect(g); g.connect(masterGain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 3.5);
        });

        // Golpe percusivo inicial (noise burst)
        const bufSize = ctx.sampleRate * 0.3;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 200;
        noiseGain.gain.setValueAtTime(1.5, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(ctx.currentTime);

        // Riser agudo
        const riser = ctx.createOscillator();
        const riserGain = ctx.createGain();
        riser.type = 'sawtooth';
        riser.frequency.setValueAtTime(80, ctx.currentTime);
        riser.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1.2);
        riserGain.gain.setValueAtTime(0.15, ctx.currentTime);
        riserGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        riser.connect(riserGain); riserGain.connect(masterGain);
        riser.start(ctx.currentTime);
        riser.stop(ctx.currentTime + 1.2);
      } catch (e) {
        console.log('Audio error:', e);
      }
    };

    const t1 = setTimeout(() => {
      playBraam();
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
