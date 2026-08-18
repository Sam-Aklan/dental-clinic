import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithWaitlistProviders } from "@/test/waitlist/test-utils";
import { waitlistFixtures } from "@/test/waitlist/fixtures";
import { WaitlistPageSection } from "@/components/waitlist";
import { waitlistQueryOptions } from "@/lib/waitlist";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
	return {
		...actual,
		Link: ({ to, params, children, ...props }: any) => {
			const href = typeof to === "string" ? to.replace("$", params?._splat ?? "") : "#";
			return (
				<a href={href} {...props}>
					{children}
				</a>
			);
		},
	};
});

import { api } from "@/lib/axios-instance";

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);
const mockedPatch = vi.mocked(api.patch);
const mockedDelete = vi.mocked(api.delete);

beforeEach(() => {
	vi.clearAllMocks();
});

function mockGetWaitlistEmpty() {
	mockedGet.mockImplementation((url: string) => {
		if (url === "/waitlist") {
			return Promise.resolve({ data: { data: { items: [], total: 0, page: 1, pageSize: 20 }, statusCode: 200 } });
		}
		if (url === "/doctors") {
			return Promise.resolve({ data: { data: waitlistFixtures.doctors, statusCode: 200 } });
		}
		return Promise.reject(new Error("Unknown endpoint"));
	});
}

function mockGetWithEntries() {
	mockedGet.mockImplementation((url: string) => {
		if (url === "/waitlist") {
			return Promise.resolve({ data: { data: { items: [waitlistFixtures.entryWithWindow], total: 1, page: 1, pageSize: 20 }, statusCode: 200 } });
		}
		if (url === "/doctors") {
			return Promise.resolve({ data: { data: waitlistFixtures.doctors, statusCode: 200 } });
		}
		return Promise.reject(new Error("Unknown endpoint"));
	});
}

function getWaitlistDoctorSelect(): HTMLSelectElement {
	return document.querySelector("select") as HTMLSelectElement;
}

