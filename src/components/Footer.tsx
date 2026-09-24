export default function Footer() {
  return (
    <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--paragraph-color)] py-3 border-t border-black/5 dark:border-white/5 z-10 gap-2">
      <span>© {new Date().getFullYear()} Umair Shahid</span>
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" /> Three.js r179
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> GSAP v3.15
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> React 19
        </span>
      </div>
    </footer>
  );
}
