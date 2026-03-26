import React, { useState, useEffect, useRef } from 'react';
import './VideoPlayer.css';
import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';

const VideoPlayer = ({ onBack, fileName = 'el ultimo guerrero.mp4', movieTitle = "Netflix Movie", episode = "Película" }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!fileName) return;

    const videoFileRef = ref(storage, fileName);

    getDownloadURL(videoFileRef)
      .then((url) => {
        setVideoUrl(url);
      })
      .catch((err) => {
        console.error("Error al obtener el video de Firebase:", err);
        setError("No se pudo cargar el video. Verifica las reglas de Firebase Storage.");
      });
  }, [fileName]);

  const togglePlay = () => {
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
    if (isNaN(time)) return "00:00";
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

  const remainingTime = formatTime(duration - currentTime);
  const progress = (currentTime / duration) * 100 || 0;

  return (
    <div className="video-player">
      <div className="video-player__top">
        <button className="video-player__back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <button className="video-player__report">
           <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
        </button>
      </div>

      <div className="video-player__video-container">
         {error ? (
           <div className="video-player__error">{error}</div>
         ) : videoUrl ? (
           <video 
              ref={videoRef}
              className="video-player__video" 
              autoPlay
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
           />
         ) : (
           <div className="video-player__loading">Cargando película...</div>
         )}
      </div>

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
              <span className="video-player__skip-text">10</span>
            </button>
            <button className="video-player__btn" onClick={() => skip(10)}>
              <svg viewBox="0 0 24 24" fill="white" width="30" height="30"><path d="M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z"/></svg>
              <span className="video-player__skip-text">10</span>
            </button>
            <button className="video-player__btn">
               <svg viewBox="0 0 24 24" fill="white" width="30" height="30"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            </button>
          </div>

          <div className="video-player__title-box">
             <span className="video-player__title">{movieTitle}</span>
             <span className="video-player__episode">{episode}</span>
          </div>

          <div className="video-player__controls-right">
            <button className="video-player__btn">
               <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button className="video-player__btn">
               <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"/></svg>
            </button>
            <button className="video-player__btn">
               <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
            </button>
            <button className="video-player__btn">
               <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            </button>
            <button className="video-player__btn">
               <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
