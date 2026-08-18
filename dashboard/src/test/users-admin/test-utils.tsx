/* eslint-disable react-refresh/only-export-components */
import { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, type AuthContextValue } from "@/contexts/auth";
import type { AdminUserDTO } from "@/types";
import { vi } from "vitest";

export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function mockAdminUser(overrides: Partial<AdminUserDTO> = {}): AdminUserDTO {
	return {
		id: "user-1",
		firstName: "Amina",
		lastName: "Saleh",
		email: "amina@example.com",
		phone: "+962-79-1234567",
		role: "ADMIN",
		languagePreference: "en",
		isDisabled: false,
		createdAt: "2026-05-01T09:00:00.000Z",
		updatedAt: "2026-05-01T09:00:00.000Z",
		...overrides,
	};
}

export function createMockAuthContext(userId = "admin-1"): AuthContextValue {
	return {
		user: { id: userId, email: "admin@example.com", role: "ADMIN", isActive: true, firstName: "Admin", lastName: "User", preferredLocale: "EN" },
		isLoading: false,
		isAuthenticated: true,
		login: vi.fn<AuthContextValue["login"]>(),
		register: vi.fn<AuthContextValue["register"]>(),
		logout: vi.fn<AuthContextValue["logout"]>(),
		refreshUser: vi.fn<AuthContextValue["refreshUser"]>(),
	};
}

interface ProvidersProps {
	children: ReactNode;
	authValue?: AuthContextValue;
}

export function Providers({ children, authValue }: ProvidersProps) {
	const queryClient = createTestQueryClient();
	const content = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	return authValue ? <AuthContext.Provider value={authValue}>{content}</AuthContext.Provider> : content;
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper"> & { authValue?: AuthContextValue }) {
	const { authValue, ...renderOptions } = options ?? {};
	return render(ui, {
		wrapper: ({ children }) => <Providers authValue={authValue}>{children}</Providers>,
		...renderOptions,
	});
}

export function setupUser() {
	return userEvent.setup();
}
