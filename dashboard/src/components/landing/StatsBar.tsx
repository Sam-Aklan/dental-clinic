import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { AnimatedCounter } from "./AnimatedCounter";

export function StatsBar() {
  const { t } = useTranslation();
  const { dir, isRtl } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let tl: gsap.core.Timeline | null = null;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        const cards = containerRef.current?.querySelectorAll(".stat-card");
        if (cards && cards.length > 0) {
          tl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 85%",
              once: true,
            },
          });

          tl.fromTo(
            cards,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "power2.out",
            }
          );
        }
      }
    );

    return () => {
      if (tl) tl.kill();
    };
  }, []);

  // Localization settings for numbers/symbols based on language
  const patientsSuffix = "+";
  const patientsPrefix = "";

  const satisfactionSuffix = isRtl ? "" : "%";
  const satisfactionPrefix = isRtl ? "%" : "";

  const waitSuffix = isRtl ? " دقائق" : " min";
  const waitPrefix = isRtl ? "أقل من " : "< ";

  const stats = [
    {
      value: 500,
      prefix: patientsPrefix,
      suffix: patientsSuffix,
      labelKey: "landing.stats.patients",
    },
    {
      value: 98,
      prefix: satisfactionPrefix,
      suffix: satisfactionSuffix,
      labelKey: "landing.stats.satisfaction",
    },
    {
      value: 3,
      prefix: "",
      suffix: "",
      labelKey: "landing.stats.doctors",
    },
    {
      value: 5,
      prefix: waitPrefix,
      suffix: waitSuffix,
      labelKey: "landing.stats.waitTime",
    },
  ];

  return (
    <section
      ref={containerRef}
      dir={dir}
      className="w-full bg-primary text-primary-foreground py-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="stat-card opacity-0 md:opacity-0 flex flex-col items-center justify-center"
            >
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                label={t(stat.labelKey)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
