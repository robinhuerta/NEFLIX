import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__left">
        <img 
          className="navbar__logo" 
          src="https://i.postimg.cc/Qdpn5mZW/Gemini-Generated-Image-5mdtub5mdtub5mdt.png" 
          alt="NEFLIX Logo" 
        />
        <ul className="navbar__links">
          <li className="navbar__link">Inicio</li>
          <li className="navbar__link">Series</li>
          <li className="navbar__link">Películas</li>
          <li className="navbar__link">Novedades populares</li>
          <li className="navbar__link">Mi lista</li>
          <li className="navbar__link">Explora por idiomas</li>
        </ul>
      </div>
      <div className="navbar__right">
        <div className="navbar__icon navbar__search">
           <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </div>
        <div className="navbar__icon navbar__notifications">
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          <span className="navbar__badge">5</span>
        </div>
        <div className="navbar__profile">
          <img 
            className="navbar__avatar" 
            src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" 
            alt="User Avatar" 
          />
          <span className="navbar__caret">▼</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
