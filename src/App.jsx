import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import VideoPlayer from './components/VideoPlayer';
import { categories, mockMovies } from './data/mockData';
import { fetchAllVideos } from './services/FirebaseService';

function App() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [firebaseVideos, setFirebaseVideos] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(mockMovies[0]);

  useEffect(() => {
    const getVideos = async () => {
      const videos = await fetchAllVideos();
      setFirebaseVideos(videos);
    };
    getVideos();
  }, []);

  const handlePlayHero = () => {
    if (featuredMovie && featuredMovie.fileName) {
      setSelectedVideo(featuredMovie);
      setShowPlayer(true);
    }
  };

  const handleSelectMovie = (movie) => {
    setFeaturedMovie(movie);
  };

  if (showPlayer && selectedVideo) {
    return (
      <VideoPlayer 
        onBack={() => setShowPlayer(false)} 
        fileName={selectedVideo.fileName}
        movieTitle={selectedVideo.title}
      />
    );
  }

  return (
    <div className="app">
      <Navbar />
      
      <Hero 
        movie={featuredMovie} 
        onPlay={handlePlayHero} 
      />
      
      <div className="app__rows">
        {/* Fila Dinámica de Firebase */}
        {firebaseVideos.length > 0 && (
          <MovieRow 
            title="Tus Videos de Firebase" 
            items={firebaseVideos} 
            onSelect={handleSelectMovie}
            isPortrait
          />
        )}

        {categories.map((category) => (
          <MovieRow 
            key={category.id} 
            title={category.title} 
            items={category.items} 
            isTop10Row={category.isTop10Row}
            onSelect={handleSelectMovie}
          />
        ))}
      </div>
      
      <footer className="footer" style={{ padding: '50px 0', textAlign: 'center', color: '#808080', fontSize: '13px' }}>
        <p>© 2026 NEFLIX Project - Realizado en Español</p>
      </footer>
    </div>
  );
}

export default App;
