import React from 'react';
import './MovieCard.css';

const MovieCard = ({ movie, isTop10, isPortrait, onSelect }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(movie);
      // Scroll to top smoothly when selecting
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div 
      className={`movie-card ${isTop10 ? 'movie-card--top10' : ''} ${isPortrait ? 'movie-card--portrait' : ''}`}
      onClick={handleClick}
    >
      {isTop10 && (
        <div className="movie-card__rank">
          {movie.rank}
        </div>
      )}
      <div className="movie-card__clickable">
        <img className="movie-card__image" src={movie.image} alt={movie.title} />
        {movie.badge && <span className="movie-card__badge">{movie.badge}</span>}
      </div>
    </div>
  );
};

export default MovieCard;
