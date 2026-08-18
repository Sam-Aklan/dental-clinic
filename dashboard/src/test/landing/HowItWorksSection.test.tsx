import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
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

describe("HowItWorksSection", () => {
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

  it("renders the heading and all steps in English", () => {
    renderWithProviders(<HowItWorksSection />);

    // Check heading
    expect(screen.getByText("How It Works")).toBeInTheDocument();

    // Check steps
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Create a free account with your email in under a minute.")).toBeInTheDocument();

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Choose a Slot")).toBeInTheDocument();
    expect(screen.getByText("Pick a doctor, date, and available time that works for you.")).toBeInTheDocument();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Get Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Receive an instant email confirmation for your booking.")).toBeInTheDocument();

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Show Up")).toBeInTheDocument();
    expect(screen.getByText("We'll remind you 24 hours before — no surprises.")).toBeInTheDocument();
  });

  it("renders the heading and all steps in Arabic", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<HowItWorksSection />);

    // Check heading in Arabic
    expect(screen.getByText("كيف يعمل")).toBeInTheDocument();

    // Check steps in Arabic
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("سجّل")).toBeInTheDocument();
    expect(screen.getByText("أنشئ حساباً مجانياً ببريدك الإلكتروني في أقل من دقيقة.")).toBeInTheDocument();

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("اختر موعداً")).toBeInTheDocument();
    expect(screen.getByText("اختر الطبيب والتاريخ والوقت المناسب لك.")).toBeInTheDocument();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("احصل على التأكيد")).toBeInTheDocument();
    expect(screen.getByText("ستصلك رسالة تأكيد فورية على بريدك الإلكتروني.")).toBeInTheDocument();

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("احضر في الموعد")).toBeInTheDocument();
    expect(screen.getByText("سنذكّرك قبل 24 ساعة — بدون مفاجآت.")).toBeInTheDocument();
  });
});
