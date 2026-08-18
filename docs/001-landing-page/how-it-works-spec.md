# 2.5 How It Works Section Specifications

## Overview
This section provides a clear, step-by-step guide on how patients can use the platform. It features a responsive layout (horizontal on desktop, vertical on mobile) and utilizes GSAP animations to create an engaging, premium user experience.

## Content Structure
*   **Section Header:** "How It Works" (H2)
*   **Stepper Layout:**
    *   **Desktop:** Horizontal layout with 4 steps connected by an animated dashed line.
    *   **Mobile:** Vertical layout with steps connected by a vertical line.
*   **Step Components (x4):**
    *   **Circle Badge:** Number indicating the step (1-4).
    *   **Title:** H3 heading for the step (e.g., "Register").
    *   **Description:** Short paragraph detailing the action.

## GSAP Animation Requirements
To create a high-quality, modern feel, implement the following GSAP animations:

1.  **Section Entrance Animation (ScrollTrigger):**
    *   The section heading should fade in and slide up slightly (`y: 30`, `opacity: 0` to `y: 0`, `opacity: 1`) as it enters the viewport.

2.  **Sequential Step Reveal (ScrollTrigger):**
    *   Steps should fade in and scale up slightly (`opacity: 0`, `scale: 0.9` to `opacity: 1`, `scale: 1`) with a stagger effect (`stagger: 0.3`).
    *   This ensures the user's attention flows naturally from step 1 to step 4.

3.  **Connecting Line Animation (ScrollTrigger/DrawSVG):**
    *   The dashed line connecting the steps should animate from left-to-right (or top-to-bottom on mobile) as the user scrolls into the section.
    *   If using SVG for the line, animate the `stroke-dashoffset` (or utilize GSAP's DrawSVG plugin) to create a "drawing" effect that follows the staggered reveal of the step cards.

4.  **Hover Interaction (Step Cards):**
    *   Apply `gsap.to` on hover to slightly elevate the step card (`y: -5`) and increase the prominence of the circle badge (e.g., slight scale up `scale: 1.1`, or color accent transition).
    *   Reverse the animation smoothly on mouse leave.

## Responsive Behavior & Accessibility
*   **Mobile (< 768px):** Stepper collapses into a vertical list. Ensure the connecting line adjusts its orientation accordingly.
*   **Reduced Motion:** Wrap all GSAP animations inside `gsap.matchMedia('(prefers-reduced-motion: reduce)')`. If reduced motion is preferred, disable the stagger, slide, and drawing animations, falling back to a simple CSS fade-in or no animation at all.
*   **RTL Support:** The horizontal flow and line animation direction must reverse automatically for Arabic (RTL) layout using CSS logical properties and GSAP direction parameters based on document `dir`.

## Data Model (from spec.md)
| Step | Title | Description |
|---|---|---|
| 1 | Register | Create a free account with your email. |
| 2 | Choose a Slot | Pick a doctor, date, and available time slot. |
| 3 | Get Confirmed | Receive an instant email confirmation. |
| 4 | Show Up | We'll remind you 24h before — no surprises. |

## i18n Keys
*   `landing.howItWorks.title`
*   `landing.howItWorks.steps.*.title`
*   `landing.howItWorks.steps.*.desc`
