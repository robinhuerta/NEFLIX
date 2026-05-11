import React, { useState, useEffect, useRef } from 'react';
import './VideoPlayer.css';
import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';

// Funciones puras a nivel de módulo (evita TDZ en minificación)
const isYouTube = (url) => !!(url && (url.includes('youtube.com') || url.includes('youtu.be')));
const isDrive   = (url) => !!(url && (url.includes('drive.google.com') || url.includes('docs.google.com')));

const getYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (m && m[2].length === 11) ? m[2] : null;
};

const getDriveId = (url) => {
  if (!url || url.includes('/folders/')) return null;
  const m = url.match(/(?:\/d\/|id=)([\w-]+)/);
  return m ? m[1] : null;
};

const formatTime = (time) => {
  if (!time || isNaN(time)) return '00:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

const VideoPlayer = ({ onBack, fileName, videoUrl: initialUrl, movieTitle = "COSMOS Original", episode = "Película", initialTime = 0, onProgress, onNext, hasNext, children }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoUrl, setVideoUrl] = useState(initialUrl || '');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const settingsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const titleTimerRef = useRef(null);
  const [autoplay, setAutoplay] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cosmos_autoplay') ?? 'true'); }
    catch { return true; }
  });
  const autoplayRef = useRef(autoplay);
  const onNextRef = useRef(onNext);
  const hasNextRef = useRef(hasNext);
  useEffect(() => { autoplayRef.current = autoplay; }, [autoplay]);
  useEffect(() => { onNextRef.current = onNext; hasNextRef.current = hasNext; }, [onNext, hasNext]);

  // YouTube IFrame Player API
  const ytContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);

  useEffect(() => {
    if (initialUrl && initialUrl !== videoUrl) {
      setVideoUrl(initialUrl);
      return;
    }

    if (fileName && fileName !== 'External Link' && !initialUrl) {
      const videoFileRef = ref(storage, fileName);
      getDownloadURL(videoFileRef)
        .then((url) => setVideoUrl(url))
        .catch((err) => {
          console.error("Error al obtener el video de Firebase:", err);
          setError("No se pudo cargar el video de COSMOS. Verifica la conexión.");
        });
    }
  }, [fileName, initialUrl, videoUrl]);

  // Sync volume and mute state with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, videoUrl]);

  // Seek to saved position when video loads
  useEffect(() => {
    if (videoUrl && videoRef.current && initialTime > 0 && !isYouTube(videoUrl) && !isDrive(videoUrl)) {
      videoRef.current.currentTime = initialTime;
    }
  }, [videoUrl]);

  // Report progress every 5 seconds
  useEffect(() => {
    if (!onProgress || isYouTube(videoUrl) || isDrive(videoUrl)) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.duration > 0) {
        onProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [onProgress, videoUrl]);

  // Cargar YouTube IFrame API script una sola vez
  useEffect(() => {
    if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }, []);

  // Crear YT.Player cuando cambia el video de YouTube
  useEffect(() => {
    if (!isYouTube(videoUrl)) return;
    const videoId = getYouTubeId(videoUrl);
    if (!videoId || !ytContainerRef.current) return;

    const createPlayer = () => {
      if (!ytContainerRef.current) return;
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
      // Crear un div no-React para que YT.Player lo reemplace con su iframe
      ytContainerRef.current.innerHTML = '';
      const mountPoint = document.createElement('div');
      ytContainerRef.current.appendChild(mountPoint);

      ytPlayerRef.current = new window.YT.Player(mountPoint, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0, iv_load_policy: 3, origin: window.location.origin },
        events: {
          onStateChange: (event) => {
            if (event.data === 0 && autoplayRef.current && hasNextRef.current && onNextRef.current) {
              onNextRef.current();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); createPlayer(); };
    }

    return () => {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
      if (ytContainerRef.current) ytContainerRef.current.innerHTML = '';
    };
  }, [videoUrl]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleAutoplay = () => {
    const val = !autoplay;
    setAutoplay(val);
    localStorage.setItem('cosmos_autoplay', JSON.stringify(val));
    showToast(val ? 'Reproducción automática activada' : 'Reproducción automática desactivada');
  };

  const handleVideoEnded = () => {
    if (autoplay && hasNext && onNext) onNext();
  };

  const togglePlay = () => {
    if (isYouTube(videoUrl) || isDrive(videoUrl)) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const skip = (amount) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };


  const handleSeek = (e) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedPos = x / rect.width;
      videoRef.current.currentTime = clickedPos * duration;
    }
  };



  const handleSpeedChange = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
    showToast(`Velocidad: ${speed === 1 ? 'Normal' : speed + 'x'}`);
  };

  const toggleFullScreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      if (playerRef.current.requestFullscreen) playerRef.current.requestFullscreen();
      else if (playerRef.current.webkitRequestFullscreen) playerRef.current.webkitRequestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const resetTitleTimer = () => {
    setShowTitle(true);
    clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => setShowTitle(false), 4000);
  };

  useEffect(() => {
    resetTitleTimer();
    return () => clearTimeout(titleTimerRef.current);
  }, []);

  // Ocultar título más rápido al entrar a pantalla completa
  useEffect(() => {
    if (isFullScreen) {
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(() => setShowTitle(false), 1500);
    } else {
      resetTitleTimer();
    }
  }, [isFullScreen]);

  const resetControlsTimeout = () => {
    setShowControls(true);
    resetTitleTimer();
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying]);

  const handlePointerMove = () => resetControlsTimeout();

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); if (!isYouTube(videoUrl) && !isDrive(videoUrl)) skip(-10); break;
        case 'ArrowRight': e.preventDefault(); if (!isYouTube(videoUrl) && !isDrive(videoUrl)) skip(10); break;
        case 'f': case 'F': toggleFullScreen(); break;
        case 'Escape': onBack(); break;
        default: break;
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isPlaying, videoUrl]);

  const remainingTime = (isYouTube(videoUrl) || isDrive(videoUrl)) ? "--:--" : formatTime(duration - currentTime);
  const progress = (isYouTube(videoUrl) || isDrive(videoUrl)) ? 0 : (currentTime / duration) * 100 || 0;



  const isExternal = isYouTube(videoUrl) || isDrive(videoUrl);

  return (
    <div 
      className={`video-player ${!showControls ? 'video-player--hide-controls' : ''} ${isExternal ? 'video-player--external' : ''}`} 
      ref={playerRef}
      onMouseMove={handlePointerMove}
      onClick={handlePointerMove}
    >
      {toast && <div className="video-player__toast">{toast}</div>}

      <div className="video-player__top">
        <button className="video-player__back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        {isExternal && (
          <button className="video-player__btn video-player__fullscreen-ext" onClick={toggleFullScreen} title="Pantalla completa">
            <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
              {isFullScreen
                ? <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                : <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              }
            </svg>
          </button>
        )}
      </div>

      {/* Título inferior izquierdo — visible unos segundos, se desvanece solo */}
      <div className={`video-player__title-overlay${showTitle ? '' : ' video-player__title-overlay--hidden'}`}>
        <span className="video-player__title-overlay-name">{movieTitle}</span>
        <span className="video-player__title-overlay-ep">{episode}</span>
      </div>

      <div className="video-player__video-container">
        {error ? (
          <div className="video-player__error">{error}</div>
        ) : isYouTube(videoUrl) ? (
          <div className="video-player__yt-wrap">
            <div ref={ytContainerRef} className="video-player__video" style={{ background: 'black' }} />
            <div className="video-player__yt-corner-blocker" />
          </div>
        ) : isDrive(videoUrl) ? (
          <iframe
            className="video-player__video"
            src={`https://drive.google.com/file/d/${getDriveId(videoUrl)}/preview`}
            title={movieTitle}
            allow="autoplay"
          />
        ) : videoUrl ? (
          <video
            ref={videoRef}
            className="video-player__video"
            autoPlay
            playsInline
            preload="auto"
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={handleVideoEnded}
          />
        ) : (
          <div className="video-player__loading">Cargando COSMOS...</div>
        )}
      </div>

      {!isExternal && (
        <div className="video-player__bottom">
          <div className="video-player__seek-bar" onClick={handleSeek}>
            <div className="video-player__progress" style={{ width: `${progress}%` }}>
              <div className="video-player__handle" />
            </div>
            <span className="video-player__time">{remainingTime}</span>
          </div>

          <div className="video-player__controls">
            <div className="video-player__controls-left">
              <button className="video-player__btn" onClick={togglePlay}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <button className="video-player__btn" onClick={() => skip(-10)}>
                <svg viewBox="0 0 24 24" fill="white" width="30" height="30"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
              </button>
              <button className="video-player__btn" onClick={() => skip(10)}>
                <svg viewBox="0 0 24 24" fill="white" width="30" height="30"><path d="M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z"/></svg>
              </button>
              
              <div className="video-player__volume-wrapper">
                <button className="video-player__btn" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="white" width="30" height="30"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="white" width="30" height="30"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  )}
                </button>
                <div className="video-player__volume-popup">
                  <input 
                    type="range" 
                    className="video-player__volume-slider" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={isMuted ? 0 : volume} 
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (v > 0) setIsMuted(false);
                    }}
                  />
                  <span className="video-player__volume-label">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="video-player__title-box">
              <span className="video-player__title">{movieTitle}</span>
              <span className="video-player__episode">{episode}</span>
            </div>

            <div className="video-player__controls-right">
              {/* Switch reproducción automática */}
              {hasNext && (
                <button
                  className={`video-player__btn video-player__autoplay-btn ${autoplay ? 'video-player__autoplay-btn--on' : ''}`}
                  onClick={toggleAutoplay}
                  title={autoplay ? 'Reproducción automática: ON' : 'Reproducción automática: OFF'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{marginLeft:2}}>
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>
              )}
              <div className="video-player__settings-wrapper" ref={settingsRef}>
                <button className="video-player__btn" onClick={() => setShowSettings(!showSettings)}>
                  <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                </button>
                {showSettings && (
                  <div className="video-player__settings-popup">
                    {SPEED_OPTIONS.map(speed => (
                      <div key={speed} className="video-player__speed-option" onClick={() => handleSpeedChange(speed)}>{speed}x</div>
                    ))}
                  </div>
                )}
              </div>
              <button className="video-player__btn" onClick={toggleFullScreen}>
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                  {isFullScreen ? (
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  ) : (
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido extra (ej. MarqueeTicker) — visible también en fullscreen */}
      {children}
    </div>
  );
};

export default VideoPlayer;
