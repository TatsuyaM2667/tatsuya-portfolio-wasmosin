import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Typewriter from '../components/Typewriter';

const Skills: React.FC = () => {
  const { t } = useLanguage();
  
  const skillCategories = [
    { title: 'languages', items: t.skills.languages },
    { title: 'frontend', items: t.skills.frontend },
    { title: 'backend', items: t.skills.backend },
    { title: 'infrastructure', items: t.skills.Infrastructure },
  ];

  return (
    <div className="page-skills">
      <p><span className="prompt">$</span> <Typewriter text="tree /home/tatsuya/skills" speed={30} /></p>
      <div className="tree-output">
        <p><Typewriter text="skills/" delay={500} /></p>
        {skillCategories.map((cat, i) => (
          <div key={i} className="tree-node">
            <p><Typewriter text={`├── ${cat.title}/`} delay={700 + i * 200} /></p>
            {cat.items.map((skill, j) => (
              <p key={j}>
                <Typewriter 
                  text={`│   ${j === cat.items.length - 1 ? '└──' : '├──'} ${skill}`} 
                  delay={1000 + i * 500 + j * 100} 
                  speed={20}
                />
              </p>
            ))}
            {i === skillCategories.length - 1 ? '' : <p>│</p>}
          </div>
        ))}
        <p><Typewriter text="└── info.txt" delay={3000} /></p>
      </div>
      
      <div style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.8rem' }}>
        <p>
          <Typewriter 
            text={`4 directories, ${skillCategories.reduce((acc, cat) => acc + cat.items.length, 0)} files`} 
            delay={3500} 
          />
        </p>
      </div>
    </div>
  );
};

export default Skills;
