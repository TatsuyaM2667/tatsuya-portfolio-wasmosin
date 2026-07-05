import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Typewriter from '../components/Typewriter';

const GithubIcon = () => (
  <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor" style={{ verticalAlign: 'middle', marginLeft: '8px' }}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const Projects: React.FC = () => {
  const { t, language } = useLanguage();
  
  return (
    <div className="page-projects" key={language}>
      <p>
        <span className="prompt">$</span>
        <Typewriter text="ls -la ~/projects" speed={50} />
      </p>
      <div style={{ paddingLeft: '1rem', marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.5rem' }}>Permissions</th>
              <th style={{ padding: '0.5rem' }}>Name</th>
              <th style={{ padding: '0.5rem' }}>Tech</th>
            </tr>
          </thead>
          <tbody>
            {t.projects.map((project, idx) => (
              <tr key={project.name} style={{ borderBottom: '1px dotted var(--border)' }}>
                <td style={{ padding: '0.5rem', fontFamily: 'monospace', color: 'var(--success)' }}>
                  <Typewriter text="drwxr-xr-x" delay={800 + idx * 200} speed={10} />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <a href={project.link} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                      <Typewriter text={project.name} delay={1200 + idx * 200} speed={30} />
                      <GithubIcon />
                    </a>
                  </div>
                </td>
                <td style={{ padding: '0.5rem', color: 'var(--accent)', fontSize: '0.8rem' }}>
                  <Typewriter text={project.tech.join(', ')} delay={1600 + idx * 200} speed={20} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {t.projects.map((project, idx) => (
          <div key={`${project.name}-desc`} style={{ marginTop: '2rem' }}>
            <p>
              <span className="prompt">$</span>
              <Typewriter text={`cat ~/projects/${project.name}/README.md`} speed={50} delay={2500 + idx * 1000} />
            </p>
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', marginTop: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <p>
                <Typewriter text={project.desc} delay={3200 + idx * 1000} speed={20} />
              </p>
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                <a href={project.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <GithubIcon />
                  <span>View Repository</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
