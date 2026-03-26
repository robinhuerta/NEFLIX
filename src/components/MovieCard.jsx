import React, { useState } from 'react';
import './MovieCard.css';
import MiniModal from './MiniModal';

const MovieCard = ({ movie, isTop10, onPlay, isPortrait }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`movie-card ${isTop10 ? 'movie-card--top10' : ''} ${isPortrait ? 'movie-card--portrait' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isTop10 && (
        <div className="movie-card__rank">
          {movie.rank}
        </div>
      )}
      <div className="movie-card__clickable" onClick={() => onPlay && onPlay(movie)}>
        <img className="movie-card__image" src={movie.image} alt={movie.title} />
        {movie.badge && <span className="movie-card__badge">{movie.badge}</span>}
      </div>

      {isHovered && <MiniModal movie={movie} onPlay={onPlay} isPortrait={isPortrait || isTop10} />}
    </div>
  );
};

export default MovieCard;
