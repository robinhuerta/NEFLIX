import React, { useState, useEffect, useRef } from 'react';
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

const MarqueeTicker = ({ saludos = [], isPlaying }) => {
  const [phase, setPhase] = useState('hidden'); // 'hidden' | 'modal' | 'marquee'
  const [modalIndex, setModalIndex] = useState(0);
  const [countdown, setCountdown] = useState(8);
  const timerRef = useRef(null);
  const countRef = useRef(null);
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
      setPhase('modal');
      setCountdown(8);
      startCountdown();
    }
    if (!isPlaying) {
      shownRef.current = false;
      clearTimers();
      setPhase('hidden');
    }
  }, [isPlaying]);

  const clearTimers = () => {
    clearTimeout(timerRef.current);
    clearInterval(countRef.current);
  };

  const startCountdown = () => {
    clearTimers();
    let c = 8;
    setCountdown(c);
    countRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countRef.current);
      }
    }, 1000);
    timerRef.current = setTimeout(() => {
      setPhase('marquee');
    }, 8000);
  };

  const handleCloseModal = () => {
    clearTimers();
    setPhase('marquee');
  };

  const handleNextModal = () => {
    clearTimers();
    const next = (modalIndex + 1) % sorted.length;
    setModalIndex(next);
    setCountdown(8);
    startCountdown();
  };

  useEffect(() => () => clearTimers(), []);

  if (!isPlaying || sorted.length === 0 || phase === 'hidden') return null;

  const current = sorted[modalIndex] || sorted[0];
  const marqueeText = sorted
    .map(s => `${TYPE_ICON[s.type] || '✨'} ${TYPE_LABEL[s.type] || ''} ${s.name}${s.message ? ' — ' + s.message : ''}`)
    .join('   •   ');

  return (
    <>
      {/* ── PREMIUM MODAL ── */}
      {phase === 'modal' && current && (
        <div className="mt-overlay" onClick={handleCloseModal}>
          <div className="mt-modal" onClick={e => e.stopPropagation()}>
            {/* Sparkles */}
            <div className="mt-modal__sparkles">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="mt-modal__spark" style={{ '--i': i }} />
              ))}
            </div>

            <div className="mt-modal__icon">{TYPE_ICON[current.type] || '✨'}</div>
            <div className="mt-modal__label">{TYPE_LABEL[current.type] || '¡Saludo!'}</div>
            <div className="mt-modal__name">{current.name}</div>
            {current.message && (
              <div className="mt-modal__message">"{current.message}"</div>
            )}

            {/* Countdown bar */}
            <div className="mt-modal__bar">
              <div
                className="mt-modal__bar-fill"
                style={{ animationDuration: '8s' }}
              />
            </div>

            <div className="mt-modal__actions">
              {sorted.length > 1 && (
                <button className="mt-modal__btn mt-modal__btn--next" onClick={handleNextModal}>
                  Siguiente →
                </button>
              )}
              <button className="mt-modal__btn mt-modal__btn--close" onClick={handleCloseModal}>
                Ver en marquesina
              </button>
            </div>

            <div className="mt-modal__countdown">{countdown}s</div>
          </div>
        </div>
      )}

      {/* ── MARQUEE BAR ── */}
      {phase === 'marquee' && (
        <div className="mt-marquee" onClick={() => setPhase('modal')}>
          <div className="mt-marquee__track">
            <span className="mt-marquee__text">{marqueeText}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{marqueeText}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MarqueeTicker;
