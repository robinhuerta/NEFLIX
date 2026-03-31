import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';

const mockNotifications = [
  { id: 1, text: "El Último Guerrero está disponible", time: "Hace 2h", isNew: true },
  { id: 2, text: "American Sicario - Nuevo estreno", time: "Hace 5h", isNew: true },
  { id: 3, text: "Novedades de esta semana", time: "Hace 1d", isNew: false },
  { id: 4, text: "Tu lista se ha actualizado", time: "Hace 2d", isNew: false },
  { id: 5, text: "Nuevas películas agregadas", time: "Hace 3d", isNew: false },
];

const Navbar = ({ onSearch, myListCount = 0, onShowMyList, onLogout, onShowAdmin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!showSearch) {
      setSearchValue('');
      onSearch && onSearch('');
    }
  }, [showSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      onSearch && onSearch(value);
    }, 300);
  };

  const handleNavClick = (section) => {
    switch (section) {
      case 'inicio':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'series':
        document.getElementById('section-series')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'peliculas':
        document.getElementById('section-peliculas')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'novedades':
        document.getElementById('section-novedades')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'milista':
        onShowMyList && onShowMyList();
        break;
      case 'idiomas':
        document.getElementById('section-idiomas')?.scrollIntoView({ behavior: 'smooth' });
        break;
      default:
        break;
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__left">
        <img
          className="navbar__logo"
          src="/logo.png"
          alt="COSMOS Logo"
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setShowSearch(false); }}
        />
        <ul className="navbar__links">
          <li className="navbar__link" onClick={() => handleNavClick('inicio')}>Inicio</li>
          <li className="navbar__link" onClick={() => handleNavClick('series')}>Series</li>
          <li className="navbar__link" onClick={() => handleNavClick('peliculas')}>Películas</li>
          <li className="navbar__link" onClick={() => handleNavClick('novedades')}>Novedades populares</li>
          <li className="navbar__link navbar__link--mylist" onClick={() => handleNavClick('milista')}>
            Mi lista {myListCount > 0 && <span className="navbar__list-count">{myListCount}</span>}
          </li>
          <li className="navbar__link" onClick={() => handleNavClick('idiomas')}>Explora por idiomas</li>
        </ul>
      </div>

      <div className="navbar__right">
        {/* Search */}
        <div className={`navbar__search-wrapper ${showSearch ? 'navbar__search-wrapper--open' : ''}`}>
          <div className="navbar__icon navbar__search" onClick={() => setShowSearch(!showSearch)}>
            <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          {showSearch && (
            <input
              ref={searchInputRef}
              className="navbar__search-input"
              type="text"
              placeholder="Títulos, personas, géneros"
              value={searchValue}
              onChange={handleSearchChange}
            />
          )}
        </div>

        {/* Notifications */}
        <div className="navbar__icon navbar__notifications" ref={notifRef} onClick={() => setShowNotifications(!showNotifications)}>
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <span className="navbar__badge">5</span>
          {showNotifications && (
            <div className="navbar__dropdown" onClick={e => e.stopPropagation()}>
              <h4 className="navbar__dropdown-title">Notificaciones</h4>
              {mockNotifications.map(n => (
                <div key={n.id} className={`navbar__notification-item ${n.isNew ? 'navbar__notification-item--new' : ''}`}>
                  {n.isNew && <span className="navbar__notif-dot" />}
                  <div>
                    <p className="navbar__notif-text">{n.text}</p>
                    <span className="navbar__notif-time">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="navbar__profile" ref={profileRef} onClick={() => setShowProfile(!showProfile)}>
          <img
            className="navbar__avatar"
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"
            alt="User Avatar"
          />
          <span className={`navbar__caret ${showProfile ? 'navbar__caret--open' : ''}`}>▼</span>
          {showProfile && (
            <div className="navbar__dropdown navbar__profile-dropdown" onClick={e => e.stopPropagation()}>
              <div className="navbar__profile-item">
                <img
                  className="navbar__profile-item-avatar"
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"
                  alt="Avatar"
                />
                <span>Usuario</span>
              </div>
              <hr className="navbar__divider" />
              <div className="navbar__profile-option" onClick={() => { setShowProfile(false); onShowAdmin(); }}>Gestionar contenido (Admin)</div>
              <div className="navbar__profile-option" onClick={() => alert("Próximamente: Gestión de perfiles")}>Gestionar perfiles</div>
              <div className="navbar__profile-option" onClick={() => alert("Próximamente: Configuración de la cuenta")}>Cuenta</div>
              <div className="navbar__profile-option" onClick={() => alert("Próximamente: Centro de ayuda de COSMOS")}>Centro de ayuda</div>
              <hr className="navbar__divider" />
              <div className="navbar__profile-option" onClick={() => { setShowProfile(false); onLogout(); }}>Cerrar sesión en COSMOS</div>
            </div>
          )}
        </div>

        {/* Hamburger button — solo visible en mobile */}
        <button
          className="navbar__hamburger"
          onClick={() => setShowMobileMenu(true)}
          aria-label="Abrir menú"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      {showMobileMenu && (
        <div className="mobile-menu__overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <button className="mobile-menu__close" onClick={() => setShowMobileMenu(false)}>✕</button>
            <img
              className="mobile-menu__logo"
              src="/logo.png"
              alt="COSMOS"
            />
            <nav className="mobile-menu__links">
              <div className="mobile-menu__link" onClick={() => { handleNavClick('inicio'); setShowMobileMenu(false); }}>Inicio</div>
              <div className="mobile-menu__link" onClick={() => { handleNavClick('series'); setShowMobileMenu(false); }}>Series</div>
              <div className="mobile-menu__link" onClick={() => { handleNavClick('peliculas'); setShowMobileMenu(false); }}>Películas</div>
              <div className="mobile-menu__link" onClick={() => { handleNavClick('novedades'); setShowMobileMenu(false); }}>Novedades populares</div>
              <div className="mobile-menu__link" onClick={() => { handleNavClick('milista'); setShowMobileMenu(false); }}>
                Mi lista {myListCount > 0 && <span className="navbar__list-count">{myListCount}</span>}
              </div>
              <div className="mobile-menu__link" onClick={() => { handleNavClick('idiomas'); setShowMobileMenu(false); }}>Explora por idiomas</div>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
