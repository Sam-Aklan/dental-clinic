import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

export function createDoctorsAdminQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function renderDoctorsAdmin(ui: ReactNode) {
	const client = createDoctorsAdminQueryClient();
	return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
