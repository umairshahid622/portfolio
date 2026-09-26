import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="nav-bar fixed top-0 left-0 right-0 z-50 w-full bg-transparent px-6 md:px-12 py-5 transition-colors duration-300">
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-orange/20">
            U
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-white">
              Umair Shahid
            </span>
            <span className="text-xs text-white/80">
              Creative Technologist
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md hover:bg-white/70 dark:hover:bg-black/60 transition-all shadow-sm active:scale-95 cursor-pointer"
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
                className="w-5 h-5 text-zinc-700"
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
