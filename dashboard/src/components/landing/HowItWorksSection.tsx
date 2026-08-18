import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";

export function HowItWorksSection() {
  const { t } = useTranslation();
  const { dir, isRtl } = useLanguage();

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const desktopLineRef = useRef<HTMLDivElement>(null);
  const mobileLineRef = useRef<HTMLDivElement>(null);

  const stepRefs = useRef<HTMLDivElement[]>([]);
  const badgeRefs = useRef<HTMLDivElement[]>([]);

  const steps = [1, 2, 3, 4];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let tl: gsap.core.Timeline | null = null;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        });

        // Heading Animation
        if (headingRef.current) {
          tl.fromTo(
            headingRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
          );
        }

        // Staggered Step Reveal
        if (stepRefs.current.length > 0) {
          tl.fromTo(
            stepRefs.current,
            { opacity: 0, scale: 0.9, y: 20 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.2,
              ease: "back.out(1.2)",
            },
            "-=0.3"
          );
        }

        // Animated Connecting Lines Reveal
        // Desktop line (width 0% -> 100%)
        if (desktopLineRef.current) {
          tl.fromTo(
            desktopLineRef.current,
            { width: "0%" },
            { width: "100%", duration: 0.8, ease: "power2.inOut" },
            "-=0.5"
          );
        }

        // Mobile line (height 0% -> 100%)
        if (mobileLineRef.current) {
          tl.fromTo(
            mobileLineRef.current,
            { height: "0%" },
            { height: "100%", duration: 0.8, ease: "power2.inOut" },
            "-=0.5"
          );
        }
      }
    );

    return () => {
      if (tl) tl.kill();
    };
  }, []);

  // GSAP Hover Animation
  const handleMouseEnter = (index: number) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    import("gsap").then(({ gsap }) => {
      const card = stepRefs.current[index];
      const badge = badgeRefs.current[index];
      if (!card || !badge) return;

      gsap.to(card, {
        y: -6,
        borderColor: "var(--color-primary-30)",
        backgroundColor: "var(--color-card)",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(badge, {
        scale: 1.15,
        backgroundColor: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        borderColor: "var(--color-primary)",
        duration: 0.3,
        ease: "power2.out",
      });
    });
  };

  const handleMouseLeave = (index: number) => {
    import("gsap").then(({ gsap }) => {
      const card = stepRefs.current[index];
      const badge = badgeRefs.current[index];
      if (!card || !badge) return;

      gsap.to(card, {
        y: 0,
        borderColor: "rgba(var(--border), 0.4)",
        backgroundColor: "rgba(var(--card), 0.3)",
        boxShadow: "none",
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(badge, {
        scale: 1,
        backgroundColor: "transparent",
        color: "var(--color-primary)",
        borderColor: "var(--color-primary)",
        duration: 0.3,
        ease: "power2.out",
      });
    });
  };

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      dir={dir}
      className="relative overflow-hidden bg-background py-20 md:py-28 border-b border-border"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div ref={headingRef} className="mb-20 text-center opacity-0 md:opacity-0">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t("landing.howItWorks.title")}
          </h2>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-primary" />
        </div>

        {/* Stepper Container */}
        <div ref={stepsContainerRef} className="relative">
          
          {/* Connecting Line - Desktop (Hidden on mobile) */}
          <div className="absolute top-10 hidden w-full lg:block px-[12.5%]">
            {/* Background dashed line */}
            <div className="h-[2px] w-full border-t-2 border-dashed border-border" />
            {/* Animated drawing line */}
            <div
              ref={desktopLineRef}
              className={`absolute top-0 h-[2px] border-t-2 border-dashed border-primary transition-all duration-300 ${
                isRtl ? "right-[12.5%]" : "left-[12.5%]"
              }`}
              style={{ width: "0%" }}
            />
          </div>

          {/* Connecting Line - Mobile (Hidden on desktop) */}
          <div
            className={`absolute top-6 bottom-6 w-[2px] lg:hidden ${
              isRtl ? "right-6" : "left-6"
            }`}
          >
            {/* Background dashed line */}
            <div className="h-full w-full border-l-2 border-dashed border-border" />
            {/* Animated drawing line */}
            <div
              ref={mobileLineRef}
              className="absolute top-0 w-full border-l-2 border-dashed border-primary"
              style={{ height: "0%" }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
            {steps.map((step, idx) => (
              <div
                key={step}
                ref={(el) => {
                  if (el) stepRefs.current[idx] = el;
                }}
                onMouseEnter={() => handleMouseEnter(idx)}
                onMouseLeave={() => handleMouseLeave(idx)}
                tabIndex={0}
                className="group relative flex flex-row items-start gap-6 rounded-2xl border border-border/40 bg-card/30 p-6 transition-all duration-300 lg:flex-col lg:items-center lg:text-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {/* Step Circle Badge */}
                <div
                  ref={(el) => {
                    if (el) badgeRefs.current[idx] = el;
                  }}
                  className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background font-bold text-primary transition-all duration-300 shadow-xs"
                >
                  {step}
                </div>

                {/* Step Content */}
                <div className="flex flex-col text-start lg:items-center lg:text-center">
                  <h3 className="mb-2 text-lg font-bold text-foreground transition-colors duration-300 group-hover:text-primary">
                    {t(`landing.howItWorks.steps.${step}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.howItWorks.steps.${step}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
