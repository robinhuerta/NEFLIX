import { useEffect } from 'react';
import './CosmosIntro.css';

const CosmosIntro = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="cosmos-intro">
      <div className="cosmos-intro__c">C</div>
    </div>
  );
};

export default CosmosIntro;
