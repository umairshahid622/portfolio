import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "../context/ThemeContext";
import AppButton from "./AppButton";
import { particleBridge } from "../utils/particleBridge";
import { cn } from "../utils/cn";

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>("hero");

  useEffect(() => {
    const handleScroll = () => {
      const headerThreshold = 75;
      const expSt = ScrollTrigger.getById("experience-timeline");
      const skillsSt = ScrollTrigger.getById("skills-timeline");
      const aboutSt = ScrollTrigger.getById("about-timeline");

      if (expSt && window.scrollY >= expSt.start && window.scrollY <= expSt.end) {
        setActiveSection("experience");
        return;
      }
      if (skillsSt && window.scrollY >= skillsSt.start && window.scrollY <= skillsSt.end) {
        setActiveSection("skills");
        return;
      }
      if (aboutSt && window.scrollY >= aboutSt.start && window.scrollY < aboutSt.end) {
        setActiveSection("about");
        return;
      }

      // Detect which section is currently underneath the navbar
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

  const isOverDarkSection =
    activeSection === "about" ||
    activeSection === "skills" ||
    activeSection === "experience" ||
    activeSection === "contact";

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    if (targetId === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (targetId === "experience") {
      particleBridge.isDarkActive = true;
      particleBridge.overviewProgress = 1.0;
      particleBridge.skillsProgress = 0.0;
      particleBridge.experienceProgress = 1.0;
      particleBridge.experienceTitleYProgress = 1.0;
      const expSt = ScrollTrigger.getById("experience-timeline");
      if (expSt) {
        // Scroll to the assembled Experience position (progress = 0.10) where title is at top and Card 0 is revealed
        const targetScroll = expSt.start + (expSt.end - expSt.start) * 0.10;
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
        return;
      }
    }
    if (targetId === "skills") {
      particleBridge.isDarkActive = true;
      particleBridge.overviewProgress = 1.0;
      particleBridge.skillsProgress = 1.0;
      particleBridge.experienceProgress = 0.0;
      const skillsSt = ScrollTrigger.getById("skills-timeline");
      if (skillsSt) {
        // Scroll directly to the assembled Skills entry point (progress = 0.142)
        // where "SKILLS </>" is fully merged and the cards track is fully revealed
        const targetScroll = skillsSt.start + (skillsSt.end - skillsSt.start) * 0.142;
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
        return;
      }
    }
    if (targetId === "about") {
      particleBridge.isDarkActive = true;
      particleBridge.overviewProgress = 0;
      particleBridge.skillsProgress = 0;
      particleBridge.experienceProgress = 0;
      const aboutSt = ScrollTrigger.getById("about-timeline");
      if (aboutSt) {
        window.scrollTo({
          top: aboutSt.start,
          behavior: "smooth",
        });
        return;
      }
    }
    if (targetId === "contact") {
      particleBridge.isDarkActive = true;
      particleBridge.overviewProgress = 1.0;
      particleBridge.skillsProgress = 0.0;
      particleBridge.experienceProgress = 0.0;
      particleBridge.contactProgress = 1.0;
      const contactTrigger = ScrollTrigger.getById("contact-particle-trigger");
      if (contactTrigger) {
        window.scrollTo({
          top: contactTrigger.end + (window.innerWidth < 640 ? 100 : 0),
          behavior: "smooth",
        });
        return;
      }
      const el = document.getElementById("contact");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="nav-bar fixed top-0 left-0 right-0 z-40 w-full px-5 sm:px-8 md:px-12 py-4 bg-transparent transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Monogram & Name */}
        <a
          href="#"
          onClick={(e) => handleNavClick(e, "hero")}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-earth-terracotta to-earth-moss flex items-center justify-center text-earth-cream font-bold text-base shadow-md shadow-earth-terracotta/20 group-hover:scale-105 group-hover:shadow-earth-terracotta/40 transition-all duration-200">
            <span>US</span>
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                "font-semibold text-sm sm:text-base tracking-tight leading-tight transition-colors duration-300",
                isOverDarkSection ? "text-earth-cream" : "text-earth-forest dark:text-earth-cream"
              )}
            >
              Umair Shahid
            </span>
            <span
              className={cn(
                "text-[11px] font-sans font-medium uppercase tracking-wider leading-tight transition-colors duration-300",
                isOverDarkSection ? "text-earth-sand" : "text-earth-moss dark:text-earth-sand"
              )}
            >
              Full-Stack Developer
            </span>
          </div>
        </a>

        {/* Navigation & Theme Switcher */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav
            className={cn(
              "hidden sm:flex items-center gap-4 md:gap-6 text-xs uppercase tracking-wider md:tracking-widest font-sans font-medium transition-colors duration-300",
              isOverDarkSection ? "text-earth-sand/90" : "text-earth-moss dark:text-earth-sand/90"
            )}
          >
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, "about")}
              className={cn(
                "transition-colors cursor-pointer py-1 whitespace-nowrap",
                activeSection === "about"
                  ? "text-earth-cream font-medium"
                  : isOverDarkSection
                  ? "hover:text-earth-cream"
                  : "hover:text-earth-forest dark:hover:text-earth-cream"
              )}
            >
              About me
            </a>
            <a
              href="#skills"
              onClick={(e) => handleNavClick(e, "skills")}
              className={cn(
                "transition-colors cursor-pointer py-1 whitespace-nowrap",
                activeSection === "skills"
                  ? "text-earth-cream font-medium"
                  : isOverDarkSection
                  ? "hover:text-earth-cream"
                  : "hover:text-earth-forest dark:hover:text-earth-cream"
              )}
            >
              Skills
            </a>
            <a
              href="#experience"
              onClick={(e) => handleNavClick(e, "experience")}
              className={cn(
                "transition-colors cursor-pointer py-1 whitespace-nowrap",
                activeSection === "experience"
                  ? "text-earth-cream font-medium"
                  : isOverDarkSection
                  ? "hover:text-earth-cream"
                  : "hover:text-earth-forest dark:hover:text-earth-cream"
              )}
            >
              Work Experience
            </a>
            <a
              href="#projects"
              onClick={(e) => handleNavClick(e, "projects")}
              className={cn(
                "transition-colors cursor-pointer py-1 whitespace-nowrap",
                activeSection === "projects"
                  ? "text-earth-cream font-medium"
                  : isOverDarkSection
                  ? "hover:text-earth-cream"
                  : "hover:text-earth-forest dark:hover:text-earth-cream"
              )}
            >
              Projects
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className={cn(
                "transition-colors cursor-pointer py-1 whitespace-nowrap",
                activeSection === "contact"
                  ? "text-earth-cream font-medium"
                  : isOverDarkSection
                  ? "hover:text-earth-cream"
                  : "hover:text-earth-forest dark:hover:text-earth-cream"
              )}
            >
              Contact
            </a>
            <AppButton
              href="/Resume.pdf"
              target="_blank"
              variant="outline"
              size="sm"
              icon="external-link"
              iconPosition="right"
              className={cn(
                isOverDarkSection &&
                  "!text-earth-sand !border-earth-sand/30 hover:!text-earth-cream hover:!border-earth-sand/60"
              )}
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
            className={cn(
              isOverDarkSection &&
                "!text-earth-sand hover:!text-earth-cream !bg-white/10 hover:!bg-white/20 !ring-earth-sand/30 hover:!ring-earth-sand/60"
            )}
          />
        </div>
      </div>
    </header>
  );
}
