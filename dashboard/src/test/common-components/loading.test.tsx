import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { LoadingSpinner } from "@/components/shared/loading";
import { renderWithProviders } from "@/test/common-components/test-utils";

describe("LoadingSpinner", () => {
  it("renders compact variant with label", () => {
    renderWithProviders(<LoadingSpinner variant="compact" label="Saving..." />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Saving...");
  });

  it("renders overlay variant", () => {
    const { container } = renderWithProviders(<LoadingSpinner variant="overlay" />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-label", "Loading content");
    expect(container.querySelector(".absolute")).toBeTruthy();
  });

  it("renders section variant by default", () => {
    const { container } = renderWithProviders(<LoadingSpinner />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(container.querySelector(".py-12")).toBeTruthy();
  });

  it("renders page variant with min-h-screen", () => {
    const { container } = renderWithProviders(<LoadingSpinner variant="page" />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(container.querySelector(".min-h-screen")).toBeTruthy();
  });

  it("renders custom label", () => {
    renderWithProviders(<LoadingSpinner variant="section" label="Custom label" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Custom label");
  });

  it("uses default localized loading label when no label provided", () => {
    renderWithProviders(<LoadingSpinner variant="page" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading content");
  });

  it("renders role status on all variants", () => {
    const { container } = renderWithProviders(<LoadingSpinner variant="compact" />);
    expect(container.querySelector('[role="status"]')).toBeTruthy();

    const { container: c2 } = renderWithProviders(<LoadingSpinner variant="overlay" />);
    expect(c2.querySelector('[role="status"]')).toBeTruthy();

    const { container: c3 } = renderWithProviders(<LoadingSpinner variant="section" />);
    expect(c3.querySelector('[role="status"]')).toBeTruthy();

    const { container: c4 } = renderWithProviders(<LoadingSpinner variant="page" />);
    expect(c4.querySelector('[role="status"]')).toBeTruthy();
  });
});
