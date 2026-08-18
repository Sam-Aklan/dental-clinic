import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { renderWithProviders } from "@/test/common-components/test-utils";
import i18next from "@/i18n";

// Mock router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: Record<string, unknown>) => (
    <a href={String(to)} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock doctors query
vi.mock("@/hooks/booking", () => ({
  useDoctorsQuery: vi.fn(() => ({
    data: [{ id: "doc-1", firstName: "Jane", lastName: "Doe", isActive: true }],
    isLoading: false,
  })),
}));

describe("LandingFooter", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18next.changeLanguage("en");
  });

  it("renders brand section with name and tagline", () => {
    renderWithProviders(<LandingFooter />);
    expect(screen.getByText("Dental Clinic")).toBeInTheDocument();
    expect(screen.getByText("Quality dental care, made simple.")).toBeInTheDocument();
  });

  it("renders quick links column", () => {
    renderWithProviders(<LandingFooter />);
    expect(screen.getByText("Quick Links")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
  });

  it("renders contact info column with active links", () => {
    renderWithProviders(<LandingFooter />);
    expect(screen.getByText("Contact Us")).toBeInTheDocument();

    const mailLink = screen.getByRole("link", { name: "info@dentalclinic.com" });
    expect(mailLink).toHaveAttribute("href", "mailto:info@dentalclinic.com");

    const phoneLink = screen.getByRole("link", { name: "+1 (555) 000-0000" });
    expect(phoneLink).toHaveAttribute("href", "tel:+15550000000");
  });

  it("renders social media links with accessible labels", () => {
    renderWithProviders(<LandingFooter />);
    expect(screen.getByRole("link", { name: "Visit our Facebook page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Visit our Instagram page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Visit our X page" })).toBeInTheDocument();
  });

  it("renders dynamic copyright year", () => {
    const currentYear = new Date().getFullYear();
    renderWithProviders(<LandingFooter />);
    expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument();
  });

  it("translates correct keys when switching to Arabic", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<LandingFooter />);
    expect(screen.getByText("عيادة الأسنان")).toBeInTheDocument();
    expect(screen.getByText("رعاية أسنان عالية الجودة، بكل بساطة.")).toBeInTheDocument();
    expect(screen.getByText("روابط سريعة")).toBeInTheDocument();
    expect(screen.getByText("اتصل بنا")).toBeInTheDocument();
    expect(screen.getByText("تابعنا")).toBeInTheDocument();
  });
});
