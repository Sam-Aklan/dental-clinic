import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { StatsBar } from "@/components/landing/StatsBar";
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

describe("StatsBar", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18next.changeLanguage("en");

    // Force prefers-reduced-motion to true so that AnimatedCounter immediately sets state to target values
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

  it("renders all four stats with labels in English", () => {
    renderWithProviders(<StatsBar />);

    // Check patients served
    expect(screen.getByText("500+")).toBeInTheDocument();
    expect(screen.getByText("Patients Served")).toBeInTheDocument();

    // Check satisfaction rate
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.getByText("Satisfaction Rate")).toBeInTheDocument();

    // Check specialist doctors
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Specialist Doctors")).toBeInTheDocument();

    // Check average wait time
    expect(screen.getByText("< 5 min")).toBeInTheDocument();
    expect(screen.getByText("Avg. Wait Time")).toBeInTheDocument();
  });

  it("renders all four stats with localized text and symbols in Arabic", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<StatsBar />);

    // Check patients served label in Arabic
    expect(screen.getByText("مريض تمت خدمته")).toBeInTheDocument();
    expect(screen.getByText("500+")).toBeInTheDocument();

    // Check satisfaction rate label in Arabic
    expect(screen.getByText("معدل الرضا")).toBeInTheDocument();
    // In Arabic satisfaction rate, `%` is a prefix so it renders as `%98`
    expect(screen.getByText("%98")).toBeInTheDocument();

    // Check specialist doctors label in Arabic
    expect(screen.getByText("أطباء متخصصون")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Check average wait time label in Arabic
    expect(screen.getByText("متوسط وقت الانتظار")).toBeInTheDocument();
    // In Arabic wait time, it renders prefix `أقل من ` and suffix ` دقائق` around value 5: `أقل من 5 دقائق`
    expect(screen.getByText("أقل من 5 دقائق")).toBeInTheDocument();
  });
});
