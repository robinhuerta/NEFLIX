import React, { useState } from 'react';
import './SeriesDetail.css';

const SeriesDetail = ({ series, onPlay, onBack }) => {
  const seasons = [...new Set(series.episodes.map(ep => ep.season || 1))].sort((a, b) => a - b);
  const [activeSeason, setActiveSeason] = useState(seasons[0] || 1);

  const episodesInSeason = series.episodes.filter(ep => (ep.season || 1) === activeSeason);

  return (
    <div className="series-detail">
      <div className="series-detail__hero" style={{ backgroundImage: `url(${series.image})` }}>
        <div className="series-detail__hero-overlay" />
        <button className="series-detail__back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Series
        </button>
        <div className="series-detail__hero-info">
          <h1 className="series-detail__title">{series.title}</h1>
          {series.description && <p className="series-detail__desc">{series.description}</p>}
          <div className="series-detail__meta">
            <span>{series.episodes.length} episodio{series.episodes.length !== 1 ? 's' : ''}</span>
            {seasons.length > 1 && <span>{seasons.length} temporadas</span>}
          </div>
        </div>
      </div>

      {seasons.length > 1 && (
        <div className="series-detail__seasons">
          {seasons.map(s => (
            <button
              key={s}
              className={`series-detail__season-btn ${activeSeason === s ? 'active' : ''}`}
              onClick={() => setActiveSeason(s)}
            >
              Temporada {s}
            </button>
          ))}
        </div>
      )}

      <div className="series-detail__episodes">
        <h2 className="series-detail__section-title">
          {seasons.length > 1 ? `Temporada ${activeSeason}` : 'Episodios'}
        </h2>
        {episodesInSeason.map((ep, idx) => (
          <div key={ep.id} className="series-detail__episode" onClick={() => onPlay(ep, series)}>
            <span className="series-detail__ep-num">{ep.episodeNumber || idx + 1}</span>
            <div className="series-detail__ep-thumb">
              <img src={ep.image} alt={ep.episodeTitle || ep.title} />
              <div className="series-detail__ep-play">
                <svg viewBox="0 0 24 24" fill="white" width="32" height="32"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <div className="series-detail__ep-info">
              <p className="series-detail__ep-title">
                {ep.episodeNumber ? `Ep. ${ep.episodeNumber} — ` : ''}{ep.episodeTitle || ep.title}
              </p>
              {ep.description && <p className="series-detail__ep-desc">{ep.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeriesDetail;
