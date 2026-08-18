import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { vi } from "vitest";

export function createPatientsQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderPatientsPage(ui: ReactNode) {
  const queryClient = createPatientsQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </I18nextProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper }) };
}

export function resetAxiosMock() {
  vi.clearAllMocks();
}
