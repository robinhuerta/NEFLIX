import React, { useState, useRef, useEffect } from 'react';
import './MusicPlayer.css';

const MusicPlayer = ({
  currentTrack,
  queue,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onSelectFromQueue,
  onRemoveFromQueue,
  onClearQueue,
  volume,
  onVolumeChange,
  progress,
  currentTime,
  duration,
  onSeek,
  shuffle,
  onToggleShuffle,
  repeat,
  onToggleRepeat,
  youtubeId,        // ID del video de YouTube (si aplica)
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [ytExpanded, setYtExpanded] = useState(false);
  const iframeRef = useRef(null);

  // Sincronizar volumen con el iframe de YouTube via postMessage
  useEffect(() => {
    if (!youtubeId || !iframeRef.current) return;
    const vol = isMuted ? 0 : Math.round(volume * 100);
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }), '*'
    );
  }, [volume, isMuted, youtubeId]);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(prevVolume || 0.8);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const handleSeekClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek && onSeek(Math.max(0, Math.min(1, ratio)));
  };

  if (!currentTrack) return null;

  return (
    <>
      {showQueue && (
        <div className="music-player__queue-panel">
          <div className="music-player__queue-header">
            <h3>Cola de reproducción</h3>
            <div className="music-player__queue-actions">
              {queue.length > 0 && (
                <button onClick={onClearQueue} className="music-player__queue-clear">Limpiar</button>
              )}
              <button onClick={() => setShowQueue(false)} className="music-player__queue-close">✕</button>
            </div>
          </div>
          <div className="music-player__queue-now">
            <span className="music-player__queue-label">Reproduciendo ahora</span>
            <div className="music-player__queue-item music-player__queue-item--active">
              <img src={currentTrack.image} alt={currentTrack.title} />
              <div>
                <p>{currentTrack.title}</p>
                <span>{currentTrack.artist || currentTrack.category || ''}</span>
              </div>
              {isPlaying && (
                <div className="music-player__queue-eq"><span /><span /><span /></div>
              )}
            </div>
          </div>
          {queue.length > 0 ? (
            <div className="music-player__queue-list">
              <span className="music-player__queue-label">Siguiente ({queue.length})</span>
              {queue.map((track, i) => (
                <div key={`${track.id}-${i}`} className="music-player__queue-item"
                  onClick={() => onSelectFromQueue && onSelectFromQueue(i)}>
                  <img src={track.image} alt={track.title} />
                  <div>
                    <p>{track.title}</p>
                    <span>{track.artist || track.category || ''}</span>
                  </div>
                  <button className="music-player__queue-remove"
                    onClick={e => { e.stopPropagation(); onRemoveFromQueue && onRemoveFromQueue(i); }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="music-player__queue-empty">Cola vacía. Añade canciones con el botón <strong>+</strong>.</p>
          )}
        </div>
      )}

      {/* ── Mini player de YouTube ────────────────────────── */}
      {youtubeId && (
        <div className={`music-player__yt-panel ${ytExpanded ? 'music-player__yt-panel--open' : ''}`}>
          <div className="music-player__yt-header">
            <span>🎵 Reproduciendo en YouTube</span>
          </div>
          {/* iframe siempre en el DOM con height:0 cuando está colapsado — el audio sigue sonando */}
          <div className="music-player__yt-video-wrap">
            <div className="music-player__yt-crop">
              <iframe
                ref={iframeRef}
                className="music-player__yt-iframe"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`}
                title={currentTrack.title}
                allow="autoplay; encrypted-media; fullscreen"
              />
              <div className="music-player__yt-blocker" />
              <button
                className="music-player__yt-fullscreen"
                onClick={() => iframeRef.current?.requestFullscreen?.()}
                title="Pantalla completa"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="music-player">
        {/* Seek bar solo para tracks locales */}
        {!youtubeId && (
          <div className="music-player__seek" onClick={handleSeekClick}>
            <div className="music-player__seek-fill" style={{ width: `${progress || 0}%` }}>
              <div className="music-player__seek-handle" />
            </div>
          </div>
        )}

        <div className="music-player__inner">
          <div className="music-player__track-info">
            <div className="music-player__thumb-wrap">
              <img className="music-player__thumb" src={currentTrack.image} alt={currentTrack.title} />
              {isPlaying && (
                <div className="music-player__thumb-eq"><span /><span /><span /></div>
              )}
            </div>
            <div className="music-player__meta">
              <span className="music-player__title">{currentTrack.title}</span>
              <span className="music-player__artist">{currentTrack.artist || currentTrack.category || 'COSMOS Música'}</span>
            </div>
          </div>

          <div className="music-player__controls">
            <button
              className={`music-player__ctrl music-player__ctrl--small ${shuffle ? 'music-player__ctrl--active' : ''}`}
              onClick={onToggleShuffle} title="Aleatorio">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>
            <button className="music-player__ctrl" onClick={onPrev} title="Anterior">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button className="music-player__ctrl music-player__ctrl--play" onClick={onPlayPause}>
              {isPlaying
                ? <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
            <button className="music-player__ctrl" onClick={onNext} title="Siguiente">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            <button
              className={`music-player__ctrl music-player__ctrl--small ${repeat !== 'none' ? 'music-player__ctrl--active' : ''}`}
              onClick={onToggleRepeat} title="Repetir">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              </svg>
            </button>
            {!youtubeId && (
              <div className="music-player__time-display">
                <span>{formatTime(currentTime)}</span>
                <span className="music-player__time-sep">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            )}
          </div>

          <div className="music-player__right">
            <button
              className={`music-player__ctrl music-player__ctrl--small ${showQueue ? 'music-player__ctrl--active' : ''}`}
              onClick={() => setShowQueue(v => !v)} title="Cola">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              {queue.length > 0 && <span className="music-player__queue-count">{queue.length}</span>}
            </button>
            <div className="music-player__volume-wrap">
              <button className="music-player__ctrl music-player__ctrl--small" onClick={handleMuteToggle} title="Silenciar">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  {volume === 0 || isMuted
                    ? <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  }
                </svg>
              </button>
              <input
                type="range" className="music-player__volume-slider"
                min="0" max="1" step="0.02"
                value={isMuted ? 0 : volume}
                style={{
                  background: `linear-gradient(to right, #6c63ff ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(isMuted ? 0 : volume) * 100}%)`
                }}
                onChange={e => {
                  onVolumeChange(parseFloat(e.target.value));
                  if (parseFloat(e.target.value) > 0) setIsMuted(false);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
