import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { uploadMovie, fetchAllVideos, deleteMovie, fetchSaludos, addSaludo, deleteSaludo, updateSaludo, fetchUsuarios } from '../services/FirebaseService';

const AdminDashboard = ({ onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manage'
  const [existingMovies, setExistingMovies] = useState([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  
  // States for Upload
  const [videoSourceType, setVideoSourceType] = useState('file'); // 'file' or 'url'
  const [externalUrl, setExternalUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Novedades');
  const [genre, setGenre] = useState('');
  const [artist, setArtist] = useState('');
  const [maturity, setMaturity] = useState('13+');
  const [duration, setDuration] = useState('2h 00m');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // General states
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' | 'batch'
  const [season, setSeason] = useState('1');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [episodes, setEpisodes] = useState([{ id: 1, num: 1, title: '', url: '' }]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [ytEmbedStatus, setYtEmbedStatus] = useState(null); // null|'checking'|'ok'|'blocked'|'invalid'
  const [batchUrlStatuses, setBatchUrlStatuses] = useState({});

  // Usuarios
  const [usuariosList, setUsuariosList] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);

  // Saludos / Marquesina
  const [saludosList, setSaludosList] = useState([]);
  const [saludoName, setSaludoName] = useState('');
  const [saludoMessage, setSaludoMessage] = useState('');
  const [saludoType, setSaludoType] = useState('birthday');
  const [saludoBirthdate, setSaludoBirthdate] = useState('');
  const [saludoLoading, setSaludoLoading] = useState(false);
  const [saludoSuccess, setSaludoSuccess] = useState('');
  const [saludoError, setSaludoError] = useState('');

  const ADMIN_PIN = 'cosmos2026';

  useEffect(() => {
    if (isAuthorized && activeTab === 'manage') loadMovies();
    if (isAuthorized && activeTab === 'saludos') loadSaludosList();
    if (isAuthorized && activeTab === 'usuarios') loadUsuarios();
  }, [isAuthorized, activeTab]);

  const loadUsuarios = async () => {
    setUsuariosLoading(true);
    const data = await fetchUsuarios();
    setUsuariosList(data);
    setUsuariosLoading(false);
  };

  const loadSaludosList = async () => {
    setSaludoLoading(true);
    const data = await fetchSaludos();
    setSaludosList(data);
    setSaludoLoading(false);
  };

  const handleAddSaludo = async (e) => {
    e.preventDefault();
    if (!saludoName.trim()) return setSaludoError('Escribe el nombre de la persona');
    setSaludoError('');
    setSaludoLoading(true);
    try {
      await addSaludo({
        name: saludoName.trim(),
        message: saludoMessage.trim(),
        type: saludoType,
        birthdate: saludoType === 'birthday' ? saludoBirthdate.trim() : '',
        active: true,
      });
      setSaludoSuccess('¡Saludo agregado a la marquesina!');
      setSaludoName(''); setSaludoMessage(''); setSaludoBirthdate(''); setSaludoType('birthday');
      setTimeout(() => setSaludoSuccess(''), 3000);
      loadSaludosList();
    } catch {
      setSaludoError('Error al guardar el saludo');
    } finally {
      setSaludoLoading(false);
    }
  };

  const handleDeleteSaludo = async (id) => {
    if (!window.confirm('¿Eliminar este saludo de la marquesina?')) return;
    await deleteSaludo(id);
    setSaludosList(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleSaludo = async (id, current) => {
    await updateSaludo(id, { active: !current });
    setSaludosList(prev => prev.map(s => s.id === id ? { ...s, active: !current } : s));
  };

  const isTodayBirthdate = (bd) => {
    if (!bd) return false;
    const today = new Date();
    const [dd, mm] = bd.split('/');
    return parseInt(dd) === today.getDate() && parseInt(mm) === (today.getMonth() + 1);
  };

  const loadMovies = async () => {
    setIsLoadingMovies(true);
    try {
      const data = await fetchAllVideos();
      setExistingMovies(data);
    } catch (err) {
      setError('Error al cargar videos: ' + err.message);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    let movieSource;
    if (videoSourceType === 'file') {
      if (!videoFile) return setError('Selecciona al menos un archivo de video (.mp4)');
      movieSource = videoFile;
    } else {
      if (!externalUrl.trim()) return setError('Introduce una URL válida de video o YouTube');
      if (ytEmbedStatus === 'blocked') {
        const ok = window.confirm('🚫 Este video tiene embedding bloqueado y NO se reproducirá en COSMOS.\n\n¿Deseas guardarlo de todas formas?');
        if (!ok) return;
      }
      movieSource = externalUrl.trim();
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await uploadMovie(
        movieSource,
        posterFile,
        {
          title, description: desc, category, genre, artist, maturity, duration,
          season: category === 'Series' ? (parseInt(season) || null) : null,
          episodeNumber: category === 'Series' ? (parseInt(episodeNumber) || null) : null,
          seriesTitle: category === 'Series' ? title : '',
        },
        (p) => setProgress(Math.round(p))
      );

      setSuccess(true);
      setVideoFile(null);
      setExternalUrl('');
      setPosterFile(null);
      setTitle('');
      setDesc('');
      setGenre('');
      setArtist('');
      setEpisodeNumber('');
      setYtEmbedStatus(null);
      setProgress(0);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Error al procesar el contenido: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${movie.title}" permanentemente de COSMOS?`)) {
      return;
    }

    setDeletingId(movie.id);
    try {
      await deleteMovie(movie.id, movie.fileName, movie.image);
      setExistingMovies(prev => prev.filter(m => m.id !== movie.id));
      if (onRefresh) onRefresh();
      setSuccess('Película eliminada correctamente');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al eliminar: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getYouTubeId = (url) => {
    const m = url.match(/^.*(youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*)/);
    return (m && m[2].length === 11) ? m[2] : null;
  };

  const checkYouTubeEmbed = async (url, callback) => {
    const id = getYouTubeId(url);
    if (!id) { callback('invalid'); return; }
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
      );
      callback(res.ok ? 'ok' : res.status === 401 ? 'blocked' : 'invalid');
    } catch {
      callback('error');
    }
  };

  // Auto-verificar URL en modo individual
  useEffect(() => {
    if (!externalUrl || !isYouTube(externalUrl)) { setYtEmbedStatus(null); return; }
    setYtEmbedStatus('checking');
    const timer = setTimeout(() => {
      checkYouTubeEmbed(externalUrl, setYtEmbedStatus);
    }, 800);
    return () => clearTimeout(timer);
  }, [externalUrl]);

  // Verificar URL por episodio al salir del campo (onBlur)
  const handleEpisodeUrlBlur = (id, url) => {
    if (!url.trim() || !isYouTube(url)) {
      setBatchUrlStatuses(prev => ({ ...prev, [id]: url.trim() ? 'invalid' : null }));
      return;
    }
    setBatchUrlStatuses(prev => ({ ...prev, [id]: 'checking' }));
    checkYouTubeEmbed(url, status => setBatchUrlStatuses(prev => ({ ...prev, [id]: status })));
  };

  const handleBatchUpload = async (e) => {
    e.preventDefault();
    const valid = episodes.filter(ep => ep.url.trim());
    if (!title.trim()) return setError('Escribe el título de la serie');
    if (valid.length === 0) return setError('Agrega al menos un episodio con URL de YouTube');
    const blocked = valid.filter(ep => batchUrlStatuses[ep.id] === 'blocked');
    if (blocked.length > 0) {
      const ok = window.confirm(
        `⚠️ ${blocked.length} episodio(s) tienen embedding bloqueado y NO se reproducirán en COSMOS:\n\n${blocked.map(ep => `· Ep ${ep.num}: ${ep.url}`).join('\n')}\n\n¿Deseas subirlos de todas formas?`
      );
      if (!ok) return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);
    setBatchProgress({ current: 0, total: valid.length });

    try {
      for (let i = 0; i < valid.length; i++) {
        const ep = valid[i];
        setBatchProgress({ current: i + 1, total: valid.length });
        await uploadMovie(ep.url.trim(), null, {
          title,
          description: desc,
          category: 'Series',
          genre,
          maturity,
          duration: '',
          season: parseInt(season) || 1,
          episodeNumber: ep.num,
          episodeTitle: ep.title,
          seriesTitle: title,
        });
      }
      const count = valid.length;
      setSuccess(`${count} episodio${count > 1 ? 's' : ''} lanzado${count > 1 ? 's' : ''} a COSMOS`);
      setEpisodes([{ id: Date.now(), num: 1, title: '', url: '' }]);
      setTitle('');
      setDesc('');
      setGenre('');
      setBatchProgress({ current: 0, total: 0 });
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Error al subir episodios: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const addEpisode = () => setEpisodes(prev => [...prev, { id: Date.now(), num: prev.length + 1, title: '', url: '' }]);
  const removeEpisode = (id) => setEpisodes(prev => {
    const f = prev.filter(ep => ep.id !== id);
    return f.map((ep, i) => ({ ...ep, num: i + 1 }));
  });
  const updateEpisode = (id, field, value) => setEpisodes(prev => prev.map(ep => ep.id === id ? { ...ep, [field]: value } : ep));

  const isYouTube = (url) => url.includes('youtube.com') || url.includes('youtu.be');
  const isDrive = (url) => url.includes('drive.google.com') || url.includes('docs.google.com');
  const isMusic = category === 'Videos Musicales';
  const isDirectMedia = (url) => /\.(mp3|mp4|m4a|ogg|wav|webm)(\?|$)/i.test(url);


  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__content" onClick={e => e.stopPropagation()}>
        <div className="admin-dashboard__header">
          <div className="admin-dashboard__header-info">
            <h2>Panel de Control COSMOS</h2>
            {isAuthorized && (
              <div className="admin-dashboard__status">Sesión Iniciada</div>
            )}
          </div>
          <button className="admin-dashboard__close" onClick={onClose}>✕</button>
        </div>

        {!isAuthorized ? (
          <div className="admin-dashboard__login">
            <h3>Acceso Restringido</h3>
            <p>Introduce tu PIN de administrador para continuar.</p>
            <input 
              type="password" 
              placeholder="PIN de COSMOS" 
              value={pinInput} 
              onChange={e => {
                setPinInput(e.target.value);
                if (e.target.value === ADMIN_PIN) setIsAuthorized(true);
              }}
              autoFocus
            />
            {pinInput.length >= 4 && pinInput !== ADMIN_PIN && (
              <p className="admin-dashboard__error-sm">PIN incorrecto</p>
            )}
          </div>
        ) : (
          <>
            <div className="admin-dashboard__tabs">
              <button 
                className={`admin-dashboard__tab ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                Lanzar Nuevo
              </button>
              <button
                className={`admin-dashboard__tab ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage')}
              >
                Gestionar Contenido ({existingMovies.length})
              </button>
              <button
                className={`admin-dashboard__tab ${activeTab === 'saludos' ? 'active' : ''}`}
                onClick={() => setActiveTab('saludos')}
              >
                🎉 Saludos
              </button>
              <button
                className={`admin-dashboard__tab ${activeTab === 'usuarios' ? 'active' : ''}`}
                onClick={() => setActiveTab('usuarios')}
              >
                👥 Usuarios
              </button>
            </div>

            {activeTab === 'usuarios' ? (
              <div className="admin-dashboard__usuarios">
                <div className="admin-dashboard__usuarios-header">
                  <h3>👥 Usuarios registrados</h3>
                  <span className="admin-dashboard__usuarios-count">{usuariosList.length} en total</span>
                </div>
                {usuariosLoading ? (
                  <div className="admin-dashboard__loading">Cargando usuarios...</div>
                ) : usuariosList.length === 0 ? (
                  <div className="admin-dashboard__empty">Aún no hay usuarios registrados.</div>
                ) : (
                  <div className="admin-dashboard__usuarios-list">
                    {usuariosList.map(u => (
                      <div key={u.id} className="admin-dashboard__usuario-item">
                        <img
                          className="admin-dashboard__usuario-avatar"
                          src={u.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"; }}
                        />
                        <div className="admin-dashboard__usuario-info">
                          <strong>{u.name || 'Sin nombre'}</strong>
                          <span>{u.email}</span>
                        </div>
                        <div className="admin-dashboard__usuario-last">
                          {u.lastLogin?.seconds
                            ? new Date(u.lastLogin.seconds * 1000).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'saludos' ? (
              <div className="admin-dashboard__saludos">
                <form className="admin-dashboard__form admin-dashboard__saludos-form" onSubmit={handleAddSaludo}>
                  <h3>Agregar Saludo a la Marquesina</h3>
                  <div className="admin-dashboard__row">
                    <input
                      type="text"
                      placeholder="Nombre de la persona *"
                      value={saludoName}
                      onChange={e => setSaludoName(e.target.value)}
                    />
                    <select value={saludoType} onChange={e => setSaludoType(e.target.value)}>
                      <option value="birthday">🎂 Cumpleaños</option>
                      <option value="anniversary">💍 Aniversario</option>
                      <option value="special">⭐ Saludo Especial</option>
                      <option value="custom">💫 Personalizado</option>
                    </select>
                  </div>
                  {saludoType === 'birthday' && (
                    <input
                      type="text"
                      placeholder="Fecha cumpleaños (dd/mm) — para mostrar automáticamente ese día"
                      value={saludoBirthdate}
                      onChange={e => setSaludoBirthdate(e.target.value)}
                      maxLength={5}
                    />
                  )}
                  <textarea
                    placeholder="Mensaje personalizado (opcional)"
                    value={saludoMessage}
                    onChange={e => setSaludoMessage(e.target.value)}
                    rows="2"
                  />
                  {saludoError && <div className="admin-dashboard__error">{saludoError}</div>}
                  {saludoSuccess && <div className="admin-dashboard__success">{saludoSuccess}</div>}
                  <button type="submit" className="admin-dashboard__submit" disabled={saludoLoading}>
                    {saludoLoading ? 'Guardando...' : '✨ Agregar a la Marquesina'}
                  </button>
                </form>

                <div className="admin-dashboard__saludos-list">
                  <h3>Saludos Activos ({saludosList.filter(s => s.active !== false).length})</h3>
                  {saludoLoading && saludosList.length === 0 ? (
                    <p style={{ color: '#aaa' }}>Cargando...</p>
                  ) : saludosList.length === 0 ? (
                    <p style={{ color: '#aaa' }}>No hay saludos todavía.</p>
                  ) : (
                    saludosList.map(s => (
                      <div key={s.id} className={`admin-dashboard__saludo-item ${s.active === false ? 'inactive' : ''}`}>
                        <div className="admin-dashboard__saludo-icon">
                          {s.type === 'birthday' ? '🎂' : s.type === 'anniversary' ? '💍' : s.type === 'special' ? '⭐' : '💫'}
                        </div>
                        <div className="admin-dashboard__saludo-info">
                          <strong>{s.name}</strong>
                          {s.birthdate && (
                            <span className={`admin-dashboard__saludo-date ${isTodayBirthdate(s.birthdate) ? 'today' : ''}`}>
                              {isTodayBirthdate(s.birthdate) ? '🎉 ¡HOY!' : s.birthdate}
                            </span>
                          )}
                          {s.message && <em>"{s.message}"</em>}
                        </div>
                        <div className="admin-dashboard__saludo-actions">
                          <button
                            type="button"
                            className={`admin-dashboard__saludo-toggle ${s.active !== false ? 'on' : 'off'}`}
                            onClick={() => handleToggleSaludo(s.id, s.active !== false)}
                            title={s.active !== false ? 'Desactivar' : 'Activar'}
                          >
                            {s.active !== false ? '✓ Activo' : '✗ Inactivo'}
                          </button>
                          <button
                            type="button"
                            className="admin-dashboard__delete-btn"
                            onClick={() => handleDeleteSaludo(s.id)}
                          >🗑️</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === 'upload' ? (
              <>
              <div className="admin-dashboard__mode-toggle">
                <button type="button" className={uploadMode === 'single' ? 'active' : ''} onClick={() => { setUploadMode('single'); setError(null); setSuccess(false); }}>
                  📺 Video único
                </button>
                <button type="button" className={uploadMode === 'batch' ? 'active' : ''} onClick={() => { setUploadMode('batch'); setCategory('Series'); setError(null); setSuccess(false); }}>
                  📋 Serie / Temporada completa
                </button>
              </div>

              {uploadMode === 'batch' ? (
              <form className="admin-dashboard__form" onSubmit={handleBatchUpload}>
                <div className="admin-dashboard__grid">
                  <div className="admin-dashboard__section">
                    <h3>Datos de la Serie</h3>
                    <input type="text" placeholder="Nombre de la Serie *" value={title} onChange={e => setTitle(e.target.value)} required />
                    <textarea placeholder="Sinopsis" value={desc} onChange={e => setDesc(e.target.value)} rows="3" />
                    <div className="admin-dashboard__row">
                      <input type="number" placeholder="Temporada" min="1" value={season} onChange={e => setSeason(e.target.value)} />
                      <input type="text" placeholder="Madurez (ej: 16+)" value={maturity} onChange={e => setMaturity(e.target.value)} />
                    </div>
                    <div className="admin-dashboard__genre-wrap">
                      <label className="admin-dashboard__genre-label">🎬 Género</label>
                      <div className="admin-dashboard__genre-grid">
                        {['Acción','Drama','Comedia','Terror','Suspenso','Romance','Aventura','Animación','Documental','Otros'].map(g => (
                          <button key={g} type="button" className={`admin-dashboard__genre-btn ${genre === g ? 'active' : ''}`} onClick={() => setGenre(genre === g ? '' : g)}>{g}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="admin-dashboard__section">
                    <h3>Episodios ({episodes.filter(ep => ep.url.trim()).length} con URL)</h3>
                    <div className="admin-dashboard__episodes">
                      {episodes.map(ep => (
                        <div key={ep.id} className="admin-dashboard__episode-row">
                          <span className="admin-dashboard__ep-num">Ep {ep.num}</span>
                          <input type="text" placeholder="Título del episodio" value={ep.title} onChange={e => updateEpisode(ep.id, 'title', e.target.value)} />
                          <div className="admin-dashboard__ep-url-wrap">
                            <input
                              type="text"
                              placeholder="URL de YouTube *"
                              value={ep.url}
                              onChange={e => { updateEpisode(ep.id, 'url', e.target.value); setBatchUrlStatuses(prev => ({ ...prev, [ep.id]: null })); }}
                              onBlur={e => handleEpisodeUrlBlur(ep.id, e.target.value)}
                            />
                            {batchUrlStatuses[ep.id] === 'checking' && <span className="admin-dashboard__ep-status checking">⏳</span>}
                            {batchUrlStatuses[ep.id] === 'ok' && <span className="admin-dashboard__ep-status ok" title="Se puede reproducir en COSMOS">✅</span>}
                            {batchUrlStatuses[ep.id] === 'blocked' && <span className="admin-dashboard__ep-status blocked" title="Embedding bloqueado — no funcionará en COSMOS">🚫</span>}
                            {batchUrlStatuses[ep.id] === 'invalid' && <span className="admin-dashboard__ep-status invalid" title="URL inválida o video no encontrado">⚠️</span>}
                          </div>
                          {episodes.length > 1 && (
                            <button type="button" className="admin-dashboard__ep-remove" onClick={() => removeEpisode(ep.id)}>×</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" className="admin-dashboard__add-episode" onClick={addEpisode}>+ Agregar episodio</button>
                  </div>
                </div>
                {uploading && batchProgress.total > 0 && (
                  <div className="admin-dashboard__progress-container">
                    <div className="admin-dashboard__progress-bar">
                      <div className="admin-dashboard__progress-fill" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
                    </div>
                    <span>Subiendo episodio {batchProgress.current} de {batchProgress.total}...</span>
                  </div>
                )}
                {error && <div className="admin-dashboard__error">{error}</div>}
                {success && <div className="admin-dashboard__success">{success}</div>}
                <button type="submit" className="admin-dashboard__submit" disabled={uploading}>
                  {uploading ? `Procesando ${batchProgress.current}/${batchProgress.total}...` : `Subir ${episodes.filter(ep => ep.url.trim()).length || 0} episodio(s)`}
                </button>
              </form>
              ) : (
              <form className="admin-dashboard__form" onSubmit={handleUpload}>
                <div className="admin-dashboard__grid">
                  <div className="admin-dashboard__section">
                    <h3>Datos de la Obra</h3>
                    <input 
                      type="text" 
                      placeholder="Título de la Película" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      required
                    />
                    <textarea 
                      placeholder="Descripción / Sinopsis" 
                      value={desc} 
                      onChange={e => setDesc(e.target.value)} 
                      rows="4"
                    />
                    <div className="admin-dashboard__row">
                      <select value={category} onChange={e => { setCategory(e.target.value); setGenre(''); setArtist(''); }}>
                        <option value="Novedades">Novedades</option>
                        <option value="Series">Series</option>
                        <option value="Películas Latinas">Películas Latinas</option>
                        <option value="Acción y Suspenso">Acción y Suspenso</option>
                        <option value="Videos Musicales">Videos Musicales 🎵</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Madurez (ej: 16+)"
                        value={maturity}
                        onChange={e => setMaturity(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Duración (ej: 1h 45m)"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                      />
                    </div>

                    {category === 'Series' && (
                      <div className="admin-dashboard__row">
                        <input type="number" placeholder="Temporada N°" min="1" value={season} onChange={e => setSeason(e.target.value)} />
                        <input type="number" placeholder="Episodio N°" min="1" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} />
                      </div>
                    )}

                    {category === 'Videos Musicales' && (
                      <input
                        type="text"
                        placeholder="Artista o Banda"
                        value={artist}
                        onChange={e => setArtist(e.target.value)}
                      />
                    )}

                    <div className="admin-dashboard__genre-wrap">
                      <label className="admin-dashboard__genre-label">
                        {category === 'Videos Musicales' ? '🎶 Género Musical' : '🎬 Género'}
                      </label>
                      <div className="admin-dashboard__genre-grid">
                        {(category === 'Videos Musicales'
                          ? ['Cumbia','Salsa','Huayno','Reggaeton','Vallenato','Tropical','Chicha','Balada','Pop','Rock','Electrónica','Merengue','Bachata','Marinera','Festejo','Otros']
                          : ['Acción','Drama','Comedia','Terror','Suspenso','Romance','Aventura','Animación','Documental','Otros']
                        ).map(g => (
                          <button
                            key={g}
                            type="button"
                            className={`admin-dashboard__genre-btn ${genre === g ? 'active' : ''}`}
                            onClick={() => setGenre(genre === g ? '' : g)}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {genre && <p className="admin-dashboard__genre-selected">Seleccionado: <strong>{genre}</strong></p>}
                    </div>
                  </div>

                  <div className="admin-dashboard__section">
                    <h3>Archivos Multimedia</h3>
                    <div className="admin-dashboard__source-toggle">
                      <button 
                        type="button"
                        className={videoSourceType === 'file' ? 'active' : ''} 
                        onClick={() => setVideoSourceType('file')}
                      >
                        Archivo Local
                      </button>
                      <button 
                        type="button"
                        className={videoSourceType === 'url' ? 'active' : ''} 
                        onClick={() => setVideoSourceType('url')}
                      >
                        Enlace / URL
                      </button>
                    </div>

                    {videoSourceType === 'file' ? (
                      <div className="admin-dashboard__file-input">
                        <label>{isMusic ? 'Audio (.mp3) o Video (.mp4) *' : 'Video (.mp4) *'}</label>
                        <input
                          type="file"
                          accept={isMusic ? 'audio/mpeg,audio/mp3,video/mp4' : 'video/mp4'}
                          onChange={e => setVideoFile(e.target.files[0])}
                          required
                        />
                        {videoFile && (
                          <p style={{ color: '#a78bfa', fontSize: '12px', marginTop: '8px' }}>
                            ✓ {videoFile.name}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="admin-dashboard__url-input">
                        <label>URL del Video o YouTube *</label>
                        <input
                          type="text"
                          placeholder="https://youtube.com/... o URL directa de archivo"
                          value={externalUrl}
                          onChange={e => setExternalUrl(e.target.value)}
                          required
                        />
                        {externalUrl && isYouTube(externalUrl) && (
                          <div className={`admin-dashboard__url-badge ${
                            ytEmbedStatus === 'ok' ? 'youtube' :
                            ytEmbedStatus === 'blocked' ? 'error' : ''
                          }`}>
                            {ytEmbedStatus === 'checking' ? '⏳ Verificando si se puede reproducir en COSMOS...' :
                             ytEmbedStatus === 'ok' ? '✅ YouTube · Se puede reproducir en COSMOS' :
                             ytEmbedStatus === 'blocked' ? '🚫 Embedding bloqueado — este video NO se reproducirá en COSMOS (el canal lo impide)' :
                             ytEmbedStatus === 'invalid' ? '⚠️ Video no encontrado o URL inválida' :
                             '⏳ Verificando...'}
                          </div>
                        )}
                        {externalUrl && isDrive(externalUrl) && (
                          <div className={externalUrl.includes('/folders/') ? 'admin-dashboard__url-badge error' : 'admin-dashboard__url-badge drive'}>
                            {externalUrl.includes('/folders/') ? '⚠️ Es una CARPETA. Usa el link del archivo.' : 'Detección: Google Drive 📁'}
                          </div>
                        )}
                        {externalUrl && isMusic && !isYouTube(externalUrl) && !isDrive(externalUrl) && !isDirectMedia(externalUrl) && externalUrl.trim() && (
                          <div className="admin-dashboard__url-badge error">
                            ⚠️ Para música se recomienda YouTube o subir un archivo .mp3/.mp4
                          </div>
                        )}
                        {externalUrl && isMusic && isDirectMedia(externalUrl) && !isYouTube(externalUrl) && (
                          <div className="admin-dashboard__url-badge youtube">✅ URL de audio/video directa</div>
                        )}
                      </div>
                    )}

                    {/* Carátula: en archivo siempre, en URL solo si NO es YouTube (YouTube la obtiene automático) */}
                    {(videoSourceType === 'file' || (isMusic && videoSourceType === 'url' && !isYouTube(externalUrl))) && (
                      <div className="admin-dashboard__file-input">
                        <label>Carátula 16:9 (Imagen)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => setPosterFile(e.target.files[0])}
                        />
                        {posterFile && (
                          <p style={{ color: '#a78bfa', fontSize: '12px', marginTop: '8px' }}>
                            ✓ {posterFile.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {uploading && videoSourceType === 'file' && (
                  <div className="admin-dashboard__progress-container">
                    <div className="admin-dashboard__progress-bar">
                      <div 
                        className="admin-dashboard__progress-fill" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span>Subiendo: {progress}%</span>
                  </div>
                )}

                {error && <div className="admin-dashboard__error">{error}</div>}
                {success && typeof success === 'string' && <div className="admin-dashboard__success">{success}</div>}
                {success && typeof success === 'boolean' && <div className="admin-dashboard__success">¡Contenido lanzado con éxito a COSMOS!</div>}

                <button 
                  type="submit" 
                  className="admin-dashboard__submit" 
                  disabled={uploading}
                >
                  {uploading ? 'Procesando...' : 'Lanzar Contenido'}
                </button>
              </form>
              )}
              </>
            ) : (
              <div className="admin-dashboard__manage">
                {isLoadingMovies ? (
                  <div className="admin-dashboard__loading">Cargando biblioteca de COSMOS...</div>
                ) : existingMovies.length === 0 ? (
                  <div className="admin-dashboard__empty">No hay videos subidos aún.</div>
                ) : (
                  <div className="admin-dashboard__movie-list">
                    {existingMovies.map(movie => (
                      <div key={movie.id} className="admin-dashboard__movie-item">
                        <img src={movie.image} alt={movie.title} />
                        <div className="admin-dashboard__movie-info">
                          <h4>{movie.title}</h4>
                          <span className="admin-dashboard__movie-meta">{movie.category} • {movie.duration}</span>
                        </div>
                        <button 
                          className="admin-dashboard__delete-btn"
                          onClick={() => handleDelete(movie)}
                          disabled={deletingId === movie.id}
                        >
                          {deletingId === movie.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {error && <div className="admin-dashboard__error">{error}</div>}
                {success && <div className="admin-dashboard__success">{success}</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
