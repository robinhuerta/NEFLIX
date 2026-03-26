import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import VideoPlayer from './components/VideoPlayer';
import { categories } from './data/mockData';

function App() {
  const [showPlayer, setShowPlayer] = useState(false);

  if (showPlayer) {
    return <VideoPlayer onBack={() => setShowPlayer(false)} />;
  }

  return (
    <div className="app">
      <Navbar />
      <div onClick={() => setShowPlayer(true)}>
        <Hero />
      </div>
      <div className="app__rows">
        {categories.map((category) => (
          <MovieRow 
            key={category.id} 
            title={category.title} 
            items={category.items} 
            isTop10Row={category.isTop10Row}
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
