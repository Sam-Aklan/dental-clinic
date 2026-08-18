import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

export function createDoctorQueueQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function renderWithDoctorQueueProviders(ui: ReactNode) {
	const queryClient = createDoctorQueueQueryClient();
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
