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
  const [bgType, setBgType] = useState(
    "uyuni && sphere && stars && cubes && dots",
  );
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

  // Close dropdown when clicking outside
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

    // Handle both standard and Japanese full-width spaces
    const normalizedCmd = fullCmd.replace(/ /g, " ");
    const cmd = normalizedCmd.toLowerCase();
    const args = cmd.split(/\s+/);
    const baseCmd = args[0];

    setCommandHistory((prev) => [...prev, `$ ${fullCmd}`]);
    setPrevCommands((prev) => [fullCmd, ...prev]);
    setHistoryIndex(-1);

    switch (baseCmd) {
      case "help":
        setCommandHistory((prev) => [
          ...prev,
          "Available commands: help, cd [page], ls [-a], pwd, echo [text], lang [code], uname [-a], whoami, fastfetch, cat [file], ssh, theme [name], bg [type], clear, date, sl, cmatrix, coffee, skills, contact, history, sudo pacman, exit, secret",
        ]);
        break;
      case "lang": {
        const newLang = args[1];
        const supported = ["en", "ja", "fr", "de", "zh", "ko", "it"];
        if (supported.includes(newLang)) {
          setLanguage(newLang);
          setCommandHistory((prev) => [
            ...prev,
            `System locale changed to ${newLang}_${newLang === "ja" ? "JP" : newLang.toUpperCase()}.UTF-8`,
          ]);
        } else {
          setCommandHistory((prev) => [
            ...prev,
            "Usage: lang [en|ja|fr|de|zh|ko|it]",
            "Supported locales: en_US, ja_JP, fr_FR, de_DE, zh_CN, ko_KR, it_IT",
          ]);
        }
        break;
      }
      case "cmatrix":
        setTheme("matrix");
        setCommandHistory((prev) => [
          ...prev,
          "Wake up, Neo...",
          "The Matrix has you...",
          "Follow the white rabbit.",
        ]);
        break;
      case "coffee":
        setCommandHistory((prev) => [
          ...prev,
          "    (  )   (  )",
          "     ) (    ) (",
          "   ___________",
          "  |           | )",
          "  |  COFFEE   | |",
          "  |           | )",
          "  |___________|/",
          "Freshly brewed British tea (or coffee) is served!",
        ]);
        break;
      case "bg": {
        const fullArg = args.slice(1).join(" ");
        if (!fullArg) {
          setCommandHistory((prev) => [
            ...prev,
            "Usage: bg [type1] && [type2] ...",
            "Available types: uyuni, summer-sky, grid, stars, cubes, torus, waves, sphere, dots, rain, tunnel, none",
          ]);
          break;
        }

        const requestedTypes = fullArg.split("&&").map((t) => t.trim());
        const validTypes = [
          "uyuni",
          "summer-sky",
          "grid",
          "stars",
          "cubes",
          "grid-cubes",
          "torus",
          "waves",
          "sphere",
          "dots",
          "rain",
          "tunnel",
          "none",
        ];

        const allValid = requestedTypes.every((t) => validTypes.includes(t));

        if (allValid) {
          setBgType(fullArg);
          setCommandHistory((prev) => [
            ...prev,
            `Background set to: ${requestedTypes.join(" + ")}`,
          ]);
        } else {
          setCommandHistory((prev) => [
            ...prev,
            "Invalid type detected.",
            "Valid types: uyuni, summer-sky, grid, stars, cubes, torus, waves, sphere, dots, rain, tunnel, none",
          ]);
        }
        break;
      }
      case "uname":
        if (args[1] === "-a") {
          setCommandHistory((prev) => [
            ...prev,
            "Linux tatsuya-dev 6.18.33-1-lts #1 SMP PREEMPT_DYNAMIC Thu, 22 May 2026 12:00:00 +0000 x86_64 GNU/Linux",
          ]);
        } else {
          setCommandHistory((prev) => [...prev, "Linux"]);
        }
        break;
      case "exit":
        setCommandHistory((prev) => [
          ...prev,
          "Session ended. Refresh to restart.",
        ]);
        break;
      case "whoami":
        setCommandHistory((prev) => [...prev, `${t.name} - ${t.role}`]);
        break;
      case "ls":
        if (args[1] === "-a") {
          setCommandHistory((prev) => [
            ...prev,
            ".  ..  .secret_vault  home/  skills/  projects/  experience/  research/  contact/  bio.txt  skills.json  education.md  awards.md  publications.md",
          ]);
        } else {
          setCommandHistory((prev) => [
            ...prev,
            "home/  skills/  projects/  experience/  research/  contact/  bio.txt  skills.json  education.md  awards.md  publications.md",
          ]);
        }
        break;
      case "cd": {
        let path = args[1] || "";
        // Clean up path: remove trailing slash, handle ~/ or /
        path = path.replace(/\/$/, "").replace(/^~\//, "").replace(/^\//, "");

        if (path === "" || path === "~" || path === "home") {
          setCurrentPage("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCommandHistory((prev) => [...prev, "Changed directory to ~/home"]);
        } else if (path === "projects") {
          setCurrentPage("projects");
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCommandHistory((prev) => [
            ...prev,
            "Changed directory to ~/projects",
          ]);
        } else if (path === "skills") {
          setCurrentPage("skills");
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCommandHistory((prev) => [
            ...prev,
            "Changed directory to ~/skills",
          ]);
        } else if (path === "contact") {
          setCurrentPage("contact");
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCommandHistory((prev) => [
            ...prev,
            "Changed directory to ~/contact",
          ]);
        } else if (path === "experience") {
          setCurrentPage("experience");
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCommandHistory((prev) => [
            ...prev,
            "Changed directory to ~/experience",
          ]);
        } else if (path === "research") {
          setCurrentPage("research");
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCommandHistory((prev) => [
            ...prev,
            "Changed directory to ~/research",
          ]);
        } else {
          setCommandHistory((prev) => [
            ...prev,
            `cd: no such directory: ${args[1]}`,
          ]);
        }
        break;
      }
      case "cat": {
        const file = args[1];
        if (file === "bio.txt") {
          setCommandHistory((prev) => [...prev, t.bio]);
        } else if (file === ".secret_vault") {
          setCommandHistory((prev) => [
            ...prev,
            "Congratulations on finding the vault!",
            "Did you know? Essex is one of the top research universities in the UK.",
            "Always keep exploring. Cheers! 🇬🇧",
          ]);
        } else if (file === "skills.json") {
          setCommandHistory((prev) => [
            ...prev,
            JSON.stringify(t.skills, null, 2),
          ]);
        } else if (file === "education.md") {
          const eduStr =
            t.education
              ?.map((e) => `- ${e.degree} @ ${e.institution} (${e.period})`)
              .join("\n") || "No education records.";
          setCommandHistory((prev) => [...prev, eduStr]);
        } else if (file === "awards.md") {
          const awardStr =
            t.awards
              ?.map((a) => `- ${a.title} (${a.date}): ${a.desc}`)
              .join("\n") || "No award records.";
          setCommandHistory((prev) => [...prev, awardStr]);
        } else if (file === "publications.md") {
          const pubStr =
            t.publications?.map((p) => `- ${p.title} (${p.year})`).join("\n") ||
            "No publication records.";
          setCommandHistory((prev) => [...prev, pubStr]);
        } else if (file?.startsWith("research/")) {
          const researchTitle = file
            .replace("research/", "")
            .replace(".md", "")
            .replace(/"/g, "");
          const research = t.research?.find((r) => r.title === researchTitle);
          if (research) {
            setCommandHistory((prev) => [...prev, research.desc]);
          } else {
            setCommandHistory((prev) => [
              ...prev,
              `cat: ${file}: No such file or directory`,
            ]);
          }
        } else if (!file) {
          setCommandHistory((prev) => [...prev, "cat: missing operand"]);
        } else {
          setCommandHistory((prev) => [
            ...prev,
            `cat: ${file}: No such file or directory`,
          ]);
        }
        break;
      }
      case "fastfetch":
        setCommandHistory((prev) => [
          ...prev,
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
        ]);
        break;
      case "ssh":
        if (args[1] === "contact@tatsuya") {
          setCommandHistory((prev) =>
            [
              ...prev,
              `GitHub: ${t.contact.github}`,
              `LinkedIn: ${t.contact.LinkedIn}`,
              `Email: ${t.contact.email}`,
              t.contact.orcid ? `ORCID: ${t.contact.orcid}` : "",
            ].filter(Boolean),
          );
        } else {
          setCommandHistory((prev) => [...prev, "ssh: connection refused"]);
        }
        break;
      case "theme": {
        const newTheme = args[1];
        if (["tokyo", "matrix", "dracula"].includes(newTheme)) {
          setTheme(newTheme);
          setCommandHistory((prev) => [
            ...prev,
            `Theme changed to ${newTheme}`,
          ]);
        } else {
          setCommandHistory((prev) => [
            ...prev,
            "Available themes: tokyo, matrix, dracula",
          ]);
        }
        break;
      }
      case "clear":
        setCommandHistory([]);
        break;
      case "date":
        setCommandHistory((prev) => [...prev, new Date().toString()]);
        break;
      case "secret":
        setCommandHistory((prev) => [
          ...prev,
          "🔓 Achievement Unlocked: Terminal Master! ",
        ]);
        break;
      case "skills":
        setCurrentPage("skills");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setCommandHistory((prev) => [...prev, "Navigating to skills..."]);
        break;
      case "contact":
        setCurrentPage("contact");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setCommandHistory((prev) => [...prev, "Navigating to contact..."]);
        break;
      case "history":
        setCommandHistory((prev) => [...prev, ...[...prevCommands].reverse()]);
        break;
      case "pwd":
        setCommandHistory((prev) => [...prev, `/home/tatsuya/${currentPage}`]);
        break;
      case "echo":
        setCommandHistory((prev) => [...prev, args.slice(1).join(" ")]);
        break;
      case "sl":
        setIsSlRunning(true);
        setTimeout(() => setIsSlRunning(false), 4000);
        break;
      case "sudo":
        if (cmd === "sudo rm -rf /") {
          setCommandHistory((prev) => [
            ...prev,
            "Steady on! You can't just delete the entire mainframe, mate.",
            "That's not very British of you. How about a cup of tea instead? ☕",
          ]);
        } else if (cmd.includes("pacman")) {
          if (cmd.includes("-syu")) {
            setCommandHistory((prev) => [
              ...prev,
              ":: Synchronizing package databases...",
              " core                 160.2 KiB   435 KiB/s 00:00 [######################] 100%",
              " extra               1012.4 KiB  2.50 MiB/s 00:00 [######################] 100%",
              ":: Starting full system upgrade...",
              " resolving dependencies...",
              " looking for conflicting packages...",
              " there is nothing to do",
              "☕ Everything is up to date. Arch is life.",
            ]);
          } else if (cmd.includes("-s ")) {
            const pkg = args[args.length - 1];
            setCommandHistory((prev) => [
              ...prev,
              `resolving dependencies...`,
              `looking for conflicting packages...`,
              `Packages (1) ${pkg}-1.0.0-1`,
              `Total Installed Size:  0.05 MiB`,
              `:: Proceed with installation? [Y/n] y`,
              `(1/1) installing ${pkg}                             [######################] 100%`,
              `:: Running post-transaction hooks...`,
              `(1/1) Arming ConditionNeedsUpdate...`,
            ]);
          } else {
            setCommandHistory((prev) => [
              ...prev,
              "error: no operation specified (use -h for help)",
            ]);
          }
        } else {
          setCommandHistory((prev) => [...prev, "sudo: permission denied"]);
        }
        break;
      default:
        setCommandHistory((prev) => [...prev, `command not found: ${baseCmd}`]);
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
      <Background type={bgType} />
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
