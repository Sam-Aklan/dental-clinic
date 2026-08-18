import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export function TestimonialsSection() {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  const items = ["1", "2", "3"];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let tl: gsap.core.Timeline | null = null;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        const cards = cardRefs.current.filter(Boolean);
        if (cards.length === 0) return;

        tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
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

        // Staggered Cards Reveal
        tl.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
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

  const handleMouseEnter = (index: number) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    import("gsap").then(({ gsap }) => {
      const card = cardRefs.current[index];
      if (!card) return;

      gsap.to(card, {
        scale: 1.02,
        y: -5,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        borderColor: "var(--color-primary-30)",
        duration: 0.3,
        ease: "power2.out",
      });
    });
  };

  const handleMouseLeave = (index: number) => {
    import("gsap").then(({ gsap }) => {
      const card = cardRefs.current[index];
      if (!card) return;

      gsap.to(card, {
        scale: 1,
        y: 0,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        borderColor: "rgba(var(--border), 0.4)",
        duration: 0.3,
        ease: "power2.out",
      });
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      dir={dir}
      className="relative overflow-hidden bg-background py-20 md:py-28 border-b border-border"
    >
      {/* Premium Decorative elements */}
      <div className="absolute top-0 right-1/4 -z-10 size-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 -z-10 size-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div ref={headingRef} className="mb-16 text-center opacity-0 md:opacity-0">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t("landing.testimonials.title")}
          </h2>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-primary" />
        </div>

        {/* Testimonials Container / Layout */}
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0"
        >
          {items.map((item, idx) => {
            const name = t(`landing.testimonials.items.${item}.name`);
            const quote = t(`landing.testimonials.items.${item}.quote`);
            const initials = getInitials(name);

            return (
              <div
                key={item}
                ref={(el) => {
                  if (el) cardRefs.current[idx] = el;
                }}
                onMouseEnter={() => handleMouseEnter(idx)}
                onMouseLeave={() => handleMouseLeave(idx)}
                tabIndex={0}
                className="w-[85vw] shrink-0 snap-align-start sm:w-[45vw] md:w-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
              >
                <Card className="h-full border border-border/40 bg-card/30 transition-all duration-300">
                  <CardContent className="flex h-full flex-col justify-between p-6">
                    <div className="flex flex-col space-y-4">
                      {/* 5-Star Indicator */}
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="size-5 fill-amber-400 text-amber-400 shrink-0" />
                        ))}
                      </div>

                      {/* Quote Text */}
                      <p className="text-base italic leading-relaxed text-muted-foreground text-start">
                        &ldquo;{quote}&rdquo;
                      </p>
                    </div>

                    {/* Patient Info Row */}
                    <div className="mt-8 flex items-center gap-4 border-t border-border/10 pt-4">
                      <Avatar className="size-10 bg-primary/10 text-primary">
                        <AvatarFallback className="font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-start">
                        <h4 className="text-base font-semibold text-foreground">
                          {name}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {t("booking.slotStates.available")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
