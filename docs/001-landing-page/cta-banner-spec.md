# 2.7 Call-to-Action Banner Section Specifications

## Overview
The Call-to-Action (CTA) Banner is designed to be a high-impact, full-width section that serves as a final prompt for the user to convert. It uses an accent background color to stand out from the rest of the page and encourages users to either register for a new account or log into an existing one. It leverages smooth GSAP animations to draw the user's attention as they scroll down the page.

## Content Structure
*   **Background:** Full-width accent-color strip (`bg-primary`).
*   **Heading:** Large centered text: "Ready to book your next appointment?" (H2).
*   **Primary Action:** Single large "Get Started" button (Filled/Solid contrast variant) linking to `/register`.
*   **Secondary Action:** Text link: "Already have an account? Log in" linking to `/login`.

## GSAP Animation Requirements
To draw attention to the final call to action, implement the following scroll-driven animations:

1.  **Banner Reveal (ScrollTrigger):**
    *   The background container should smoothly fade in (`opacity: 0` to `opacity: 1`) with a subtle upward movement (`y: 50`) when it enters the viewport.
2.  **Text Reveal:**
    *   The heading text should slide up and fade in (`y: 30`, `opacity: 0`) slightly after the container becomes visible.
3.  **Buttons Entrance:**
    *   The primary button and secondary link should stagger-fade in from the bottom (`y: 20`, `opacity: 0`) after the heading completes its animation.
4.  **Hover Interactions:**
    *   **Primary Button:** Apply a subtle scale (`scale: 1.05`) and slight shadow enhancement on hover using GSAP or CSS transitions.
5.  **Reduced Motion:**
    *   Wrap all animations in `gsap.matchMedia('(prefers-reduced-motion: reduce)')` to disable or simplify them for users preferring reduced motion.

## Styling Guidelines
*   **Container:** `w-full bg-primary text-primary-foreground py-16 md:py-24`
*   **Layout:** Centered flexbox column (`flex flex-col items-center justify-center text-center space-y-6 px-4 md:px-8`).
*   **Typography:**
    *   Heading: `text-3xl md:text-5xl font-bold tracking-tight max-w-2xl`
    *   Secondary Link: `text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium underline-offset-4 hover:underline transition-colors`
*   **Button:** Use the shadcn `Button` component with a variant that provides high contrast against the `bg-primary` background (e.g., `variant="secondary"` or `variant="outline"` with white background on hover).

## i18n & RTL (Arabic) Support
*   **Translation Keys:**
    *   Heading: `landing.cta.heading`
    *   Button: `landing.cta.button`
    *   Login Link: `landing.cta.login`
*   **RTL Behavior:**
    *   Because the content is centered (`text-center`, `items-center`), the visual layout remains largely symmetrical and unaffected in RTL mode.
    *   Standard logical properties should still be applied where necessary.

## Component Architecture
```tsx
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

export function CTABanner() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
        },
      });

      tl.from(sectionRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
      .from('.cta-element', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
      }, '-=0.4');
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-primary text-primary-foreground py-16 md:py-24">
      <div ref={contentRef} className="container mx-auto px-4 flex flex-col items-center justify-center text-center space-y-8">
        <h2 className="cta-element text-3xl md:text-5xl font-bold tracking-tight max-w-2xl">
          {t('landing.cta.heading')}
        </h2>
        <div className="cta-element flex flex-col items-center space-y-4">
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link to="/register">{t('landing.cta.button')}</Link>
          </Button>
          <Link to="/login" className="text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium underline-offset-4 hover:underline transition-colors">
            {t('landing.cta.login')}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

## Acceptance Criteria
- [ ] Renders a full-width banner with primary brand background color.
- [ ] Heading, primary button, and secondary link are centered and legible.
- [ ] Primary button routes to `/register` and secondary link to `/login`.
- [ ] GSAP ScrollTrigger animations trigger correctly when the banner enters the viewport.
- [ ] Text and buttons stagger in smoothly.
- [ ] Animations are disabled or simplified when `prefers-reduced-motion` is enabled.
- [ ] Content translates correctly using the specified i18n keys.
- [ ] Meets WCAG AA contrast ratios (e.g., sufficient contrast for text on primary background).
