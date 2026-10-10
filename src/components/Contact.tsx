import React, { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";
import AppButton from "./AppButton";
import { AppIcon } from "./AppIcon";
import AppInput from "./AppInput";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const rightCol = rightColRef.current;
      if (!section) return;

      const existingSt = ScrollTrigger.getById("contact-timeline");
      if (existingSt) {
        existingSt.kill(true);
      }
      const existingLead = ScrollTrigger.getById("contact-particle-lead-in");
      if (existingLead) {
        existingLead.kill(true);
      }

      // Lead-in trigger: morph particles as contact section enters viewport
      ScrollTrigger.create({
        id: "contact-particle-lead-in",
        trigger: section,
        start: "top 80%",
        end: "top top",
        scrub: 0.8,
        onEnter: () => {
          particleBridge.isDarkActive = true;
        },
        onLeaveBack: () => {
          particleBridge.contactProgress = 0.0;
        },
        onUpdate: (self) => {
          particleBridge.contactProgress = self.progress;
          particleBridge.isDarkActive = true;
        },
      });

      const isDesktop = window.innerWidth >= 1024;

      if (isDesktop && rightCol) {
        // Desktop pinned scroll:
        // Left side ("Let's Get In Touch" + contact cards) stays stuck in place
        // Right side (Contact Form) scrolls up into the center of the screen
        gsap.set(rightCol, { y: 440, opacity: 0.25 });

        const tl = gsap.timeline({
          scrollTrigger: {
            id: "contact-timeline",
            trigger: section,
            start: "top top",
            end: "+=1200",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onEnter: () => {
              particleBridge.isDarkActive = true;
              particleBridge.contactProgress = 1.0;
            },
            onEnterBack: () => {
              particleBridge.isDarkActive = true;
              particleBridge.contactProgress = 1.0;
            },
            onLeaveBack: () => {
              particleBridge.contactProgress = 0.0;
            },
            onUpdate: () => {
              particleBridge.isDarkActive = true;
              particleBridge.contactProgress = 1.0;
            },
          },
        });

        tl.to(rightCol, {
          y: 0,
          opacity: 1,
          ease: "power1.out",
        });
      }
    },
    { scope: sectionRef }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate async submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSuccess(true);
    setFormData({ fullName: "", email: "", message: "" });
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative w-full min-h-screen px-5 sm:px-8 md:px-12 bg-transparent text-earth-cream overflow-hidden flex items-center justify-center py-10 lg:py-0"
    >
      {/* Ambient background glows */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-earth-moss/10 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 -right-32 w-96 h-96 rounded-full bg-earth-sand/10 blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto relative z-10">      

        {/* Two-Column Grid: Left (Stuck 3D Particle Text & Contact Cards) & Right (Scrolling Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left Column: Stuck at the left side */}
          <div className="w-full flex flex-col justify-center items-center lg:items-start relative z-10 space-y-4 sm:space-y-6">
            {/* Upper Area: Reserved space for 3D particles "Let's Get In Touch" */}
            <div
              className="w-full min-h-[210px] sm:min-h-[220px] lg:min-h-[220px] flex items-center justify-center relative pointer-events-none"
              aria-label="Let's Get in touch particle text area"
            >
              {/* The 3D CharacterPointsCanvas renders "Let's Get in touch" right here */}
            </div>

            {/* Email & Phone Contact Information */}
            <div className="w-full flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-3.5 max-w-md pointer-events-auto">
              {/* Email */}
              <a
                href="mailto:shahidumair622@gmail.com"
                className="group flex items-center justify-between gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-earth-card/80 hover:bg-earth-card border border-earth-cream/10 hover:border-earth-sand/40 transition-all duration-300 shadow-md hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-earth-sand/15 group-hover:bg-earth-sand/25 border border-earth-sand/30 flex items-center justify-center text-earth-sand transition-all shrink-0">
                    <AppIcon icon="mail" className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-earth-sand/80">
                      Email
                    </span>
                    <span className="text-sm sm:text-base font-medium text-earth-cream group-hover:text-earth-sand transition-colors truncate">
                      shahidumair622@gmail.com
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-earth-sand pr-1 shrink-0">
                  <AppIcon icon="arrow-up-right" className="w-4 h-4" />
                </div>
              </a>

              {/* Phone */}
              <a
                href="tel:+923215215701"
                className="group flex items-center justify-between gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-earth-card/80 hover:bg-earth-card border border-earth-cream/10 hover:border-earth-sand/40 transition-all duration-300 shadow-md hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-earth-sand/15 group-hover:bg-earth-sand/25 border border-earth-sand/30 flex items-center justify-center text-earth-sand transition-all shrink-0">
                    <AppIcon icon="phone" className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-earth-sand/80">
                      Phone
                    </span>
                    <span className="text-sm sm:text-base font-medium text-earth-cream group-hover:text-earth-sand transition-colors truncate">
                      +92-321-5215701
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-earth-sand pr-1 shrink-0">
                  <AppIcon icon="arrow-up-right" className="w-4 h-4" />
                </div>
              </a>
            </div>
          </div>

          {/* Right Column: Contact Form (Scrolls) */}
          <div ref={rightColRef} className="w-full will-change-transform">
            <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-7 md:p-8 bg-earth-card border border-earth-cream/10 shadow-[0_-12px_32px_rgba(0,0,0,0.7),0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden">
              {/* Subtle top golden accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-earth-sand/60 to-transparent pointer-events-none"
                aria-hidden="true"
              />

              {isSuccess ? (
                <div className="py-10 flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-earth-sand/20 border border-earth-sand/40 flex items-center justify-center text-earth-sand shadow-lg shadow-earth-sand/20">
                    <AppIcon icon="check" className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-heading text-earth-cream tracking-tight">
                    Message Sent!
                  </h3>
                  <p className="text-earth-cream/70 text-sm sm:text-base max-w-md font-sans">
                    Thank you for reaching out. Your message has been received, and I'll get back to you as soon as possible.
                  </p>
                  <div className="pt-4">
                    <AppButton
                      variant="outline"
                      size="md"
                      onClick={() => setIsSuccess(false)}
                      className="!border-earth-sand/40 !text-earth-sand hover:!text-earth-cream hover:!border-earth-sand"
                    >
                      Send Another Message
                    </AppButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  
                    <h3 className="text-xl sm:text-2xl font-bold font-heading text-earth-cream tracking-tight mb-1">
                      Send a Message
                    </h3>                    

                  {/* Full Name */}
                  <AppInput
                    id="fullName"
                    name="fullName"
                    label="Full Name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Write Your Full Name"
                    disabled={isSubmitting}
                  />

                  {/* Email */}
                  <AppInput
                    type="email"
                    id="email"
                    name="email"
                    label="Email Address"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Write Your Email"
                    disabled={isSubmitting}
                  />

                  {/* Message */}
                  <AppInput
                    multiline
                    rows={4}
                    id="message"
                    name="message"
                    label="Message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write Anything In Your Mind"
                    disabled={isSubmitting}
                  />

                  {/* Submit Button */}
                  <div className="pt-2">
                    <AppButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSubmitting}
                      icon={isSubmitting ? undefined : "arrow-right"}
                      iconPosition="right"
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting ? "Sending Message..." : "Send Message"}
                    </AppButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
