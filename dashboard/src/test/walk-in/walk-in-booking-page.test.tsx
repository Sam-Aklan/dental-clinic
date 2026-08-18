import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	useSearch: () => ({}),
}));

vi.mock("@/hooks/booking", () => ({
	useAvailableSlotsQuery: vi.fn(),
	useCreateStaffAppointmentMutation: vi.fn(),
	useDoctorsQuery: vi.fn(),
}));

vi.mock("@/hooks/patients", () => ({
	usePatientDetailQuery: vi.fn(),
	usePatientSearchQuery: vi.fn(),
}));

vi.mock("@/hooks/clinic-settings", () => ({
	useClinicSettings: vi.fn(),
}));

import { WalkInBookingPage } from "@/components/walk-in";
import { useAvailableSlotsQuery, useCreateStaffAppointmentMutation, useDoctorsQuery } from "@/hooks/booking";
import { useClinicSettings } from "@/hooks/clinic-settings";
import { usePatientDetailQuery, usePatientSearchQuery } from "@/hooks/patients";

const mockedUseDoctorsQuery = vi.mocked(useDoctorsQuery);
const mockedUseAvailableSlotsQuery = vi.mocked(useAvailableSlotsQuery);
const mockedUseCreateStaffAppointmentMutation = vi.mocked(useCreateStaffAppointmentMutation);
const mockedUsePatientDetailQuery = vi.mocked(usePatientDetailQuery);
const mockedUsePatientSearchQuery = vi.mocked(usePatientSearchQuery);
const mockedUseClinicSettings = vi.mocked(useClinicSettings);

beforeEach(() => {
	vi.clearAllMocks();
	mockedUseDoctorsQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() } as never);
	mockedUseAvailableSlotsQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() } as never);
	mockedUseCreateStaffAppointmentMutation.mockReturnValue({
		mutation: { mutateAsync: vi.fn() },
		generateIdempotencyKey: vi.fn(),
		isPending: false,
	} as never);
	mockedUsePatientDetailQuery.mockReturnValue({ data: undefined, isLoading: false, isSuccess: false, isError: false, error: undefined } as never);
	mockedUsePatientSearchQuery.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false, refetch: vi.fn() } as never);
	mockedUseClinicSettings.mockReturnValue({
		data: { slotDurationMinutes: 45, timeZone: "UTC" },
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	} as never);
});

describe("WalkInBookingPage timing context", () => {
	it("shows the clinic timing context when clinic settings are available", async () => {
		render(<WalkInBookingPage />);

		expect(await screen.findByText("Appointment duration: 45 minutes")).toBeInTheDocument();
		expect(screen.getByText("Clinic timezone: UTC")).toBeInTheDocument();
	});

	it("hides the clinic timing context while settings are unavailable", async () => {
		mockedUseClinicSettings.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as never);

		render(<WalkInBookingPage />);

		await waitFor(() => {
			expect(screen.queryByText("Appointment duration: 45 minutes")).not.toBeInTheDocument();
		});
	});
});
