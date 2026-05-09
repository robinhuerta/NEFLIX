import React, { useState, useEffect, useRef } from 'react';
import './Hero.css';

const Hero = ({ movie, onPlay, onInfo }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

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

  // Resetear a silenciado cuando el preview termina o cambia película
  useEffect(() => {
    if (!showPreview) setIsMuted(true);
  }, [showPreview]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    // Video nativo
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }

    // YouTube iframe vía postMessage (sin recargar)
    if (iframeRef.current) {
      const cmd = newMuted ? 'mute' : 'unMute';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: cmd, args: [] }), '*'
      );
    }
  };

  if (!movie) return null;

  const ytId = getYouTubeId(movie.videoUrl);
  const drId = getDriveId(movie.videoUrl);
  const canToggleAudio = showPreview && !isDrive(movie.videoUrl);

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
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&enablejsapi=1`}
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
                ref={videoRef}
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

      {/* Botón mute/unmute — solo visible durante el preview */}
      {canToggleAudio && (
        <button className="hero__mute-btn" onClick={toggleMute} title={isMuted ? 'Activar sonido' : 'Silenciar'}>
          {isMuted ? (
            <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
      )}

      <div className="hero__rating">
         <span className="hero__rating-text">{movie.maturity || "13+"}</span>
      </div>
    </div>
  );
};

export default Hero;
