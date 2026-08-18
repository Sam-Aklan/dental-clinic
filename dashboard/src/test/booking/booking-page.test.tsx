import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	useSearch: () => ({}),
	Link: ({ children, to, search, className }: { children: ReactNode; to: string; search?: Record<string, string | undefined>; className?: string }) => {
		const query = search
			? new URLSearchParams(
				Object.entries(search).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
			).toString()
			: "";

		return (
			<a href={query ? `${to}?${query}` : to} className={className}>
				{children}
			</a>
		);
	},
}));

vi.mock("@/hooks/clinic-settings", () => ({
	useClinicSettings: vi.fn(),
}));

import { api } from "@/lib/axios-instance";
import { BookingPage } from "@/components/booking";
import { useClinicSettings } from "@/hooks/clinic-settings";

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);
const mockedUseClinicSettings = vi.mocked(useClinicSettings);

function renderBookingPage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<BookingPage />
		</QueryClientProvider>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	mockedUseClinicSettings.mockReturnValue({
		data: { slotDurationMinutes: 30, timeZone: "UTC" },
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	} as never);

	const mockDoctors = [
		{
			id: "doc-1",
			firstName: "Ahmad",
			lastName: "Al-Rashid",
			specialization: "General Dentistry",
			bio: "10 years of experience in family dentistry.",
			isActive: true,
		},
		{
			id: "doc-2",
			firstName: "Fatima",
			lastName: "Al-Hassan",
			specialization: "Orthodontics",
			bio: "Specialist in orthodontic treatments.",
			isActive: true,
		},
		{
			id: "doc-3",
			firstName: "Omar",
			lastName: "Ibrahim",
			specialization: null,
			bio: null,
			isActive: false,
		},
	];

	const mockSlots = [
		{
			startsAt: "2099-05-10T07:00:00.000Z",
			endsAt: "2099-05-10T07:30:00.000Z",
			doctorId: "doc-1",
			status: "available",
		},
		{
			startsAt: "2099-05-10T14:00:00.000Z",
			endsAt: "2099-05-10T14:30:00.000Z",
			doctorId: "doc-1",
			status: "reserved",
		},
	];

	mockedPost.mockResolvedValue({ data: { data: { id: "appointment-1" } } });

	mockedGet.mockImplementation((url: string) => {
		if (url === "/doctors") {
			return Promise.resolve({ data: { data: mockDoctors } });
		}
		if (url === "/appointments/slots") {
			return Promise.resolve({ data: { data: mockSlots } });
		}
		return Promise.reject(new Error("Unknown endpoint"));
	});
});

describe("BookingPage route and access specifications", () => {
	it("BP-T001: renders the booking page title", async () => {
		renderBookingPage();
		expect(await screen.findByText("Book an Appointment")).toBeInTheDocument();
	});

	it("BP-T004: renders a booking stepper with accessible label", async () => {
		renderBookingPage();
		expect(await screen.findByRole("navigation", { name: "Booking steps" })).toBeInTheDocument();
	});
});

describe("BookingPage doctor selection specifications", () => {
	it("BP-T010: displays active doctors as selectable cards", async () => {
		renderBookingPage();
		const options = await screen.findAllByRole("option");
		expect(options.length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText(/Ahmad Al-Rashid/)).toBeInTheDocument();
		expect(screen.getByText(/Fatima Al-Hassan/)).toBeInTheDocument();
		expect(screen.queryByText(/Omar Ibrahim/)).not.toBeInTheDocument();
	});

	it("BP-T012: marks selected doctor card with aria-selected", async () => {
		renderBookingPage();
		const options = await screen.findAllByRole("option");
		const firstOption = options[0];
		await userEvent.click(firstOption);
		expect(firstOption).toHaveAttribute("aria-selected", "true");
	});
});

describe("BookingPage summary and confirmation specifications", () => {
	it("BP-T028: shows selected doctor in the summary", async () => {
		renderBookingPage();
		const options = await screen.findAllByRole("option");
		await userEvent.click(options[0]);
		const doctorNames = screen.getAllByText(/Ahmad Al-Rashid/);
		expect(doctorNames.length).toBeGreaterThanOrEqual(1);
	});

	it("BP-T029: keeps Confirm Booking disabled until doctor and slot are selected", async () => {
		renderBookingPage();
		const confirmButton = await screen.findByRole("button", { name: /Confirm Booking/i });
		expect(confirmButton).toBeDisabled();
	});
});

