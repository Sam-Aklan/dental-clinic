import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createWalkInQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function createWalkInWrapper(queryClient = createWalkInQueryClient()) {
	function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	}

	return { queryClient, Wrapper };
}
