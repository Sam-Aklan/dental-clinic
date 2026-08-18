import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { MyAppointmentsPage } from "@/components/appointments";
import { renderWithAppointmentsProviders } from "./test-utils";
import { createAppointment, createAppointmentListResult, listWithMixedAppointments } from "./fixtures";

const mockNavigate = vi.fn();
const mockSetTab = vi.fn();
const mockSetDoctorId = vi.fn();
const mockSetStatuses = vi.fn();
const mockSetPage = vi.fn();
const mockClearFilters = vi.fn();
const mockRefetch = vi.fn();
let mockQueryResult = { data: { ...createAppointmentListResult(listWithMixedAppointments().items), total: 11 }, isLoading: false, isError: false, refetch: mockRefetch };

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/appointments", () => ({
	useAppointmentsQuery: () => mockQueryResult,
	useAppointmentSearchState: () => ({
		state: { tab: "upcoming", doctorId: null, statuses: ["PENDING", "CONFIRMED", "IN_PROGRESS"], page: 1, createdAppointmentId: null },
		setTab: mockSetTab,
		setDoctorId: mockSetDoctorId,
		setStatuses: mockSetStatuses,
		setPage: mockSetPage,
		clearFilters: mockClearFilters,
	}),
	useCancelAppointmentMutation: () => ({ mutate: vi.fn(), isPending: false }),
	useCreatedAppointmentHighlight: () => false,
}));

beforeEach(() => {
	vi.clearAllMocks();
	mockQueryResult = { data: { ...createAppointmentListResult(listWithMixedAppointments().items), total: 11 }, isLoading: false, isError: false, refetch: mockRefetch };
});

describe("MyAppointmentsPage", () => {
	it("renders the title and upcoming appointments", () => {
		renderWithAppointmentsProviders(<MyAppointmentsPage />);
		expect(screen.getByText("My Appointments")).toBeInTheDocument();
		expect(screen.getAllByText(/Ahmad Al-Rashid/).length).toBeGreaterThan(0);
	});

	it("shows pagination when needed", () => {
		renderWithAppointmentsProviders(<MyAppointmentsPage />);
		expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
	});

	it("renders the server page items for upcoming results instead of hiding page one", () => {
		mockQueryResult = {
			data: createAppointmentListResult([
				createAppointment({
					id: "appt-server-upcoming-page-1",
					startsAt: "2026-05-07T10:00:00.000Z",
					endsAt: "2026-05-07T10:30:00.000Z",
					status: "PENDING",
				}),
			]),
			isLoading: false,
			isError: false,
			refetch: mockRefetch,
		};

		renderWithAppointmentsProviders(<MyAppointmentsPage />);

		expect(screen.getAllByText(/Ahmad Al-Rashid/).length).toBeGreaterThan(0);
		expect(screen.queryByText("No upcoming appointments")).not.toBeInTheDocument();
	});
});
