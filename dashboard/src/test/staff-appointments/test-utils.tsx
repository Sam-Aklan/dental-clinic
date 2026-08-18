import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

if (!(HTMLElement.prototype as Partial<HTMLElement>).hasPointerCapture) {
	Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
		value: () => false,
		configurable: true,
	});
	Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
		value: () => undefined,
		configurable: true,
	});
	Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
		value: () => undefined,
		configurable: true,
	});
	Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
		value: () => undefined,
		configurable: true,
	});
}

export function createStaffAppointmentsQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function renderWithStaffAppointmentsProviders(ui: ReactNode) {
	const queryClient = createStaffAppointmentsQueryClient();
	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<I18nextProvider i18n={i18n}>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</I18nextProvider>
		);
	}

	return { queryClient, ...render(ui, { wrapper: Wrapper }) };
}
