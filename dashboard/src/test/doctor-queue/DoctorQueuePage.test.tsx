import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/common-components/test-utils";
import { DoctorQueuePage } from "@/components/doctor-queue";

const queueState = {
	clinicDate: "2026-05-11",
	filters: { state: { statuses: [], showFinished: false }, toggleStatus: vi.fn(), toggleShowFinished: vi.fn(), clearFilters: vi.fn() },
	queueQuery: { data: [], isLoading: false, isError: false, refetch: vi.fn() },
	sections: { summary: { inSession: 0, waiting: 0, upcoming: 0, completed: 0, noShow: 0 }, sections: [{ key: "waiting", appointments: [] }] },
	socket: { connectionState: "connected" as const, isReconnecting: false },
};

const doctorProfileState = {
	data: { id: "doctor-1", firstName: "Sara", lastName: "Ahmed", specialization: "Orthodontics" },
	isLoading: false,
	isError: false,
	error: null as unknown,
};

const authState = { user: { doctorProfileId: "doctor-1" } };

vi.mock("@/stores", () => ({
	useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

vi.mock("@/hooks/doctors-admin", () => ({
	useDoctor: () => doctorProfileState,
}));

vi.mock("@/hooks/doctor-queue", () => ({
	useDoctorQueueDate: () => ({ clinicDate: queueState.clinicDate }),
	useDoctorQueueFilters: () => queueState.filters,
	useDoctorQueueQuery: () => queueState.queueQuery,
	useDoctorQueueSections: () => queueState.sections,
	useDoctorQueueSocket: () => queueState.socket,
	useAppointmentStatusMutation: () => ({ mutate: vi.fn() }),
	useAppointmentNoteMutation: () => ({ mutate: vi.fn() }),
}));

beforeEach(() => {
	vi.clearAllMocks();
	doctorProfileState.isError = false;
	doctorProfileState.error = null as unknown;
});

describe("DoctorQueuePage", () => {
	it("shows the linked doctor profile context", () => {
		renderWithProviders(<DoctorQueuePage />);

		expect(screen.getByText("Doctor Queue")).toBeInTheDocument();
		expect(screen.getByText("Doctor profile context")).toBeInTheDocument();
		expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
		expect(screen.getByText("Orthodontics")).toBeInTheDocument();
	});

	it("shows a non-blocking warning when the profile lookup is forbidden", () => {
		doctorProfileState.isError = true;
		doctorProfileState.error = { response: { status: 403 } };

		renderWithProviders(<DoctorQueuePage />);

		expect(screen.getByText("Could not load doctor profile")).toBeInTheDocument();
		expect(screen.getByText("Queue data is still available, but your profile context could not be loaded.")).toBeInTheDocument();
		expect(screen.getByText("Doctor Queue")).toBeInTheDocument();
	});
});
