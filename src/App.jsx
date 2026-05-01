import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import MovieCard from './components/MovieCard';
import VideoPlayer from './components/VideoPlayer';
import SkeletonCard from './components/SkeletonCard';
import CosmosIntro from './components/CosmosIntro';
import { mockMovies } from './data/mockData';
import { fetchAllVideos } from './services/FirebaseService';
import AdminDashboard from './components/AdminDashboard';
import './components/AdminDashboard.css';
import MusicView from './components/MusicView';
import MusicPlayer from './components/MusicPlayer';

const SKELETON_COUNT = 6;

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [firebaseVideos, setFirebaseVideos] = useState([]);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [infoMovie, setInfoMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyList, setShowMyList] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMusic, setShowMusic] = useState(false);

  // ── Music Player State ──────────────────────────────────────────
  const [currentTrack, setCurrentTrack] = useState(null);
  const [musicQueue, setMusicQueue] = useState([]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.8);
  const [musicProgress, setMusicProgress] = useState(0);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicShuffle, setMusicShuffle] = useState(false);
  const [musicRepeat, setMusicRepeat] = useState('none'); // 'none' | 'all' | 'one'
  const audioRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState('');

  // Persist Mi Lista in localStorage
  const [myList, setMyList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cosmos_mylist') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cosmos_mylist', JSON.stringify(myList));
  }, [myList]);

  // Persist watch history in localStorage
  const [watchHistory, setWatchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cosmos_history') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cosmos_history', JSON.stringify(watchHistory));
  }, [watchHistory]);

  useEffect(() => {
    const getVideos = async () => {
      setFirebaseLoading(true);
      const videos = await fetchAllVideos();
      setFirebaseVideos(videos);
      if (videos.length > 0 && !featuredMovie) {
        setFeaturedMovie(videos[0]);
      }
      setFirebaseLoading(false);
    };
    getVideos();
  }, []);

  const handleHoverMovie = (movie) => {
    if (movie && movie.id !== featuredMovie?.id) {
      setFeaturedMovie(movie);
    }
  };

  const handlePlayHero = () => {
    if (featuredMovie && (featuredMovie.fileName || featuredMovie.videoUrl)) {
      setSelectedVideo(featuredMovie);
      setShowPlayer(true);
    }
  };

  const handlePlayMovie = (movie) => {
    if (movie && (movie.fileName || movie.videoUrl)) {
      setSelectedVideo(movie);
      setShowPlayer(true);
    }
  };

  const handleSelectMovie = (movie) => {
    setFeaturedMovie(movie);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToList = (movie) => {
    setMyList(prev => {
      const exists = prev.find(m => m.id === movie.id);
      return exists ? prev.filter(m => m.id !== movie.id) : [...prev, movie];
    });
  };

  const isInMyList = (movieId) => myList.some(m => m.id === movieId);

  // Persist likes in localStorage
  const [likes, setLikes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cosmos_likes') || '{}'); }
    catch { return {}; }
  });

  const handleLogout = () => {
    setSearchQuery('');
    setInfoMovie(null);
    setShowPlayer(false);
    setShowAdmin(false);
    setShowMusic(false);
    setShowIntro(true);
  };

  // ── Music Player Logic ──────────────────────────────────────────
  const getTrackUrl = useCallback(async (track) => {
    if (track.videoUrl) return track.videoUrl;
    if (track.fileName && track.fileName !== 'External Link') {
      const { ref, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('./firebaseConfig');
      return await getDownloadURL(ref(storage, track.fileName));
    }
    return '';
  }, []);

  // ── YouTube helper ────────────────────────────────────────────────
  const getYtId = (url) => {
    if (!url) return null;
    const m = url.match(/^.*(youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*)/);
    return (m && m[2].length === 11) ? m[2] : null;
  };

  const isYouTubeTrack = (track) =>
    !!(track?.videoUrl?.includes('youtube.com') || track?.videoUrl?.includes('youtu.be'));

  const currentYoutubeId = isYouTubeTrack(currentTrack)
    ? getYtId(currentTrack.videoUrl)
    : null;

  const playTrack = useCallback(async (track, queue = []) => {
    setCurrentTrack(track);
    setMusicQueue(queue);
    setMusicProgress(0);
    setMusicCurrentTime(0);
    setMusicDuration(0);
    setIsMusicPlaying(true);
    // Solo obtener URL si NO es YouTube (YouTube usa iframe)
    if (!isYouTubeTrack(track)) {
      const url = await getTrackUrl(track);
      setAudioUrl(url);
    } else {
      setAudioUrl(''); // Limpiar audio nativo
    }
  }, [getTrackUrl]);

  const addToQueue = useCallback((track) => {
    setMusicQueue(prev => {
      if (prev.find(t => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }, []);

  // Sync audio element — solo para tracks locales (NO YouTube)
  useEffect(() => {
    if (!audioRef.current || !audioUrl || !currentTrack || isYouTubeTrack(currentTrack)) return;
    audioRef.current.src = audioUrl;
    audioRef.current.volume = musicVolume;
    if (isMusicPlaying) audioRef.current.play().catch(() => {});
  }, [audioUrl]);

  useEffect(() => {
    if (!audioRef.current || isYouTubeTrack(currentTrack)) return;
    if (isMusicPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isMusicPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  const handleMusicTimeUpdate = () => {
    if (!audioRef.current) return;
    const ct = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    setMusicCurrentTime(ct);
    setMusicDuration(dur);
    setMusicProgress(dur > 0 ? (ct / dur) * 100 : 0);
  };

  const handleMusicEnded = () => {
    if (musicRepeat === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    if (musicShuffle && musicQueue.length > 0) {
      const idx = Math.floor(Math.random() * musicQueue.length);
      const next = musicQueue[idx];
      const rest = musicQueue.filter((_, i) => i !== idx);
      playTrack(next, rest);
      return;
    }
    if (musicQueue.length > 0) {
      const [next, ...rest] = musicQueue;
      playTrack(next, musicRepeat === 'all' ? [...rest, currentTrack] : rest);
    } else if (musicRepeat === 'all' && currentTrack) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      setIsMusicPlaying(false);
    }
  };

  const handleMusicNext = () => {
    if (musicShuffle && musicQueue.length > 0) {
      const idx = Math.floor(Math.random() * musicQueue.length);
      const next = musicQueue[idx];
      const rest = musicQueue.filter((_, i) => i !== idx);
      playTrack(next, rest);
      return;
    }
    if (musicQueue.length > 0) {
      const [next, ...rest] = musicQueue;
      playTrack(next, rest);
    }
  };

  const handleMusicPrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    setIsMusicPlaying(false);
  };

  const handleMusicSeek = (ratio) => {
    if (audioRef.current && musicDuration > 0) {
      audioRef.current.currentTime = ratio * musicDuration;
    }
  };

  const handleSelectFromQueue = (idx) => {
    const track = musicQueue[idx];
    const rest = musicQueue.filter((_, i) => i !== idx);
    playTrack(track, rest);
  };

  const handleRemoveFromQueue = (idx) => {
    setMusicQueue(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToggleRepeat = () => {
    setMusicRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none');
  };

  useEffect(() => {
    localStorage.setItem('cosmos_likes', JSON.stringify(likes));
  }, [likes]);

  const toggleLike = (movieId) => setLikes(prev => ({ ...prev, [movieId]: !prev[movieId] }));
  const isLiked = (movieId) => !!likes[movieId];

  // Update watch progress (called every 5s and on back)
  const updateWatchProgress = (movie, currentTime, duration) => {
    if (!movie || !duration || duration === 0) return;
    const progress = currentTime / duration;
    setWatchHistory(prev => {
      const filtered = prev.filter(h => h.id !== movie.id);
      // Remove if almost finished (>95%) or barely started (<2%)
      if (progress > 0.95 || progress < 0.02) return filtered;
      return [{ ...movie, currentTime, duration, progress, watchedAt: Date.now() }, ...filtered].slice(0, 10);
    });
  };

  // All playable videos for next navigation
  const allVideos = firebaseVideos.filter(v => v.fileName);

  const handleNextVideo = () => {
    if (!selectedVideo) return;
    const idx = allVideos.findIndex(v => v.id === selectedVideo.id);
    if (idx >= 0 && idx < allVideos.length - 1) {
      setSelectedVideo(allVideos[idx + 1]);
    }
  };

  const hasNext = selectedVideo
    ? allVideos.findIndex(v => v.id === selectedVideo.id) < allVideos.length - 1
    : false;

  // "Continuar viendo" — items with progress between 2% and 95%
  const continueWatching = watchHistory.filter(h => h.progress > 0.02 && h.progress < 0.95);
  const continueProgressMap = Object.fromEntries(continueWatching.map(h => [h.id, h.progress]));

  // ESC to close modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (infoMovie) setInfoMovie(null);
        else if (showMyList) setShowMyList(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [infoMovie, showMyList]);

  // Search filter
  const allMovies = firebaseVideos || [];
  const searchResults = searchQuery.trim()
    ? allMovies.filter(m => m.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  // Music videos for the dedicated music page
  const musicVideos = firebaseVideos.filter(v =>
    v.category === 'Videos Musicales' ||
    v.category?.toLowerCase() === 'musica' ||
    v.category?.toLowerCase() === 'música' ||
    v.type?.toLowerCase() === 'musica' ||
    v.type?.toLowerCase() === 'música'
  );

  // Dynamic Categories based on Firebase data
  const dynamicCategories = [
    { 
      id: "originals", 
      title: "Originales de COSMOS", 
      items: (mockMovies || []).concat(firebaseVideos.filter(v => v.category === 'Originales'))
    },
    { 
      id: "trending", 
      title: "Tendencias de COSMOS", 
      items: firebaseVideos.slice(0, 5) 
    },
    { 
      id: "series", 
      title: "Series Populares", 
      items: firebaseVideos.filter(v => v.category?.toLowerCase() === 'serie' || v.type?.toLowerCase() === 'serie') 
    },
    { 
      id: "movies", 
      title: "Películas Aclamadas", 
      items: firebaseVideos.filter(v => v.category?.toLowerCase() === 'pelicula' || v.category?.toLowerCase() === 'movie') 
    },
    {
      id: "musica",
      title: "Videos Musicales",
      items: musicVideos
    }
  ];

  // If filtered categories are empty, fallback to just chunks of all videos
  if (dynamicCategories[1].items.length === 0 && firebaseVideos.length > 5) {
    dynamicCategories[1].items = firebaseVideos.slice(5, 10);
  }
  if (dynamicCategories[2].items.length === 0 && firebaseVideos.length > 10) {
    dynamicCategories[2].items = firebaseVideos.slice(10, 15);
  }

  if (showIntro) {
    return <CosmosIntro onDone={() => setShowIntro(false)} />;
  }

  const handleAdminRefresh = async () => {
    setFirebaseLoading(true);
    const videos = await fetchAllVideos();
    setFirebaseVideos(videos);
    setFirebaseLoading(false);
  };

  if (showPlayer && selectedVideo) {
    return (
      <VideoPlayer
        onBack={() => setShowPlayer(false)}
        fileName={selectedVideo.fileName}
        videoUrl={selectedVideo.videoUrl}
        movieTitle={selectedVideo.title}
        onNext={handleNextVideo}
        hasNext={hasNext}
        initialTime={watchHistory.find(h => h.id === selectedVideo.id)?.currentTime || 0}
        onProgress={(currentTime, duration) => updateWatchProgress(selectedVideo, currentTime, duration)}
      />
    );
  }

  return (
    <div className="app">
      {/* Hidden audio element for music */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleMusicTimeUpdate}
        onEnded={handleMusicEnded}
        onLoadedMetadata={handleMusicTimeUpdate}
        style={{ display: 'none' }}
      />

      <Navbar
        onSearch={setSearchQuery}
        myListCount={myList.length}
        onShowMyList={() => setShowMyList(true)}
        onLogout={handleLogout}
        onShowAdmin={() => setShowAdmin(true)}
        onShowMusic={() => { setShowMusic(true); setSearchQuery(''); }}
        onGoHome={() => { setShowMusic(false); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        activeSection={showMusic ? 'musica' : ''}
      />

      {/* Search Results */}
      {searchResults && (
        <div className="search-results">
          <div className="search-results__header">
            <h2>Resultados para "<span>{searchQuery}</span>"</h2>
            <button className="search-results__close" onClick={() => setSearchQuery('')}>✕</button>
          </div>
          {searchResults.length === 0 ? (
            <p className="search-results__empty">No se encontraron resultados para "{searchQuery}".</p>
          ) : (
            <div className="search-results__grid">
              {searchResults.map(movie => (
                <MovieCard key={movie.id} movie={movie} onSelect={handleSelectMovie} onHover={handleHoverMovie} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Music Page */}
      {showMusic && !searchResults && (
        <MusicView
          tracks={musicVideos}
          currentTrack={currentTrack}
          isPlaying={isMusicPlaying}
          onPlay={(track, queue) => playTrack(track, queue || [])}
          onAddToQueue={addToQueue}
        />
      )}

      {!showMusic && !searchResults && (
        <>
          <Hero
            movie={featuredMovie}
            onPlay={handlePlayHero}
            onInfo={() => setInfoMovie(featuredMovie)}
          />

          <div className="app__rows">
            {/* Continuar viendo */}
            {continueWatching.length > 0 && (
              <MovieRow
                title="Continuar viendo"
                items={continueWatching}
                onSelect={handleSelectMovie}
                progressMap={continueProgressMap}
                id="section-continuar"
                onPlay={handlePlayMovie}
                onAddToList={handleAddToList}
                onInfo={setInfoMovie}
                isInMyList={isInMyList}
                isLiked={isLiked}
                onLike={toggleLike}
                onHover={handleHoverMovie}
              />
            )}

            {/* Firebase videos con skeleton */}
            <div className="firebase-gallery" id="section-peliculas">
              <h2 className="firebase-gallery__title">Tus Videos de Firebase</h2>
              <div className="firebase-gallery__grid">
                {firebaseLoading
                  ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)
                  : firebaseVideos.map(video => (
                      <MovieCard
                        key={video.id}
                        movie={video}
                        onSelect={handleSelectMovie}
                        onPlay={handlePlayMovie}
                        onAddToList={handleAddToList}
                        onInfo={setInfoMovie}
                        isInMyList={isInMyList(video.id)}
                        isLiked={isLiked(video.id)}
                        onLike={toggleLike}
                        onHover={handleHoverMovie}
                      />
                    ))
                }
              </div>
            </div>

            {dynamicCategories.map((category) => category.items.length > 0 && (
              <MovieRow
                key={category.id}
                title={category.title}
                items={category.items}
                isTop10Row={category.isTop10Row}
                onSelect={handleSelectMovie}
                id={category.id === 'series' ? 'section-series' : category.id === 'movies' ? 'section-peliculas-row' : category.id === 'musica' ? 'section-musica' : undefined}
                onPlay={handlePlayMovie}
                onAddToList={handleAddToList}
                onInfo={setInfoMovie}
                isInMyList={isInMyList}
                isLiked={isLiked}
                onLike={toggleLike}
                onHover={handleHoverMovie}
              />
            ))}
          </div>

          <footer className="footer" style={{ padding: '80px 0 50px', textAlign: 'center', color: '#808080', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '50px' }}>
            <p style={{ marginBottom: '10px' }}>&copy; {new Date().getFullYear()} COSMOS. Todos los derechos reservados.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <span>Políticas de Privacidad</span>
              <span>Términos de Uso</span>
              <span>Preguntas Frecuentes</span>
            </div>
          </footer>
        </>
      )}

      {/* Music Player (persistente) */}
      <MusicPlayer
        currentTrack={currentTrack}
        queue={musicQueue}
        isPlaying={isMusicPlaying}
        onPlayPause={() => setIsMusicPlaying(p => !p)}
        onNext={handleMusicNext}
        onPrev={handleMusicPrev}
        onSelectFromQueue={handleSelectFromQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={() => setMusicQueue([])}
        volume={musicVolume}
        onVolumeChange={setMusicVolume}
        progress={musicProgress}
        currentTime={musicCurrentTime}
        duration={musicDuration}
        onSeek={handleMusicSeek}
        shuffle={musicShuffle}
        onToggleShuffle={() => setMusicShuffle(s => !s)}
        repeat={musicRepeat}
        onToggleRepeat={handleToggleRepeat}
        youtubeId={currentYoutubeId}
      />

      {/* Mi Lista Modal */}
      {showMyList && (
        <div className="info-modal" onClick={() => setShowMyList(false)}>
          <div className="info-modal__content" onClick={e => e.stopPropagation()}>
            <div className="info-modal__header">
              <h2>Mi Lista</h2>
              <button className="info-modal__close" onClick={() => setShowMyList(false)}>✕</button>
            </div>
            {myList.length === 0 ? (
              <p className="info-modal__empty">Tu lista está vacía. Agrega películas desde "Más información".</p>
            ) : (
              <div className="info-modal__list-grid">
                {myList.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={(m) => { setShowMyList(false); handleSelectMovie(m); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoMovie && (
        <div className="info-modal" onClick={() => setInfoMovie(null)}>
          <div className="info-modal__content" onClick={e => e.stopPropagation()}>
            <div className="info-modal__header">
              <h2>{infoMovie.title}</h2>
              <button className="info-modal__close" onClick={() => setInfoMovie(null)}>✕</button>
            </div>
            {infoMovie.trailerUrl && (
              <div className="info-modal__trailer">
                <iframe
                  src={`${infoMovie.trailerUrl}?autoplay=1&mute=1`}
                  title={`Trailer de ${infoMovie.title}`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            )}
            <div className="info-modal__body">
              {!infoMovie.trailerUrl && <img className="info-modal__image" src={infoMovie.image} alt={infoMovie.title} />}
              <div className="info-modal__details">
                <div className="info-modal__meta">
                  {infoMovie.match && <span className="info-modal__match">{infoMovie.match}</span>}
                  {infoMovie.maturity && <span className="info-modal__badge">{infoMovie.maturity}</span>}
                  {infoMovie.duration && <span className="info-modal__duration">{infoMovie.duration}</span>}
                  {infoMovie.quality && <span className="info-modal__badge">{infoMovie.quality}</span>}
                </div>
                <p className="info-modal__desc">
                  {infoMovie.description || infoMovie.genre || "Una emocionante producción disponible en COSMOS."}
                </p>
                <div className="info-modal__actions">
                  {infoMovie.fileName && (
                    <button
                      className="info-modal__btn info-modal__btn--play"
                      onClick={() => { setInfoMovie(null); handlePlayMovie(infoMovie); }}
                    >
                      <svg viewBox="0 0 24 24" fill="black" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                      {watchHistory.find(h => h.id === infoMovie.id) ? 'Reanudar' : 'Reproducir'}
                    </button>
                  )}
                  <button
                    className={`info-modal__btn info-modal__btn--list ${isInMyList(infoMovie.id) ? 'info-modal__btn--list-active' : ''}`}
                    onClick={() => handleAddToList(infoMovie)}
                  >
                    {isInMyList(infoMovie.id) ? '✓ En Mi Lista' : '+ Mi Lista'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin Dashboard */}
      {showAdmin && (
        <AdminDashboard 
          onClose={() => setShowAdmin(false)} 
          onRefresh={handleAdminRefresh}
        />
      )}
    </div>
  );
}

export default App;
