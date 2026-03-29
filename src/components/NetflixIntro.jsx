import { useEffect } from 'react';
import './NetflixIntro.css';

const NetflixIntro = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="netflix-intro">
      <div className="netflix-intro__n">N</div>
    </div>
  );
};

export default NetflixIntro;
