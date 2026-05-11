import React, { useState, useMemo, useRef } from 'react';
import MusicCard from './MusicCard';
import './MusicView.css';

const GENRES = ['Todos', 'Cumbia', 'Salsa', 'Huayno', 'Reggaeton', 'Vallenato', 'Tropical', 'Chicha', 'Balada', 'Pop', 'Rock', 'Electrónica', 'Merengue', 'Bachata', 'Marinera', 'Festejo', 'Otros'];

const MusicView = ({ tracks = [], currentTrack, isPlaying, onPlay, onAddToQueue, onWatch }) => {
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('Todos');
  const [ytQuery, setYtQuery] = useState('');
  const [ytResults, setYtResults] = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const ytTimer = useRef(null);

  const searchYouTube = (q) => {
    if (!q.trim()) { setYtResults([]); return; }
    setYtLoading(true);
    const key = import.meta.env.VITE_YOUTUBE_API_KEY;
    fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(q)}&key=${key}`)
      .then(r => r.json())
      .then(data => {
        setYtResults(data.items || []);
        setYtLoading(false);
      })
      .catch(() => setYtLoading(false));
  };

  const handleYtInput = (val) => {
    setYtQuery(val);
    clearTimeout(ytTimer.current);
    ytTimer.current = setTimeout(() => searchYouTube(val), 500);
  };

  const playYt = (item) => {
    const id = item.id?.videoId;
    const snip = item.snippet;
    onWatch({
      id,
      title: snip.title,
      artist: snip.channelTitle,
      image: snip.thumbnails?.high?.url || snip.thumbnails?.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${id}`,
      category: 'Videos Musicales',
    });
  };

  const queueYt = (item) => {
    const id = item.id?.videoId;
    const snip = item.snippet;
    onAddToQueue?.({
      id,
      title: snip.title,
      artist: snip.channelTitle,
      image: snip.thumbnails?.high?.url || snip.thumbnails?.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${id}`,
      category: 'Videos Musicales',
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tracks.filter(t => {
      const matchSearch = !q ||
        t.title?.toLowerCase().includes(q) ||
        t.artist?.toLowerCase().includes(q) ||
        t.genre?.toLowerCase().includes(q);
      const matchGenre = activeGenre === 'Todos' ||
        t.genre?.trim().toLowerCase() === activeGenre.toLowerCase() ||
        t.category?.trim().toLowerCase() === activeGenre.toLowerCase();
      return matchSearch && matchGenre;
    });
  }, [tracks, search, activeGenre]);

  // Group by genre
  const groupedByGenre = useMemo(() => {
    const groups = {};
    filtered.forEach(t => {
      const key = t.genre?.trim() || t.category?.trim() || 'Otros';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    // Sort: genres with more tracks first
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const showGrouped = activeGenre === 'Todos' && !search.trim() && groupedByGenre.length > 0;

  return (
    <div className="music-view">
      {/* Hero */}
      <div className="music-view__hero">
        <div className="music-view__hero-bg" />
        <div className="music-view__hero-content">
          <div className="music-view__hero-icon">🎵</div>
          <h1 className="music-view__hero-title">COSMOS Música</h1>
          <p className="music-view__hero-sub">
            {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'} disponibles
          </p>
          {tracks.length > 0 && (
            <button
              className="music-view__play-all"
              onClick={() => { if (tracks[0]) onPlay(tracks[0], tracks.slice(1)); }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Reproducir todo
            </button>
          )}
        </div>
        {/* Visualizer decoration */}
        <div className="music-view__hero-visualizer">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${(i * 0.07).toFixed(2)}s` }} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="music-view__controls">
        <div className="music-view__search-wrap">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            className="music-view__search"
            placeholder="Buscar canciones, artistas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="music-view__search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div className="music-view__genres">
          {GENRES.map(g => (
            <button
              key={g}
              className={`music-view__genre-btn ${activeGenre === g ? 'music-view__genre-btn--active' : ''}`}
              onClick={() => { setActiveGenre(g); setSearch(''); }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="music-view__content">
        {filtered.length === 0 ? (
          <div className="music-view__empty">
            <span>🎵</span>
            <p>No se encontraron canciones</p>
            <button onClick={() => { setSearch(''); setActiveGenre('Todos'); }}>
              Ver todo
            </button>
          </div>
        ) : showGrouped ? (
          // Agrupado por género
          groupedByGenre.map(([genre, genreTracks]) => (
            <div key={genre} className="music-view__group">
              <div className="music-view__group-header">
                <h2 className="music-view__group-title">{genre}</h2>
                <span className="music-view__group-count">{genreTracks.length} {genreTracks.length === 1 ? 'canción' : 'canciones'}</span>
                <button
                  className="music-view__group-play"
                  onClick={() => onPlay(genreTracks[0], genreTracks.slice(1))}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
                  Reproducir
                </button>
              </div>
              <div className="music-view__grid">
                {genreTracks.map(track => (
                  <MusicCard
                    key={track.id}
                    track={track}
                    isActive={currentTrack?.id === track.id}
                    isPlaying={currentTrack?.id === track.id && isPlaying}
                    onPlay={(t) => onPlay(t, genreTracks.filter(x => x.id !== t.id))}
                    onAddToQueue={onAddToQueue}
                    onWatch={onWatch}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Grid simple (búsqueda o filtro activo)
          <div className="music-view__group">
            <div className="music-view__grid">
              {filtered.map(track => (
                <MusicCard
                  key={track.id}
                  track={track}
                  isActive={currentTrack?.id === track.id}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onPlay={(t) => onPlay(t, filtered.filter(x => x.id !== t.id))}
                  onAddToQueue={onAddToQueue}
                  onWatch={onWatch}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== YouTube Search ===== */}
      <div className="music-view__yt-section">
        <div className="music-view__yt-header">
          <span className="music-view__yt-logo">▶</span>
          <h2 className="music-view__yt-title">Buscar en YouTube</h2>
        </div>
        <div className="music-view__yt-search-wrap">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            className="music-view__yt-search"
            placeholder="Busca cualquier canción en YouTube..."
            value={ytQuery}
            onChange={e => handleYtInput(e.target.value)}
          />
          {ytQuery && (
            <button className="music-view__yt-clear" onClick={() => { setYtQuery(''); setYtResults([]); }}>✕</button>
          )}
        </div>

        {ytLoading && (
          <div className="music-view__yt-loading">
            <span className="music-view__yt-spinner" />
            Buscando en YouTube...
          </div>
        )}

        {ytResults.length > 0 && (
          <div className="music-view__yt-grid">
            {ytResults.map(item => {
              const vid = item.id?.videoId;
              const snip = item.snippet;
              return (
                <div key={vid} className="music-view__yt-card" onClick={() => playYt(item)}>
                  <div className="music-view__yt-thumb-wrap">
                    <img
                      src={snip.thumbnails?.medium?.url}
                      alt={snip.title}
                      className="music-view__yt-thumb"
                    />
                    <div className="music-view__yt-play-overlay">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="music-view__yt-info">
                    <p className="music-view__yt-name">{snip.title}</p>
                    <p className="music-view__yt-channel">{snip.channelTitle}</p>
                  </div>
                  <button
                    className="music-view__yt-queue-btn"
                    title="Agregar a la cola"
                    onClick={e => { e.stopPropagation(); queueYt(item); }}
                  >+</button>
                </div>
              );
            })}
          </div>
        )}

        {!ytLoading && ytQuery && ytResults.length === 0 && (
          <div className="music-view__yt-empty">Sin resultados para "{ytQuery}"</div>
        )}
      </div>

      {/* Bottom spacer for player bar */}
      <div style={{ height: '90px' }} />
    </div>
  );
};

export default MusicView;
