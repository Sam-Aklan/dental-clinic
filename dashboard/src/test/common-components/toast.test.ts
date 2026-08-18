import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockWarning = vi.fn();
const mockInfo = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockSuccess(...args),
    error: (...args: unknown[]) => mockError(...args),
    warning: (...args: unknown[]) => mockWarning(...args),
    info: (...args: unknown[]) => mockInfo(...args),
  },
}));

import { showSuccess, showError, showWarning, showInfo } from "@/lib/toast";

describe("toast helpers", () => {
  beforeEach(() => {
    mockSuccess.mockClear();
    mockError.mockClear();
    mockWarning.mockClear();
    mockInfo.mockClear();
  });

  it("showSuccess calls sonner toast.success with message", () => {
    showSuccess("Operation completed");
    expect(mockSuccess).toHaveBeenCalledWith("Operation completed");
  });

  it("showError calls sonner toast.error with message", () => {
    showError("Something failed");
    expect(mockError).toHaveBeenCalledWith("Something failed");
  });

  it("showWarning calls sonner toast.warning with message", () => {
    showWarning("Proceed with caution");
    expect(mockWarning).toHaveBeenCalledWith("Proceed with caution");
  });

  it("showInfo calls sonner toast.info with message", () => {
    showInfo("For your information");
    expect(mockInfo).toHaveBeenCalledWith("For your information");
  });
});
