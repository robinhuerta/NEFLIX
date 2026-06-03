import React, { useState, useEffect, useRef } from 'react';
import './Hero.css';

const loadYTApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve();
  return new Promise((resolve) => {
    if (document.getElementById('yt-iframe-api')) {
      window.onYouTubeIframeAPIReady = resolve;
      return;
    }
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
};

const Hero = ({ movie, onPlay, onInfo }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);

  const isYouTube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const isDrive = (url) => url && (url.includes('drive.google.com') || url.includes('docs.google.com'));

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getDriveId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:\/d\/|id=)([\w-]+)/);
    return match ? match[1] : null;
  };

  // Timer para mostrar/ocultar preview
  useEffect(() => {
    setShowPreview(false);
    if (!movie?.videoUrl || !isYouTube(movie.videoUrl)) return;

    const startTimer = setTimeout(() => setShowPreview(true), 1500);
    const stopTimer  = setTimeout(() => setShowPreview(false), 21500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, [movie?.videoUrl]);

  // Resetear mute cuando el preview termina
  useEffect(() => {
    if (!showPreview) setIsMuted(true);
  }, [showPreview]);

  // YouTube IFrame Player API — autoplay programático y fiable
  useEffect(() => {
    const ytId = getYouTubeId(movie?.videoUrl);
    if (!showPreview || !ytId) return;

    let player = null;
    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed || !ytContainerRef.current) return;

      player = new window.YT.Player(ytContainerRef.current, {
        videoId: ytId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          showinfo: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
            ytPlayerRef.current = e.target;
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) setShowPreview(false);
          },
        },
      });
    });

    return () => {
      destroyed = true;
      try { player?.destroy(); } catch {}
      ytPlayerRef.current = null;
    };
  }, [showPreview, movie?.videoUrl]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (videoRef.current) videoRef.current.muted = newMuted;

    if (ytPlayerRef.current) {
      newMuted ? ytPlayerRef.current.mute() : ytPlayerRef.current.unMute();
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
              <div ref={ytContainerRef} className="hero__yt-player" />
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
          <h1 className={`hero__title${movie.title.length > 50 ? ' hero__title--long' : movie.title.length > 30 ? ' hero__title--medium' : ''}`}>
            {movie.title.toUpperCase()}
          </h1>
          <p className="hero__description">
            {movie.description || movie.genre || "Una emocionante aventura ahora disponible en COSMOS."}
          </p>
          <div className="hero__buttons">
            <button className="hero__button hero__button--play" onClick={onPlay}>
              <svg viewBox="0 0 24 24" fill="black" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
              Reproducir
            </button>
            <button className="hero__button hero__button--info" onClick={onInfo}>
              <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
              Más información
            </button>
          </div>
        </div>
      </div>

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
