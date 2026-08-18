import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export function AnimatedCounter({ value, prefix = "", suffix = "", label }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCount(value);
      return;
    }

    let tween: gsap.core.Tween | null = null;

    // Dynamically import GSAP and ScrollTrigger to be safe for SSR/Testing environment
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        const proxy = { val: 0 };
        tween = gsap.to(proxy, {
          val: value,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
          },
          onUpdate: () => {
            setCount(Math.ceil(proxy.val));
          },
        });
      }
    );

    return () => {
      if (tween) {
        tween.kill();
      }
    };
  }, [value]);

  return (
    <div ref={containerRef} className="flex flex-col items-center text-center">
      {/* Screen reader only output for accessibility */}
      <span className="sr-only">
        {prefix}
        {value}
        {suffix} {label}
      </span>
      {/* Visual output hidden from screen readers to prevent reading incrementing numbers */}
      <div className="text-3xl md:text-5xl font-bold tracking-tight" aria-hidden="true">
        {prefix}
        {count}
        {suffix}
      </div>
      <div className="mt-2 text-sm md:text-base font-medium opacity-80" aria-hidden="true">
        {label}
      </div>
    </div>
  );
}
