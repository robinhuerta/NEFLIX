import './MiniModal.css';

const MiniModal = ({ movie, onPlay, onAddToList, onInfo, isInMyList, isLiked, onLike }) => {

  return (
    <div className="mini-modal">
      <div className="mini-modal__thumbnail" onClick={onPlay}>
        <img
          className="mini-modal__image"
          src={movie.image || movie.thumbnail}
          alt={movie.title}
          loading="lazy"
          onError={e => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23333'/%3E%3C/svg%3E"; }}
        />
        <div className="mini-modal__vignette" />
        <h3 className="mini-modal__title">{movie.title}</h3>
      </div>

      <div className="mini-modal__info">
        <div className="mini-modal__actions">
          <div className="mini-modal__actions-left">
            {/* Play */}
            <button
              className="mini-modal__btn mini-modal__btn--play"
              onClick={onPlay}
              title="Reproducir"
            >
              <svg viewBox="0 0 24 24" fill="black" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
            </button>

            {/* Add / Remove from list */}
            <button
              className={`mini-modal__btn ${isInMyList ? 'mini-modal__btn--active' : ''}`}
              onClick={onAddToList}
              title={isInMyList ? 'Quitar de Mi Lista' : 'Agregar a Mi Lista'}
            >
              {isInMyList ? (
                <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              )}
            </button>

            {/* Like */}
            <button
              className={`mini-modal__btn ${isLiked ? 'mini-modal__btn--liked' : ''}`}
              onClick={onLike}
              title={isLiked ? 'Ya no me gusta' : 'Me gusta'}
            >
              <svg viewBox="0 0 24 24" fill={isLiked ? '#ffd700' : 'white'} width="20" height="20">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
              </svg>
            </button>
          </div>

          <div className="mini-modal__actions-right">
            {/* More info */}
            <button className="mini-modal__btn" onClick={onInfo} title="Más información">
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mini-modal__metadata">
          {movie.match && <span className="mini-modal__match">{movie.match}</span>}
          {movie.maturity && <span className="mini-modal__maturity">{movie.maturity}</span>}
          {movie.duration && <span className="mini-modal__duration">{movie.duration}</span>}
          {movie.quality && <span className="mini-modal__quality">{movie.quality}</span>}
        </div>

        {movie.genre && (
          <div className="mini-modal__genres">
            {movie.genre}
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniModal;
