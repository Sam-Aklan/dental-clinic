import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useDoctorsQuery } from "@/hooks/booking";

export function HeroSection() {
  const { t } = useTranslation();
  const { dir, isRtl } = useLanguage();

  // Fetch doctors to find a default doctor for live queue viewing
  const { data: doctors } = useDoctorsQuery();

  const defaultDoctorId =
    import.meta.env.VITE_DEFAULT_DOCTOR_ID ||
    doctors?.find((doc) => doc.isActive)?.id ||
    doctors?.[0]?.id;

  // Refs for GSAP animation target elements
  const containerRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let tl: gsap.core.Timeline | null = null;
    let floatTween: gsap.core.Tween | null = null;

    import("gsap").then(({ gsap }) => {
      // 1. Initial Timeline setup
      tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 2. Eyebrow Reveal
      tl.fromTo(
        eyebrowRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 }
      );

      // 3. Headline Stagger (split into words/spans)
      const words = headlineRef.current?.querySelectorAll(".headline-word");
      if (words && words.length > 0) {
        tl.fromTo(
          words,
          { opacity: 0, y: 30, rotateX: -15 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.08 },
          "-=0.4"
        );
      } else {
        tl.fromTo(
          headlineRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.4"
        );
      }

      // 4. Subheadline Fade & Slide
      tl.fromTo(
        subheadlineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.5"
      );

      // 5. CTA Buttons Pop-In
      if (ctasRef.current) {
        tl.fromTo(
          Array.from(ctasRef.current.children),
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "elastic.out(1, 0.6)" },
          "-=0.4"
        );
      }

      // 6. Trust Indicators Cascade (with directional sweep based on RTL)
      const startX = isRtl ? 10 : -10;
      if (trustRef.current) {
        tl.fromTo(
          Array.from(trustRef.current.children),
          { opacity: 0, x: startX },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "power1.out" },
          "-=0.2"
        );
      }

      // 7. Right Column Image Reveal
      tl.fromTo(
        imageWrapperRef.current,
        { opacity: 0, scale: 0.95, filter: "blur(10px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power3.inOut" },
        "-=1.2"
      );

      // 8. Continuous Floating Effect for Image
      floatTween = gsap.to(imageRef.current, {
        y: -15,
        rotation: 1,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    });

    return () => {
      if (tl) tl.kill();
      if (floatTween) floatTween.kill();
    };
  }, [isRtl]);

  // Split headline text into words for stagger animation
  const headlineText = t("landing.hero.headline");
  const words = headlineText.split(" ");

  return (
    <section
      id="hero"
      ref={containerRef}
      dir={dir}
      className="relative flex min-h-[90vh] w-full items-center overflow-hidden bg-gradient-to-br from-primary/10 to-background py-16 md:py-24"
    >
      <div className="mx-auto grid max-w-7xl w-full grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        
        {/* Left Column (60% width on large screens) */}
        <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-start">
          {/* Eyebrow Text */}
          <div
            ref={eyebrowRef}
            className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase opacity-0"
          >
            {t("landing.hero.eyebrow")}
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="mb-6 text-4xl font-extrabold tracking-tight leading-tight text-foreground sm:text-5xl md:text-6xl"
          >
            {words.map((word, idx) => (
              <span
                key={idx}
                className="inline-block whitespace-nowrap overflow-hidden mr-[0.25em] rtl:ml-[0.25em] rtl:mr-0"
              >
                <span className="inline-block headline-word opacity-0 origin-left">
                  {word}
                </span>
              </span>
            ))}
          </h1>

          {/* Subheadline */}
          <p
            ref={subheadlineRef}
            className="mb-8 max-w-2xl text-lg text-muted-foreground opacity-0 md:text-xl"
          >
            {t("landing.hero.subheadline")}
          </p>

          {/* CTA Buttons */}
          <div
            ref={ctasRef}
            className="mb-10 flex w-full flex-col sm:flex-row justify-center lg:justify-start gap-4"
          >
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto font-medium shadow-md transition-transform hover:scale-105 opacity-0"
            >
              <Link to="/register">{t("landing.hero.cta.book")}</Link>
            </Button>
            
            {defaultDoctorId && (
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full sm:w-auto font-medium transition-transform hover:scale-105 opacity-0"
              >
                <Link to={`/lobby/${defaultDoctorId}`}>
                  {t("landing.hero.cta.queue")}
                </Link>
              </Button>
            )}
          </div>

          {/* Trust Indicators */}
          <div
            ref={trustRef}
            className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-3 border-t border-border/40 pt-6 w-full"
          >
            <div className="flex items-center text-sm font-medium text-muted-foreground opacity-0 transition-transform hover:-translate-y-0.5">
              <Check className="size-4 text-primary me-2 shrink-0" />
              <span>{t("landing.hero.trust.slots")}</span>
            </div>
            <div className="flex items-center text-sm font-medium text-muted-foreground opacity-0 transition-transform hover:-translate-y-0.5">
              <Check className="size-4 text-primary me-2 shrink-0" />
              <span>{t("landing.hero.trust.cancel")}</span>
            </div>
            <div className="flex items-center text-sm font-medium text-muted-foreground opacity-0 transition-transform hover:-translate-y-0.5">
              <Check className="size-4 text-primary me-2 shrink-0" />
              <span>{t("landing.hero.trust.reminders")}</span>
            </div>
          </div>
        </div>

        {/* Right Column (40% width on large screens) */}
        <div className="flex justify-center lg:col-span-5 w-full">
          <div
            ref={imageWrapperRef}
            className="relative w-full max-w-[450px] aspect-square rounded-3xl bg-primary/5 p-4 shadow-xl border border-primary/10 overflow-hidden opacity-0"
          >
            <img
              ref={imageRef}
              src="/hero-dental-care.png"
              alt={t("landing.hero.headline")}
              fetchPriority="high"
              className="h-full w-full object-cover rounded-2xl"
              style={{ contentVisibility: "auto" }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
