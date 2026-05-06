# Spec: Landing Page (Marketing / Public Home)

**Route**: `/`  
**Component**: `LandingPage`  
**Auth**: Public (no auth required)  
**File**: `frontend/src/features/landing/pages/LandingPage.tsx`

---

## 1. Purpose

The public-facing marketing page that:

1. Communicates the clinic's value proposition to prospective patients.
2. Drives conversions to **Register** and **Login**.
3. Provides a direct link to the **Lobby Queue** display for in-clinic kiosk use.
4. Works fully in **English (LTR)** and **Arabic (RTL)** via react-i18next.

---

## 2. Sections (top → bottom)

### 2.1 Navbar
- Logo (text or SVG icon) + clinic name on the left.
- Navigation links: **Home**, **Services**, **How It Works**, **Contact** (smooth-scroll anchors within the page).
- Right side: **Language Switcher** (`EN | AR`) + **Login** button (outline) + **Register** button (filled primary).
- Sticky on scroll (`position: sticky; top: 0; z-index: 50`).
- Mobile: hamburger menu collapses nav links; CTA buttons remain visible.
- RTL: logo on the right, nav links reversed, buttons on the left.

**Components used**: `LanguageSwitcher`, shadcn `Button`, `Sheet` (mobile drawer).

---

### 2.2 Hero Section
- Full-width section, min-height `100vh` (or `90vh` on desktop).
- **Left column** (60%):
  - Eyebrow text: `"Modern Dental Care"` (small, muted).
  - `<h1>` headline: `"Book Your Dental Appointment Online"`.
  - Subheadline paragraph: brief description (2–3 sentences) of convenient online booking, real-time queue, and no wait surprises.
  - Two CTA buttons stacked horizontally:
    - **"Book an Appointment"** → `/register` (primary, large).
    - **"View Live Queue"** → `/lobby/<defaultDoctorId>` (secondary/outline, large).
  - Trust indicators row (icons + text): `✓ Same-Day Slots  ✓ 24h Cancellation  ✓ Email Reminders`.
- **Right column** (40%): illustration or stock photo of dental chair / smiling patient (lazy-loaded `<img>`).
- RTL: columns swap, text alignment flips.

**i18n keys**: `landing.hero.eyebrow`, `landing.hero.headline`, `landing.hero.subheadline`, `landing.hero.cta.book`, `landing.hero.cta.queue`, `landing.hero.trust.*`

---

### 2.3 Stats Bar
- 3–4 animated counters after viewport entry (IntersectionObserver):
  - `500+` Patients Served
  - `98%` Satisfaction Rate
  - `3` Specialist Doctors
  - `< 5 min` Average Wait Time
- Light background contrast strip separating hero from features.

**i18n keys**: `landing.stats.*`

---

### 2.4 Features / Why Us Section (`id="features"`)
- Section heading: `"Why Choose Our Clinic"`.
- 3-column grid (1-col on mobile, 2-col on tablet, 3-col on desktop) of Feature Cards:

| Icon | Title | Body |
|---|---|---|
| 🗓 Calendar | Online Booking | Book anytime from any device without calling. |
| 🔔 Bell | Smart Reminders | Automatic email reminders before your appointment. |
| 🔄 Refresh | Waitlist Engine | Get notified automatically when a cancellation matches your window. |
| 📍 Queue | Live Queue Display | See your position in real time on any screen. |
| 🌐 Globe | Bilingual | Full Arabic and English support with RTL layout. |
| 🔒 Shield | Secure & Private | JWT auth, encrypted passwords, RBAC. |

Each card: icon (shadcn/lucide), bold title, short body text, subtle hover lift shadow.

**i18n keys**: `landing.features.title`, `landing.features.cards.*.title`, `landing.features.cards.*.body`

---

### 2.5 How It Works Section (`id="how-it-works"`)
- Section heading: `"How It Works"`.
- Horizontal stepper (4 steps, collapses to vertical on mobile):

| Step | Title | Description |
|---|---|---|
| 1 | Register | Create a free account with your email. |
| 2 | Choose a Slot | Pick a doctor, date, and available time slot. |
| 3 | Get Confirmed | Receive an instant email confirmation. |
| 4 | Show Up | We'll remind you 24h before — no surprises. |

Steps connected by a dashed line on desktop. Each step: circle number badge, title, description.

**i18n keys**: `landing.howItWorks.title`, `landing.howItWorks.steps.*.title`, `landing.howItWorks.steps.*.desc`

---

