import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { HeroSection } from "@/components/landing/HeroSection";
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

// Mock useDoctorsQuery from booking hooks
const mockUseDoctorsQuery = vi.fn();
vi.mock("@/hooks/booking", () => ({
  useDoctorsQuery: () => mockUseDoctorsQuery(),
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

describe("HeroSection", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18next.changeLanguage("en");

    // Default mock implementation returning active doctors
    mockUseDoctorsQuery.mockReturnValue({
      data: [
        { id: "doc-1", firstName: "Jane", lastName: "Doe", isActive: true },
        { id: "doc-2", firstName: "John", lastName: "Smith", isActive: false },
      ],
      isLoading: false,
    });

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("renders Hero Section content in English by default", () => {
    renderWithProviders(<HeroSection />);
    
    // Check eyebrow text
    expect(screen.getByText("Modern Dental Care")).toBeInTheDocument();
    
    // Check headline words are rendered
    expect(screen.getByText("Book")).toBeInTheDocument();
    expect(screen.getByText("Your")).toBeInTheDocument();
    
    // Check subheadline
    expect(screen.getByText(/Skip the phone calls/i)).toBeInTheDocument();
    
    // Check trust indicators
    expect(screen.getByText("Same-Day Slots")).toBeInTheDocument();
    expect(screen.getByText("24h Cancellation")).toBeInTheDocument();
    expect(screen.getByText("Email Reminders")).toBeInTheDocument();
  });

  it("renders Arabic content when language is switched", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<HeroSection />);

    expect(screen.getByText("رعاية الأسنان الحديثة")).toBeInTheDocument();
    expect(screen.getByText("احجز")).toBeInTheDocument();
    expect(screen.getByText("موعدك")).toBeInTheDocument();
    expect(screen.getByText(/تخلّص من المكالمات الهاتفية/i)).toBeInTheDocument();
    expect(screen.getByText("مواعيد في نفس اليوم")).toBeInTheDocument();
  });

  it("links Book an Appointment CTA to /register", () => {
    renderWithProviders(<HeroSection />);
    const bookButton = screen.getByRole("link", { name: "Book an Appointment" });
    expect(bookButton).toHaveAttribute("href", "/register");
  });

  it("links View Live Queue to first active doctor ID from useDoctorsQuery", () => {
    renderWithProviders(<HeroSection />);
    const queueButton = screen.getByRole("link", { name: "View Live Queue" });
    expect(queueButton).toHaveAttribute("href", "/lobby/doc-1");
  });

  it("prioritizes VITE_DEFAULT_DOCTOR_ID env variable when linking Live Queue", () => {
    vi.stubEnv("VITE_DEFAULT_DOCTOR_ID", "env-doc-id");
    renderWithProviders(<HeroSection />);
    const queueButton = screen.getByRole("link", { name: "View Live Queue" });
    expect(queueButton).toHaveAttribute("href", "/lobby/env-doc-id");
    vi.unstubAllEnvs();
  });

  it("hides View Live Queue button if doctor ID cannot be resolved", () => {
    mockUseDoctorsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    
    renderWithProviders(<HeroSection />);
    const queueButton = screen.queryByRole("link", { name: "View Live Queue" });
    expect(queueButton).not.toBeInTheDocument();
  });
});
