import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import VideoPlayer from './components/VideoPlayer';
import { categories } from './data/mockData';
import { fetchAllVideos } from './services/FirebaseService';

function App() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [firebaseVideos, setFirebaseVideos] = useState([]);

  useEffect(() => {
    const getVideos = async () => {
      const videos = await fetchAllVideos();
      setFirebaseVideos(videos);
    };
    getVideos();
  }, []);

  const handlePlayHero = () => {
    setSelectedVideo({
      fileName: 'el ultimo guerrero.mp4',
      title: 'El Último Guerrero'
    });
    setShowPlayer(true);
  };

  const handlePlayVideo = (video) => {
    setSelectedVideo(video);
    setShowPlayer(true);
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
      <div onClick={handlePlayHero}>
        <Hero />
      </div>
      
      <div className="app__rows">
        {/* Fila Dinámica de Firebase */}
        {firebaseVideos.length > 0 && (
          <MovieRow 
            title="Tus Videos de Firebase (Auto)" 
            items={firebaseVideos} 
            onPlay={handlePlayVideo}
          />
        )}

        {categories.map((category) => (
          <MovieRow 
            key={category.id} 
            title={category.title} 
            items={category.items} 
            isTop10Row={category.isTop10Row}
            onPlay={handlePlayVideo}
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
