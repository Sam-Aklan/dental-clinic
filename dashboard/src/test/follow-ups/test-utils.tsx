import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

if (!(HTMLElement.prototype as Partial<HTMLElement>).hasPointerCapture) {
	Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", { value: () => false, configurable: true });
	Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { value: () => undefined, configurable: true });
	Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", { value: () => undefined, configurable: true });
	Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { value: () => undefined, configurable: true });
}

if (!window.matchMedia) {
	Object.defineProperty(window, "matchMedia", {
		value: () => ({ matches: false, media: "", onchange: null, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false }),
		configurable: true,
	});
}

export function createFollowUpQueryClient() {
	return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

export async function setFollowUpLanguage(locale: "en" | "ar") {
	await i18n.changeLanguage(locale);
	document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export function renderWithFollowUpProviders(ui: ReactNode) {
	const queryClient = createFollowUpQueryClient();
	const user = userEvent.setup();
	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<I18nextProvider i18n={i18n}>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</I18nextProvider>
		);
	}

	return { queryClient, user, ...render(ui, { wrapper: Wrapper }) };
}
