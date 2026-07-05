import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Typewriter from '../components/Typewriter';

const Research: React.FC = () => {
  const { t, language } = useLanguage();
  
  return (
    <div className="page-research" key={language}>
      <p>
        <span className="prompt">$</span>
        <Typewriter text="ls -la ~/research" speed={50} />
      </p>
      <div style={{ paddingLeft: '1rem', marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.5rem' }}>Permissions</th>
              <th style={{ padding: '0.5rem' }}>Topic</th>
            </tr>
          </thead>
          <tbody>
            {t.research?.map((item, idx) => (
              <tr key={item.title} style={{ borderBottom: '1px dotted var(--border)' }}>
                <td style={{ padding: '0.5rem', fontFamily: 'monospace', color: 'var(--success)' }}>
                  <Typewriter text="-rw-r--r--" delay={800 + idx * 200} speed={10} />
                </td>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                  <Typewriter text={item.title} delay={1200 + idx * 200} speed={30} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {t.research?.map((item, idx) => (
          <div key={`${item.title}-desc`} style={{ marginTop: '2rem' }}>
            <p>
              <span className="prompt">$</span>
              <Typewriter text={`cat ~/research/"${item.title}".md`} speed={50} delay={2000 + idx * 1000} />
            </p>
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', marginTop: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <p>
                <Typewriter text={item.desc} delay={2700 + idx * 1000} speed={20} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Research;
