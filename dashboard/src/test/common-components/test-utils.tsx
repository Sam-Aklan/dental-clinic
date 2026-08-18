/* eslint-disable react-refresh/only-export-components */
import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, type AuthContextValue } from "@/contexts/auth";
import type { User } from "@/types";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export interface MockAuthOptions {
  user?: User | null;
  isLoading?: boolean;
  logout?: () => Promise<void>;
}

export function createMockAuthContext(opts: MockAuthOptions = {}): AuthContextValue {
  const user = opts.user ?? null;
  return {
    user,
    isLoading: opts.isLoading ?? false,
    isAuthenticated: user !== null,
    login: vi.fn<AuthContextValue["login"]>(),
    register: vi.fn<AuthContextValue["register"]>(),
    logout: opts.logout ?? vi.fn<AuthContextValue["logout"]>(),
    refreshUser: vi.fn<AuthContextValue["refreshUser"]>(),
  };
}

export function mockUser(overrides?: Partial<User>): User {
  return {
    id: "test-user-1",
    email: "test@example.com",
    role: "PATIENT",
    isActive: true,
    firstName: "Test",
    lastName: "User",
    preferredLocale: "EN",
    ...overrides,
  };
}

interface CommonProvidersProps {
  children: React.ReactNode;
  authValue?: AuthContextValue;
}

export function CommonProviders({ children, authValue }: CommonProvidersProps) {
  const queryClient = createTestQueryClient();
  const content = (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  if (authValue) {
    return (
      <AuthContext.Provider value={authValue}>
        {content}
      </AuthContext.Provider>
    );
  }

  return content;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { authValue?: AuthContextValue },
) {
  const { authValue, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <CommonProviders authValue={authValue}>
        {children}
      </CommonProviders>
    ),
    ...renderOptions,
  });
}

export function setupUser() {
  return userEvent.setup();
}

export async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}
