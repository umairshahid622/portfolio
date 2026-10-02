import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import AppButton from "./AppButton";

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
            <AppButton
              href="/Resume.pdf"
              target="_blank"
              variant="outline"
              size="sm"
              icon="external-link"
              iconPosition="right"
            >
              Resume
            </AppButton>
          </nav>

          {/* Theme Toggle Button */}
          <AppButton
            variant="icon"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            icon={isDark ? "sun" : "moon"}
            iconClassName={isDark ? "text-earth-sand" : "text-earth-terracotta"}
          />
        </div>
      </div>
    </header>
  );
}
