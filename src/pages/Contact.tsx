import React from "react";
import { useLanguage } from "../hooks/useLanguage";
import Typewriter from "../components/Typewriter";

const Contact: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="page-contact">
      <p>
        <span className="prompt">$</span>{" "}
        <Typewriter text="finger tatsuya" speed={30} />
      </p>
      <div className="terminal-status-info">
        <p>
          <Typewriter
            text={`Login: tatsuya          Name: ${t.name}`}
            delay={500}
          />
        </p>
        <p>
          <Typewriter text={`Role: ${t.role}`} delay={800} />
        </p>
        <p>
          <Typewriter
            text="Location: Colchester, UK / Tokyo, JP"
            delay={1100}
          />
        </p>
        <p>
          <Typewriter
            text="--------------------------------------------------"
            delay={1300}
          />
        </p>

        <div className="status-links">
          <p>
            <span className="status-label">
              <Typewriter text="GITHUB:" delay={1500} />
            </span>
            <a href={t.contact.github} target="_blank" rel="noreferrer">
              <Typewriter
                text={t.contact.github.replace("https://", "")}
                delay={1800}
              />
            </a>
          </p>
          <p>
            <span className="status-label">
              <Typewriter text="LINKEDIN:" delay={2000} />
            </span>
            <a href={t.contact.LinkedIn} target="_blank" rel="noreferrer">
              <Typewriter
                text="linkedin.com/in/tatsuya-miura-1bb48339a/"
                delay={2300}
              />
            </a>
          </p>
          <p>
            <span className="status-label">
              <Typewriter text="EMAIL:" delay={2500} />
            </span>
            <a href={`mailto:${t.contact.email}`}>
              <Typewriter text={t.contact.email} delay={2800} />
            </a>
          </p>
          {t.contact.orcid && (
            <p>
              <span className="status-label">
                <Typewriter text="ORCID:" delay={3000} />
              </span>
              <a href={t.contact.orcid} target="_blank" rel="noreferrer">
                <Typewriter
                  text={t.contact.orcid.replace("https://orcid.org/", "")}
                  delay={3300}
                />
              </a>
            </p>
          )}
        </div>

        <p>
          <Typewriter
            text="--------------------------------------------------"
            delay={3500}
          />
        </p>
        <p>
          <Typewriter
            text="Status: Available for interesting projects."
            delay={3800}
          />
        </p>
        <p>
          <Typewriter
            text="Plan: Graduate from Essex with first-class honours."
            delay={4100}
          />
        </p>
      </div>
    </div>
  );
};

export default Contact;