### 2.6 Testimonials Section (`id="services"`)
- Section heading: `"What Our Patients Say"`.
- 3 testimonial cards in a horizontal scroll / grid:
  - Avatar (initials-based fallback), patient name (anonymized), star rating (1–5), quote text.
- Static data (no API call); hardcoded in the component or a local JSON file.
- Cards use shadcn `Card` component.

**i18n keys**: `landing.testimonials.title`, `landing.testimonials.items.*.name`, `landing.testimonials.items.*.quote`

---

### 2.7 Call-to-Action Banner
- Full-width accent-color strip.
- Large centered text: `"Ready to book your next appointment?"`.
- Single large **"Get Started"** button → `/register`.
- Secondary link: `"Already have an account? Log in"` → `/login`.

**i18n keys**: `landing.cta.heading`, `landing.cta.button`, `landing.cta.login`

---

### 2.8 Footer (`id="contact"`)
- **Column 1**: Clinic logo + name + tagline + address/phone placeholder.
- **Column 2**: Quick links (Home, Book, Login, Register, Lobby Queue).
- **Column 3**: Contact info placeholder (email, phone, map link).
- **Column 4** (optional): Social media icons (placeholder hrefs `#`).
- Bottom bar: copyright `© {year} Dental Clinic. All rights reserved.` + language switcher repeat.
- RTL: columns reverse direction.

**i18n keys**: `landing.footer.*`

---

## 3. Component Tree

```
LandingPage
├── LandingNavbar
│   ├── LanguageSwitcher
│   └── NavLinks + CTAButtons
├── HeroSection
│   └── TrustBadges
├── StatsBar
│   └── AnimatedCounter (×4)
├── FeaturesSection
│   └── FeatureCard (×6)
├── HowItWorksSection
│   └── StepCard (×4)
├── TestimonialsSection
│   └── TestimonialCard (×3)
├── CTABanner
└── LandingFooter
```

All sub-components are **local** to `features/landing/` — do not place them in `features/common/` unless reused elsewhere.

---

## 4. File Layout

```
frontend/src/features/landing/
├── pages/
│   └── LandingPage.tsx
├── components/
│   ├── LandingNavbar.tsx
│   ├── HeroSection.tsx
│   ├── StatsBar.tsx
│   ├── AnimatedCounter.tsx
│   ├── FeaturesSection.tsx
│   ├── FeatureCard.tsx
│   ├── HowItWorksSection.tsx
│   ├── StepCard.tsx
│   ├── TestimonialsSection.tsx
│   ├── TestimonialCard.tsx
│   ├── CTABanner.tsx
│   └── LandingFooter.tsx
└── data/
    └── landing-data.ts          # static testimonials, features list
```

---

## 5. Routing

In `app/router.tsx`:

```tsx
{ path: '/', element: <RootLayout><LandingPage /></RootLayout> }
```

`RootLayout` provides the HTML shell but **not** a navbar — `LandingPage` owns its own `LandingNavbar` because the landing navbar differs from the authenticated app navbar.

---

## 6. Behaviour Details

### 6.1 Language Switching
- `LanguageSwitcher` calls `i18n.changeLanguage(lang)`, saves to `localStorage`, and sets `document.documentElement.lang` + `document.documentElement.dir`.
- All section text re-renders from i18n keys immediately.
- CSS uses logical properties throughout so layout flips automatically.

### 6.2 Smooth Scrolling
- Nav links use `href="#features"` etc. with `scroll-behavior: smooth` on `<html>`.
- Or implement via `element.scrollIntoView({ behavior: 'smooth' })` onClick.

### 6.3 Animated Counters
- `AnimatedCounter` accepts `target: number`, `duration: number`, `suffix?: string`.
- Uses `IntersectionObserver` to start counting only when the stats bar enters viewport.
- Increments via `requestAnimationFrame` easing function.

### 6.4 Mobile Navbar
- shadcn `Sheet` component slides in from the side (flips side in RTL).
- Hamburger icon toggles open/close.
- Closes on navigation or outside click.

### 6.5 Lobby Queue Link
- The "View Live Queue" button links to `/lobby/:doctorId`.
- Since the landing page has no auth, use a hardcoded default doctor ID from env (`VITE_DEFAULT_DOCTOR_ID`) or query `GET /doctors` for the first active doctor.
- If `VITE_DEFAULT_DOCTOR_ID` is undefined, the button is hidden until the API resolves.

---

## 7. i18n Translation Keys

### English (`i18n/en.json` additions)

