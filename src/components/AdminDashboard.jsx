import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { uploadMovie, fetchAllVideos } from '../services/FirebaseService';

const AdminDashboard = ({ onClose, onRefresh }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Novedades');
  const [maturity, setMaturity] = useState('13+');
  const [duration, setDuration] = useState('2h 00m');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const ADMIN_PIN = 'COSMOS2026';

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) return setError('Selecciona al menos un archivo de video (.mp4)');
    
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await uploadMovie(
        videoFile, 
        posterFile, 
        { title, description: desc, category, maturity, duration },
        (p) => setProgress(Math.round(p))
      );
      
      setSuccess(true);
      setVideoFile(null);
      setPosterFile(null);
      setTitle('');
      setDesc('');
      setProgress(0);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Error al subir los archivos: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__content" onClick={e => e.stopPropagation()}>
        <div className="admin-dashboard__header">
          <h2>Panel de Control COSMOS</h2>
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
                <div className="admin-dashboard__file-input">
                  <label>Video (.mp4) *</label>
                  <input 
                    type="file" 
                    accept="video/mp4" 
                    onChange={e => setVideoFile(e.target.files[0])} 
                    required
                  />
                </div>
                <div className="admin-dashboard__file-input">
                  <label>Poster / Carátula (Imagen)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setPosterFile(e.target.files[0])} 
                  />
                </div>
                <p className="admin-dashboard__tip">
                  Tip: Si el video y la imagen tienen el mismo nombre, COSMOS los asociará automáticamente.
                </p>
              </div>
            </div>

            {uploading && (
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
            {success && <div className="admin-dashboard__success">¡Contenido subido con éxito a COSMOS!</div>}

            <button 
              type="submit" 
              className="admin-dashboard__submit" 
              disabled={uploading}
            >
              {uploading ? 'Procesando...' : 'Lanzar Contenido'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
