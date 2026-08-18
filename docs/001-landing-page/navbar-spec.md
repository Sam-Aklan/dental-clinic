# Spec: Landing Page Navbar

**Component**: `LandingNavbar`
**Location**: `frontend/src/features/landing/components/LandingNavbar.tsx`

---

## 1. Overview
The Navbar is the primary navigation component for the public landing page. It provides branding, anchor links to page sections, language switching, and primary call-to-action (CTA) buttons for authentication.

## 2. Layout & Structure

### Desktop Layout
- **Container**: Max-width container (`max-w-7xl` or similar), centered.
- **Left Side**: Logo and Clinic Name.
  - The logo should be an SVG or high-quality image.
  - Clicking the logo scrolls to the top of the page.
- **Center**: Navigation Links.
  - Links: **Home**, **Services**, **How It Works**, **Contact**.
  - These are smooth-scroll anchors (`#hero`, `#services`, `#how-it-works`, `#contact`).
- **Right Side**: Controls and Actions.
  - **Language Switcher**: Toggles between English (`en`) and Arabic (`ar`).
  - **Login Button**: Outline variant (`/login`).
  - **Register Button**: Primary filled variant (`/register`).

### Mobile Layout
- **Left Side**: Logo and Clinic Name.
- **Right Side**: Hamburger Menu Icon.
- **Mobile Drawer (Sheet)**:
  - Triggered by the hamburger menu.
  - Slides in from the side (Right in LTR, Left in RTL).
  - Contains navigation links stacked vertically.
  - Contains Language Switcher and Authentication buttons at the bottom of the drawer.

### RTL Support (Arabic)
- The layout must reverse automatically using CSS logical properties (`flex-row-reverse` or relying on `dir="rtl"` standard flex behavior).
- Drawer slides from the opposite side.
- Icons and text align correctly.

## 3. Behavior & Interactions

### Scrolling
- **Sticky Positioning**: The navbar must be sticky at the top of the viewport (`position: sticky; top: 0; z-index: 50`).
- **Scroll State**: When scrolled past the top (`scrollY > 0`), the navbar should gain a subtle drop shadow and a solid background (e.g., glassmorphism effect: `bg-background/80 backdrop-blur-md border-b`) to separate it from the content.

### Animations (GSAP & CSS)
*As requested, the navbar must incorporate premium, dynamic animations.*
- **Initial Load Animation**:
  - The navbar should slide down from the top of the screen (`y: -100%` to `y: 0`) and fade in (`opacity: 0` to `opacity: 1`) on page load. Use GSAP for this staggered entrance.
  - **Nav Links Stagger**: The logo, nav links, and CTA buttons should stagger in smoothly one after another.
- **Hover Effects**:
  - **Links**: Nav links should have an animated underline effect on hover (e.g., using an `::after` pseudo-element that scales from `0` to `1` on `transformX`).
  - **Buttons**: Slight scale up (`scale: 1.05`) or color transition on hover using CSS transitions or GSAP to provide a premium feel.
- **Mobile Menu Toggle**:
  - The hamburger icon should animate into a 'Close' (X) state when opened.
  - The mobile drawer items should use a GSAP stagger fade-in and slight vertical slide when the drawer is opened.
- **Active State Indicator**:
  - Implement a scrollspy-like feature (using `IntersectionObserver` or GSAP ScrollTrigger) to highlight the currently active section link in the navbar as the user scrolls down the page.

## 4. State Management
- `isScrolled`: Boolean state to track if the page has scrolled past 0, to apply the glassmorphism/shadow styling.
- `isMobileMenuOpen`: Boolean state for the shadcn `Sheet` open/close state.

## 5. Dependencies & Components
- `gsap` for load and scroll animations.
- `lucide-react` for icons (Menu, X, Globe for language).
- `shadcn/ui`: `Button`, `Sheet` (for mobile nav).
- `react-i18next`: For translated strings (`landing.nav.*`).

## 6. Accessibility
- Use `<nav>` semantic HTML tag.
- `aria-label="Main Navigation"`.
- Hamburger button must have `aria-expanded` and `aria-controls`.
- Ensure focus states are clearly visible for keyboard navigation.
- If `prefers-reduced-motion` is enabled, disable GSAP slide-in animations.
