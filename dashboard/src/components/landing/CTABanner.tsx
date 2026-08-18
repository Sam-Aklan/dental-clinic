import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

import gsap from 'gsap'
import {useGSAP} from '@gsap/react'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export function CTABanner() {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let tl: gsap.core.Timeline | null = null;

        tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        });

        // Banner Reveal
        tl.fromTo(
          sectionRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
          }
        );

        // Heading Reveal
        if (headingRef.current) {
          tl.fromTo(
            headingRef.current,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power3.out",
            },
            "-=0.4"
          );
        }

        // Actions (Buttons/Links) Entrance
        if (actionsRef.current) {
          const elements = actionsRef.current.children;
          tl.fromTo(
            Array.from(elements),
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.15,
              ease: "power3.out",
            },
            "-=0.3"
          );
        }
  }, []);

  const handleMouseEnter = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    import("gsap").then(({ gsap }) => {
      const btn = primaryButtonRef.current;
      if (!btn) return;

      gsap.to(btn, {
        scale: 1.05,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
        duration: 0.3,
        ease: "power2.out",
      });
    });
  };

  const handleMouseLeave = () => {
    import("gsap").then(({ gsap }) => {
      const btn = primaryButtonRef.current;
      if (!btn) return;

      gsap.to(btn, {
        scale: 1,
        boxShadow: "none",
        duration: 0.3,
        ease: "power2.out",
      });
    });
  };

  return (
    <section
      ref={sectionRef}
      dir={dir}
      className="w-full bg-primary text-primary-foreground py-16 md:py-24 opacity-0 md:opacity-0"
    >
      <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center space-y-8">
        <h2
          ref={headingRef}
          className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl text-center opacity-0 md:opacity-0"
        >
          {t("landing.cta.heading")}
        </h2>
        <div
          ref={actionsRef}
          className="flex flex-col items-center space-y-4"
        >
          <Button
            ref={primaryButtonRef}
            asChild
            size="lg"
            variant="secondary"
            className="text-lg px-8 transition-transform duration-300"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link to="/register">{t("landing.cta.button")}</Link>
          </Button>
          <Link
            to="/login"
            className="text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium underline-offset-4 hover:underline transition-colors"
          >
            {t("landing.cta.login")}
          </Link>
        </div>
      </div>
    </section>
  );
}
