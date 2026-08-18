import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/shared/language-switcher/LanguageSwitcher";
import { renderWithProviders } from "@/test/common-components/test-utils";
import i18next from "@/i18n";
import userEvent from "@testing-library/user-event";

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    await i18next.changeLanguage("en");
    localStorage.clear();
  });

  it("renders with AR label in English mode", () => {
    renderWithProviders(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("AR");
  });

  it("renders with EN label in Arabic mode", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("EN");
  });

  it("switches to Arabic on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    await user.click(button);
    expect(i18next.language).toBe("ar");
  });

  it("switches to English on click from Arabic", async () => {
    const user = userEvent.setup();
    await i18next.changeLanguage("ar");
    renderWithProviders(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    await user.click(button);
    expect(i18next.language).toBe("en");
  });

  it("sets aria-pressed when Arabic is active", async () => {
    await i18next.changeLanguage("ar");
    renderWithProviders(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("does not set aria-pressed when English is active", () => {
    renderWithProviders(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("works without AuthProvider", () => {
    renderWithProviders(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
