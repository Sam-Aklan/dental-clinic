import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { renderWithProviders } from "@/test/common-components/test-utils";
import i18next from "@/i18n";

// Mock GSAP to avoid running animations in testing environment
vi.mock("gsap", () => {
  const mockGsap = {
    timeline: () => ({
      fromTo: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    }),
    to: vi.fn(() => ({
      kill: vi.fn(),
    })),
    fromTo: vi.fn(() => ({
      kill: vi.fn(),
    })),
  };
  return {
    default: mockGsap,
    gsap: mockGsap,
  };
});

describe("FeaturesSection", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18next.changeLanguage("en");

    // Force prefers-reduced-motion to true
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("reduce"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("renders the heading and all six feature cards in English", () => {
    renderWithProviders(<FeaturesSection />);

    // Check heading
    expect(screen.getByText("Why Choose Our Clinic")).toBeInTheDocument();

    // Check features
    expect(screen.getByText("Online Booking")).toBeInTheDocument();
    expect(screen.getByText("Book anytime from any device without calling.")).toBeInTheDocument();

    expect(screen.getByText("Smart Reminders")).toBeInTheDocument();
    expect(screen.getByText("Automatic email reminders before your appointment.")).toBeInTheDocument();

    expect(screen.getByText("Waitlist Engine")).toBeInTheDocument();
    expect(screen.getByText("Get notified automatically when a cancellation matches your window.")).toBeInTheDocument();

    expect(screen.getByText("Live Queue Display")).toBeInTheDocument();
    expect(screen.getByText("See your position in real time on any screen.")).toBeInTheDocument();

    expect(screen.getByText("Bilingual")).toBeInTheDocument();
    expect(screen.getByText("Full Arabic and English support with RTL layout.")).toBeInTheDocument();

    expect(screen.getByText("Secure & Private")).toBeInTheDocument();
    expect(screen.getByText("JWT auth, encrypted passwords, and role-based access.")).toBeInTheDocument();
  });

  it("renders the heading and all six feature cards in Arabic", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<FeaturesSection />);

    // Check heading in Arabic
    expect(screen.getByText("لماذا تختار عيادتنا")).toBeInTheDocument();

    // Check features in Arabic
    expect(screen.getByText("الحجز الإلكتروني")).toBeInTheDocument();
    expect(screen.getByText("احجز في أي وقت ومن أي جهاز بدون اتصال هاتفي.")).toBeInTheDocument();

    expect(screen.getByText("تذكيرات ذكية")).toBeInTheDocument(); // wait, key in ar.json is "تذكيرات ذكية"
    expect(screen.getByText("تذكيرات تلقائية بالبريد الإلكتروني قبل موعدك.")).toBeInTheDocument();

    expect(screen.getByText("محرك قائمة الانتظار")).toBeInTheDocument();
    expect(screen.getByText("يتم إشعارك تلقائياً عند توفر موعد ملغى يناسب نافذتك الزمنية.")).toBeInTheDocument();

    expect(screen.getByText("الطابور المباشر")).toBeInTheDocument();
    expect(screen.getByText("شاهد موقعك في الطابور في الوقت الفعلي.")).toBeInTheDocument();

    expect(screen.getByText("ثنائي اللغة")).toBeInTheDocument();
    expect(screen.getByText("دعم كامل للعربية والإنجليزية مع تخطيط RTL.")).toBeInTheDocument();

    expect(screen.getByText("آمن وخاص")).toBeInTheDocument();
    expect(screen.getByText("مصادقة JWT وكلمات مرور مشفرة والتحكم في الوصول.")).toBeInTheDocument();
  });
});
