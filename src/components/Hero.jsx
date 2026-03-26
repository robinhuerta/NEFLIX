import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero">
      <div className="hero__background">
        <img 
          className="hero__image" 
          src="/posters/el-ultimo-guerrero-square.png" 
          alt="Banner" 
        />
        <div className="hero__vignette" />
        <div className="hero__vignette--bottom" />
      </div>
      
      <div className="hero__contents">
        <h1 className="hero__title">EL ÚLTIMO GUERRERO</h1>
        <p className="hero__description">
          Un estoico guerrero antiguo se enfrenta a su destino en un campo de 
          batalla al atardecer. Una epopeya de valor, redención y la lucha 
          por el honor en un mundo devastado por la guerra.
        </p>
        <div className="hero__buttons">
          <button className="hero__button hero__button--play">
            <svg viewBox="0 0 24 24" fill="black" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
            Reproducir
          </button>
          <button className="hero__button hero__button--info">
            <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>
            Más información
          </button>
        </div>
      </div>
      
      <div className="hero__rating">
         <span className="hero__rating-text">13+</span>
      </div>
    </div>
  );
};

export default Hero;
