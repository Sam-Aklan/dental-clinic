import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

export function createAuditLogQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function renderWithAuditLogProviders(ui: ReactNode) {
	const queryClient = createAuditLogQueryClient();
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