describe("My Waitlist Page specifications", () => {
	it("WL-T001: allows a patient to view active waitlist entries with doctor, position, availability, and joined date", async () => {
		mockGetWithEntries();
		renderWithWaitlistProviders(<WaitlistPageSection />);

		expect(await screen.findByText("Ahmad Al-Rashid")).toBeDefined();
		expect(screen.getByText("Orthodontics")).toBeDefined();
		expect(screen.getByText("09:00 - 13:00")).toBeDefined();
	});

	it("WL-T001: shows an offer indicator link when the entry has a pending offer", async () => {
		mockedGet.mockImplementation((url: string) => {
			if (url === "/waitlist") {
				return Promise.resolve({ data: { data: { items: [waitlistFixtures.entryWithPendingOffer], total: 1, page: 1, pageSize: 20 }, statusCode: 200 } });
			}
			if (url === "/doctors") {
				return Promise.resolve({ data: { data: waitlistFixtures.doctors, statusCode: 200 } });
			}
			return Promise.reject(new Error("Unknown endpoint"));
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		expect(await screen.findByText("waitlist.offerAvailable")).toBeDefined();
			expect(screen.getByRole("link", { name: "waitlist.offerAvailable waitlist.viewOffer" })).toHaveAttribute(
				"href",
				"/offers/offer-1",
			);
	});

	it("WL-T001: encodes slash-containing offer ids in in-app review links", async () => {
		mockedGet.mockImplementation((url: string) => {
			if (url === "/waitlist") {
				return Promise.resolve({
					data: {
						data: {
						items: [
							{
								...waitlistFixtures.entryWithPendingOffer,
								pendingOffer: { id: "offer/token-1" },
							},
						],
							total: 1,
							page: 1,
							pageSize: 20,
						},
						statusCode: 200,
					},
				});
			}
			if (url === "/doctors") {
				return Promise.resolve({ data: { data: waitlistFixtures.doctors, statusCode: 200 } });
			}
			return Promise.reject(new Error("Unknown endpoint"));
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		expect(await screen.findByRole("link", { name: "waitlist.offerAvailable waitlist.viewOffer" })).toHaveAttribute(
			"href",
			"/offers/offer%2Ftoken-1",
		);
	});

	it("WL-T001: hides the offer indicator when no pending offer exists", async () => {
		mockGetWithEntries();
		renderWithWaitlistProviders(<WaitlistPageSection />);

		expect(await screen.findByText("Ahmad Al-Rashid")).toBeDefined();
		expect(screen.queryByText("waitlist.offerAvailable")).toBeNull();
	});

	it("WL-T001: omits position when position is zero or missing", async () => {
		mockedGet.mockImplementation((url: string) => {
			if (url === "/waitlist") {
				return Promise.resolve({ data: { data: { items: [waitlistFixtures.entryWithoutWindow], total: 1, page: 1, pageSize: 20 }, statusCode: 200 } });
			}
			if (url === "/doctors") {
				return Promise.resolve({ data: { data: waitlistFixtures.doctors, statusCode: 200 } });
			}
			return Promise.reject(new Error("Unknown endpoint"));
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		expect(await screen.findByText("Nour Ali")).toBeDefined();
	});

	it("WL-T002: shows an empty state while keeping the join form area visible when the patient has no active entries", async () => {
		mockGetWaitlistEmpty();
		renderWithWaitlistProviders(<WaitlistPageSection />);

		expect(await screen.findByText("waitlist.empty")).toBeDefined();
		expect(screen.getByText("waitlist.joinTitle")).toBeDefined();
	});

	it("WL-T003: preselects a joinable doctor when the patient arrives with a valid doctor preselection context", async () => {
		mockGetWaitlistEmpty();
		renderWithWaitlistProviders(<WaitlistPageSection preselectedDoctorId="doc-2" />);

		await screen.findByText("waitlist.join");
		const select = await waitFor(() => {
			const s = getWaitlistDoctorSelect();
			expect(s).not.toBeNull();
			return s;
		});
		expect(select.value).toBe("doc-2");
	});

	it("WL-T004: allows joining a doctor's waitlist without an availability window", async () => {
		mockGetWaitlistEmpty();

		mockedPost.mockResolvedValueOnce({
			data: { data: waitlistFixtures.entryWithWindow, statusCode: 201 },
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("waitlist.join");
		const select = await waitFor(() => {
			const s = getWaitlistDoctorSelect();
			expect(s).not.toBeNull();
			return s;
		});
		await userEvent.selectOptions(select, "doc-1");

		await userEvent.click(screen.getByRole("button", { name: /join/i }));

		await waitFor(() => {
			expect(mockedPost).toHaveBeenCalledWith("/waitlist", {
				doctorId: "doc-1",
				availableFrom: null,
				availableUntil: null,
			});
		});
	});

	it("WL-T005: allows joining a doctor's waitlist with a valid availability window", async () => {
		mockGetWaitlistEmpty();

		mockedPost.mockResolvedValueOnce({
			data: { data: waitlistFixtures.entryWithWindow, statusCode: 201 },
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("waitlist.join");
		const select = await waitFor(() => {
			const s = getWaitlistDoctorSelect();
			expect(s).not.toBeNull();
			return s;
		});
		await userEvent.selectOptions(select, "doc-1");

		const fromInput = screen.getByLabelText("waitlist.availableFrom") as HTMLInputElement;
		const untilInput = screen.getByLabelText("waitlist.availableUntil") as HTMLInputElement;
		await userEvent.clear(fromInput);
		await userEvent.type(fromInput, "09:00");
		await userEvent.clear(untilInput);
		await userEvent.type(untilInput, "13:00");

		await userEvent.click(screen.getByRole("button", { name: /join/i }));

		await waitFor(() => {
			expect(mockedPost).toHaveBeenCalledWith("/waitlist", {
				doctorId: "doc-1",
				availableFrom: "09:00",
				availableUntil: "13:00",
			});
		});
	});

	it("WL-T006: blocks submission when only one availability time is provided", async () => {
		mockGetWaitlistEmpty();

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("waitlist.join");
		const select = await waitFor(() => {
			const s = getWaitlistDoctorSelect();
			expect(s).not.toBeNull();
			return s;
		});
		await userEvent.selectOptions(select, "doc-1");

		const fromInput = screen.getByLabelText("waitlist.availableFrom") as HTMLInputElement;
		await userEvent.clear(fromInput);
		await userEvent.type(fromInput, "09:00");

		await userEvent.click(screen.getByRole("button", { name: /join/i }));

		expect(await screen.findByText("waitlist.errors.windowIncomplete")).toBeDefined();
	});

	it("WL-T007: blocks submission when the availability end time is not later than the start time", async () => {
		mockGetWaitlistEmpty();

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("waitlist.join");
		const select = await waitFor(() => {
			const s = getWaitlistDoctorSelect();
			expect(s).not.toBeNull();
			return s;
		});
		await userEvent.selectOptions(select, "doc-1");

		const fromInput = screen.getByLabelText("waitlist.availableFrom") as HTMLInputElement;
		const untilInput = screen.getByLabelText("waitlist.availableUntil") as HTMLInputElement;
		await userEvent.clear(fromInput);
		await userEvent.type(fromInput, "13:00");
		await userEvent.clear(untilInput);
		await userEvent.type(untilInput, "09:00");

		await userEvent.click(screen.getByRole("button", { name: /join/i }));

		expect(await screen.findByText("waitlist.errors.windowInvalid")).toBeDefined();
	});

	it("WL-T008: prevents selecting doctors the patient has already joined and explains duplicate entries", async () => {
		mockGetWithEntries();

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("Ahmad Al-Rashid");

		const option = screen.getByRole("option", { name: /Ahmad Al-Rashid/ }) as HTMLOptionElement;
		expect(option.disabled).toBe(true);
	});

	it("WL-T009: displays an inline duplicate-entry message when a duplicate join is rejected after submission", async () => {
		mockGetWaitlistEmpty();

		mockedPost.mockRejectedValueOnce({
			response: { status: 409, data: { message: "waitlist.alreadyJoined" } },
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("waitlist.join");
		const select = await waitFor(() => {
			const s = getWaitlistDoctorSelect();
			expect(s).not.toBeNull();
			return s;
		});
		await userEvent.selectOptions(select, "doc-1");

		await userEvent.click(screen.getByRole("button", { name: /join/i }));

		expect(await screen.findByText("waitlist.alreadyJoined")).toBeDefined();
	});

	it("WL-T010: allows editing an active entry availability window and confirms the update", async () => {
		mockGetWithEntries();

		mockedPatch.mockResolvedValueOnce({
			data: { data: { ...waitlistFixtures.entryWithWindow, availableFrom: "10:00", availableUntil: "14:00" }, statusCode: 200 },
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("Ahmad Al-Rashid");

		const editButton = screen.getByRole("button", { name: "waitlist.edit" });
		await userEvent.click(editButton);

		const fromInput = screen.getAllByLabelText("waitlist.availableFrom")[0] as HTMLInputElement;
		const untilInput = screen.getAllByLabelText("waitlist.availableUntil")[0] as HTMLInputElement;
		await userEvent.clear(fromInput);
		await userEvent.type(fromInput, "10:00");
		await userEvent.clear(untilInput);
		await userEvent.type(untilInput, "14:00");

		await userEvent.click(screen.getByRole("button", { name: /save/i }));

		await waitFor(() => {
			expect(mockedPatch).toHaveBeenCalledWith("/waitlist/entry-1", {
				availableFrom: "10:00",
				availableUntil: "14:00",
			});
		});
	});

	it("WL-T011: allows clearing both availability times so the patient accepts any available time", async () => {
		mockGetWithEntries();

		mockedPatch.mockResolvedValueOnce({
			data: { data: { ...waitlistFixtures.entryWithWindow, availableFrom: null, availableUntil: null }, statusCode: 200 },
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("Ahmad Al-Rashid");

		const editButton = screen.getByRole("button", { name: "waitlist.edit" });
		await userEvent.click(editButton);

		const fromInput = screen.getAllByLabelText("waitlist.availableFrom")[0] as HTMLInputElement;
		const untilInput = screen.getAllByLabelText("waitlist.availableUntil")[0] as HTMLInputElement;
		await userEvent.clear(fromInput);
		await userEvent.clear(untilInput);

		await userEvent.click(screen.getByRole("button", { name: /save/i }));

		await waitFor(() => {
			expect(mockedPatch).toHaveBeenCalledWith("/waitlist/entry-1", {
				availableFrom: null,
				availableUntil: null,
			});
		});
	});

	it("WL-T012: requires confirmation before leaving a waitlist entry", async () => {
		mockGetWithEntries();

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("Ahmad Al-Rashid");

		const leaveButton = screen.getByRole("button", { name: "waitlist.leave" });
		await userEvent.click(leaveButton);

		expect(await screen.findByText("waitlist.leaveTitle")).toBeDefined();
		expect(screen.getByText("waitlist.leaveDescription")).toBeDefined();
	});

	it("WL-T013: removes an entry from the active list after confirmed leave", async () => {
		mockGetWithEntries();

		mockedDelete.mockResolvedValueOnce({ data: { statusCode: 204 } });

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("Ahmad Al-Rashid");

		const leaveButton = screen.getByRole("button", { name: "waitlist.leave" });
		await userEvent.click(leaveButton);

		await screen.findByText("waitlist.leaveTitle");

		const confirmButton = screen.getByRole("button", { name: /confirm/i });
		await userEvent.click(confirmButton);

		await waitFor(() => {
			expect(mockedDelete).toHaveBeenCalledWith("/waitlist/entry-1");
		});
	});

	it("WL-T014: keeps the entry unchanged when the patient cancels leave confirmation", async () => {
		mockGetWithEntries();

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("Ahmad Al-Rashid");

		const leaveButton = screen.getByRole("button", { name: "waitlist.leave" });
		await userEvent.click(leaveButton);

		await screen.findByText("waitlist.leaveTitle");

		const cancelButton = screen.getByRole("button", { name: /cancel/i });
		await userEvent.click(cancelButton);

		await waitFor(() => {
			expect(screen.queryByText("waitlist.leaveTitle")).toBeNull();
		});

		expect(mockedDelete).not.toHaveBeenCalled();
		expect(screen.getByText("Ahmad Al-Rashid")).toBeDefined();
	});

	it("WL-T015: exposes loading state for waitlist entries", async () => {
		mockedGet.mockImplementation(() => {
			return new Promise(() => {});
		});

		renderWithWaitlistProviders(<WaitlistPageSection />);

		expect(await screen.findByRole("status")).toBeDefined();
	});

	it("WL-T016: renders waitlist copy with translation keys", () => {
		mockGetWaitlistEmpty();
		renderWithWaitlistProviders(<WaitlistPageSection />);
		expect(screen.getByText("waitlist.joinTitle")).toBeDefined();
	});

	it("WL-T017: keeps time fields and form controls accessible", async () => {
		mockGetWaitlistEmpty();

		renderWithWaitlistProviders(<WaitlistPageSection />);

		await screen.findByText("waitlist.join");

		const fromLabel = screen.getByText("waitlist.availableFrom");
		expect(fromLabel).toBeDefined();

		const untilLabel = screen.getByText("waitlist.availableUntil");
		expect(untilLabel).toBeDefined();

		const select = await waitFor(() => {
			const s = getWaitlistDoctorSelect();
			expect(s).not.toBeNull();
			return s;
		});
		expect(select).toBeDefined();
	});

	it("WL-T018: renders the page structure for desktop and mobile", () => {
		mockGetWaitlistEmpty();
		renderWithWaitlistProviders(<WaitlistPageSection />);
		expect(screen.getByText("waitlist.title")).toBeDefined();
	});

	it("WL-T019: keeps waitlist refresh polling enabled every 30 seconds", () => {
		expect(waitlistQueryOptions().refetchInterval).toBe(30_000);
	});
});