```json
{
  "landing": {
    "nav": {
      "home": "Home",
      "features": "Features",
      "howItWorks": "How It Works",
      "contact": "Contact",
      "login": "Login",
      "register": "Register"
    },
    "hero": {
      "eyebrow": "Modern Dental Care",
      "headline": "Book Your Dental Appointment Online",
      "subheadline": "Skip the phone calls. Pick a slot, get confirmed, and receive a reminder — all in minutes.",
      "cta": {
        "book": "Book an Appointment",
        "queue": "View Live Queue"
      },
      "trust": {
        "slots": "Same-Day Slots",
        "cancel": "24h Cancellation",
        "reminders": "Email Reminders"
      }
    },
    "stats": {
      "patients": "Patients Served",
      "satisfaction": "Satisfaction Rate",
      "doctors": "Specialist Doctors",
      "waitTime": "Avg. Wait Time"
    },
    "features": {
      "title": "Why Choose Our Clinic",
      "cards": {
        "booking": { "title": "Online Booking", "body": "Book anytime from any device without calling." },
        "reminders": { "title": "Smart Reminders", "body": "Automatic email reminders before your appointment." },
        "waitlist": { "title": "Waitlist Engine", "body": "Get notified automatically when a cancellation matches your window." },
        "queue": { "title": "Live Queue Display", "body": "See your position in real time on any screen." },
        "bilingual": { "title": "Bilingual", "body": "Full Arabic and English support with RTL layout." },
        "secure": { "title": "Secure & Private", "body": "JWT auth, encrypted passwords, and role-based access." }
      }
    },
    "howItWorks": {
      "title": "How It Works",
      "steps": {
        "1": { "title": "Register", "desc": "Create a free account with your email in under a minute." },
        "2": { "title": "Choose a Slot", "desc": "Pick a doctor, date, and available time that works for you." },
        "3": { "title": "Get Confirmed", "desc": "Receive an instant email confirmation for your booking." },
        "4": { "title": "Show Up", "desc": "We'll remind you 24 hours before — no surprises." }
      }
    },
    "testimonials": {
      "title": "What Our Patients Say",
      "items": {
        "1": { "name": "Sara M.", "quote": "Booking online saved me so much time. I got a slot in 2 minutes!" },
        "2": { "name": "Ahmed K.", "quote": "The Arabic interface was perfect. Very easy to use." },
        "3": { "name": "Lina R.", "quote": "The waitlist feature got me an earlier appointment automatically. Brilliant." }
      }
    },
    "cta": {
      "heading": "Ready to book your next appointment?",
      "button": "Get Started",
      "login": "Already have an account? Log in"
    },
    "footer": {
      "tagline": "Quality dental care, made simple.",
      "quickLinks": "Quick Links",
      "contact": "Contact Us",
      "copyright": "© {{year}} Dental Clinic. All rights reserved."
    }
  }
}
```

### Arabic (`i18n/ar.json` additions)

