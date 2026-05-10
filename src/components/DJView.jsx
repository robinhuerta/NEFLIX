import React, { useState, useEffect, useMemo } from 'react';
import './DJView.css';

const GENRE_BPM = {
  reggaeton: [85, 100], merengue: [120, 145], salsa: [160, 220],
  cumbia: [90, 115], chicha: [110, 130], huayno: [120, 140],
  bachata: [100, 115], balada: [70, 90], bolero: [60, 80],
  rock: [120, 160], pop: [100, 130],
};

const GENRE_ENERGY = {
  reggaeton: 5, merengue: 5, salsa: 4, cumbia: 4, chicha: 4,
  huayno: 3, bachata: 2, balada: 1, bolero: 1, rock: 5, pop: 3,
};

const getEnergy = (track) => {
  const text = `${track.category} ${track.genre} ${track.title}`.toLowerCase();
  for (const [key, val] of Object.entries(GENRE_ENERGY)) {
    if (text.includes(key)) return val;
  }
  return 3;
};

const getBPM = (track) => {
  if (!track) return 120;
  const text = `${track.category} ${track.genre} ${track.title}`.toLowerCase();
  for (const [key, [min, max]] of Object.entries(GENRE_BPM)) {
    if (text.includes(key)) return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return Math.floor(Math.random() * 40) + 100;
};

const LASERS = [
  { color: '#6c63ff', from: '-45deg', to: '-15deg', dur: '3.2s' },
  { color: '#ff4da6', from: '-30deg', to: '10deg',  dur: '2.8s' },
  { color: '#00d4ff', from: '15deg',  to: '45deg',  dur: '3.6s' },
  { color: '#a78bfa', from: '30deg',  to: '-5deg',  dur: '4.0s' },
  { color: '#ff4da6', from: '-60deg', to: '-25deg', dur: '2.5s' },
  { color: '#6c63ff', from: '20deg',  to: '55deg',  dur: '3.8s' },
  { color: '#00d4ff', from: '-10deg', to: '30deg',  dur: '3.0s' },
  { color: '#ffd700', from: '40deg',  to: '65deg',  dur: '4.2s' },
];

export default function DJView({ tracks = [], currentTrack, isPlaying, onPlay, onAddToQueue, queue = [] }) {
  const [mixMode, setMixMode]       = useState('shuffle');
  const [isMixActive, setIsMixActive] = useState(false);
  const [bpm, setBpm]               = useState(120);
  const [search, setSearch]         = useState('');
  const [activeGenre, setActiveGenre] = useState('Todos');

  useEffect(() => {
    if (currentTrack) setBpm(getBPM(currentTrack));
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!isPlaying) setIsMixActive(false);
  }, [isPlaying]);

  const genres = useMemo(() => {
    const cats = [...new Set(tracks.map(t => t.category || t.genre).filter(Boolean))];
    return ['Todos', ...cats];
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    let list = activeGenre === 'Todos' ? tracks : tracks.filter(t => t.category === activeGenre || t.genre === activeGenre);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q));
    }
    return list;
  }, [tracks, activeGenre, search]);

  const handleActivateMix = () => {
    if (filteredTracks.length === 0) return;
    let list = [...filteredTracks];
    if (mixMode === 'shuffle') {
      list = list.sort(() => Math.random() - 0.5);
    } else if (mixMode === 'energy') {
      list = list.sort((a, b) => getEnergy(b) - getEnergy(a));
    }
    const [first, ...rest] = list;
    onPlay(first, rest);
    setIsMixActive(true);
  };

  const nextTrack = queue[0] || null;
  const beatMs = Math.round(60000 / bpm);

  return (
    <div className="dj-view">

      {/* Lasers */}
      <div className="dj-view__lasers" aria-hidden="true">
        {LASERS.map((l, i) => (
          <div
            key={i}
            className="dj-view__laser"
            style={{
              '--color': l.color,
              '--from': l.from,
              '--to': l.to,
              '--dur': l.dur,
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="dj-view__particles" aria-hidden="true">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="dj-view__particle" style={{ '--i': i }} />
        ))}
      </div>

      {/* Header */}
      <header className="dj-view__header">
        <div className="dj-view__live">
          <span className="dj-view__live-dot" />
          EN VIVO
        </div>
        <h1 className="dj-view__title">
          <span className="dj-view__title-accent">DJ</span> COSMOS
        </h1>
        <p className="dj-view__subtitle">{tracks.length} tracks en la cabina &nbsp;·&nbsp; Modo Fiesta</p>
      </header>

      {/* Stage */}
      <section className="dj-view__stage">

        {/* Deck A — current */}
        <div className="dj-view__deck">
          <div className="dj-view__deck-tag">DECK A</div>
          <div className={`dj-view__platter ${isPlaying ? 'dj-view__platter--spin' : ''}`}>
            <div className="dj-view__grooves" />
            <div className="dj-view__label">
              {currentTrack?.image
                ? <img src={currentTrack.image} alt="" className="dj-view__label-art" />
                : <span className="dj-view__label-icon">♪</span>
              }
            </div>
            <div className="dj-view__spindle" />
          </div>
          <div className="dj-view__arm" />
          <div className="dj-view__deck-meta">
            <p className="dj-view__deck-name">{currentTrack?.title || '— Sin pista —'}</p>
            <p className="dj-view__deck-artist">{currentTrack?.artist || currentTrack?.category || ''}</p>
          </div>
        </div>

        {/* Mixer center */}
        <div className="dj-view__mixer">

          <div className="dj-view__bpm" style={{ '--beat': `${beatMs}ms` }}>
            <span className="dj-view__bpm-num">{bpm}</span>
            <span className="dj-view__bpm-unit">BPM</span>
            <div className={`dj-view__beat ${isPlaying ? 'dj-view__beat--on' : ''}`} />
          </div>

          <div className="dj-view__equalizer" aria-hidden="true">
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className={`dj-view__bar ${isPlaying ? 'dj-view__bar--on' : ''}`}
                style={{
                  '--delay': `${(i * 0.055).toFixed(3)}s`,
                  '--peak':  `${25 + ((i * 37 + 13) % 65)}%`,
                }}
              />
            ))}
          </div>

          <div className="dj-view__modes">
            {[
              { id: 'sequential', icon: '▤', label: 'Orden' },
              { id: 'shuffle',    icon: '⇄', label: 'Aleatorio' },
              { id: 'energy',     icon: '⚡', label: 'Energía' },
            ].map(m => (
              <button
                key={m.id}
                className={`dj-view__mode ${mixMode === m.id ? 'dj-view__mode--on' : ''}`}
                onClick={() => setMixMode(m.id)}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <button
            className={`dj-view__go ${isMixActive && isPlaying ? 'dj-view__go--active' : ''}`}
            onClick={handleActivateMix}
          >
            {isMixActive && isPlaying
              ? <><span className="dj-view__go-dot" /> MIX ACTIVO</>
              : '▶  ACTIVAR MIX'
            }
          </button>
        </div>

        {/* Deck B — next */}
        <div className="dj-view__deck dj-view__deck--b">
          <div className="dj-view__deck-tag">DECK B</div>
          <div className="dj-view__platter">
            <div className="dj-view__grooves" />
            <div className="dj-view__label dj-view__label--idle">
              {nextTrack?.image
                ? <img src={nextTrack.image} alt="" className="dj-view__label-art" />
                : <span className="dj-view__label-icon" style={{ opacity: 0.3 }}>↑</span>
              }
            </div>
            <div className="dj-view__spindle" />
          </div>
          <div className="dj-view__arm dj-view__arm--parked" />
          <div className="dj-view__deck-meta">
            <p className="dj-view__deck-name">{nextTrack?.title || '— Fin del set —'}</p>
            <p className="dj-view__deck-artist">{nextTrack?.artist || nextTrack?.category || ''}</p>
          </div>
        </div>

      </section>

      {/* Setlist */}
      <section className="dj-view__setlist">
        <div className="dj-view__setlist-bar">
          <h2 className="dj-view__setlist-title">
            Setlist <span className="dj-view__setlist-count">{filteredTracks.length}</span>
          </h2>
          <input
            className="dj-view__search"
            placeholder="Buscar track..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="dj-view__chips">
          {genres.map(g => (
            <button
              key={g}
              className={`dj-view__chip ${activeGenre === g ? 'dj-view__chip--on' : ''}`}
              onClick={() => setActiveGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="dj-view__tracks">
          {filteredTracks.length === 0 ? (
            <p className="dj-view__empty">No hay tracks que coincidan</p>
          ) : filteredTracks.map((track, idx) => {
            const active = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`dj-view__row ${active ? 'dj-view__row--active' : ''}`}
                onClick={() => onPlay(track, filteredTracks.slice(idx + 1))}
              >
                <span className="dj-view__row-num">
                  {active && isPlaying
                    ? <span className="dj-view__mini-eq">{[0,1,2].map(i => <span key={i} style={{ '--di': `${i * 0.12}s` }} />)}</span>
                    : idx + 1
                  }
                </span>
                <img
                  src={track.image || ''}
                  alt=""
                  className="dj-view__row-art"
                  onError={e => { e.target.style.visibility = 'hidden'; }}
                />
                <div className="dj-view__row-info">
                  <span className="dj-view__row-title">{track.title}</span>
                  <span className="dj-view__row-sub">{track.artist || track.category || 'COSMOS'}</span>
                </div>
                <span className="dj-view__row-cat">{track.category || ''}</span>
                <button
                  className="dj-view__row-add"
                  title="Agregar a cola"
                  onClick={e => { e.stopPropagation(); onAddToQueue(track); }}
                >+</button>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
