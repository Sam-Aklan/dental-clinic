import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Bell, RefreshCw, ListOrdered, Globe, Shield } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { useLanguage } from "@/hooks/use-language";

const featuresList = [
  { id: "booking", icon: Calendar },
  { id: "reminders", icon: Bell },
  { id: "waitlist", icon: RefreshCw },
  { id: "queue", icon: ListOrdered },
  { id: "bilingual", icon: Globe },
  { id: "secure", icon: Shield },
];

export function FeaturesSection() {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let tl: gsap.core.Timeline | null = null;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        const cards = gridRef.current?.children;
        if (!cards || cards.length === 0) return;

        tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        });

        // Entrance animation for heading
        if (headingRef.current) {
          tl.fromTo(
            headingRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
          );
        }

        // Staggered entrance for cards
        tl.fromTo(
          Array.from(cards),
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
          },
          "-=0.4"
        );
      }
    );

    return () => {
      if (tl) tl.kill();
    };
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      dir={dir}
      className="relative overflow-hidden bg-muted/30 py-20 md:py-28"
    >
      {/* Decorative background vectors for premium styling */}
      <div className="absolute top-0 left-1/4 -z-10 size-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 -z-10 size-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div ref={headingRef} className="mb-16 text-center opacity-0 md:opacity-0">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-primary" />
        </div>

        {/* Feature Cards Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {featuresList.map((feature) => (
            <FeatureCard
              key={feature.id}
              id={feature.id}
              icon={feature.icon}
              title={t(`landing.features.cards.${feature.id}.title`)}
              body={t(`landing.features.cards.${feature.id}.body`)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
