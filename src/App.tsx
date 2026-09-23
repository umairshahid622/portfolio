import { useTheme } from "./context/ThemeContext";

export default function App() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative px-6 py-16 overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-brand-green)]/15 dark:bg-[var(--color-brand-green)]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--color-brand-orange)]/15 dark:bg-[var(--color-brand-orange)]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Theme Toggle Button */}
      <header className="absolute top-6 right-6 z-20">
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-current/15 bg-white/60 dark:bg-black/30 backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 transition-all text-xs md:text-sm font-medium"
          aria-label="Toggle dark mode"
        >
          <span>{isDark ? "🌙 Dark" : "☀️ Light"}</span>
        </button>
      </header>

      {/* Main Content Card */}
      <div className="relative z-10 max-w-3xl w-full text-center flex flex-col items-center">
        {/* Font badge indicators */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-neutral-200/70 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/60 text-neutral-800 dark:text-neutral-200 backdrop-blur-sm">
            Heading: <strong className="ml-1 font-semibold">Thunder-VF</strong>
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-neutral-200/70 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/60 text-neutral-800 dark:text-neutral-200 backdrop-blur-sm">
            Body: <strong className="ml-1 font-semibold">GeneralSans-Variable</strong>
          </span>
        </div>

        {/* Primary Requested Title */}
        <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black uppercase tracking-[0.1px] leading-none bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent drop-shadow-sm">
          Full Stack Developer
        </h1>

        {/* Primary Requested Subtitle */}
        <p className="mt-4 text-xl sm:text-2xl md:text-3xl text-[var(--paragraph-color)] tracking-wide font-normal max-w-xl">
          lorem ipsom
        </p>

        {/* Heading scale showcase */}
        <div className="mt-16 pt-10 w-full border-t border-neutral-200/60 dark:border-neutral-800/70 flex flex-col gap-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--paragraph-color)] opacity-70">
            Font Scale Preview (h1 — h6 &amp; Body)
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-dashed border-neutral-200 dark:border-neutral-800/60 pb-2">
              <span className="text-xs uppercase tracking-wider text-[var(--paragraph-color)] font-medium">h1 &middot; Thunder</span>
              <h1 className="text-4xl sm:text-5xl">Display Headline</h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-dashed border-neutral-200 dark:border-neutral-800/60 pb-2">
              <span className="text-xs uppercase tracking-wider text-[var(--paragraph-color)] font-medium">h2 &middot; Thunder</span>
              <h2 className="text-3xl sm:text-4xl">Section Heading</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-dashed border-neutral-200 dark:border-neutral-800/60 pb-2">
              <span className="text-xs uppercase tracking-wider text-[var(--paragraph-color)] font-medium">h3 &middot; Thunder</span>
              <h3 className="text-2xl sm:text-3xl">Card Title</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-dashed border-neutral-200 dark:border-neutral-800/60 pb-2">
              <span className="text-xs uppercase tracking-wider text-[var(--paragraph-color)] font-medium">h4 &middot; Thunder</span>
              <h4 className="text-xl sm:text-2xl">Subsection Headline</h4>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-dashed border-neutral-200 dark:border-neutral-800/60 pb-2">
              <span className="text-xs uppercase tracking-wider text-[var(--paragraph-color)] font-medium">h5 &middot; Thunder</span>
              <h5 className="text-lg sm:text-xl">Small Heading</h5>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-dashed border-neutral-200 dark:border-neutral-800/60 pb-2">
              <span className="text-xs uppercase tracking-wider text-[var(--paragraph-color)] font-medium">h6 &middot; Thunder</span>
              <h6 className="text-base sm:text-lg">Micro Heading</h6>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-2">
              <span className="text-xs uppercase tracking-wider text-[var(--paragraph-color)] font-medium">body &middot; General Sans</span>
              <p className="text-sm sm:text-base text-[var(--paragraph-color)] max-w-md">
                General Sans is used for body text, paragraphs, buttons, and inputs, ensuring high legibility and balanced proportions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
