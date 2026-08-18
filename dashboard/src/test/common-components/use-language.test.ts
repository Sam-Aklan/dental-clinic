import { describe, it, expect, beforeEach } from "vitest";
import { useLanguage } from "@/hooks/use-language";
import { act, renderHook } from "@testing-library/react";
import i18next from "@/i18n";

describe("useLanguage", () => {
  beforeEach(async () => {
    await i18next.changeLanguage("en");
    localStorage.clear();
  });

  it("returns lang en and dir ltr initially", () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.lang).toBe("en");
    expect(result.current.dir).toBe("ltr");
  });

  it("returns lang ar and dir rtl after language change", async () => {
    const { result } = renderHook(() => useLanguage());
    await act(async () => {
      await i18next.changeLanguage("ar");
    });
    expect(result.current.lang).toBe("ar");
    expect(result.current.dir).toBe("rtl");
  });

  it("isRtl is false for en, true for ar", async () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.isRtl).toBe(false);
    await act(async () => {
      await i18next.changeLanguage("ar");
    });
    expect(result.current.isRtl).toBe(true);
  });

  it("toggle switches language", async () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.lang).toBe("en");
    await act(async () => {
      result.current.toggle();
    });
    expect(result.current.lang).toBe("ar");
    await act(async () => {
      result.current.toggle();
    });
    expect(result.current.lang).toBe("en");
  });

  it("setLanguage changes language", async () => {
    const { result } = renderHook(() => useLanguage());
    await act(async () => {
      result.current.setLanguage("ar");
    });
    expect(result.current.lang).toBe("ar");
    expect(result.current.dir).toBe("rtl");
  });

  it("persists language via i18next localStorage key lang", async () => {
    const { result } = renderHook(() => useLanguage());
    await act(async () => {
      result.current.toggle();
    });
    expect(localStorage.getItem("lang")).toBe("ar");
    await act(async () => {
      result.current.toggle();
    });
    expect(localStorage.getItem("lang")).toBe("en");
  });

  it("syncs document element attributes", async () => {
    renderHook(() => useLanguage());
    await act(async () => {
      await i18next.changeLanguage("ar");
    });
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    await act(async () => {
      await i18next.changeLanguage("en");
    });
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });
});
