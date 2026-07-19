import { useState, useEffect, useRef } from "react";
import TerminalWindow from "./components/TerminalWindow";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Experience from "./pages/Experience";
import Research from "./pages/Research";
import Skills from "./pages/Skills";
import Contact from "./pages/Contact";
import Background from "./components/Background";
import Typewriter from "./components/Typewriter";
import PixelDemo from "./components/PixelDemo";
import { useLanguage, LanguageProvider } from "./hooks/useLanguage";
import "./App.css";

type Page =
  | "home"
  | "skills"
  | "projects"
  | "experience"
  | "research"
  | "contact";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [inputValue, setInputValue] = useState("");
  const [theme, setTheme] = useState("tokyo");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [prevCommands, setPrevCommands] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSlRunning, setIsSlRunning] = useState(false);
  const [showPixelDemo, setShowPixelDemo] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to top on mount and page change
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    // Focus input without scrolling after a short delay
    const isMobile = window.innerWidth < 600;
    if (!isMobile) {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    const handleClickOutside = () => setIsLangOpen(false);
    if (isLangOpen) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isLangOpen]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCmd = inputValue.trim();
    if (!fullCmd) return;

    const normalizedCmd = fullCmd.replace(/ /g, " ");
    const cmd = normalizedCmd.toLowerCase();
    const args = cmd.split(/\s+/);
    const baseCmd = args[0];

    setCommandHistory((prev) => [...prev, `$ ${fullCmd}`]);
    setPrevCommands((prev) => [fullCmd, ...prev]);
    setHistoryIndex(-1);

    const pushHistory = (...lines: string[]) =>
      setCommandHistory((prev) => {
        const next = [...prev, ...lines];
        return next.length > 80 ? next.slice(next.length - 80) : next;
      });

    switch (baseCmd) {
      case "help":
        pushHistory(
          "Available commands: help, cd [page], ls [-a], pwd, echo [text], lang [code], uname [-a], whoami, fastfetch, cat [file], ssh, theme [name], clear, date, sl, pixel, cmatrix, coffee, skills, contact, history, sudo pacman, exit, secret",
        );
        break;
      case "lang": {
        const newLang = args[1];
        const supported = ["en", "ja", "fr", "de", "zh", "ko", "it"];
        if (supported.includes(newLang)) {
          setLanguage(newLang);
          pushHistory(
            `System locale changed to ${newLang}_${newLang === "ja" ? "JP" : newLang.toUpperCase()}.UTF-8`,
          );
        } else {
          pushHistory(
            "Usage: lang [en|ja|fr|de|zh|ko|it]",
            "Supported locales: en_US, ja_JP, fr_FR, de_DE, zh_CN, ko_KR, it_IT",
          );
        }
        break;
      }
      case "cmatrix":
        setTheme("matrix");
        pushHistory(
          "Wake up, Neo...",
          "The Matrix has you...",
          "Follow the white rabbit.",
        );
        break;
      case "coffee":
        pushHistory(
          "    (  )   (  )",
          "     ) (    ) (",
          "   ___________",
          "  |           | )",
          "  |  COFFEE   | |",
          "  |           | )",
          "  |___________|/",
          "Freshly brewed British tea (or coffee) is served!",
        );
        break;
      case "bg":
        pushHistory(
          "bg: this portfolio uses WASM/Odin CPU rendering.",
          "Run 'fastfetch' to see the tech stack.",
        );
        break;
      case "uname":
        if (args[1] === "-a") {
          pushHistory(
            "Linux tatsuya-dev 6.18.33-1-lts #1 SMP PREEMPT_DYNAMIC Thu, 22 May 2026 12:00:00 +0000 x86_64 GNU/Linux",
          );
        } else {
          pushHistory("Linux");
        }
        break;
      case "exit":
        pushHistory("Session ended. Refresh to restart.");
        break;
      case "whoami":
        pushHistory(`${t.name} - ${t.role}`);
        break;
      case "ls":
        if (args[1] === "-a") {
          pushHistory(
            ".  ..  .secret_vault  home/  skills/  projects/  experience/  research/  contact/  bio.txt  skills.json  education.md  awards.md  publications.md",
          );
        } else {
          pushHistory(
            "home/  skills/  projects/  experience/  research/  contact/  bio.txt  skills.json  education.md  awards.md  publications.md",
          );
        }
        break;
      case "cd": {
        let path = args[1] || "";
        path = path.replace(/\/$/, "").replace(/^~\//, "").replace(/^\//, "");
        const pages = [
          "home",
          "skills",
          "projects",
          "experience",
          "research",
          "contact",
        ];
        const target = path === "" || path === "~" ? "home" : path;
        if (pages.includes(target)) {
          setCurrentPage(target as Page);
          window.scrollTo({ top: 0, behavior: "smooth" });
          pushHistory(`Changed directory to ~/${target}`);
        } else {
          pushHistory(`cd: no such directory: ${args[1]}`);
        }
        break;
      }
      case "cat": {
        const file = args[1];
        if (file === "bio.txt") {
          pushHistory(t.bio);
        } else if (file === ".secret_vault") {
          pushHistory(
            "Congratulations on finding the vault!",
            "Did you know? Essex is one of the top research universities in the UK.",
            "Always keep exploring. Cheers! 🇬🇧",
          );
        } else if (file === "skills.json") {
          pushHistory(JSON.stringify(t.skills, null, 2));
        } else if (file === "education.md") {
          pushHistory(
            t.education
              ?.map((e) => `- ${e.degree} @ ${e.institution} (${e.period})`)
              .join("\n") || "No education records.",
          );
        } else if (file === "awards.md") {
          pushHistory(
            t.awards
              ?.map((a) => `- ${a.title} (${a.date}): ${a.desc}`)
              .join("\n") || "No award records.",
          );
        } else if (file === "publications.md") {
          pushHistory(
            t.publications?.map((p) => `- ${p.title} (${p.year})`).join("\n") ||
              "No publication records.",
          );
        } else if (file?.startsWith("research/")) {
          const researchTitle = file
            .replace("research/", "")
            .replace(".md", "")
            .replace(/"/g, "");
          const research = t.research?.find((r) => r.title === researchTitle);
          pushHistory(
            research
              ? research.desc
              : `cat: ${file}: No such file or directory`,
          );
        } else if (!file) {
          pushHistory("cat: missing operand");
        } else {
          pushHistory(`cat: ${file}: No such file or directory`);
        }
        break;
      }
      case "fastfetch":
        pushHistory(
          `                   -\``,
          `                  .o+\``,
          `                 \`ooo/                  ${t.name}@dev`,
          `                \`+oooo:                 ${"-".repeat(`${t.name}@dev`.length)}`,
          `               \`+oooooo:                OS: Arch Linux x86_64`,
          `               -+oooooo+:               Host: ${t.name}-IdeaPad Slim 3`,
          `             \`/:-:++oooo+:              Kernel: 6.18.33-1-lts`,
          `            \`/++++/+++++++:             Shell: ghostty 1.3.1-arch2`,
          `           \`/++++++++++++++:            WM: Hyprland`,
          `          \`/+++ooooooooooooo/\`          Theme: Tokyo Night`,
          `         ./ooosssso++osssssso+\`         CPU: AMD Ryzen 7 7735HS with Radeon Graphics (16) @ 4.83`,
          `        .oossssso-\`\`\`\`/ossssss+\`        GPU: AMD ATI Radeon 680M`,
          `       -osssssso.      :ssssssso.`,
          `      :osssssss/        osssso+++.`,
          `     /ossssssss/        +ssssooo/-`,
          `   \`/ossssso+/:-        -:/+osssso+-`,
          `  \`+sso+:-\`                 \`.-/+oso:`,
          ` \`++:.                           \`-/+/`,
          ` .\`                                 \``,
        );
        break;
      case "ssh":
        if (args[1] === "contact@tatsuya") {
          pushHistory(
            `GitHub: ${t.contact.github}`,
            `LinkedIn: ${t.contact.LinkedIn}`,
            `Email: ${t.contact.email}`,
            ...(t.contact.orcid ? [`ORCID: ${t.contact.orcid}`] : []),
          );
        } else {
          pushHistory("ssh: connection refused");
        }
        break;
      case "theme": {
        const newTheme = args[1];
        if (["tokyo", "matrix", "dracula"].includes(newTheme)) {
          setTheme(newTheme);
          pushHistory(`Theme changed to ${newTheme}`);
        } else {
          pushHistory("Available themes: tokyo, matrix, dracula");
        }
        break;
      }
      case "clear":
        setCommandHistory([]);
        break;
      case "date":
        pushHistory(new Date().toString());
        break;
      case "secret":
        pushHistory("🔓 Achievement Unlocked: Terminal Master! ");
        break;
      case "skills":
        setCurrentPage("skills");
        window.scrollTo({ top: 0, behavior: "smooth" });
        pushHistory("Navigating to skills...");
        break;
      case "contact":
        setCurrentPage("contact");
        window.scrollTo({ top: 0, behavior: "smooth" });
        pushHistory("Navigating to contact...");
        break;
      case "history":
        pushHistory(...[...prevCommands].reverse());
        break;
      case "pwd":
        pushHistory(`/home/tatsuya/${currentPage}`);
        break;
      case "echo":
        pushHistory(args.slice(1).join(" "));
        break;
      case "sl":
        setIsSlRunning(true);
        setTimeout(() => setIsSlRunning(false), 4000);
        break;
      case "pixel":
        setShowPixelDemo(true);
        pushHistory(
          "Launching terminal-pixel-animation-react...",
          "Rendering braille unicode pixels via WASM...",
        );
        break;
      case "sudo":
        if (cmd === "sudo rm -rf /") {
          pushHistory(
            "Steady on! You can't just delete the entire mainframe, mate.",
            "That's not very British of you. How about a cup of tea instead? ☕",
          );
        } else if (cmd.includes("pacman")) {
          if (cmd.includes("-syu")) {
            pushHistory(
              ":: Synchronizing package databases...",
              " core                 160.2 KiB   435 KiB/s 00:00 [######################] 100%",
              " extra               1012.4 KiB  2.50 MiB/s 00:00 [######################] 100%",
              ":: Starting full system upgrade...",
              " resolving dependencies...",
              " looking for conflicting packages...",
              " there is nothing to do",
              "☕ Everything is up to date. Arch is life.",
            );
          } else if (cmd.includes("-s ")) {
            const pkg = args[args.length - 1];
            pushHistory(
              `resolving dependencies...`,
              `looking for conflicting packages...`,
              `Packages (1) ${pkg}-1.0.0-1`,
              `Total Installed Size:  0.05 MiB`,
              `:: Proceed with installation? [Y/n] y`,
              `(1/1) installing ${pkg}                             [######################] 100%`,
              `:: Running post-transaction hooks...`,
              `(1/1) Arming ConditionNeedsUpdate...`,
            );
          } else {
            pushHistory("error: no operation specified (use -h for help)");
          }
        } else {
          pushHistory("sudo: permission denied");
        }
        break;
      default:
        pushHistory(`command not found: ${baseCmd}`);
    }

    setInputValue("");

    // Skip auto-focus on mobile to prevent keyboard popup
    const isMobile = window.innerWidth < 600;
    if (!isMobile) {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < prevCommands.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(prevCommands[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(prevCommands[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue("");
      }
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home />;
      case "skills":
        return <Skills />;
      case "projects":
        return <Projects />;
      case "experience":
        return <Experience />;
      case "research":
        return <Research />;
      case "contact":
        return <Contact />;
      default:
        return <Home />;
    }
  };

  const languages = [
    { code: "en", label: "en_US.UTF-8" },
    { code: "ja", label: "ja_JP.UTF-8" },
    { code: "fr", label: "fr_FR.UTF-8" },
    { code: "de", label: "de_DE.UTF-8" },
    { code: "zh", label: "zh_CN.UTF-8" },
    { code: "ko", label: "ko_KR.UTF-8" },
    { code: "it", label: "it_IT.UTF-8" },
  ];

  return (
    <>
      <Background />
      <div
        className="app-container"
        onClick={() =>
          window.innerWidth >= 600 &&
          inputRef.current?.focus({ preventScroll: true })
        }
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            position: "relative",
            zIndex: 1000,
            padding: "0.5rem 0",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <nav className="terminal-nav">
            {[
              "home",
              "skills",
              "projects",
              "experience",
              "research",
              "contact",
            ].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setCurrentPage(p as Page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={currentPage === p ? "active" : ""}
              >
                ~/{p}
              </button>
            ))}
          </nav>

          <div
            className="lang-switcher"
            onClick={(e) => {
              e.stopPropagation();
              setIsLangOpen(!isLangOpen);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "0.75rem",
              fontFamily: "var(--mono)",
              borderRadius: "4px",
              overflow: "visible",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              position: "relative",
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                background: "var(--prompt)",
                color: "#1a1b26",
                padding: "4px 8px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                borderTopLeftRadius: "3px",
                borderBottomLeftRadius: "3px",
              }}
            >
              <span style={{ fontSize: "1rem" }}>🌐</span>
              <span className="lang-label">LANG</span>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "4px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minWidth: window.innerWidth < 450 ? "auto" : "100px",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "var(--text)", fontSize: "0.85rem" }}>
                {languages.find((l) => l.code === language.split("-")[0])
                  ?.label || "en_US.UTF-8"}
              </span>
              <span
                style={{
                  opacity: 0.5,
                  transform: isLangOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              >
                ▾
              </span>
            </div>

            {isLangOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  background: "rgba(26, 27, 38, 0.9)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  padding: "6px",
                  width: "180px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
                  zIndex: 1001,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                  WebkitTransform: "translate3d(0, 0, 0)",
                  transform: "translate3d(0, 0, 0)",
                }}
              >
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLanguage(lang.code);
                      setIsLangOpen(false);
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      color: language.startsWith(lang.code)
                        ? "var(--prompt)"
                        : "var(--text)",
                      background: language.startsWith(lang.code)
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                      transition: "all 0.2s",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.12)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = language.startsWith(
                        lang.code,
                      )
                        ? "rgba(255,255,255,0.08)"
                        : "transparent")
                    }
                  >
                    <span>{lang.label}</span>
                    {language.startsWith(lang.code) && <span>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <TerminalWindow title={`tatsuya@dev: ~/${currentPage}`}>
          {renderPage()}

          {showPixelDemo && (
            <div className="pixel-demo-container" style={{ marginTop: "1.5rem" }}>
              <p style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>
                <span className="prompt">$</span> pixel --render braille --fire
              </p>
              <PixelDemo />
              <p className="pixel-scene-label">
                [braille unicode | 80x64 pixels | 40x16 cells | 30fps]
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                <span
                  style={{
                    color: "var(--text)",
                    opacity: 0.5,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowPixelDemo(false)}
                >
                  [click to close]
                </span>
              </p>
            </div>
          )}

          <div
            style={{
              marginTop: "2rem",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "1rem",
            }}
          >
            <p>
              <span className="prompt">$</span>
              <Typewriter text="ssh contact@tatsuya" speed={30} delay={6000} />
            </p>
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                marginTop: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <a href={t.contact.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={t.contact.LinkedIn} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              {t.contact.orcid && (
                <a href={t.contact.orcid} target="_blank" rel="noreferrer">
                  ORCID
                </a>
              )}
              <a href={`mailto:${t.contact.email}`}>Email</a>
            </div>
          </div>

          <div className="command-history" style={{ marginTop: "2rem" }}>
            {commandHistory.map((line, i) => (
              <p
                key={i}
                style={{
                  color: line.startsWith("$") ? "var(--prompt)" : "var(--text)",
                  margin: "4px 0",
                }}
              >
                {line}
              </p>
            ))}
          </div>

          <form
            onSubmit={handleCommand}
            style={{ display: "flex", marginTop: "1rem", alignItems: "center" }}
          >
            <span className="prompt">$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              autoComplete="off"
              autoCapitalize="none"
              style={{
                background: "none",
                border: "none",
                color: "var(--text)",
                fontFamily: "var(--mono)",
                fontSize: "1rem",
                outline: "none",
                width: "100%",
                marginLeft: "0.5rem",
              }}
            />
          </form>
        </TerminalWindow>

        {isSlRunning && (
          <div className="sl-overlay">
            <pre className="sl-train">
              {`
      ====        ________                ___________
  _D _|  |_ ______|_  ____|_  _________  |_  _______|_
 |   |____| |      |_|    |_| |      |_| |_|       |_|
 |___________|______|______|______|______|___________|
  oo          oo          oo          oo          oo
              `}
            </pre>
          </div>
        )}

        <footer className="terminal-footer">
          <p>
            © 2026 Tatsuya-PortfolioOS v3.0.0 - Built with React && Bun && Hono
          </p>
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
