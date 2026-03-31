import { useEffect, useState } from 'react';
import './CosmosIntro.css';

const CosmosIntro = ({ onDone }) => {
  const [text, setText] = useState('');
  const fullText = 'COSMOS';

  useEffect(() => {
    // Cinematic Intro Sound (Deep Space Riser / Logo reveal style)
    const introSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    introSound.volume = 0.5;

    let currentIdx = 0;
    // Small initial delay before starting animation
    const initialDelay = setTimeout(() => {
      // Play sound
      introSound.play().catch(e => console.log("Autoplay blocked: ", e));
      
      const typeInterval = setInterval(() => {
        if (currentIdx <= fullText.length) {
          setText(fullText.slice(0, currentIdx));
          currentIdx++;
        } else {
          clearInterval(typeInterval);
        }
      }, 180); // Cinematic typing speed
    }, 500);

    const doneTimer = setTimeout(() => {
      onDone();
    }, 3500);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(doneTimer);
      // Fade out and stop sound on unmount
      const fadeOut = setInterval(() => {
        if (introSound.volume > 0.05) {
          introSound.volume -= 0.05;
        } else {
          introSound.pause();
          clearInterval(fadeOut);
        }
      }, 50);
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
