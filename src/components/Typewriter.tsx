import React, { useState, useEffect, useRef } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}

const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 30,
  delay = 0,
  className = "",
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // If this Typewriter is inside an element with class "page-home", start immediately
    if (elementRef.current) {
      let el: HTMLElement | null = elementRef.current;
      while (el) {
        if (el.classList && el.classList.contains("page-home")) {
          setIsStarted(true);
          return;
        }
        el = el.parentElement;
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isStarted) return;

    let timeout: ReturnType<typeof setTimeout>;
    let i = 0;

    const startTyping = () => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        timeout = setTimeout(startTyping, speed);
      }
    };

    const delayTimeout = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(delayTimeout);
      clearTimeout(timeout);
    };
  }, [text, speed, delay, isStarted]);

  return (
    <span ref={elementRef} className={className}>
      {displayedText}
      {isStarted && displayedText.length < text.length && (
        <span className="typing-cursor" />
      )}
    </span>
  );
};

export default Typewriter;
