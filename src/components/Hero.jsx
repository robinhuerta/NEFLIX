import React from 'react';
import './Hero.css';

const Hero = ({ movie, onPlay, onInfo }) => {
  if (!movie) return null;

  return (
    <div className="hero">
      <div className="hero__background">
        <div className="hero__vignette" />
        <div className="hero__vignette--bottom" />
      </div>
      
      <div className="hero__content-wrapper">
        <div className="hero__left">
          <h1 className="hero__title">{movie.title.toUpperCase()}</h1>
          <p className="hero__description">
            {movie.description || movie.genre || "Una emocionante aventura ahora disponible en COSMOS."}
          </p>
          <div className="hero__buttons">
            <button className="hero__button hero__button--play" onClick={onPlay}>
              <svg viewBox="0 0 24 24" fill="black" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
              Reproducir
            </button>
            <button className="hero__button hero__button--info" onClick={onInfo}>
              <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>
              Más información
            </button>
          </div>
        </div>

        <div className="hero__right">
          <div className="hero__banner-image-container">
            <img 
              className="hero__banner-image" 
              src={movie.image} 
              alt={movie.title} 
            />
          </div>
        </div>
      </div>
      
      <div className="hero__rating">
         <span className="hero__rating-text">{movie.maturity || "13+"}</span>
      </div>
    </div>
  );
};

export default Hero;
