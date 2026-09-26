import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="nav-bar fixed top-0 left-0 right-0 z-50 w-full px-6 md:px-12 py-4">
      {/* Background & blur layer with smooth GPU opacity transition (prevents currentColor white border flashing) */}
      <div
        className={`absolute inset-0 -z-10 pointer-events-none transition-opacity duration-300 bg-[var(--background-color)]/70 backdrop-blur-md border-b border-black/5 dark:border-white/5 shadow-sm ${
          isScrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="w-full max-w-6xl mx-auto flex items-center justify-between relative z-10">
        {/* Brand / Logo */}
        <a href="#" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-orange/20 group-hover:scale-105 transition-transform">
            U
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-[var(--text-color)] drop-shadow-sm">
              Umair Shahid
            </span>
            <span className="text-xs text-[var(--paragraph-color)] drop-shadow-sm">
              Creative Technologist
            </span>
          </div>
        </a>

        {/* Navigation Items & Theme Toggle */}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden sm:flex items-center gap-6 text-xs uppercase tracking-wider font-mono text-[var(--paragraph-color)]">
            <a
              href="#overview"
              className="hover:text-brand-orange transition-colors cursor-pointer"
            >
              Overview
            </a>
            <a
              href="/Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-orange transition-colors cursor-pointer"
            >
              Resume
            </a>
          </nav>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md hover:bg-white/70 dark:hover:bg-black/60 transition-all shadow-sm active:scale-95 cursor-pointer text-[var(--text-color)]"
          >
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-brand-orange"
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
                className="w-5 h-5 text-zinc-700 dark:text-zinc-300"
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
