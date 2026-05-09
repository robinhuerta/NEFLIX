import React, { useState, useEffect } from 'react';
import './Hero.css';

const Hero = ({ movie, onPlay, onInfo }) => {
  const [showPreview, setShowPreview] = useState(false);

  const isYouTube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const isDrive = (url) => url && (url.includes('drive.google.com') || url.includes('docs.google.com'));

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getDriveId = (url) => {
    if (!url) return null;
    const regExp = /(?:\/d\/|id=)([\w-]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (!movie || !movie.videoUrl) return;

    // Timer to start preview after 1.5s
    const startTimer = setTimeout(() => {
      setShowPreview(true);
    }, 1500);

    // Timer to stop preview after 21.5s (1.5 delay + 20s play)
    const stopTimer = setTimeout(() => {
      setShowPreview(false);
    }, 21500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, [movie]);

  if (!movie) return null;

  const ytId = getYouTubeId(movie.videoUrl);
  const drId = getDriveId(movie.videoUrl);

  return (
    <div className={`hero ${showPreview ? 'hero--preview' : ''}`}>
      <div className="hero__background">
        <img 
          className={`hero__bg-image ${showPreview ? 'hero__bg-image--hidden' : ''}`}
          src={movie.image} 
          alt={movie.title} 
        />
        
        {showPreview && movie.videoUrl && (
          <div className="hero__video-container">
            {isYouTube(movie.videoUrl) ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`}
                title="Hero Preview"
                frameBorder="0"
                allow="autoplay; encrypted-media"
              />
            ) : isDrive(movie.videoUrl) ? (
              <iframe
                src={`https://drive.google.com/file/d/${drId}/preview`}
                title="Hero Preview"
                frameBorder="0"
                allow="autoplay"
              />
            ) : (
              <video 
                src={movie.videoUrl} 
                autoPlay 
                muted 
                playsInline
                onEnded={() => setShowPreview(false)}
              />
            )}
          </div>
        )}

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
      </div>
      
      <div className="hero__rating">
         <span className="hero__rating-text">{movie.maturity || "13+"}</span>
      </div>
    </div>
  );
};

export default Hero;
