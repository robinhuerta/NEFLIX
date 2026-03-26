import React, { useState } from 'react';
import './MovieCard.css';
import MiniModal from './MiniModal';

const MovieCard = ({ movie, isTop10, onPlay }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`movie-card ${isTop10 ? 'movie-card--top10' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="movie-card__clickable" onClick={() => onPlay && onPlay(movie)}>
        {isTop10 && (
          <div className="movie-card__rank">
            {movie.rank}
          </div>
        )}
        <img className="movie-card__image" src={movie.image} alt={movie.title} />
        {movie.badge && <span className="movie-card__badge">{movie.badge}</span>}
      </div>

      {isHovered && <MiniModal movie={movie} onPlay={onPlay} />}
    </div>
  );
};

export default MovieCard;
