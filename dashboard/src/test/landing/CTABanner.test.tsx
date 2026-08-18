import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { CTABanner } from "@/components/landing/CTABanner";
import { renderWithProviders } from "@/test/common-components/test-utils";
import i18next from "@/i18n";

// Mock router Link component
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: Record<string, unknown>) => (
    <a href={String(to)} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

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

describe("CTABanner", () => {
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

  it("renders CTA Banner content in English by default", () => {
    renderWithProviders(<CTABanner />);

    // Check heading
    expect(screen.getByText("Ready to book your next appointment?")).toBeInTheDocument();

    // Check buttons/links
    const getStartedBtn = screen.getByRole("link", { name: "Get Started" });
    expect(getStartedBtn).toHaveAttribute("href", "/register");

    const loginLink = screen.getByRole("link", { name: "Already have an account? Log in" });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("renders Arabic content when language is switched", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<CTABanner />);

    // Check heading in Arabic
    expect(screen.getByText("هل أنت مستعد لحجز موعدك القادم؟")).toBeInTheDocument();

    // Check buttons/links in Arabic
    const getStartedBtn = screen.getByRole("link", { name: "ابدأ الآن" });
    expect(getStartedBtn).toHaveAttribute("href", "/register");

    const loginLink = screen.getByRole("link", { name: "هل لديك حساب بالفعل؟ سجّل الدخول" });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
