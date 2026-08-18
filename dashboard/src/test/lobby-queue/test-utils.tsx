import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18next from "@/i18n";

export function createLobbyQueueTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function renderWithLobbyQueueProviders(ui: ReactNode) {
	const queryClient = createLobbyQueueTestQueryClient();
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

export async function setLobbyQueueLanguage(language: "en" | "ar") {
	await i18next.changeLanguage(language);
}

export async function flushLobbyQueuePromises() {
	await Promise.resolve();
	await Promise.resolve();
}