```json
{
  "landing": {
    "nav": {
      "home": "الرئيسية",
      "features": "المميزات",
      "howItWorks": "كيف يعمل",
      "contact": "اتصل بنا",
      "login": "تسجيل الدخول",
      "register": "إنشاء حساب"
    },
    "hero": {
      "eyebrow": "رعاية الأسنان الحديثة",
      "headline": "احجز موعدك في عيادة الأسنان عبر الإنترنت",
      "subheadline": "تخلّص من المكالمات الهاتفية. اختر موعداً، احصل على تأكيد، وتلقَّ تذكيراً — كل ذلك في دقائق.",
      "cta": {
        "book": "احجز موعداً",
        "queue": "عرض الطابور المباشر"
      },
      "trust": {
        "slots": "مواعيد في نفس اليوم",
        "cancel": "إلغاء مجاني قبل 24 ساعة",
        "reminders": "تذكيرات بالبريد الإلكتروني"
      }
    },
    "stats": {
      "patients": "مريض تمت خدمته",
      "satisfaction": "معدل الرضا",
      "doctors": "أطباء متخصصون",
      "waitTime": "متوسط وقت الانتظار"
    },
    "features": {
      "title": "لماذا تختار عيادتنا",
      "cards": {
        "booking": { "title": "الحجز الإلكتروني", "body": "احجز في أي وقت ومن أي جهاز بدون اتصال هاتفي." },
        "reminders": { "title": "تذكيرات ذكية", "body": "تذكيرات تلقائية بالبريد الإلكتروني قبل موعدك." },
        "waitlist": { "title": "محرك قائمة الانتظار", "body": "يتم إشعارك تلقائياً عند توفر موعد ملغى يناسب نافذتك الزمنية." },
        "queue": { "title": "الطابور المباشر", "body": "شاهد موقعك في الطابور في الوقت الفعلي." },
        "bilingual": { "title": "ثنائي اللغة", "body": "دعم كامل للعربية والإنجليزية مع تخطيط RTL." },
        "secure": { "title": "آمن وخاص", "body": "مصادقة JWT وكلمات مرور مشفرة والتحكم في الوصول." }
      }
    },
    "howItWorks": {
      "title": "كيف يعمل",
      "steps": {
        "1": { "title": "سجّل", "desc": "أنشئ حساباً مجانياً ببريدك الإلكتروني في أقل من دقيقة." },
        "2": { "title": "اختر موعداً", "desc": "اختر الطبيب والتاريخ والوقت المناسب لك." },
        "3": { "title": "احصل على التأكيد", "desc": "ستصلك رسالة تأكيد فورية على بريدك الإلكتروني." },
        "4": { "title": "احضر في الموعد", "desc": "سنذكّرك قبل 24 ساعة — بدون مفاجآت." }
      }
    },
    "testimonials": {
      "title": "ماذا يقول مرضانا",
      "items": {
        "1": { "name": "سارة م.", "quote": "الحجز الإلكتروني وفّر عليّ الكثير من الوقت. حصلت على موعد في دقيقتين!" },
        "2": { "name": "أحمد خ.", "quote": "الواجهة العربية كانت مثالية. سهلة الاستخدام جداً." },
        "3": { "name": "لينا ر.", "quote": "ميزة قائمة الانتظار جلبت لي موعداً مبكراً تلقائياً. رائع." }
      }
    },
    "cta": {
      "heading": "هل أنت مستعد لحجز موعدك القادم؟",
      "button": "ابدأ الآن",
      "login": "هل لديك حساب بالفعل؟ سجّل الدخول"
    },
    "footer": {
      "tagline": "رعاية أسنان عالية الجودة، بكل بساطة.",
      "quickLinks": "روابط سريعة",
      "contact": "اتصل بنا",
      "copyright": "© {{year}} عيادة الأسنان. جميع الحقوق محفوظة."
    }
  }
}
```

---

## 8. Styling Notes

- **Tailwind classes** throughout; no inline styles.
- Use **CSS logical properties** via Tailwind plugin or custom utilities: `ps-*` (padding-start), `me-*` (margin-end), `text-start`, `items-start`.
- Color palette uses shadcn CSS variables (`--primary`, `--secondary`, `--muted`, `--accent`) so theme changes propagate automatically.
- Hero section gradient: `bg-gradient-to-br from-primary/10 to-background`.
- Stats bar: `bg-primary text-primary-foreground`.
- Features section: `bg-muted/30`.
- How it Works: `bg-background`.
- CTA Banner: `bg-primary text-primary-foreground`.
- Footer: `bg-card border-t`.

---

## 9. Accessibility

- All interactive elements have accessible labels (`aria-label` or visible text).
- Color contrast meets WCAG AA.
- Focus ring visible on all buttons and links.
- Images have `alt` text (or `alt=""` for decorative images).
- Animated counters respect `prefers-reduced-motion` (skip animation if set).
- Mobile nav uses `aria-expanded` on hamburger button.

---

## 10. Performance

- Hero image: `loading="lazy"`, `decoding="async"`, explicit `width`/`height` to avoid CLS.
- Sections below the fold: can be lazy-loaded with `React.lazy` + `Suspense` if bundle size becomes a concern.
- No API calls on page load except the optional `/doctors` fetch for the lobby link (non-blocking).

---

## 11. Acceptance Criteria

- [ ] Navbar is sticky and collapses to hamburger on mobile.
- [ ] Language switcher toggles EN ↔ AR; `<html dir>` and `<html lang>` update instantly.
- [ ] Hero headline renders in `<h1>`; page has exactly one `<h1>`.
- [ ] "Book an Appointment" CTA navigates to `/register`.
- [ ] "View Live Queue" CTA navigates to `/lobby/<doctorId>` (or is hidden if none available).
- [ ] Stats counters animate on first viewport entry; skip animation if `prefers-reduced-motion`.
- [ ] All 6 feature cards render with icon, title, and body.
- [ ] All 4 how-it-works steps render with step number, title, and description.
- [ ] All 3 testimonials render.
- [ ] Footer links navigate to correct routes.
- [ ] All strings exist in both `en.json` and `ar.json`.
- [ ] No TypeScript errors (`pnpm build` succeeds).
- [ ] Lighthouse score ≥ 90 for Performance and Accessibility on desktop.
