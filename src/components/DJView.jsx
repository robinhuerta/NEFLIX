import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const getYtId = (url) => {
  if (!url?.trim()) return null;
  const m = url.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  return m ? m[1] : null;
};

// DJ-style equal-power crossfader: at 50 both decks play at 100%
const cfVolA = (cf) => cf <= 50 ? 100 : Math.round((100 - cf) * 2);
const cfVolB = (cf) => cf >= 50 ? 100 : Math.round(cf * 2);

export default function DJView({ tracks = [], currentTrack, isPlaying, onPlay, onAddToQueue, queue = [] }) {
  const [mixMode, setMixMode]         = useState('shuffle');
  const [isMixActive, setIsMixActive] = useState(false);
  const [bpm, setBpm]                 = useState(120);
  const [search, setSearch]           = useState('');
  const [activeGenre, setActiveGenre] = useState('Todos');

  // YouTube DJ state
  const [deckAId, setDeckAId]         = useState(null);
  const [deckBId, setDeckBId]         = useState(null);
  const [deckATitle, setDeckATitle]   = useState('');
  const [deckBTitle, setDeckBTitle]   = useState('');
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [crossfader, setCrossfader]   = useState(50);
  const [inputA, setInputA]           = useState('');
  const [inputB, setInputB]           = useState('');
  const [showVideoA, setShowVideoA]   = useState(true);
  const [showVideoB, setShowVideoB]   = useState(true);
  const [ytReady, setYtReady]         = useState(false);

  const ytContainerA = useRef(null);
  const ytContainerB = useRef(null);
  const ytPlayerA    = useRef(null);
  const ytPlayerB    = useRef(null);
  const cfRef        = useRef(crossfader);

  useEffect(() => { cfRef.current = crossfader; }, [crossfader]);

  // Load YouTube IFrame API (idempotent)
  useEffect(() => {
    if (window.YT?.Player) { setYtReady(true); return; }
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id  = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); setYtReady(true); };
  }, []);

  // Create/destroy Deck A player
  useEffect(() => {
    if (!ytReady || !deckAId || !ytContainerA.current) {
      ytPlayerA.current?.destroy?.();
      ytPlayerA.current = null;
      return;
    }
    ytPlayerA.current?.destroy?.();
    ytContainerA.current.innerHTML = '';
    const mount = document.createElement('div');
    ytContainerA.current.appendChild(mount);
    ytPlayerA.current = new window.YT.Player(mount, {
      videoId: deckAId,
      playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1, iv_load_policy: 3 },
      events: {
        onReady: (e) => e.target.setVolume(cfVolA(cfRef.current)),
      },
    });
    setDeckAPlaying(false);
    return () => { ytPlayerA.current?.destroy?.(); ytPlayerA.current = null; };
  }, [deckAId, ytReady]);

  // Create/destroy Deck B player
  useEffect(() => {
    if (!ytReady || !deckBId || !ytContainerB.current) {
      ytPlayerB.current?.destroy?.();
      ytPlayerB.current = null;
      return;
    }
    ytPlayerB.current?.destroy?.();
    ytContainerB.current.innerHTML = '';
    const mount = document.createElement('div');
    ytContainerB.current.appendChild(mount);
    ytPlayerB.current = new window.YT.Player(mount, {
      videoId: deckBId,
      playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1, iv_load_policy: 3 },
      events: {
        onReady: (e) => e.target.setVolume(cfVolB(cfRef.current)),
      },
    });
    setDeckBPlaying(false);
    return () => { ytPlayerB.current?.destroy?.(); ytPlayerB.current = null; };
  }, [deckBId, ytReady]);

  // Crossfader → update volumes in real time
  useEffect(() => {
    ytPlayerA.current?.setVolume?.(cfVolA(crossfader));
    ytPlayerB.current?.setVolume?.(cfVolB(crossfader));
  }, [crossfader]);

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
    if (mixMode === 'shuffle') list = list.sort(() => Math.random() - 0.5);
    else if (mixMode === 'energy') list = list.sort((a, b) => getEnergy(b) - getEnergy(a));
    const [first, ...rest] = list;
    onPlay(first, rest);
    setIsMixActive(true);
  };

  const loadDeck = (deck) => {
    const input = deck === 'A' ? inputA : inputB;
    const id = getYtId(input);
    if (!id) return;
    if (deck === 'A') { setDeckAId(id); setDeckATitle(input); setInputA(''); }
    else              { setDeckBId(id); setDeckBTitle(input); setInputB(''); }
  };

  const toggleDeck = (deck) => {
    const player = deck === 'A' ? ytPlayerA.current : ytPlayerB.current;
    const playing = deck === 'A' ? deckAPlaying : deckBPlaying;
    const setPlaying = deck === 'A' ? setDeckAPlaying : setDeckBPlaying;
    if (!player) return;
    if (playing) { player.pauseVideo?.(); setPlaying(false); }
    else         { player.playVideo?.();  setPlaying(true);  }
  };

  const swapDecks = () => {
    setDeckAId(deckBId);    setDeckBId(deckAId);
    setDeckATitle(deckBTitle); setDeckBTitle(deckATitle);
    setDeckAPlaying(false); setDeckBPlaying(false);
    setCrossfader(50);
  };

  const nextTrack = queue[0] || null;
  const beatMs    = Math.round(60000 / bpm);
  const ytMode    = deckAId || deckBId;

  return (
    <div className="dj-view">

      {/* Lasers */}
      <div className="dj-view__lasers" aria-hidden="true">
        {LASERS.map((l, i) => (
          <div key={i} className="dj-view__laser"
            style={{ '--color': l.color, '--from': l.from, '--to': l.to, '--dur': l.dur }} />
        ))}
      </div>

      {/* Particles */}
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

      {/* ── YouTube DJ Panel ── */}
      <section className="dj-view__yt-section">

        {/* Deck A */}
        <div className="dj-view__yt-deck">
          <div className="dj-view__yt-deck-tag">
            <span className="dj-view__yt-deck-letter">A</span>
            {deckAPlaying && <span className="dj-view__yt-live-dot" />}
            {deckATitle && <span className="dj-view__yt-deck-now">{deckATitle.slice(0,40)}</span>}
          </div>

          <div
            ref={ytContainerA}
            className="dj-view__yt-preview"
            style={{ display: showVideoA && deckAId ? 'block' : 'none' }}
          />

          {!deckAId && (
            <div className="dj-view__yt-empty">
              <span>🎵</span>
              <p>Pega una URL de YouTube<br />para cargar el Deck A</p>
            </div>
          )}

          <div className="dj-view__yt-input-row">
            <input
              className="dj-view__yt-input"
              placeholder="URL de YouTube..."
              value={inputA}
              onChange={e => setInputA(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadDeck('A')}
            />
            <button className="dj-view__yt-load" onClick={() => loadDeck('A')}>Cargar</button>
          </div>

          {deckAId && (
            <div className="dj-view__yt-controls">
              <button
                className={`dj-view__yt-play ${deckAPlaying ? 'dj-view__yt-play--on' : ''}`}
                onClick={() => toggleDeck('A')}
              >
                {deckAPlaying ? '⏸' : '▶'}
              </button>
              <button
                className={`dj-view__yt-vidtoggle ${showVideoA ? 'dj-view__yt-vidtoggle--on' : ''}`}
                onClick={() => setShowVideoA(v => !v)}
                title={showVideoA ? 'Ocultar video' : 'Mostrar video'}
              >
                {showVideoA ? '🎬' : '🎵'}
              </button>
              <button className="dj-view__yt-clear" onClick={() => { setDeckAId(null); setDeckATitle(''); setDeckAPlaying(false); }} title="Limpiar deck">✕</button>
            </div>
          )}
        </div>

        {/* Crossfader center */}
        <div className="dj-view__yt-cf">
          <div className="dj-view__yt-cf-labels">
            <span style={{ opacity: cfVolA(crossfader) / 100 }}>A</span>
            <span className="dj-view__yt-cf-title">CROSSFADER</span>
            <span style={{ opacity: cfVolB(crossfader) / 100 }}>B</span>
          </div>
          <input
            type="range"
            className="dj-view__yt-cf-slider"
            min="0" max="100"
            value={crossfader}
            onChange={e => setCrossfader(Number(e.target.value))}
          />
          <div className="dj-view__yt-cf-vols">
            <span>{cfVolA(crossfader)}%</span>
            <button
              className="dj-view__yt-swap"
              onClick={swapDecks}
              title="Intercambiar decks"
              disabled={!deckAId && !deckBId}
            >⇄</button>
            <span>{cfVolB(crossfader)}%</span>
          </div>
        </div>

        {/* Deck B */}
        <div className="dj-view__yt-deck">
          <div className="dj-view__yt-deck-tag">
            <span className="dj-view__yt-deck-letter dj-view__yt-deck-letter--b">B</span>
            {deckBPlaying && <span className="dj-view__yt-live-dot dj-view__yt-live-dot--b" />}
            {deckBTitle && <span className="dj-view__yt-deck-now">{deckBTitle.slice(0,40)}</span>}
          </div>

          <div
            ref={ytContainerB}
            className="dj-view__yt-preview"
            style={{ display: showVideoB && deckBId ? 'block' : 'none' }}
          />

          {!deckBId && (
            <div className="dj-view__yt-empty">
              <span>🎵</span>
              <p>Pega una URL de YouTube<br />para cargar el Deck B</p>
            </div>
          )}

          <div className="dj-view__yt-input-row">
            <input
              className="dj-view__yt-input"
              placeholder="URL de YouTube..."
              value={inputB}
              onChange={e => setInputB(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadDeck('B')}
            />
            <button className="dj-view__yt-load" onClick={() => loadDeck('B')}>Cargar</button>
          </div>

          {deckBId && (
            <div className="dj-view__yt-controls">
              <button
                className={`dj-view__yt-play ${deckBPlaying ? 'dj-view__yt-play--on' : ''}`}
                onClick={() => toggleDeck('B')}
              >
                {deckBPlaying ? '⏸' : '▶'}
              </button>
              <button
                className={`dj-view__yt-vidtoggle ${showVideoB ? 'dj-view__yt-vidtoggle--on' : ''}`}
                onClick={() => setShowVideoB(v => !v)}
                title={showVideoB ? 'Ocultar video' : 'Mostrar video'}
              >
                {showVideoB ? '🎬' : '🎵'}
              </button>
              <button className="dj-view__yt-clear" onClick={() => { setDeckBId(null); setDeckBTitle(''); setDeckBPlaying(false); }} title="Limpiar deck">✕</button>
            </div>
          )}
        </div>

      </section>

      {/* Stage — vinyl decks */}
      <section className="dj-view__stage">

        {/* Deck A vinyl */}
        <div className="dj-view__deck">
          <div className="dj-view__deck-tag">DECK A</div>
          <div className={`dj-view__platter ${(isPlaying || deckAPlaying) ? 'dj-view__platter--spin' : ''}`}>
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
            <p className="dj-view__deck-name">{currentTrack?.title || (deckAId ? 'YouTube — Deck A' : '— Sin pista —')}</p>
            <p className="dj-view__deck-artist">{currentTrack?.artist || currentTrack?.category || ''}</p>
          </div>
        </div>

        {/* Mixer center */}
        <div className="dj-view__mixer">
          <div className="dj-view__bpm" style={{ '--beat': `${beatMs}ms` }}>
            <span className="dj-view__bpm-num">{bpm}</span>
            <span className="dj-view__bpm-unit">BPM</span>
            <div className={`dj-view__beat ${(isPlaying || deckAPlaying || deckBPlaying) ? 'dj-view__beat--on' : ''}`} />
          </div>

          <div className="dj-view__equalizer" aria-hidden="true">
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className={`dj-view__bar ${(isPlaying || deckAPlaying || deckBPlaying) ? 'dj-view__bar--on' : ''}`}
                style={{ '--delay': `${(i * 0.055).toFixed(3)}s`, '--peak': `${25 + ((i * 37 + 13) % 65)}%` }}
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

        {/* Deck B vinyl */}
        <div className="dj-view__deck dj-view__deck--b">
          <div className="dj-view__deck-tag">DECK B</div>
          <div className={`dj-view__platter ${deckBPlaying ? 'dj-view__platter--spin' : ''}`}>
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
            <p className="dj-view__deck-name">{nextTrack?.title || (deckBId ? 'YouTube — Deck B' : '— Fin del set —')}</p>
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
                <img src={track.image || ''} alt="" className="dj-view__row-art"
                  onError={e => { e.target.style.visibility = 'hidden'; }} />
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
