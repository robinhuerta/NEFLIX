import { useState, useEffect, useRef } from 'react';
import './MarqueeTicker.css';

const TYPE_ICON = {
  birthday: '🎂',
  anniversary: '💍',
  special: '⭐',
  custom: '💫',
};

const TYPE_LABEL = {
  birthday: '¡Feliz Cumpleaños!',
  anniversary: '¡Feliz Aniversario!',
  special: '¡Saludo Especial!',
  custom: '¡Un Mensaje Para Ti!',
};

// Returns true if today matches dd/mm birthdate
const isTodayBirthdate = (birthdate) => {
  if (!birthdate) return false;
  const today = new Date();
  const [dd, mm] = birthdate.split('/');
  return parseInt(dd) === today.getDate() && parseInt(mm) === (today.getMonth() + 1);
};

const MarqueeTicker = ({ saludos = [], isPlaying, inPlayer = false }) => {
  const [phase, setPhase] = useState('hidden'); // 'hidden' | 'marquee'
  const shownRef = useRef(false);

  const activeSaludos = saludos.filter(s => s.active !== false);

  // Birthday saludos come first
  const sorted = [
    ...activeSaludos.filter(s => s.type === 'birthday' && isTodayBirthdate(s.birthdate)),
    ...activeSaludos.filter(s => !(s.type === 'birthday' && isTodayBirthdate(s.birthdate))),
  ];

  useEffect(() => {
    if (isPlaying && sorted.length > 0 && !shownRef.current) {
      shownRef.current = true;
      setPhase('marquee');
    }
    if (!isPlaying) {
      shownRef.current = false;
      setPhase('hidden');
    }
  }, [isPlaying]);

  // Clases en body para coordinar MusicPlayer y VideoPlayer con la marquesina
  useEffect(() => {
    if (phase === 'marquee') {
      if (inPlayer) {
        document.body.classList.add('has-player-marquee');
        document.body.classList.remove('has-marquee');
      } else {
        document.body.classList.add('has-marquee');
        document.body.classList.remove('has-player-marquee');
      }
    } else {
      document.body.classList.remove('has-marquee');
      document.body.classList.remove('has-player-marquee');
    }
    return () => {
      document.body.classList.remove('has-marquee');
      document.body.classList.remove('has-player-marquee');
    };
  }, [inPlayer, phase]);

  if (!isPlaying || sorted.length === 0 || phase === 'hidden') return null;

  const marqueeText = sorted
    .map(s => `${TYPE_ICON[s.type] || '✨'} ${TYPE_LABEL[s.type] || ''} ${s.name}${s.message ? ' — ' + s.message : ''}`)
    .join('   •   ');

  return (
    <>
      {/* ── MARQUEE BAR ── */}
      {phase === 'marquee' && (
        <div className={`mt-marquee${inPlayer ? ' mt-marquee--in-player' : ''}`}>
          <div className="mt-marquee__track">
            <span className="mt-marquee__text">{marqueeText}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{marqueeText}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MarqueeTicker;
