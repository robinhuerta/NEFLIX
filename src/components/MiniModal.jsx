import React from 'react';
import './MiniModal.css';

const MiniModal = ({ movie, onPlay }) => {
  return (
    <div className="mini-modal">
      <div className="mini-modal__thumbnail" onClick={() => onPlay && onPlay(movie)}>
        <img className="mini-modal__image" src={movie.image || movie.thumbnail} alt={movie.title} />
        <div className="mini-modal__vignette" />
        <h3 className="mini-modal__title">{movie.title}</h3>
      </div>
      
      <div className="mini-modal__info">
        <div className="mini-modal__actions">
          <div className="mini-modal__actions-left">
            <button className="mini-modal__btn mini-modal__btn--play" onClick={() => onPlay && onPlay(movie)}>
              <svg viewBox="0 0 24 24" fill="black" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button className="mini-modal__btn">
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
            <button className="mini-modal__btn">
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
            </button>
          </div>
          <div className="mini-modal__actions-right">
            <button className="mini-modal__btn">
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
            </button>
          </div>
        </div>

        <div className="mini-modal__metadata">
          <span className="mini-modal__match">{movie.match || "98% para ti"}</span>
          <span className="mini-modal__maturity">{movie.maturity || "13+"}</span>
          <span className="mini-modal__duration">{movie.duration || "1 temporada"}</span>
          <span className="mini-modal__quality">{movie.quality || "HD"}</span>
        </div>

        <div className="mini-modal__genres">
           {movie.genre || "Violento • Acción • Boxeo"}
        </div>
      </div>
    </div>
  );
};

export default MiniModal;
