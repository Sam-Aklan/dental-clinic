import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/i18n";
import { renderWithStaffAppointmentsProviders } from "@/test/staff-appointments/test-utils";
import { staffAppointmentFixtures } from "@/test/staff-appointments/fixtures";
import { AppointmentsAdminPage, StaffWaitlistSection } from "@/components/staff-appointments";

vi.mock("@/components/queue", () => ({
	StaffQueuePage: () => <div data-testid="queue-page">Queue tab content</div>,
}));

let waitlistQueryImplementation = vi.fn();
let removeMutationImplementation = vi.fn();
let doctorsQueryImplementation = vi.fn();

vi.mock("@/hooks/staff-appointments", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/hooks/staff-appointments")>();
	return {
		...actual,
		useStaffWaitlistQuery: (filters: unknown) => waitlistQueryImplementation(filters),
		useRemoveWaitlistEntryMutation: () => removeMutationImplementation(),
	};
});

vi.mock("@/hooks/booking", () => ({
	useDoctorsQuery: () => doctorsQueryImplementation(),
}));

beforeEach(() => {
	vi.clearAllMocks();
	i18n.changeLanguage("en");
	doctorsQueryImplementation = vi.fn().mockReturnValue({
		data: [
			{ id: "doctor-1", firstName: "Nour", lastName: "Saleh", specialization: "General Dentistry" },
			{ id: "doctor-2", firstName: "Maha", lastName: "Khalid", specialization: "Pediatric Dentistry" },
		],
		isLoading: false,
		isFetching: false,
	});
	removeMutationImplementation = vi.fn(() => ({
		mutate: vi.fn((_id: string, options?: { onSuccess?: () => void; onError?: () => void }) => options?.onSuccess?.()),
		isPending: false,
	}));
	waitlistQueryImplementation = vi.fn((filters: { doctorId?: string; page?: number }) => {
		if (filters.page === 2) {
			return {
				data: staffAppointmentFixtures.waitlistPageTwo,
				isPending: false,
				isFetching: false,
				isError: false,
				refetch: vi.fn(),
			};
		}
		if (filters.doctorId === "doctor-2") {
			return {
				data: {
					...staffAppointmentFixtures.waitlistPage,
					data: [staffAppointmentFixtures.waitlistEntryTwo],
					total: 11,
				},
				isPending: false,
				isFetching: false,
				isError: false,
				refetch: vi.fn(),
			};
		}
		return {
			data: staffAppointmentFixtures.waitlistPage,
			isPending: false,
			isFetching: false,
			isError: false,
			refetch: vi.fn(),
		};
	});
});

describe("AppointmentsAdminPage waitlist integration", () => {
	it("renders the queue tab by default and switches to waitlist", async () => {
		renderWithStaffAppointmentsProviders(<AppointmentsAdminPage />);

		expect(await screen.findByTestId("queue-page")).toBeDefined();
		await userEvent.click(screen.getByRole("tab", { name: "Waitlist" }));
		expect(await screen.findByRole("heading", { name: "Waitlist" })).toBeDefined();
	});
});

describe("StaffWaitlistSection", () => {
	it("shows loading, empty, and row states with localized staff waitlist content", async () => {
		waitlistQueryImplementation = vi.fn(() => ({
			data: undefined,
			isPending: true,
			isFetching: false,
			isError: false,
			refetch: vi.fn(),
		}));

		renderWithStaffAppointmentsProviders(<StaffWaitlistSection locale="en" />);

		expect(await screen.findByTestId("staff-waitlist-loading")).toBeDefined();
	});

	it("shows an empty state when no active waitlist entries are returned", async () => {
		waitlistQueryImplementation = vi.fn(() => ({
			data: staffAppointmentFixtures.waitlistPageEmpty,
			isPending: false,
			isFetching: false,
			isError: false,
			refetch: vi.fn(),
		}));

		renderWithStaffAppointmentsProviders(<StaffWaitlistSection locale="en" />);

		expect(await screen.findByTestId("staff-waitlist-empty")).toBeDefined();
	});

	it("shows an error state when the waitlist request fails", async () => {
		waitlistQueryImplementation = vi.fn(() => ({
			data: undefined,
			isPending: false,
			isFetching: false,
			isError: true,
			refetch: vi.fn(),
		}));

		renderWithStaffAppointmentsProviders(<StaffWaitlistSection locale="en" />);

		expect(await screen.findByText("Could not load the waitlist")).toBeDefined();
	});

	it("filters by doctor, resets to page one, paginates, and removes entries after confirmation", async () => {
		const removeMutate = vi.fn((_id: string, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
		removeMutationImplementation = vi.fn(() => ({ mutate: removeMutate, isPending: false }));

		renderWithStaffAppointmentsProviders(<StaffWaitlistSection locale="en" />);

		expect(await screen.findByText("Sara Ali")).toBeDefined();
		await userEvent.click(screen.getByRole("combobox", { name: /doctor filter/i }));
		await userEvent.click(await screen.findByRole("option", { name: "Maha Khalid" }));
		expect(await screen.findByText("Lina Omar")).toBeDefined();

		await userEvent.click(screen.getByRole("button", { name: /next/i }));
		expect(await screen.findByText("Omar Yousef")).toBeDefined();

		await userEvent.click(screen.getByTestId("remove-waitlist-entry-wait-3"));
		const dialog = await screen.findByRole("alertdialog");
		await userEvent.click(within(dialog).getByRole("button", { name: /remove/i }));
		expect(removeMutate).toHaveBeenCalledWith("wait-3", expect.any(Object));
	});

	it("shows Arabic RTL labels and inline remove errors", async () => {
		const removeMutate = vi.fn((_id: string, options?: { onError?: () => void }) => options?.onError?.());
		removeMutationImplementation = vi.fn(() => ({ mutate: removeMutate, isPending: false }));
		i18n.changeLanguage("ar");

		renderWithStaffAppointmentsProviders(<StaffWaitlistSection locale="ar" />);

		expect(await screen.findByText("قائمة الانتظار")).toBeDefined();
		await userEvent.click(screen.getByTestId("remove-waitlist-entry-wait-1"));
		const dialog = await screen.findByRole("alertdialog");
		await userEvent.click(within(dialog).getByRole("button", { name: "إزالة" }));
		expect(await screen.findByText(/فشلت إزالة الإدخال/)).toBeDefined();
	});
});
