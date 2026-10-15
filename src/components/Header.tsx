import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AppButton from "./AppButton";
import { AppIcon } from "./AppIcon";
import { particleBridge } from "../utils/particleBridge";
import { cn } from "../utils/cn";
import { scrollTo, stopScroll, startScroll } from "../utils/lenis";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface NavItem {
  id: string;
  label: string;
  number: string;
  description: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: "about", label: "About Me", number: "01", description: "Background & Architecture" },
  { id: "skills", label: "Skills", number: "02", description: "Tech Stack & Specialties" },
  { id: "experience", label: "Work Experience", number: "03", description: "Roles & Achievements" },
  { id: "contact", label: "Contact", number: "04", description: "Let's Get In Touch" },
] as const;

export default function Header() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const togglerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [clipOrigin, setClipOrigin] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  const updateClipOrigin = () => {
    if (togglerRef.current) {
      const rect = togglerRef.current.getBoundingClientRect();
      setClipOrigin({
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      });
    }
  };

  useEffect(() => {
    updateClipOrigin();
    window.addEventListener("resize", updateClipOrigin, { passive: true });
    return () => window.removeEventListener("resize", updateClipOrigin);
  }, []);

  const handleToggleMenu = () => {
    updateClipOrigin();
    setIsMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        stopScroll();
      } else {
        startScroll();
      }
      return next;
    });
  };

  // Kinetic GSAP stagger entrance and exit for mobile menu elements
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (isMobileMenuOpen) {
        if (prefersReducedMotion) {
          gsap.set(".mobile-menu-anim", { opacity: 1, y: 0, scale: 1, filter: "none" });
          return;
        }

        gsap.killTweensOf(".mobile-menu-anim");
        gsap.fromTo(
          ".mobile-menu-anim",
          {
            opacity: 0,
            y: 28,
            scale: 0.94,
            filter: "blur(6px)",
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.46,
            ease: "back.out(1.4)",
            stagger: 0.065,
            delay: 0.12, // Synchronized with circular clip-path expansion
            clearProps: "filter",
          }
        );
      } else {
        if (prefersReducedMotion) {
          gsap.set(".mobile-menu-anim", { opacity: 0 });
          return;
        }

        gsap.killTweensOf(".mobile-menu-anim");
        gsap.to(".mobile-menu-anim", {
          opacity: 0,
          y: -12,
          scale: 0.97,
          duration: 0.2,
          ease: "power2.in",
          stagger: 0.02,
        });
      }
    },
    { dependencies: [isMobileMenuOpen], scope: menuRef }
  );

  useEffect(() => {
    const handleScroll = () => {
      const headerThreshold = 75;
      const aboutSt = ScrollTrigger.getById("about-timeline");
      const aboutStart = aboutSt ? aboutSt.start : 850;

      // 1. When at or near the top of the page (Hero section before About portal expansion)
      if (window.scrollY < aboutStart) {
        setActiveSection("hero");
        return;
      }

      // 2. Check pinned / scrubbed sections via ScrollTrigger
      const expSt = ScrollTrigger.getById("experience-timeline");
      const skillsSt = ScrollTrigger.getById("skills-timeline");
      const contactSt = ScrollTrigger.getById("contact-timeline");

      if (contactSt && window.scrollY >= contactSt.start) {
        setActiveSection("contact");
        return;
      }

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

      // 3. Fallback for mobile and natural scroll sections
      const contactEl = document.getElementById("contact");
      if (contactEl) {
        const cRect = contactEl.getBoundingClientRect();
        if (cRect.top <= headerThreshold + 150) {
          setActiveSection("contact");
          return;
        }
      }

      const sections = document.querySelectorAll<HTMLElement>("section[id]");
      let current = "hero";

      for (const section of sections) {
        // Skip #about if scroll position hasn't crossed the portal threshold into Overview
        if (section.id === "about" && window.scrollY < aboutStart) {
          continue;
        }
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

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsMobileMenuOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileMenuOpen]);

  // Auto-close mobile menu if viewport expands beyond mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavAction = (targetId: string) => {
    if (targetId === "hero") {
      scrollTo(0, { duration: 1.2 });
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
        scrollTo(targetScroll, { duration: 1.2 });
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
        scrollTo(targetScroll, { duration: 1.2 });
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
        scrollTo(aboutSt.start, { duration: 1.2 });
        return;
      }
    }
    if (targetId === "contact") {
      particleBridge.isDarkActive = true;
      particleBridge.overviewProgress = 1.0;
      particleBridge.skillsProgress = 0.0;
      particleBridge.experienceProgress = 0.0;
      particleBridge.contactProgress = 1.0;
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        const contactEl = document.getElementById("contact");
        if (contactEl) {
          const targetTop = contactEl.getBoundingClientRect().top + window.scrollY;
          scrollTo(targetTop, { duration: 1.2 });
          return;
        }
      }
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      scrollTo(scrollMax, { duration: 1.2 });
      return;
    }
    const el = document.getElementById(targetId);
    if (el) {
      scrollTo(el, { duration: 1.2 });
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    handleNavAction(targetId);
  };

  const handleMobileNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    document.body.style.overflow = "";
    startScroll();
    setIsMobileMenuOpen(false);
    requestAnimationFrame(() => {
      handleNavAction(targetId);
    });
  };

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isMobileMenuOpen) {
      document.body.style.overflow = "";
      setIsMobileMenuOpen(false);
    }
    requestAnimationFrame(() => {
      handleNavAction("hero");
    });
  };

  return (
    <>
      <header className="nav-bar fixed top-0 left-0 right-0 z-[70] w-full px-5 sm:px-8 md:px-12 py-4 bg-transparent pointer-events-none transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Monogram & Name */}
          <a
            href="#"
            onClick={handleBrandClick}
            className="flex items-center gap-3 group cursor-pointer relative z-50 select-none pointer-events-auto"
          >
            <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background font-bold text-base shadow-md shadow-primary/20 group-hover:scale-105 group-hover:shadow-primary/40 transition-all duration-200">
              <span>US</span>
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base tracking-tight leading-tight text-foreground">
                Umair Shahid
              </span>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wider leading-tight text-primary">
                Full-Stack Developer
              </span>
            </div>
          </a>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Desktop Navigation Links */}
            <nav className="hidden sm:flex items-center gap-4 md:gap-6 text-xs uppercase tracking-wider md:tracking-widest font-sans font-medium text-primary/90 pointer-events-auto">
              <a
                href="#about"
                onClick={(e) => handleNavClick(e, "about")}
                className={cn(
                  "transition-colors cursor-pointer py-1 whitespace-nowrap",
                  activeSection === "about"
                    ? "text-foreground font-medium"
                    : "text-primary/80 hover:text-foreground"
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
                    ? "text-foreground font-medium"
                    : "text-primary/80 hover:text-foreground"
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
                    ? "text-foreground font-medium"
                    : "text-primary/80 hover:text-foreground"
                )}
              >
                Work Experience
              </a>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "contact")}
                className={cn(
                  "transition-colors cursor-pointer py-1 whitespace-nowrap",
                  activeSection === "contact"
                    ? "text-foreground font-medium"
                    : "text-primary/80 hover:text-foreground"
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
                className="!text-primary !border-primary/30 hover:!text-foreground hover:!border-primary/60"
              >
                Resume
              </AppButton>
            </nav>

            {/* Mobile Hamburger / Close Morph Button */}
            <button
              ref={togglerRef}
              type="button"
              onClick={handleToggleMenu}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-menu"
              className={cn(
                "sm:hidden relative z-50 w-11 h-11 rounded-xl bg-surface border active:scale-95 transition-all duration-300 flex flex-col items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-lg backdrop-blur-md cursor-pointer pointer-events-auto",
                isMobileMenuOpen
                  ? "border-primary/40 shadow-primary/15"
                  : "border-foreground/15 hover:border-primary/40"
              )}
            >
              <span
                className={cn(
                  "w-5 h-[2px] rounded-full bg-foreground transition-all duration-300 origin-center",
                  isMobileMenuOpen && "translate-y-[8px] rotate-45 bg-primary"
                )}
              />
              <span
                className={cn(
                  "w-5 h-[2px] rounded-full bg-foreground transition-all duration-200",
                  isMobileMenuOpen && "opacity-0 scale-x-0"
                )}
              />
              <span
                className={cn(
                  "w-5 h-[2px] rounded-full bg-foreground transition-all duration-300 origin-center",
                  isMobileMenuOpen && "-translate-y-[8px] -rotate-45 bg-primary"
                )}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay — extends directly from toggler button's background */}
      <div
        ref={menuRef}
        id="mobile-nav-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        style={{
          clipPath: isMobileMenuOpen
            ? `circle(160% at ${clipOrigin.x !== null ? `${clipOrigin.x}px` : "calc(100% - 42px)"} ${clipOrigin.y !== null ? `${clipOrigin.y}px` : "38px"})`
            : `circle(0px at ${clipOrigin.x !== null ? `${clipOrigin.x}px` : "calc(100% - 42px)"} ${clipOrigin.y !== null ? `${clipOrigin.y}px` : "38px"})`,
          WebkitClipPath: isMobileMenuOpen
            ? `circle(160% at ${clipOrigin.x !== null ? `${clipOrigin.x}px` : "calc(100% - 42px)"} ${clipOrigin.y !== null ? `${clipOrigin.y}px` : "38px"})`
            : `circle(0px at ${clipOrigin.x !== null ? `${clipOrigin.x}px` : "calc(100% - 42px)"} ${clipOrigin.y !== null ? `${clipOrigin.y}px` : "38px"})`,
          transition: isMobileMenuOpen
            ? "clip-path 0.58s cubic-bezier(0.76, 0, 0.24, 1), -webkit-clip-path 0.58s cubic-bezier(0.76, 0, 0.24, 1)"
            : "clip-path 0.45s cubic-bezier(0.76, 0, 0.24, 1), -webkit-clip-path 0.45s cubic-bezier(0.76, 0, 0.24, 1)",
        }}
        className={cn(
          "fixed inset-0 z-[60] bg-surface text-foreground backdrop-blur-3xl sm:hidden flex flex-col justify-between overflow-y-auto px-5 pt-24 pb-8 overscroll-contain will-change-[clip-path]",
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Ambient Celestial Glow Orbs inside the expanding menu */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-primary/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-tertiary/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Navigation Items List */}
        <div className="relative z-10 flex flex-col gap-2.5 pt-2">
          <div className="mobile-menu-anim opacity-0 text-[11px] font-mono uppercase tracking-widest text-primary/60 px-2 pb-1 will-change-transform">
            Navigation Menu
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleMobileNavClick(e, item.id)}
                className={cn(
                  "mobile-menu-anim opacity-0 group relative flex items-center justify-between p-3.5 rounded-2xl border select-none will-change-transform",
                  isActive
                    ? "bg-background/70 border-primary/50 shadow-lg shadow-primary/10 text-foreground"
                    : "bg-background/30 border-foreground/10 hover:bg-background/50 hover:border-primary/30 text-foreground/80 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={cn(
                      "font-mono text-[11px] px-2 py-0.5 rounded-md border transition-colors",
                      isActive
                        ? "border-primary/50 text-primary bg-primary/15 font-semibold"
                        : "border-foreground/10 text-primary/60 bg-white/[0.02]"
                    )}
                  >
                    {item.number}
                  </span>
                  <div className="flex flex-col text-left">
                    <span
                      className={cn(
                        "font-heading text-lg font-semibold tracking-tight leading-snug transition-colors",
                        isActive ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="text-[11px] font-sans text-primary/70 leading-tight">
                      {item.description}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}

          {/* Mobile Resume Action Button with Signature Ripple Effect */}
          <div className="mobile-menu-anim opacity-0 pt-2 will-change-transform">
            <AppButton
              href="/Resume.pdf"
              target="_blank"
              variant="primary"
              size="md"
              icon="external-link"
              iconPosition="right"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full !rounded-2xl !py-3.5 shadow-lg shadow-primary/20 text-xs font-semibold uppercase tracking-widest"
            >
              View Resume
            </AppButton>
          </div>
        </div>

        {/* Quick Contact Footer */}
        <div className="mobile-menu-anim opacity-0 relative z-10 pt-5 mt-6 border-t border-foreground/10 flex flex-col gap-2.5 text-xs font-sans text-primary/85 will-change-transform">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="mailto:shahidumair622@gmail.com"
              className="flex items-center gap-2 hover:text-foreground transition-colors py-1 group min-w-0"
            >
              <AppIcon icon="mail" className="w-3.5 h-3.5 text-primary shrink-0 group-hover:text-foreground transition-colors" />
              <span className="truncate text-foreground/90 group-hover:text-foreground font-medium">
                shahidumair622@gmail.com
              </span>
            </a>

            <a
              href="tel:+923215215701"
              className="flex items-center gap-2 hover:text-foreground transition-colors py-1 group shrink-0"
            >
              <AppIcon icon="phone" className="w-3.5 h-3.5 text-primary shrink-0 group-hover:text-foreground transition-colors" />
              <span className="text-foreground/90 group-hover:text-foreground font-medium">
                +92-321-5215701
              </span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
