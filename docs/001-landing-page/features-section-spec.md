# Features / Why Us Section - Detailed Specification

**Component**: `FeaturesSection` and `FeatureCard`
**Location**: `frontend/src/features/landing/components/FeaturesSection.tsx` & `frontend/src/features/landing/components/FeatureCard.tsx`
**Parent Component**: `LandingPage`

## 1. Overview
The "Features / Why Us" section highlights the main benefits of using the clinic's platform. It presents six key features in a responsive grid layout using visually appealing cards with animated icons and staggered entrance animations.

---

## 2. Content & Structure

- **Section Container**:
  - `id="features"` to allow smooth scrolling from the navigation.
  - Background color: `bg-muted/30` to visually separate it from surrounding sections.

- **Section Heading**:
  - Centered text: `"Why Choose Our Clinic"`.
  - i18n key: `landing.features.title`.
  - Styling: Large, bold typography with appropriate vertical margins.

- **Feature Cards Grid**:
  - CSS Grid with responsive columns:
    - Mobile: 1 column (`grid-cols-1`).
    - Tablet: 2 columns (`md:grid-cols-2`).
    - Desktop: 3 columns (`lg:grid-cols-3`).
  - Gap spacing: `gap-6` or `gap-8`.

---

## 3. Feature Card Details

Each `FeatureCard` component consists of:
- **Icon**: shadcn/lucide icon representing the feature.
- **Title**: Bold heading text (`text-lg font-semibold`).
- **Body**: Short descriptive paragraph (`text-muted-foreground`).
- **Interaction**: Subtle hover lift shadow (`hover:shadow-md hover:-translate-y-1 transition-all duration-300`).

### Cards Data

| Icon (Lucide) | i18n Key (`*.title`) | i18n Key (`*.body`) | English Title | English Body |
|---------------|----------------------|----------------------|---------------|--------------|
| `Calendar`    | `landing.features.cards.booking.title` | `landing.features.cards.booking.body` | Online Booking | Book anytime from any device without calling. |
| `Bell`        | `landing.features.cards.reminders.title` | `landing.features.cards.reminders.body` | Smart Reminders | Automatic email reminders before your appointment. |
| `RefreshCw`   | `landing.features.cards.waitlist.title` | `landing.features.cards.waitlist.body` | Waitlist Engine | Get notified automatically when a cancellation matches your window. |
| `Users` (or `ListOrdered`) | `landing.features.cards.queue.title` | `landing.features.cards.queue.body` | Live Queue Display | See your position in real time on any screen. |
| `Globe`       | `landing.features.cards.bilingual.title` | `landing.features.cards.bilingual.body` | Bilingual | Full Arabic and English support with RTL layout. |
| `Shield`      | `landing.features.cards.secure.title` | `landing.features.cards.secure.body` | Secure & Private | JWT auth, encrypted passwords, and role-based access. |

---

## 4. Animations (GSAP)

The section heavily relies on GSAP (`gsap` + `ScrollTrigger`) for premium aesthetics.

### 4.1 Section Reveal Animation
- **Trigger**: The animation starts when the `.features-container` enters the viewport (e.g., `start: "top 80%"`).
- **Heading**: Fades in and slides up slightly (`y: 30`, `opacity: 0` to `y: 0`, `opacity: 1`).
- **Cards Stagger**: The six cards reveal sequentially.
  - Initial state: `y: 50, opacity: 0`.
  - Final state: `y: 0, opacity: 1`.
  - Stagger timing: `stagger: 0.1` (100ms delay between each card).
  - Ease: `ease: "power3.out"`, duration: `0.8s`.

### 4.2 Interactive Icon Animations (SVG via GSAP)
When a user hovers over a `FeatureCard`, the corresponding Lucide icon should play a subtle micro-animation.
- **Calendar**: Top bar lifts slightly or a date element pops.
- **Bell**: Pendulum swing back and forth (`rotation: 15` to `-15`, `transformOrigin: "top center"`).
- **RefreshCw**: Spins 180 or 360 degrees (`rotation: "+=180"`).
- **Queue/ListOrdered**: Lines slide horizontally or stagger in width.
- **Globe**: Infinite slow rotation on hover.
- **Shield**: Slight scale up or pulse effect (`scale: 1.1`).

*Implementation Note*: Use React `onMouseEnter` / `onMouseLeave` to trigger GSAP timelines attached to the icon wrapper refs, or use CSS keyframes if GSAP is overkill for hover states, but prefer GSAP for programmatic control.

### 4.3 Reduced Motion
- All GSAP animations must respect accessibility settings.
- Use `gsap.matchMedia()`:
  ```javascript
  let mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Setup ScrollTrigger stagger and hover animations here
  });
  ```

---

## 5. i18n & RTL Support

- **Text Extraction**: All text strictly uses `useTranslation('landing')`.
- **RTL Layout**: 
  - The CSS Grid naturally flows right-to-left in Arabic mode due to Tailwind's grid behavior and logical properties.
  - Text alignment inside cards uses `text-start`.
  - Margin/Padding uses logical properties (e.g., `ps-4`, `me-2`) if necessary, though grid gaps handle most spacing.

---

## 6. Accessibility Criteria

- Ensure color contrast of the muted text meets WCAG AA standards against the `bg-muted/30` background.
- Include proper `aria-label` or keep icons `aria-hidden="true"` since the title is self-explanatory.
- Card hover states must also be visible when focused via keyboard (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`).
- Reduced motion preferences correctly disable the scroll and stagger animations.

---

## 7. Component Skeleton (Example)

```tsx
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Bell, RefreshCw, ListOrdered, Globe, Shield } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { id: 'booking', icon: Calendar },
  { id: 'reminders', icon: Bell },
  { id: 'waitlist', icon: RefreshCw },
  { id: 'queue', icon: ListOrdered },
  { id: 'bilingual', icon: Globe },
  { id: 'secure', icon: Shield },
];

export function FeaturesSection() {
  const { t } = useTranslation('landing');
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  // GSAP Animation setup
  useEffect(() => {
    let ctx = gsap.context(() => {
      let mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          cardsRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('features.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.id}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="bg-card p-6 rounded-xl border hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-start">
                  {t(`features.cards.${feature.id}.title`)}
                </h3>
                <p className="text-muted-foreground text-start">
                  {t(`features.cards.${feature.id}.body`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```
