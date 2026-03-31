import { useEffect, useState } from 'react';
import './CosmosIntro.css';

const CosmosIntro = ({ onDone }) => {
  const [text, setText] = useState('');
  const fullText = 'COSMOS';

  useEffect(() => {
    let currentIdx = 0;
    // Small initial delay before starting animation
    const initialDelay = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (currentIdx <= fullText.length) {
          setText(fullText.slice(0, currentIdx));
          currentIdx++;
        } else {
          clearInterval(typeInterval);
        }
      }, 180); // Cinematic typing speed
    }, 500);

    const doneTimer = setTimeout(onDone, 3500);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className="cosmos-intro">
      <div className="cosmos-intro__text">
        {text}
        <span className="cosmos-intro__cursor">|</span>
      </div>
    </div>
  );
};

export default CosmosIntro;
