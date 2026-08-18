import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useForgotPasswordFlow } from "@/hooks/auth/use-forgot-password-flow";

const mockPost = vi.fn();
vi.mock("@/lib/axios-instance", () => ({
  get api() {
    return { post: mockPost };
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useForgotPasswordFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts in form view by default", () => {
    const { result } = renderHook(() => useForgotPasswordFlow(), {
      wrapper: createWrapper(),
    });

    expect(result.current.view).toBe("form");
    expect(result.current.submittedEmail).toBeNull();
    expect(result.current.apiErrorKey).toBeNull();
  });

  it("restores success view from valid localStorage cooldown on mount", () => {
    const now = Date.now();
    localStorage.setItem(
      "fp_cooldown",
      JSON.stringify({
        expiresAt: now + 30_000,
        email: "saved@example.com",
      }),
    );

    const { result } = renderHook(() => useForgotPasswordFlow(), {
      wrapper: createWrapper(),
    });

    expect(result.current.view).toBe("success");
    expect(result.current.submittedEmail).toBe("saved@example.com");
    expect(result.current.remainingSeconds).toBeGreaterThan(0);
  });

  it("clears stale cooldown on mount", () => {
    const past = Date.now() - 10_000;
    localStorage.setItem(
      "fp_cooldown",
      JSON.stringify({
        expiresAt: past,
        email: "old@example.com",
      }),
    );

    const { result } = renderHook(() => useForgotPasswordFlow(), {
      wrapper: createWrapper(),
    });

    expect(result.current.view).toBe("form");
    expect(result.current.submittedEmail).toBeNull();
    expect(localStorage.getItem("fp_cooldown")).toBeNull();
  });

  it("clears malformed cooldown on mount", () => {
    localStorage.setItem("fp_cooldown", "not-valid-json");

    const { result } = renderHook(() => useForgotPasswordFlow(), {
      wrapper: createWrapper(),
    });

    expect(result.current.view).toBe("form");
    expect(localStorage.getItem("fp_cooldown")).toBeNull();
  });

  it("clears cooldown with missing fields", () => {
    localStorage.setItem(
      "fp_cooldown",
      JSON.stringify({ something: "else" }),
    );

    const { result } = renderHook(() => useForgotPasswordFlow(), {
      wrapper: createWrapper(),
    });

    expect(result.current.view).toBe("form");
    expect(localStorage.getItem("fp_cooldown")).toBeNull();
  });

  it("submits email and transitions to success", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "ok" },
    });

    const { result } = renderHook(() => useForgotPasswordFlow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.submitEmail("user@example.com");
    });

    await waitFor(() => {
      expect(result.current.view).toBe("success");
    });

    expect(result.current.submittedEmail).toBe("user@example.com");
    expect(result.current.remainingSeconds).toBe(60);
  });

  it("sets apiErrorKey on request failure and stays in form view", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useForgotPasswordFlow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.submitEmail("user@example.com");
    });

    await waitFor(() => {
      expect(result.current.apiErrorKey).toBe("auth.errors.networkError");
    });

    expect(result.current.view).toBe("form");
  });

  it("clears apiErrorKey via clearApiError", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useForgotPasswordFlow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.submitEmail("user@example.com");
    });

    await waitFor(() => {
      expect(result.current.apiErrorKey).toBe("auth.errors.networkError");
    });

    act(() => {
      result.current.clearApiError();
    });

    expect(result.current.apiErrorKey).toBeNull();
  });
});
