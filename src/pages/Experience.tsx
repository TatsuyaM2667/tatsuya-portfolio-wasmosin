import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Typewriter from '../components/Typewriter';

const Experience: React.FC = () => {
  const { t, language } = useLanguage();
  
  return (
    <div className="page-experience" key={language}>
      <p>
        <span className="prompt">$</span>
        <Typewriter text="journalctl -u career.service" speed={50} />
      </p>
      <div style={{ paddingLeft: '1rem', marginTop: '1rem' }}>
        {t.experiences.map((exp, idx) => (
          <div key={idx} style={{ marginBottom: '2rem', borderLeft: '2px solid var(--accent)', paddingLeft: '1rem' }}>
            <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>
              <Typewriter text={`[${exp.period}] INFO: ${exp.role}`} delay={800 + idx * 1000} speed={30} />
            </p>
            <p style={{ color: 'var(--text-h)' }}>
              <Typewriter text={`Company: ${exp.company}`} delay={1400 + idx * 1000} speed={30} />
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
              <Typewriter text={exp.desc} delay={2000 + idx * 1000} speed={20} />
            </p>
          </div>
        ))}
      </div>

      <p style={{ marginTop: '3rem' }}>
        <span className="prompt">$</span>
        <Typewriter text="cat skills.json" speed={50} delay={3000} />
      </p>
      <pre style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
        <Typewriter 
          text={JSON.stringify(t.skills, null, 2)} 
          delay={3800} 
          speed={5} 
        />
      </pre>
    </div>
  );
};

export default Experience;
