# 2.6 Testimonials Section Specifications

## Overview
The Testimonials Section builds trust and social proof by highlighting positive patient experiences. It displays patient feedback in a visually appealing, interactive horizontal scroll or grid layout, enhanced with premium GSAP animations.

## Content Structure
*   **Section Header:** "What Our Patients Say" (H2)
*   **Layout:** 3 testimonial cards in a horizontal scroll on mobile/tablet, and a 3-column grid on desktop.
*   **Testimonial Card Structure:**
    *   **Avatar:** Initials-based fallback (e.g., "SM" for Sara M.) using shadcn `Avatar`.
    *   **Patient Name:** Anonymized (e.g., "Sara M.").
    *   **Star Rating:** 5-star visual indicator (SVG icons).
    *   **Quote Text:** The patient's feedback.

## Data Source
*   Static data (no API call required).
*   Data should be hardcoded in the component or imported from a local data file (e.g., `frontend/src/features/landing/data/landing-data.ts`).

## GSAP Animation Requirements
To maintain the premium aesthetic of the landing page, implement the following GSAP animations:

1.  **Scroll-Triggered Entrance:**
    *   **Trigger:** Section enters the viewport (`start: "top 80%"`).
    *   **Animation:** Cards fade in and slide up (`y: 40`, `opacity: 0`).
    *   **Stagger:** Use `stagger: 0.15` for a cascading sequential entrance effect across the cards.
2.  **Hover Interaction (Desktop):**
    *   **Trigger:** Mouse enter/leave on a testimonial card.
    *   **Animation:** Slight scale up (`scale: 1.02`), subtle lift (`y: -5px`), and an increase in box-shadow intensity.
    *   **Timing:** Fast, smooth, and responsive (`duration: 0.3`, `ease: "power2.out"`).
3.  **Horizontal Scroll / Parallax (Optional Enhancement):**
    *   If using a horizontal scroll layout on desktop, implement a slight horizontal parallax effect tied to vertical scrolling to make the cards feel dynamic.
4.  **Reduced Motion:**
    *   Always respect `gsap.matchMedia('(prefers-reduced-motion: reduce)')` to disable or simplify animations for users who prefer it.

## Styling & Aesthetic
*   **Container:** Subtle background color or gradient to distinguish it from the preceding section (e.g., `bg-background` or `bg-muted/10`).
*   **Cards:** Use the shadcn `Card` component with consistent padding (`p-6`), rounded corners, and a clean appearance (`bg-card`, `border`).
*   **Typography:** Quote text should be legible, slightly italicized, and use a muted color (`text-muted-foreground`), while the patient name is prominent (`font-semibold`).
*   **Stars:** Use an accent color (e.g., amber/yellow) for the star rating icons to make them pop.
*   **RTL Support:** Ensure the avatar, text alignment, and horizontal scroll direction respect RTL (Arabic) layout out-of-the-box using CSS logical properties (`text-start`, `me-4`, etc.).

## i18n Translation Keys
Ensure all text is localized using the following keys:
*   `landing.testimonials.title`
*   `landing.testimonials.items.1.name`
*   `landing.testimonials.items.1.quote`
*   `landing.testimonials.items.2.name`
*   `landing.testimonials.items.2.quote`
*   `landing.testimonials.items.3.name`
*   `landing.testimonials.items.3.quote`

## Acceptance Criteria
- [ ] Section displays 3 testimonial cards.
- [ ] Each card correctly renders an avatar (initials fallback), name, star rating, and quote.
- [ ] GSAP entrance animations trigger smoothly as the section scrolls into view with staggered timing.
- [ ] Card hover animations work correctly (scale/lift/shadow) without layout shift.
- [ ] Layout is responsive (horizontal scroll or stacked on mobile, grid on desktop).
- [ ] RTL layout mirrors correctly for Arabic.
- [ ] All text is successfully loaded via `react-i18next`.
- [ ] Animations are automatically disabled when `prefers-reduced-motion` is enabled.
