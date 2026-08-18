import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { renderWithProviders } from "@/test/common-components/test-utils";
import i18next from "@/i18n";

// Mock router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, onClick, ...props }: Record<string, unknown>) => (
    <a href={String(to)} onClick={onClick as () => void} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock useIsMobile hook
const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}));
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: useIsMobileMock,
}));

// Mock doctors query
vi.mock("@/hooks/booking", () => ({
  useDoctorsQuery: vi.fn(() => ({
    data: [{ id: "doc-1", firstName: "Jane", lastName: "Doe", isActive: true }],
    isLoading: false,
  })),
}));

// Mock GSAP to avoid animations running during tests
vi.mock("gsap", () => {
  const mockGsap = {
    timeline: () => ({
      fromTo: vi.fn().mockReturnThis(),
    }),
    fromTo: vi.fn(),
  };
  return {
    default: mockGsap,
    gsap: mockGsap,
  };
});

describe("LandingNavbar", () => {
  const scrollMock = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18next.changeLanguage("en");
    window.scrollTo = scrollMock;
    useIsMobileMock.mockReturnValue(false);

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

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

  it("renders brand logo and title in English", () => {
    renderWithProviders(<LandingNavbar />);
    expect(screen.getByText("Dental Clinic")).toBeInTheDocument();
  });

  it("renders desktop navigation links in English", () => {
    renderWithProviders(<LandingNavbar />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders authentication links on desktop", () => {
    renderWithProviders(<LandingNavbar />);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("renders in Arabic when language is changed", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<LandingNavbar />);
    expect(screen.getByText("عيادة الأسنان")).toBeInTheDocument();
    expect(screen.getByText("الرئيسية")).toBeInTheDocument();
    expect(screen.getByText("الخدمات")).toBeInTheDocument();
    expect(screen.getByText("كيف يعمل")).toBeInTheDocument();
    expect(screen.getByText("اتصل بنا")).toBeInTheDocument();
  });

  it("triggers smooth scrolling on link click", async () => {
    const user = userEvent.setup();
    const mockSection = document.createElement("div");
    mockSection.id = "services";
    document.body.appendChild(mockSection);

    renderWithProviders(<LandingNavbar />);
    const servicesLink = screen.getByText("Services");
    await user.click(servicesLink);

    expect(scrollMock).toHaveBeenCalled();
    document.body.removeChild(mockSection);
  });

  it("renders mobile layout with hamburger icon", () => {
    useIsMobileMock.mockReturnValue(true);
    renderWithProviders(<LandingNavbar />);
    
    // Check that desktop nav links are NOT directly visible in header
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument();
    
    // Check that hamburger menu button is present
    const toggleButton = screen.getByRole("button", { name: /open menu/i });
    expect(toggleButton).toBeInTheDocument();
  });
});
