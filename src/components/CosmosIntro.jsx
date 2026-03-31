import { useEffect, useState } from 'react';
import './CosmosIntro.css';

const CosmosIntro = ({ onDone }) => {
  const [text, setText] = useState('');
  const fullText = 'COSMOS';

  useEffect(() => {
    let currentIdx = 0;
    const typeInterval = setInterval(() => {
      if (currentIdx <= fullText.length) {
        setText(fullText.slice(0, currentIdx));
        currentIdx++;
      } else {
        clearInterval(typeInterval);
      }
    }, 150); // Speed of typing

    const doneTimer = setTimeout(onDone, 3000); // Wait bit more before finishing

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
