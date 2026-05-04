import { memo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import './MovieCard.css';
import MiniModal from './MiniModal';

const MovieCard = ({ movie, isTop10, isPortrait, onSelect, progress, onPlay, onAddToList, onInfo, isInMyList, isLiked, onLike, onHover }) => {
  const [showMini, setShowMini] = useState(false);
  const [miniStyle, setMiniStyle] = useState({});
  const cardRef = useRef(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const handleClick = () => {
    if (onSelect) {
      onSelect(movie);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openMini = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const miniWidth = Math.max(rect.width * 1.55, 210);
    const vw = window.innerWidth;
    const left = Math.max(10, Math.min(
      rect.left + rect.width / 2 - miniWidth / 2,
      vw - miniWidth - 10
    ));
    const top = Math.max(10, rect.top - 12);
    setMiniStyle({ top, left, width: miniWidth });
    setShowMini(true);
  };

  const handleCardMouseEnter = () => {
    clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(openMini, 380);
    if (onHover) onHover(movie);
  };

  const handleCardMouseLeave = () => {
    clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => setShowMini(false), 200);
  };

  const handleMiniMouseEnter = () => clearTimeout(closeTimerRef.current);

  const handleMiniMouseLeave = () => {
    clearTimeout(closeTimerRef.current);
    setShowMini(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onPlay) onPlay(movie);
      else if (onSelect) onSelect(movie);
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`movie-card ${isTop10 ? 'movie-card--top10' : ''} ${isPortrait ? 'movie-card--portrait' : ''}`}
        onClick={handleClick}
        onMouseEnter={handleCardMouseEnter}
        onMouseLeave={handleCardMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        data-focusable="true"
      >
        {isTop10 && <div className="movie-card__rank">{movie.rank}</div>}
        <div className="movie-card__clickable">
          <img
            className="movie-card__image"
            src={movie.image}
            alt={movie.title}
            loading="lazy"
            onError={e => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='169'%3E%3Crect width='300' height='169' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' fill='%23666' font-size='14' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E"; }}
          />
          {movie.badge && <span className="movie-card__badge">{movie.badge}</span>}
          {progress > 0 && (
            <div className="movie-card__progress-bar">
              <div
                className="movie-card__progress-fill"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {showMini && createPortal(
        <div
          className="mini-modal-portal"
          style={{
            position: 'fixed',
            top: miniStyle.top,
            left: miniStyle.left,
            width: miniStyle.width,
            zIndex: 9999,
          }}
          onMouseEnter={handleMiniMouseEnter}
          onMouseLeave={handleMiniMouseLeave}
        >
          <MiniModal
            movie={movie}
            onPlay={() => { setShowMini(false); onPlay && onPlay(movie); }}
            onAddToList={() => onAddToList && onAddToList(movie)}
            onInfo={() => { setShowMini(false); onInfo && onInfo(movie); }}
            isInMyList={isInMyList}
            isLiked={isLiked}
            onLike={() => onLike && onLike(movie.id)}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default memo(MovieCard);
