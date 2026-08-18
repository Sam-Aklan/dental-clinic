import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { vi } from "vitest";

export function createAppointmentsQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function renderWithAppointmentsProviders(ui: ReactNode) {
	const queryClient = createAppointmentsQueryClient();
	function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	}

	return {
		queryClient,
		...render(ui, { wrapper: Wrapper }),
	};
}

export function createMockNavigate() {
	return vi.fn();
}
