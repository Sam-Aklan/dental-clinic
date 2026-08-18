import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import i18n from "@/i18n";
import { MyAppointmentsPage } from "@/components/appointments";
import { renderWithAppointmentsProviders } from "./test-utils";
import { listWithMixedAppointments } from "./fixtures";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/appointments", () => ({
	useAppointmentsQuery: () => ({ data: listWithMixedAppointments(), isLoading: false, isError: false, refetch: vi.fn() }),
	useAppointmentSearchState: () => ({
		state: { tab: "upcoming", doctorId: null, statuses: ["PENDING", "CONFIRMED", "IN_PROGRESS"], page: 1, createdAppointmentId: null },
		setTab: vi.fn(),
		setDoctorId: vi.fn(),
		setStatuses: vi.fn(),
		setPage: vi.fn(),
		clearFilters: vi.fn(),
	}),
	useCancelAppointmentMutation: () => ({ mutate: vi.fn(), isPending: false }),
	useCreatedAppointmentHighlight: () => false,
}));

describe("MyAppointmentsPage accessibility and i18n", () => {
	it("renders Arabic copy and RTL direction", async () => {
		await i18n.changeLanguage("ar");
		renderWithAppointmentsProviders(<MyAppointmentsPage />);
		expect(screen.getByText("مواعيدي")).toBeInTheDocument();
		expect(document.querySelector("[dir='rtl']")).toBeTruthy();
		await i18n.changeLanguage("en");
	});
});
