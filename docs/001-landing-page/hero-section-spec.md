# Detailed Specification: 2.2 Hero Section

**Parent Document**: `docs/001-landing-page/spec.md`
**Component Name**: `HeroSection.tsx`
**Location**: `frontend/src/features/landing/components/HeroSection.tsx`

---

## 1. Overview

The Hero Section is the first point of interaction for users visiting the landing page. It must capture attention, clearly communicate the clinic's core value proposition (online booking and live queue), and drive immediate action through prominent Call-to-Action (CTA) buttons. The section heavily features GSAP (GreenSock Animation Platform) for a premium, dynamic feel.

---

## 2. Layout & Structure

The Hero Section uses a full-width container with a minimum height of `100vh` on mobile and `90vh` on desktop. It employs a responsive two-column grid.

### 2.1 Desktop Layout (min-width: 1024px)
- **Left Column (60% width)**: Contains the typographic elements, CTA buttons, and trust indicators. Vertically centered.
- **Right Column (40% width)**: Contains a high-quality illustration, SVG graphic, or stock photo of a modern dental clinic/smiling patient.

### 2.2 Mobile & Tablet Layout (max-width: 1023px)
- **Single Column**: Elements stack vertically. The text content (Left Column) appears first to prioritize the CTA, followed by the image/graphic (Right Column) below it.
- **Alignment**: Text alignment shifts to center on mobile for better balance.

### 2.3 Background & Theme
- Uses a subtle gradient background: `bg-gradient-to-br from-primary/10 to-background` (Tailwind classes).

---

## 3. Content Elements

### 3.1 Typographic Hierarchy
1. **Eyebrow Text**: Small, uppercase, muted text above the headline.
   - Text: `"Modern Dental Care"` (Key: `landing.hero.eyebrow`)
   - Style: `text-sm font-semibold tracking-wider text-muted-foreground uppercase`
2. **Headline (`<h1>`)**: The primary SEO and visual focal point.
   - Text: `"Book Your Dental Appointment Online"` (Key: `landing.hero.headline`)
   - Style: `text-4xl md:text-6xl font-extrabold tracking-tight leading-tight`
3. **Subheadline (`<p>`)**: A brief description supporting the headline.
   - Text: `"Skip the phone calls. Pick a slot, get confirmed, and receive a reminder — all in minutes."` (Key: `landing.hero.subheadline`)
   - Style: `text-lg md:text-xl text-muted-foreground max-w-2xl`

### 3.2 CTA Buttons Container
- Two large buttons stacked horizontally on desktop, vertically on mobile.
- **Primary Action**: "Book an Appointment" → routes to `/register`.
  - Style: Solid primary color (`variant="default"`, `size="lg"`).
- **Secondary Action**: "View Live Queue" → routes to `/lobby/<defaultDoctorId>`.
  - Style: Outline (`variant="outline"`, `size="lg"`).
  - Note: Hidden if `VITE_DEFAULT_DOCTOR_ID` is unavailable.

### 3.3 Trust Indicators
- A horizontal row of icons + short text below the CTAs to build immediate trust.
- **Items**:
  1. `✓ Same-Day Slots`
  2. `✓ 24h Cancellation`
  3. `✓ Email Reminders`
- Style: Small font size (`text-sm`), flexbox layout, muted icon colors.

---

## 4. GSAP Animations Specification

To create a "wow" factor, the Hero Section integrates GSAP for load animations and continuous subtle movements.

### 4.1 Entry Timeline (On Component Mount)
Use `gsap.timeline()` to orchestrate the initial load sequence. Ensure the timeline plays only after the DOM elements are ready (using `useGSAP` hook).

1. **Eyebrow Reveal**:
   - `fromTo`: `opacity: 0, y: 20` -> `opacity: 1, y: 0`
   - `duration: 0.6`, `ease: "power3.out"`
2. **Headline Stagger (Split Text)**:
   - Split the `<h1>` into words or lines using `SplitText` (if available) or basic CSS masking.
   - `fromTo`: `opacity: 0, y: 50, rotateX: -15` -> `opacity: 1, y: 0, rotateX: 0`
   - `stagger: 0.1`, `duration: 0.8`, `ease: "back.out(1.7)"`
   - Start: `-=0.4` (overlap with eyebrow).
3. **Subheadline Fade & Slide**:
   - `fromTo`: `opacity: 0, y: 20` -> `opacity: 1, y: 0`
   - `duration: 0.8`, `ease: "power2.out"`
   - Start: `-=0.5`.
4. **CTA Buttons Pop-In**:
   - `fromTo`: `opacity: 0, scale: 0.9` -> `opacity: 1, scale: 1`
   - `stagger: 0.15`, `duration: 0.5`, `ease: "elastic.out(1, 0.5)"`
   - Start: `-=0.4`.
5. **Trust Indicators Cascade**:
   - `fromTo`: `opacity: 0, x: -10` -> `opacity: 1, x: 0`
   - `stagger: 0.1`, `duration: 0.5`, `ease: "power1.out"`
   - Start: `-=0.2`.

### 4.2 Right Column Graphic/Image Animation
1. **Initial Reveal**:
   - `fromTo`: `opacity: 0, scale: 0.95, filter: "blur(10px)"` -> `opacity: 1, scale: 1, filter: "blur(0px)"`
   - `duration: 1.2`, `ease: "power3.inOut"`
   - Start: `-=1.0` (plays alongside text reveal).
2. **Continuous Floating Effect (Yoyo)**:
   - Apply a continuous, subtle float to the image or SVG wrapper.
   - `to`: `y: -15, rotation: 1`
   - `duration: 4`, `yoyo: true`, `repeat: -1`, `ease: "sine.inOut"`

### 4.3 Interactive Hover States (GSAP or CSS)
- **Buttons**: Slight scale up (`scale: 1.05`) and shadow expansion on hover.
- **Trust Indicators**: Slight icon lift (`y: -2`, `color: primary`) on hover.

---

## 5. i18n & RTL Considerations

- **Logical Properties**: Use `ps-*` (padding-start), `me-*` (margin-end), `text-start`, and `flex-row` instead of hardcoded left/right directions.
- **RTL Swap**: In Arabic mode (`dir="rtl"`), the 60/40 column layout naturally flips via flexbox or CSS grid so the text is on the right and the image is on the left.
- **GSAP Directionality**: Avoid animating hardcoded `x: -50` if it implies a left-to-right movement that feels unnatural in Arabic. Use logical relative movements or detect document direction (`document.documentElement.dir`) to invert the `x` values for `rtl`.
  - *Example*: `x: isRTL ? 10 : -10` for trust indicators cascade.

---

## 6. Accessibility & Performance

### 6.1 Reduced Motion
- All GSAP animations MUST be wrapped in a `gsap.matchMedia()` block targeting `(prefers-reduced-motion: reduce)`.
- If reduced motion is preferred, set durations to `0` or replace complex stagger/slide animations with a simple instantaneous fade-in.

### 6.2 Performance (LCP)
- The Hero image is likely the Largest Contentful Paint (LCP) element.
- **Do not lazy load** the hero image. Use `fetchpriority="high"`.
- Ensure the image has explicit `width` and `height` attributes to prevent Cumulative Layout Shift (CLS).
- Preload the primary font used for the headline to ensure text renders quickly before GSAP takes over.

### 6.3 Semantic HTML & ARIA
- Use a single `<h1>` tag.
- Ensure buttons have adequate contrast.
- If the right column uses an SVG graphic, include `<title>` and `<desc>` tags within the SVG, or use `aria-hidden="true"` if it is purely decorative.
