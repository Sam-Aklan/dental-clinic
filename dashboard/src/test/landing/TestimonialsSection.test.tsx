import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
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

describe("TestimonialsSection", () => {
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

  it("renders the heading and all three testimonials in English", () => {
    renderWithProviders(<TestimonialsSection />);

    // Check heading
    expect(screen.getByText("What Our Patients Say")).toBeInTheDocument();

    // Check testimonial names
    expect(screen.getByText("Sara M.")).toBeInTheDocument();
    expect(screen.getByText("Ahmed K.")).toBeInTheDocument();
    expect(screen.getByText("Lina R.")).toBeInTheDocument();

    // Check testimonial quotes
    expect(screen.getByText(/Booking online saved me so much time/i)).toBeInTheDocument();
    expect(screen.getByText(/The Arabic interface was perfect/i)).toBeInTheDocument();
    expect(screen.getByText(/The waitlist feature got me an earlier appointment/i)).toBeInTheDocument();

    // Check initials fallbacks
    expect(screen.getByText("SM")).toBeInTheDocument();
    expect(screen.getByText("AK")).toBeInTheDocument();
    expect(screen.getByText("LR")).toBeInTheDocument();
  });

  it("renders the heading and all three testimonials in Arabic", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<TestimonialsSection />);

    // Check heading in Arabic
    expect(screen.getByText("ماذا يقول مرضانا")).toBeInTheDocument();

    // Check testimonial names in Arabic
    expect(screen.getByText("سارة م.")).toBeInTheDocument();
    expect(screen.getByText("أحمد خ.")).toBeInTheDocument();
    expect(screen.getByText("لينا ر.")).toBeInTheDocument();

    // Check testimonial quotes in Arabic
    expect(screen.getByText(/الحجز الإلكتروني وفّر عليّ الكثير من الوقت/i)).toBeInTheDocument();
    expect(screen.getByText(/الواجهة العربية كانت مثالية/i)).toBeInTheDocument();
    expect(screen.getByText(/ميزة قائمة الانتظار جلبت لي موعداً مبكراً/i)).toBeInTheDocument();

    // Check initials fallbacks in Arabic
    expect(screen.getByText("سم")).toBeInTheDocument();
    expect(screen.getByText("أخ")).toBeInTheDocument();
    expect(screen.getByText("لر")).toBeInTheDocument();
  });
});
