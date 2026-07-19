import React from "react";
import Typewriter from "../components/Typewriter";
import NowPlaying from "../components/NowPlaying";
import { useLanguage } from "../hooks/useLanguage";

const Home: React.FC = () => {
  const { t, language } = useLanguage();

  const archLogo = [
    "                   -`",
    "                  .o+`",
    "                 `ooo/",
    "                `+oooo:",
    "               `+oooooo:",
    "               -+oooooo+:",
    "             `/:-:++oooo+:",
    "            `/++++/+++++++:",
    "           `/++++++++++++++:",
    "          `/+++ooooooooooooo/`",
    "         ./ooosssso++osssssso+`",
    "        .oossssso-````/ossssss+`",
    "       -osssssso.      :ssssssso.",
    "      :osssssss/        osssso+++.",
    "     /ossssssss/        +ssssooo/-",
    "   `/ossssso+/:-        -:/+osssso+-",
    "  `+sso+:-`                 `.-/+oso:",
    " `++:.                           `-/+/",
    " .`                                 `",
  ].join("\n");

  return (
    <div className="page-home" key={language}>
      <div
        style={{
          backgroundColor: "var(--accent-bg)",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          fontSize: "0.8rem",
          marginBottom: "1.5rem",
          border: "1px solid var(--accent-border)",
          color: "var(--accent)",
        }}
      ></div>

      <div
        className="braille-divider"
        style={{
          textAlign: "center",
          fontSize: "0.9rem",
          lineHeight: 1,
          letterSpacing: "2px",
          color: "var(--accent)",
          opacity: 0.4,
          marginBottom: "1.5rem",
          userSelect: "none",
        }}
      >
        ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      </div>
      <div
        className="home-profile"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <img
          src="/favicon.png"
          alt="Avatar"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "2px solid var(--accent)",
          }}
        />
        <div className="profile-info">
          <p>
            <span className="prompt">$</span>
            <Typewriter text="whoami" speed={30} />
          </p>
          <h1 style={{ margin: 0 }}>
            <Typewriter text={t.name} speed={70} delay={300} />
          </h1>
          <p style={{ color: "var(--accent)", fontSize: "1.2rem" }}>
            <Typewriter text={t.role} delay={1000} speed={40} />
          </p>
          <p
            style={{
              fontSize: "0.7rem",
              lineHeight: 1,
              letterSpacing: "1px",
              color: "var(--accent)",
              opacity: 0.5,
              marginTop: "0.3rem",
              userSelect: "none",
            }}
          >
            ⠠⠞⠍
          </p>
        </div>
        <NowPlaying />
      </div>

      <section>
        <p>
          <span className="prompt">$</span>
          <Typewriter text="cat bio.txt" speed={30} delay={1800} />
        </p>
        <p
          style={{ paddingLeft: "1rem", borderLeft: "2px solid var(--border)" }}
        >
          <Typewriter text={t.bio} delay={2200} speed={20} />
        </p>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <p>
          <span className="prompt">$</span>
          <Typewriter text="firstfetch" speed={30} delay={3500} />
        </p>
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <pre
            className="ascii-art"
            style={{
              margin: 0,
              color: "var(--accent)",
              fontSize: "0.85rem",
              lineHeight: 1.2,
            }}
          >
            <Typewriter text={archLogo} delay={3800} speed={2} />
          </pre>
          <div>
            <p>
              <strong>OS</strong>:{" "}
              <Typewriter text="Arch Linux" delay={4000} speed={15} />
            </p>
            <p>
              <strong>Host</strong>:{" "}
              <Typewriter
                text={`${t.name}-IdeaPad Slim 3 14ARP10`}
                delay={4200}
                speed={15}
              />
            </p>
            <p>
              <strong>Kernel</strong>:{" "}
              <Typewriter text="Linux 6.18.33-1-lts" delay={4400} speed={15} />
            </p>
            <p>
              <strong>Shell</strong>:{" "}
              <Typewriter text=" ghostty 1.3.1-arch2" delay={4600} speed={15} />
            </p>
            <p>
              <strong>WM</strong>:{" "}
              <Typewriter text="Hyprland" delay={4600} speed={15} />
            </p>
            <p>
              <strong>Theme</strong>:{" "}
              <Typewriter text="Tokyo Night" delay={4600} speed={15} />
            </p>
            <p>
              <strong>Resolution</strong>:{" "}
              <Typewriter text="1920x1080" delay={4600} speed={15} />
            </p>
            <p>
              <strong>CPU</strong>:{" "}
              <Typewriter
                text="AMD Ryzen 7 7735HS with Radeon Graphics"
                delay={4600}
                speed={15}
              />
            </p>
            <p>
              <strong>GPU</strong>:{" "}
              <Typewriter text="AMD ATI Radeon 680M" delay={4600} speed={15} />
            </p>
          </div>
        </div>
      </section>

      {t.education && (
        <section style={{ marginTop: "2rem" }}>
          <p>
            <span className="prompt">$</span>
            <Typewriter text="cat education.md" speed={30} delay={5000} />
          </p>
          <div style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
            {t.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: "1rem" }}>
                <p style={{ color: "var(--accent)", fontWeight: "bold" }}>
                  <Typewriter
                    text={`> ${edu.degree}`}
                    delay={5500 + index * 300}
                    speed={25}
                  />
                </p>
                <p>
                  <Typewriter
                    text={`${edu.institution} | ${edu.period}`}
                    delay={5800 + index * 300}
                    speed={15}
                  />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {t.awards && (
        <section style={{ marginTop: "2rem" }}>
          <p>
            <span className="prompt">$</span>
            <Typewriter text="cat awards.md" speed={30} delay={7000} />
          </p>
          <div style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
            {t.awards.map((award, index) => (
              <div key={index} style={{ marginBottom: "1rem" }}>
                <p style={{ color: "var(--accent)", fontWeight: "bold" }}>
                  <Typewriter
                    text={`* ${award.title}`}
                    delay={7500 + index * 300}
                    speed={25}
                  />
                </p>
                <p>
                  <Typewriter
                    text={`${award.date}: ${award.desc}`}
                    delay={7800 + index * 300}
                    speed={15}
                  />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {t.publications && (
        <section style={{ marginTop: "2rem" }}>
          <p>
            <span className="prompt">$</span>
            <Typewriter text="cat publications.md" speed={30} delay={8500} />
          </p>
          <div style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
            {t.publications.map((pub, index) => (
              <div key={index} style={{ marginBottom: "1rem" }}>
                <p style={{ color: "var(--accent)", fontWeight: "bold" }}>
                  <Typewriter
                    text={`- ${pub.title}`}
                    delay={9000 + index * 300}
                    speed={25}
                  />
                </p>
                <p>
                  <Typewriter
                    text={`${pub.publisher} (${pub.year})`}
                    delay={9300 + index * 300}
                    speed={15}
                  />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {t.hobbies && (
        <section style={{ marginTop: "2rem" }}>
          <p>
            <span className="prompt">$</span>
            <Typewriter text="ls hobbies/" speed={30} delay={9500} />
          </p>
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.8rem",
            }}
          >
            {t.hobbies.map((hobby, index) => (
              <span key={index} className="skill-tag">
                <Typewriter
                  text={hobby}
                  delay={10000 + index * 200}
                  speed={20}
                />
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
