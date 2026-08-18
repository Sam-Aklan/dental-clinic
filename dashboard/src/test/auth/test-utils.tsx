/* eslint-disable react-refresh/only-export-components */
import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RegisterPayload, User } from "@/types";

if (typeof globalThis.ResizeObserver === "undefined") {
	class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}

	globalThis.ResizeObserver = ResizeObserver as typeof globalThis.ResizeObserver;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
}

export function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export const authUserEn: User = {
	id: "user-en",
	email: "en@example.com",
	role: "PATIENT",
	isActive: true,
	firstName: "Amina",
	lastName: "Saleh",
	preferredLocale: "EN",
};

export const authUserAr: User = {
	id: "user-ar",
	email: "ar@example.com",
	role: "DOCTOR",
	isActive: true,
	firstName: "Yousef",
	lastName: "Hassan",
	preferredLocale: "AR",
};

export const authUserWithoutLocale = {
	id: "user-none",
	email: "none@example.com",
	role: "RECEPTIONIST",
	isActive: true,
	firstName: "No",
	lastName: "Locale",
} as unknown as User;

export const loginResponse = {
	accessToken: "token-123",
	user: authUserEn,
};

export const registerPayload: RegisterPayload = {
	firstName: "Sara",
	lastName: "Ali",
	email: "sara@example.com",
	password: "Password123!",
};

export function deferredPromise<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

export async function flushPromises() {
	await Promise.resolve();
	await Promise.resolve();
}
