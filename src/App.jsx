import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import MovieCard from './components/MovieCard';
import VideoPlayer from './components/VideoPlayer';
import SkeletonCard from './components/SkeletonCard';
import CosmosIntro from './components/CosmosIntro';
import { categories, mockMovies } from './data/mockData';
import { fetchAllVideos } from './services/FirebaseService';

const SKELETON_COUNT = 6;

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [firebaseVideos, setFirebaseVideos] = useState([]);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [featuredMovie, setFeaturedMovie] = useState(mockMovies[0]);
  const [infoMovie, setInfoMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyList, setShowMyList] = useState(false);

  // Persist Mi Lista in localStorage
  const [myList, setMyList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('neflix_mylist') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('neflix_mylist', JSON.stringify(myList));
  }, [myList]);

  // Persist watch history in localStorage
  const [watchHistory, setWatchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('neflix_history') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('neflix_history', JSON.stringify(watchHistory));
  }, [watchHistory]);

  useEffect(() => {
    const getVideos = async () => {
      setFirebaseLoading(true);
      const videos = await fetchAllVideos();
      setFirebaseVideos(videos);
      setFirebaseLoading(false);
    };
    getVideos();
  }, []);

  const handlePlayHero = () => {
    if (featuredMovie && featuredMovie.fileName) {
      setSelectedVideo(featuredMovie);
      setShowPlayer(true);
    }
  };

  const handlePlayMovie = (movie) => {
    if (movie && movie.fileName) {
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
    try { return JSON.parse(localStorage.getItem('neflix_likes') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('neflix_likes', JSON.stringify(likes));
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
  const allVideos = [...firebaseVideos, ...mockMovies.filter(m => m.fileName)];

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
  const allMovies = [...mockMovies, ...firebaseVideos];
  const searchResults = searchQuery.trim()
    ? allMovies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  if (showIntro) {
    return <CosmosIntro onDone={() => setShowIntro(false)} />;
  }

  if (showPlayer && selectedVideo) {
    return (
      <VideoPlayer
        onBack={() => setShowPlayer(false)}
        fileName={selectedVideo.fileName}
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
      <Navbar
        onSearch={setSearchQuery}
        myListCount={myList.length}
        onShowMyList={() => setShowMyList(true)}
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
                <MovieCard key={movie.id} movie={movie} onSelect={handleSelectMovie} />
              ))}
            </div>
          )}
        </div>
      )}

      {!searchResults && (
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
                      />
                    ))
                }
              </div>
            </div>

            {categories.map((category, index) => (
              <MovieRow
                key={category.id}
                title={category.title}
                items={category.items}
                isTop10Row={category.isTop10Row}
                onSelect={handleSelectMovie}
                id={index === 0 ? 'section-series' : index === 1 ? 'section-novedades' : undefined}
                onPlay={handlePlayMovie}
                onAddToList={handleAddToList}
                onInfo={setInfoMovie}
                isInMyList={isInMyList}
                isLiked={isLiked}
                onLike={toggleLike}
              />
            ))}
          </div>

          <footer className="footer" style={{ padding: '50px 0', textAlign: 'center', color: '#808080', fontSize: '13px' }}>
            <p>© 2026 NEFLIX Project - Realizado en Español</p>
          </footer>
        </>
      )}

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
                  {infoMovie.description || infoMovie.genre || "Una emocionante producción disponible en NEFLIX."}
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
    </div>
  );
}

export default App;
