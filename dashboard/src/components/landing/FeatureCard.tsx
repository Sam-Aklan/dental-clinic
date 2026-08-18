import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

export function FeatureCard({ id, icon: Icon, title, body }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | gsap.core.Tween | null>(null);

  const handleMouseEnter = () => {
    // Dynamically load GSAP to avoid SSR/Vite issues
    import("gsap").then(({ gsap }) => {
      const icon = iconRef.current;
      if (!icon) return;

      // Kill any running animations on this icon
      if (animationRef.current) {
        animationRef.current.kill();
      }

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      const tl = gsap.timeline();
      animationRef.current = tl;

      if (id === "booking") {
        // Calendar: quick bounce up and rotation nudge
        tl.to(icon, {
          y: -4,
          scale: 1.05,
          duration: 0.2,
          ease: "back.out(2)",
        }).to(icon, {
          y: 0,
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
        });
      } else if (id === "reminders") {
        // Bell: swing back and forth
        tl.to(icon, {
          rotation: 15,
          transformOrigin: "50% 0%",
          duration: 0.15,
          ease: "power1.inOut",
        })
          .to(icon, {
            rotation: -12,
            duration: 0.15,
            ease: "power1.inOut",
          })
          .to(icon, {
            rotation: 8,
            duration: 0.12,
            ease: "power1.inOut",
          })
          .to(icon, {
            rotation: -4,
            duration: 0.12,
            ease: "power1.inOut",
          })
          .to(icon, {
            rotation: 0,
            duration: 0.1,
            ease: "power1.inOut",
          });
      } else if (id === "waitlist") {
        // RefreshCw: spin 360 degrees
        tl.to(icon, {
          rotation: "+=360",
          duration: 0.6,
          ease: "power2.inOut",
        });
      } else if (id === "queue") {
        // ListOrdered/Users: slide up slightly and nudge horizontally
        tl.to(icon, {
          y: -2,
          x: 2,
          duration: 0.15,
          ease: "power1.out",
        })
          .to(icon, {
            x: -2,
            duration: 0.15,
            ease: "power1.inOut",
          })
          .to(icon, {
            y: 0,
            x: 0,
            duration: 0.15,
            ease: "power1.inOut",
          });
      } else if (id === "bilingual") {
        // Globe: Infinite slow rotation while hovered
        const tween = gsap.to(icon, {
          rotation: "+=360",
          duration: 4,
          repeat: -1,
          ease: "none",
        });
        animationRef.current = tween;
      } else if (id === "secure") {
        // Shield: slight scale up pulse
        tl.to(icon, {
          scale: 1.15,
          duration: 0.2,
          ease: "power1.out",
        }).to(icon, {
          scale: 1,
          duration: 0.2,
          ease: "power1.in",
        });
      }
    });
  };

  const handleMouseLeave = () => {
    import("gsap").then(({ gsap }) => {
      const icon = iconRef.current;
      if (!icon) return;

      if (animationRef.current) {
        animationRef.current.kill();
      }

      // Smoothly animate back to normal state
      gsap.to(icon, {
        y: 0,
        x: 0,
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-8 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Background glow effect on card hover */}
      <div className="absolute -right-16 -top-16 size-32 rounded-full bg-primary/5 blur-2xl transition-all duration-300 group-hover:scale-150" />

      {/* Icon Container */}
      <div
        ref={iconRef}
        className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
      >
        <Icon size={24} className="shrink-0" />
      </div>

      {/* Content */}
      <h3 className="mb-3 text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary text-start">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground text-start">
        {body}
      </p>
    </div>
  );
}
