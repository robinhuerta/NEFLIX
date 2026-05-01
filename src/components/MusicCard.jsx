import React, { memo } from 'react';
import './MusicCard.css';

const MusicCard = ({ track, isActive, isPlaying, onPlay, onAddToQueue }) => {
  return (
    <div
      className={`music-card ${isActive ? 'music-card--active' : ''}`}
      onClick={() => onPlay && onPlay(track)}
    >
      <div className="music-card__art-wrapper">
        <img
          className="music-card__art"
          src={track.image}
          alt={track.title}
          loading="lazy"
          onError={e => {
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='45%25' fill='%236c63ff' font-size='60' text-anchor='middle' dominant-baseline='middle'%3E🎵%3C/text%3E%3Ctext x='50%25' y='70%25' fill='%23666' font-size='14' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'%3ESin portada%3C/text%3E%3C/svg%3E";
          }}
        />

        {/* Overlay play */}
        <div className="music-card__overlay">
          {isActive && isPlaying ? (
            <div className="music-card__equalizer">
              <span /><span /><span /><span />
            </div>
          ) : (
            <div className="music-card__play-icon">
              <svg viewBox="0 0 24 24" fill="white" width="40" height="40">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Badge "Reproduciendo" */}
        {isActive && (
          <div className="music-card__now-playing">
            {isPlaying ? '▶ Reproduciendo' : '⏸ Pausado'}
          </div>
        )}
      </div>

      <div className="music-card__info">
        <p className="music-card__title" title={track.title}>{track.title}</p>
        {track.artist && <p className="music-card__artist">{track.artist}</p>}
        {track.category && !track.artist && (
          <p className="music-card__artist">{track.category}</p>
        )}
        {track.duration && <p className="music-card__duration">{track.duration}</p>}
      </div>

      <button
        className="music-card__queue-btn"
        title="Añadir a la cola"
        onClick={e => {
          e.stopPropagation();
          onAddToQueue && onAddToQueue(track);
        }}
      >
        +
      </button>
    </div>
  );
};

export default memo(MusicCard);
