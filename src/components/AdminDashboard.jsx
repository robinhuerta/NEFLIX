import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { uploadMovie, fetchAllVideos, deleteMovie } from '../services/FirebaseService';

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

  const ADMIN_PIN = 'COSMOS2026';

  useEffect(() => {
    if (isAuthorized && activeTab === 'manage') {
      loadMovies();
    }
  }, [isAuthorized, activeTab]);

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
      movieSource = externalUrl.trim();
    }
    
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await uploadMovie(
        movieSource, 
        posterFile, 
        { title, description: desc, category, maturity, duration },
        (p) => setProgress(Math.round(p))
      );
      
      setSuccess(true);
      setVideoFile(null);
      setExternalUrl('');
      setPosterFile(null);
      setTitle('');
      setDesc('');
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

  const isYouTube = (url) => url.includes('youtube.com') || url.includes('youtu.be');
  const isDrive = (url) => url.includes('drive.google.com') || url.includes('docs.google.com');

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
            </div>

            {activeTab === 'upload' ? (
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
                      <select value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="Novedades">Novedades</option>
                        <option value="Series">Series</option>
                        <option value="Películas Latinas">Películas Latinas</option>
                        <option value="Acción y Suspenso">Acción y Suspenso</option>
                        <option value="Videos Musicales">Videos Musicales</option>
                        <option value="Mi Lista">Mi Lista</option>
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
                        <label>Video (.mp4) *</label>
                        <input 
                          type="file" 
                          accept="video/mp4" 
                          onChange={e => setVideoFile(e.target.files[0])} 
                          required
                        />
                      </div>
                    ) : (
                      <div className="admin-dashboard__url-input">
                        <label>URL del Video o YouTube *</label>
                        <input 
                          type="text" 
                          placeholder="https://drive.google.com/... o https://youtube.com/..." 
                          value={externalUrl} 
                          onChange={e => setExternalUrl(e.target.value)} 
                          required
                        />
                        {externalUrl && isYouTube(externalUrl) && (
                          <div className="admin-dashboard__url-badge">Detección: YouTube 🎬</div>
                        )}
                        {externalUrl && isDrive(externalUrl) && (
                          <div className={externalUrl.includes('/folders/') ? "admin-dashboard__url-badge error" : "admin-dashboard__url-badge drive"}>
                            {externalUrl.includes('/folders/') ? "⚠️ Error: Es una CARPETA. Usa el link del archivo." : "Detección: Google Drive 📁"}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="admin-dashboard__file-input">
                      <label>Poster / Carátula (Imagen)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => setPosterFile(e.target.files[0])} 
                      />
                    </div>
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
