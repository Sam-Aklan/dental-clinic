# Detailed Specification: 2.3 Stats Bar

**Parent Document**: `docs/001-landing-page/spec.md`
**Component Name**: `StatsBar.tsx` (Parent) & `AnimatedCounter.tsx` (Child)
**Location**: `frontend/src/features/landing/components/`

---

## 1. Overview

The Stats Bar is a horizontal strip that sits immediately below the Hero Section. It serves as a visual break and builds credibility by presenting key metrics (e.g., Patients Served, Satisfaction Rate). It uses scroll-triggered GSAP animations to count up the numbers dynamically as the user scrolls them into view, adding a layer of interactivity and polish.

---

## 2. Layout & Structure

The Stats Bar uses a full-width container with a contrasting background to separate the Hero Section from the Features Section.

### 2.1 Grid Layout
- **Desktop & Tablet (min-width: 768px)**: A 4-column CSS grid (`grid-cols-2 md:grid-cols-4`).
- **Mobile (max-width: 767px)**: A 2-column grid (`grid-cols-2`) to keep the metrics compact without overwhelming the screen vertically.

### 2.2 Background & Theme
- Uses the primary color for a bold contrast strip.
- **Background**: `bg-primary`
- **Text Color**: `text-primary-foreground`
- **Padding**: Generous vertical padding (`py-12`) to give the numbers room to breathe.

---

## 3. Content Elements (Metrics)

The Stats Bar renders 4 distinct data points. Each point consists of a large number (the counter) and a smaller descriptive label.

1. **Patients Served**
   - Value: `500`
   - Prefix/Suffix: `+`
   - Label: `"Patients Served"` (Key: `landing.stats.patients`)
2. **Satisfaction Rate**
   - Value: `98`
   - Prefix/Suffix: `%`
   - Label: `"Satisfaction Rate"` (Key: `landing.stats.satisfaction`)
3. **Specialist Doctors**
   - Value: `3`
   - Prefix/Suffix: None
   - Label: `"Specialist Doctors"` (Key: `landing.stats.doctors`)
4. **Average Wait Time**
   - Value: `5`
   - Prefix/Suffix: `< ` (prefix), ` min` (suffix)
   - Label: `"Avg. Wait Time"` (Key: `landing.stats.waitTime`)

### 3.1 Typography
- **Number**: Large, bold font. `text-3xl md:text-5xl font-bold tracking-tight`.
- **Label**: Smaller, slightly transparent font. `text-sm md:text-base font-medium opacity-80`.
- **Layout**: The number and label are stacked vertically (`flex-col items-center text-center`).

---

## 4. GSAP Animations Specification (`AnimatedCounter.tsx`)

The core feature of this section is the counting animation. Instead of static text, the numbers count up from 0 to their target value when they enter the viewport.

### 4.1 ScrollTrigger Integration
- The animation MUST NOT start until the Stats Bar is visible in the viewport.
- Use GSAP's `ScrollTrigger` plugin.
- **Trigger**: The parent `StatsBar` container.
- **Start**: `top 85%` (animation begins when the top of the Stats Bar hits 85% down the viewport).

### 4.2 Counting Animation (Tweening)
Do not manipulate the DOM string manually in a `setInterval`. Use GSAP to tween a numeric property on a proxy object, then update the React state on `onUpdate`.

1. **Setup Proxy**: 
   ```javascript
   const proxy = { val: 0 };
   ```
2. **Tween**:
   ```javascript
   gsap.to(proxy, {
     val: targetValue, // e.g., 500, 98, 3, 5
     duration: 2, // 2 seconds
     ease: "power2.out", // Fast start, slow down at the end
     scrollTrigger: {
       trigger: containerRef.current,
       start: "top 85%",
       once: true, // Only animate once
     },
     onUpdate: () => {
       // Math.ceil or Math.floor to keep it a whole number
       setCount(Math.ceil(proxy.val));
     }
   });
   ```

### 4.3 Container Reveal (Staggered Fade-in)
In addition to the numbers counting, the 4 stat blocks themselves should fade and slide up slightly.
- `fromTo`: `opacity: 0, y: 30` -> `opacity: 1, y: 0`
- `stagger: 0.15`
- `duration: 0.8`
- `ease: "power2.out"`
- Link this timeline to the same `ScrollTrigger` as the counters so they happen simultaneously.

---

## 5. i18n & RTL Considerations

- **Layout**: Since the grid is centered, flipping the order (RTL) is handled natively by CSS Grid/Flexbox without extra configuration.
- **Prefixes/Suffixes in Arabic**: Ensure that symbols like `<` or `%` align correctly based on the locale. In Arabic, `%` often appears on the left of the number (`%98` vs `98%`). Pass the formatted string structure via i18n or handle RTL conditional rendering for suffixes.
- Translations rely on keys under `landing.stats.*`.

---

## 6. Accessibility & Performance

### 6.1 Reduced Motion (`prefers-reduced-motion`)
- Wrap the GSAP timeline and counter tween in `gsap.matchMedia()`.
- **If reduced motion is requested**:
  - Set `duration: 0` for the fade-in.
  - Skip the counting animation entirely and immediately render the final `targetValue` to avoid rapid visual changes.

### 6.2 ARIA Attributes
- Screen readers do not need to read every tick of the counter.
- Add `aria-hidden="true"` to the animating `<span/>`.
- Provide a visually hidden screen-reader-only element that reads the final static value: 
  `<span className="sr-only">500+ Patients Served</span>`
- This ensures voiceover reads the context clearly without stuttering numbers.
