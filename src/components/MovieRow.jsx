import { memo, useRef } from 'react';
import './MovieRow.css';
import MovieCard from './MovieCard';

const MovieRow = ({ title, items, isTop10Row, isPortrait, onSelect, id, progressMap, onPlay, onAddToList, onInfo, isInMyList, isLiked, onLike, onHover }) => {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="movie-row" id={id}>
      <h2 className="movie-row__title">{title}</h2>
      <div className="movie-row__container">
        <button className="movie-row__arrow movie-row__arrow--left" onClick={() => scroll('left')} aria-label="Desplazar izquierda">
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>

        <div className="movie-row__items" ref={rowRef}>
          {items.map((item) => (
            <MovieCard
              key={item.id}
              movie={item}
              isTop10={isTop10Row}
              isPortrait={isPortrait}
              onSelect={onSelect}
              progress={progressMap?.[item.id]}
              onPlay={onPlay}
              onAddToList={onAddToList}
              onInfo={onInfo}
              isInMyList={isInMyList ? isInMyList(item.id) : false}
              isLiked={isLiked ? isLiked(item.id) : false}
              onLike={onLike}
              onHover={onHover}
            />
          ))}
        </div>

        <button className="movie-row__arrow movie-row__arrow--right" onClick={() => scroll('right')} aria-label="Desplazar derecha">
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default memo(MovieRow);
