# Spec: Landing Page Footer

**Component**: `LandingFooter`
**Location**: `frontend/src/features/landing/components/LandingFooter.tsx`

---

## 1. Overview
The Footer serves as the bottom anchor of the landing page, providing secondary navigation, contact information, branding, and legal/copyright details.

## 2. Layout & Structure

### Grid Layout (Desktop)
- Use a 4-column CSS Grid (`grid-cols-1 md:grid-cols-4 gap-8`) wrapped in a max-width container (`max-w-7xl` or similar) with padding.
- **Column 1: Brand & Tagline**
  - Clinic Logo (SVG) and Name.
  - A short tagline (`landing.footer.tagline`).
  - Brief clinic address or physical location summary.
- **Column 2: Quick Links**
  - Title: "Quick Links" (`landing.footer.quickLinks`).
  - Links: Home (`#hero`), Book Appointment (`/register`), Login (`/login`), Register (`/register`), View Live Queue (`/lobby/<defaultDoctorId>`).
- **Column 3: Contact Info**
  - Title: "Contact Us" (`landing.footer.contact`).
  - Email address (clickable `mailto:` link).
  - Phone number (clickable `tel:` link).
  - Link to Google Maps for directions (optional).
- **Column 4: Social Media & Extras**
  - Title: "Follow Us" (optional/placeholder).
  - Social media icon links (Facebook, Instagram, Twitter/X). Placeholder `#` if not available yet.

### Bottom Bar
- A full-width bottom section separated by a subtle top border (`border-t border-border`).
- **Left Side**: Copyright notice `© {year} Dental Clinic. All rights reserved.` (`landing.footer.copyright`).
- **Right Side**: Language Switcher (replicated from navbar for convenience at the bottom of the page) or secondary legal links (Privacy Policy, Terms of Service placeholders).

### Mobile Layout
- Grid collapses to a single column (`grid-cols-1`).
- Items are stacked vertically with appropriate spacing (`gap-6`).
- Left-aligned text is generally preferred for readability, even on mobile.
- Bottom bar stacks copyright and language switcher vertically.

### RTL Support (Arabic)
- Grid columns naturally reverse in RTL mode.
- Text alignment should use CSS logical properties (`text-start`, `items-start`, `ps-*`, `me-*`).

## 3. Behavior & Interactions
- **Link Hover States**: 
  - Subtle color change (e.g., text fading to `--primary`) or underline on hover for all links.
  - Utilize micro-animations for interactivity.
- **Social Icons**: Scale up slightly (`hover:scale-110`) or change color on hover with a smooth transition.
- **Dynamic Year**: The copyright year should be calculated dynamically in React (`new Date().getFullYear()`).

## 4. Dependencies & Components
- `lucide-react` for contact icons (Phone, Mail, MapPin) and social icons.
- `react-i18next` for translated strings (`landing.footer.*`).
- standard semantic HTML tags (no heavy UI framework components necessary besides icons).

## 5. Accessibility
- Use the `<footer>` semantic HTML tag for the outer wrapper.
- Ensure adequate color contrast between text (`text-muted-foreground`) and background (`bg-card` or `bg-background`).
- Social links must have descriptive `aria-label`s explaining the destination (e.g., `aria-label="Visit our Facebook page"`).
- Links should have clear focus rings for keyboard navigation.
