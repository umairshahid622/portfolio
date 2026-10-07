import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import AppButton from "./AppButton";

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>("hero");

  useEffect(() => {
    const handleScroll = () => {
      // Detect which section is currently underneath the navbar
      const headerThreshold = 75;
      const sections = document.querySelectorAll<HTMLElement>("section[id]");
      let current = "hero";

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= headerThreshold && rect.bottom > headerThreshold) {
          current = section.id;
          break;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const isOverDarkSection = activeSection === "about";

  return (
    <header className="nav-bar fixed top-0 left-0 right-0 z-40 w-full px-5 sm:px-8 md:px-12 py-4 bg-transparent transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Monogram & Name */}
        <a href="#" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-earth-terracotta to-earth-moss flex items-center justify-center text-earth-cream font-bold text-base shadow-md shadow-earth-terracotta/20 group-hover:scale-105 group-hover:shadow-earth-terracotta/40 transition-all duration-200">
            <span>US</span>
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-semibold text-sm sm:text-base tracking-tight leading-tight transition-colors duration-300 ${
                isOverDarkSection
                  ? "text-earth-cream"
                  : "text-earth-forest dark:text-earth-cream"
              }`}
            >
              Umair Shahid
            </span>
            <span
              className={`text-[11px] font-mono uppercase tracking-wider leading-tight transition-colors duration-300 ${
                isOverDarkSection
                  ? "text-earth-sand"
                  : "text-earth-moss dark:text-earth-sand"
              }`}
            >
              Full-Stack Developer
            </span>
          </div>
        </a>

        {/* Navigation & Theme Switcher */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav
            className={`hidden sm:flex items-center gap-6 text-xs uppercase tracking-widest font-mono transition-colors duration-300 ${
              isOverDarkSection
                ? "text-earth-sand/90"
                : "text-earth-moss dark:text-earth-sand/90"
            }`}
          >
            <a
              href="#about"
              className={`transition-colors cursor-pointer py-1 ${
                isOverDarkSection
                  ? "text-earth-cream font-medium"
                  : "hover:text-earth-forest dark:hover:text-earth-cream"
              }`}
            >
              About
            </a>
            <a
              href="#projects"
              className={`transition-colors cursor-pointer py-1 ${
                isOverDarkSection
                  ? "hover:text-earth-cream"
                  : "hover:text-earth-forest dark:hover:text-earth-cream"
              }`}
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
              className={
                isOverDarkSection
                  ? "!text-earth-sand !border-earth-sand/30 hover:!text-earth-cream hover:!border-earth-sand/60"
                  : ""
              }
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
            className={
              isOverDarkSection
                ? "!text-earth-sand hover:!text-earth-cream !bg-white/10 hover:!bg-white/20 !ring-earth-sand/30 hover:!ring-earth-sand/60"
                : ""
            }
          />
        </div>
      </div>
    </header>
  );
}
