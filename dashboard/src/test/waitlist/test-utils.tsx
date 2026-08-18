import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";

i18n.init({
	lng: "en",
	fallbackLng: "en",
	resources: {
		en: {
			waitlist: {
				title: "My Waitlist",
				description: "Waitlist entries help you receive earlier appointment offers.",
				empty: "You have no active waitlist entries.",
				anyTime: "Any available time",
				position: "Position #{{position}}",
				joined: "Joined {{date}}",
				doctorLabel: "Doctor",
				availableFrom: "Available from",
				availableUntil: "Available until",
				join: "Join Waitlist",
				edit: "Edit",
				leave: "Leave",
				cancel: "Cancel",
				confirm: "Confirm",
				save: "Save",
				retry: "Retry",
				loadingEntries: "Loading waitlist entries...",
				loadingDoctors: "Loading doctors...",
				errorEntries: "Failed to load waitlist entries",
				errorDoctors: "Failed to load doctors",
				pending: "Processing...",
				joinedSuccess: "Successfully joined the waitlist.",
				updatedSuccess: "Availability window updated.",
				leftSuccess: "You have left the waitlist.",
				alreadyJoined: "You are already on this doctor's waitlist.",
				leaveTitle: "Leave Waitlist",
				leaveDescription: "Are you sure you want to leave this waitlist? You will stop receiving earlier appointment offers for this doctor.",
				errors: {
					doctorRequired: "Please select a doctor.",
					windowIncomplete: "Please provide both start and end times, or leave both empty.",
					windowInvalid: "End time must be later than start time.",
				},
			},
		},
	},
});

export function createWaitlistQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function renderWithWaitlistProviders(ui: ReactNode) {
	const queryClient = createWaitlistQueryClient();
	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<I18nextProvider i18n={i18n}>{children}</I18nextProvider>
			</QueryClientProvider>
		);
	}

	return {
		queryClient,
		...render(ui, { wrapper: Wrapper }),
	};
}

export function createMockNavigate() {
	return vi.fn();
}
