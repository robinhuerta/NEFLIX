import React, { useState, useEffect, useRef } from 'react';
import './VideoPlayer.css';
import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';

const VideoPlayer = ({ onBack, fileName, videoUrl: initialUrl, movieTitle = "COSMOS Original", episode = "Película", initialTime = 0, onProgress, onNext, hasNext }) => {
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
    // Evitar que detecte IDs de carpetas como si fueran archivos
    if (url.includes('/folders/')) return null;
    const regExp = /(?:\/d\/|id=)([\w-]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
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

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

  const resetControlsTimeout = () => {
    setShowControls(true);
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
      </div>

      <div className="video-player__video-container">
        {error ? (
          <div className="video-player__error">{error}</div>
        ) : isYouTube(videoUrl) ? (
          <div className="video-player__yt-wrap">
            <iframe
              className="video-player__video"
              src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3`}
              title={movieTitle}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
            <div className="video-player__yt-blocker" />
          </div>
        ) : isDrive(videoUrl) ? (
          <iframe
            className="video-player__video"
            src={`https://drive.google.com/file/d/${getDriveId(videoUrl)}/preview`}
            title={movieTitle}
            allow="autoplay"
            allowFullScreen
          />
        ) : videoUrl ? (
          <video
            ref={videoRef}
            className="video-player__video"
            autoPlay
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={() => { if (hasNext && onNext) onNext(); }}
          />
        ) : (
          <div className="video-player__loading">Cargando COSMOS...</div>
        )}
      </div>

      <div className="video-player__bottom">
        {!isYouTube(videoUrl) && !isDrive(videoUrl) && (
          <div className="video-player__seek-bar" onClick={handleSeek}>
            <div className="video-player__progress" style={{ width: `${progress}%` }}>
              <div className="video-player__handle" />
            </div>
            <span className="video-player__time">{remainingTime}</span>
          </div>
        )}

        <div className="video-player__controls">
          <div className="video-player__controls-left">
            <button className="video-player__btn" onClick={togglePlay}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            {!isYouTube(videoUrl) && !isDrive(videoUrl) && (
              <>
                <button className="video-player__btn" onClick={() => skip(-10)}>
                  <svg viewBox="0 0 24 24" fill="white" width="30" height="30"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
                </button>
                <button className="video-player__btn" onClick={() => skip(10)}>
                  <svg viewBox="0 0 24 24" fill="white" width="30" height="30"><path d="M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z"/></svg>
                </button>
              </>
            )}
          </div>

          <div className="video-player__title-box">
            <span className="video-player__title">{movieTitle}</span>
            <span className="video-player__episode">{episode}</span>
          </div>

          <div className="video-player__controls-right">
            {!isYouTube(videoUrl) && (
              <div className="video-player__settings-wrapper" ref={settingsRef}>
                <button className="video-player__btn" onClick={() => setShowSettings(!showSettings)}>
                  <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                </button>
                {showSettings && (
                  <div className="video-player__settings-popup">
                    {[0.5, 1, 1.5, 2].map(speed => (
                      <div key={speed} className="video-player__speed-option" onClick={() => handleSpeedChange(speed)}>{speed}x</div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
};

export default VideoPlayer;
