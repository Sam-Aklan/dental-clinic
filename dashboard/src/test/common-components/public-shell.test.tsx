import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { PublicShell } from "@/components/shared/public-shell";
import { renderWithProviders } from "@/test/common-components/test-utils";

describe("PublicShell", () => {
  it("renders children", () => {
    renderWithProviders(
      <PublicShell>
        <p>Public content</p>
      </PublicShell>
    );
    expect(screen.getByText("Public content")).toBeInTheDocument();
  });

  it("renders main landmark with correct id", () => {
    renderWithProviders(
      <PublicShell>
        <p>Content</p>
      </PublicShell>
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
  });

  it("renders language switcher by default", () => {
    renderWithProviders(
      <PublicShell>
        <p>Content</p>
      </PublicShell>
    );
    expect(screen.getByText("AR")).toBeInTheDocument();
  });

  it("hides language switcher when showLanguageSwitcher is false", () => {
    renderWithProviders(
      <PublicShell showLanguageSwitcher={false}>
        <p>Content</p>
      </PublicShell>
    );
    expect(screen.queryByText("AR")).not.toBeInTheDocument();
  });

  it("does not render authenticated sidebar", () => {
    renderWithProviders(
      <PublicShell>
        <p>Content</p>
      </PublicShell>
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("works without auth provider", () => {
    // PublicShell does not depend on AuthContext — should render fine
    renderWithProviders(
      <PublicShell>
        <p>No auth</p>
      </PublicShell>
    );
    expect(screen.getByText("No auth")).toBeInTheDocument();
  });
});