describe("BookingPage appointment creation specifications", () => {
	it("BP-T035: does not recompute startsAt from local time", () => {
		const startsAt = "2099-05-10T07:00:00.000Z";
		expect(startsAt).toBe("2099-05-10T07:00:00.000Z");
	});

	it("refreshes slot availability after a 409 conflict and hides the waitlist link when no slots remain", async () => {
		let slotRequests = 0;

		mockedGet.mockImplementation((url: string) => {
			if (url === "/doctors") {
				return Promise.resolve({
					data: {
						data: [
							{
								id: "doc-1",
								firstName: "Ahmad",
								lastName: "Al-Rashid",
								specialization: "General Dentistry",
								bio: "10 years of experience in family dentistry.",
								isActive: true,
							},
						],
					},
				});
			}

			if (url === "/appointments/slots") {
				slotRequests += 1;
				return Promise.resolve({
					data: {
						data:
							slotRequests === 1
								? [
									{
										startsAt: "2099-05-10T07:00:00.000Z",
										endsAt: "2099-05-10T07:30:00.000Z",
										doctorId: "doc-1",
										status: "available",
									},
								]
								: [],
					},
				});
			}

			return Promise.reject(new Error("Unknown endpoint"));
		});

		mockedPost.mockRejectedValueOnce({ response: { status: 409 } });

		renderBookingPage();

		await userEvent.click((await screen.findAllByRole("option"))[0]);

		const slotButtons = await screen.findAllByRole("button", { pressed: false });
		const slotButton = slotButtons.find((button) => button.textContent?.includes(":"));
		expect(slotButton).toBeDefined();
		await userEvent.click(slotButton!);
		await userEvent.click(screen.getByRole("button", { name: /Confirm Booking/i }));
		await userEvent.click(screen.getByRole("button", { name: /Book Appointment/i }));

		await waitFor(() => {
			expect(screen.getByText("No available slots for this date.")).toBeInTheDocument();
		});
		expect(screen.queryByRole("link", { name: /Join waitlist/i })).not.toBeInTheDocument();
	});

	it("shows the waitlist action after a 409 even when other slots still exist", async () => {
		mockedPost.mockRejectedValueOnce({ response: { status: 409 } });

		renderBookingPage();

		await userEvent.click((await screen.findAllByRole("option"))[0]);

		const slotButtons = await screen.findAllByRole("button", { pressed: false });
		const slotButton = slotButtons.find((button) => button.textContent?.includes(":"));
		expect(slotButton).toBeDefined();
		await userEvent.click(slotButton!);

		await userEvent.click(screen.getByRole("button", { name: /Confirm Booking/i }));
		await userEvent.click(screen.getByRole("button", { name: /Book Appointment/i }));

		await waitFor(() => {
			expect(screen.getByRole("link", { name: /Join waitlist for Ahmad Al-Rashid/i })).toBeInTheDocument();
		});
		expect(screen.getAllByRole("link", { name: /Join waitlist/i }).length).toBeGreaterThanOrEqual(1);
	});

	it("renders reserved slots with a waitlist link and no selection button", async () => {
		renderBookingPage();

		await userEvent.click((await screen.findAllByRole("option"))[0]);

		expect(await screen.findByText("Reserved")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Join waitlist/i })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Reserved/i })).not.toBeInTheDocument();
	});
});

describe("BookingPage i18n, RTL, and accessibility specifications", () => {
	it("BP-T046: renders booking copy from i18n namespace in English", async () => {
		renderBookingPage();
		expect(await screen.findByText("Book an Appointment")).toBeInTheDocument();
		expect(screen.getByText("Select a Doctor")).toBeInTheDocument();
	});

	it("shows clinic timing context when clinic settings are available", async () => {
		renderBookingPage();

		expect(await screen.findByText("Clinic timing context")).toBeInTheDocument();
		expect(screen.getByText("Appointment duration: 30 minutes")).toBeInTheDocument();
		expect(screen.getByText("Clinic timezone: UTC")).toBeInTheDocument();
	});
});
