import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/common-components/test-utils";
import { DoctorTodayPage } from "@/components/doctor-today";

const state = {
	date: "2026-05-11",
	week: "2026-05-11",
	tab: "today" as const,
	status: [] as string[],
	page: 1,
	sortBy: "startsAt" as const,
	sortDir: "asc" as const,
};

const setDate = vi.fn();
const setTab = vi.fn();
const setStatus = vi.fn();
const setPage = vi.fn();
const setSort = vi.fn();

const authState = { user: { doctorProfileId: "doctor-1" } };

const doctorProfileState = {
	data: { id: "doctor-1", firstName: "Sara", lastName: "Ahmed", specialization: "Orthodontics" },
	isLoading: false,
	isError: false,
	error: null as unknown,
};

const statusDistributionState = {
	data: [{ status: "PENDING", count: 1 }],
	isLoading: false,
	isError: false,
	refetch: vi.fn(),
};

vi.mock("@/stores", () => ({
	useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

vi.mock("@/hooks/doctors-admin", () => ({
	useDoctor: () => doctorProfileState,
}));

vi.mock("@/hooks/doctor-today", () => ({
	useDoctorTodayState: () => ({ state, setDate, setTab, setStatus, setPage, setSort }),
	useDoctorTodayMutations: () => ({
		updateStatus: vi.fn().mockResolvedValue(undefined),
		updateNotes: vi.fn().mockResolvedValue(undefined),
		statusMutation: { variables: null },
		notesMutation: { variables: null },
	}),
	useDoctorTodaySchedule: () => ({ data: { data: [{ id: "1", startsAt: "2026-05-11T08:00:00.000Z", endsAt: "2026-05-11T08:30:00.000Z", status: "PENDING", patientName: "Amina Ali", patientSequence: 1, notes: "", createdAt: "2026-05-11T00:00:00.000Z", updatedAt: "2026-05-11T00:00:00.000Z" }], total: 1, page: 1, pageSize: 50 }, isLoading: false, isError: false, refetch: vi.fn() }),
	useMyStats: () => ({ data: { todayTotal: 1, completed: 0, remaining: 1, inSession: 0, noShows: 0 }, isLoading: false, isError: false, refetch: vi.fn() }),
	useMyTrends: () => ({ data: [{ date: "2026-05-11", total: 1, dominantStatus: "PENDING", confirmed: 0, completed: 0, canceled: 0, noShow: 0 }], isLoading: false, isError: false, refetch: vi.fn() }),
	useMyStatusDistribution: () => statusDistributionState,
	useMyHourlyLoad: () => ({ data: [{ hour: 8, count: 1, percentage: 50 }], isLoading: false, isError: false, refetch: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe("DoctorTodayPage", () => {
	beforeEach(() => {
	vi.clearAllMocks();
	doctorProfileState.isError = false;
	doctorProfileState.error = null as unknown;
	statusDistributionState.data = [{ status: "PENDING", count: 1 }];
	statusDistributionState.isLoading = false;
	statusDistributionState.isError = false;
	});

	it("renders analytics and schedule sections", () => {
		renderWithProviders(<DoctorTodayPage />);

		expect(screen.getByText("Doctor Today")).toBeInTheDocument();
		expect(screen.getByText("Doctor profile context")).toBeInTheDocument();
		expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
		expect(screen.getByText("Today's total")).toBeInTheDocument();
		expect(screen.getByText("Week at a glance")).toBeInTheDocument();
		expect(screen.getByText("Monthly status distribution")).toBeInTheDocument();
		expect(screen.getByText("Monthly hourly load")).toBeInTheDocument();
		expect(screen.getByText("Today")).toBeInTheDocument();
		expect(screen.getByText("This Week")).toBeInTheDocument();
		expect(screen.getAllByText("Amina Ali")).toHaveLength(2);
		expect(screen.getAllByText(/Patient #1/)).toHaveLength(2);
	});

	it("wires day and tab interactions to URL state setters", async () => {
		const user = userEvent.setup();
		renderWithProviders(<DoctorTodayPage />);

		await user.click(screen.getByRole("button", { name: "This Week" }));
		expect(setTab).toHaveBeenCalledWith("thisWeek");

		await user.click(screen.getByRole("button", { name: /Mon 11|الاثنين|Mo 11/i }));
		expect(setDate).toHaveBeenCalled();
	});

	it("shows a non-blocking warning when profile lookup is not found", () => {
		doctorProfileState.isError = true;
		doctorProfileState.error = { response: { status: 404 } };

		renderWithProviders(<DoctorTodayPage />);

		expect(screen.getByText("Could not load doctor profile")).toBeInTheDocument();
		expect(screen.getByText("Schedule data is still available, but your profile context could not be loaded.")).toBeInTheDocument();
		expect(screen.getByText("Doctor Today")).toBeInTheDocument();
	});

	it("shows the empty chart state when status distribution data is not an array", () => {
		statusDistributionState.data = {} as never;

		renderWithProviders(<DoctorTodayPage />);

		expect(screen.getByText("No appointments found")).toBeInTheDocument();
		expect(screen.getByText("Try another date or clear filters.")).toBeInTheDocument();
	});
});
