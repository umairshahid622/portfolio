import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="nav-bar fixed top-0 left-0 right-0 z-40 w-full px-5 sm:px-8 md:px-12 py-4 transition-all duration-300">
      {/* Background blur when scrolled */}
      <div
        className={`absolute inset-0 -z-10 pointer-events-none transition-all duration-300 ${
          isScrolled
            ? "opacity-100 bg-earth-cream/80 dark:bg-earth-forest/85 backdrop-blur-md border-b border-earth-forest/10 dark:border-earth-cream/10 shadow-lg shadow-black/5 dark:shadow-black/20"
            : "opacity-0"
        }`}
      />

      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Monogram & Name */}
        <a href="#" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-earth-terracotta to-earth-moss flex items-center justify-center text-earth-cream font-bold text-base shadow-md shadow-earth-terracotta/20 group-hover:scale-105 group-hover:shadow-earth-terracotta/40 transition-all duration-200">
            <span>US</span>
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base tracking-tight text-earth-forest dark:text-earth-cream leading-tight">
              Umair Shahid
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-earth-moss dark:text-earth-sand leading-tight">
              Full-Stack Developer
            </span>
          </div>
        </a>

        {/* Navigation & Theme Switcher */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden sm:flex items-center gap-6 text-xs uppercase tracking-widest font-mono text-earth-moss dark:text-earth-sand/90">
            <a
              href="#about"
              className="hover:text-earth-forest dark:hover:text-earth-cream transition-colors cursor-pointer py-1"
            >
              About
            </a>
            <a
              href="#projects"
              className="hover:text-earth-forest dark:hover:text-earth-cream transition-colors cursor-pointer py-1"
            >
              Projects
            </a>
            <a
              href="/Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-earth-moss/30 dark:border-earth-sand/30 hover:border-earth-terracotta text-earth-forest dark:text-earth-sand hover:text-earth-terracotta dark:hover:text-earth-cream bg-earth-moss/10 dark:bg-earth-sand/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Resume</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </nav>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-earth-forest/15 dark:border-earth-cream/15 bg-earth-forest/10 dark:bg-earth-forest/60 backdrop-blur-md hover:border-earth-terracotta transition-all shadow-sm active:scale-95 cursor-pointer text-earth-forest dark:text-earth-cream"
          >
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-earth-sand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-earth-terracotta"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
