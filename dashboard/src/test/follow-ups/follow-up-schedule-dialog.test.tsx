import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithFollowUpProviders, setFollowUpLanguage } from "./test-utils";
import { conflictError, completedFollowUpSourceAppointment, futureFollowUpSlots, followUpSuccessResponse, invalidPayloadError, networkError, notFoundError, permissionError } from "./fixtures";
import { FollowUpScheduleDialog } from "@/components/follow-ups";
import { waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
	toastSuccess: vi.fn(),
	getFollowUpSlots: vi.fn(),
	createFollowUp: vi.fn(),
	useIsMobile: vi.fn(() => false),
}));

vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: mocks.useIsMobile }));
vi.mock("@/lib/follow-ups/actions/follow-up.api", async () => {
	const actual = await vi.importActual<typeof import("@/lib/follow-ups/actions/follow-up.api")>("@/lib/follow-ups/actions/follow-up.api");
	return {
		...actual,
		getFollowUpSlots: mocks.getFollowUpSlots,
		createFollowUp: mocks.createFollowUp,
	};
});

describe("follow-up schedule dialog", () => {
	beforeEach(() => {
		mocks.toastSuccess.mockReset();
		mocks.getFollowUpSlots.mockReset();
		mocks.createFollowUp.mockReset();
		mocks.useIsMobile.mockReturnValue(false);
		mocks.getFollowUpSlots.mockResolvedValue(futureFollowUpSlots);
		mocks.createFollowUp.mockResolvedValue(followUpSuccessResponse);
	});

	it("renders source details and required controls", async () => {
		await setFollowUpLanguage("en");
		const { findByRole, getByText, getByLabelText } = renderWithFollowUpProviders(<FollowUpScheduleDialog open sourceAppointment={completedFollowUpSourceAppointment} onOpenChange={() => undefined} />);
		await findByRole("button", { name: /08:30 PM/i });
		expect(getByText("Amina Hassan")).toBeInTheDocument();
		expect(getByText("Dr. Omar Saleh")).toBeInTheDocument();
		expect(getByLabelText(/follow-up date/i)).toBeInTheDocument();
		expect(getByLabelText(/reason/i)).toBeInTheDocument();
		expect(getByLabelText(/notes/i)).toBeInTheDocument();
	});

	it("submits a trimmed payload and closes successfully", async () => {
		await setFollowUpLanguage("en");
		const onOpenChange = vi.fn();
		const { user, findByRole, getByRole, getByLabelText } = renderWithFollowUpProviders(<FollowUpScheduleDialog open sourceAppointment={completedFollowUpSourceAppointment} onOpenChange={onOpenChange} />);
		await user.click(await findByRole("button", { name: /08:30 PM/i }));
		await user.type(getByLabelText(/reason/i), "  Review healing  ");
		await user.type(getByLabelText(/notes/i), "  Bring x-ray  ");
		await user.click(getByRole("button", { name: /schedule follow-up/i }));
		await waitFor(() => expect(mocks.createFollowUp).toHaveBeenCalledWith({ patientId: "pat-1", doctorId: "doc-1", startsAt: "2026-06-09T17:30:00.000Z", reason: "Review healing", notes: "Bring x-ray", sourceAppointmentId: "appt-src-1" }, expect.any(String)));
		expect(mocks.toastSuccess).toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(getByRole("status")).toHaveTextContent("Follow-up scheduled successfully");
	});

	it("shows backend, permission, not-found, conflict, and network errors", async () => {
		await setFollowUpLanguage("en");
		mocks.createFollowUp.mockRejectedValueOnce(invalidPayloadError);
		const onOpenChange = vi.fn();
		const { user, findByRole, getByRole, getByLabelText, queryByRole, getAllByRole } = renderWithFollowUpProviders(<FollowUpScheduleDialog open sourceAppointment={completedFollowUpSourceAppointment} onOpenChange={onOpenChange} />);
		await user.click(await findByRole("button", { name: /08:30 PM/i }));
		await user.type(getByLabelText(/reason/i), "Review healing");
		await user.click(getByRole("button", { name: /schedule follow-up/i }));
		await waitFor(() => expect(getByRole("alert")).toHaveTextContent("Bad request"));
		expect(onOpenChange).not.toHaveBeenCalledWith(false);

		mocks.createFollowUp.mockRejectedValueOnce(permissionError);
		await user.click(getByRole("button", { name: /schedule follow-up/i }));
		await waitFor(() => expect(getByRole("alert")).toHaveTextContent("You do not have permission to schedule this follow-up."));

		mocks.createFollowUp.mockRejectedValueOnce(notFoundError);
		await user.click(getByRole("button", { name: /schedule follow-up/i }));
		await waitFor(() => expect(getByRole("alert")).toHaveTextContent("The source appointment or clinic data could not be found."));

		mocks.createFollowUp.mockRejectedValueOnce(conflictError);
		await user.click(getByRole("button", { name: /schedule follow-up/i }));
		await waitFor(() => expect(getAllByRole("alert").some((alert) => alert.textContent?.includes("That slot is no longer available. Please select another slot."))).toBe(true));
		await waitFor(() => expect(mocks.getFollowUpSlots).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(getAllByRole("alert").some((alert) => alert.textContent?.includes("Select a future slot"))).toBe(true));
		expect(getByLabelText(/reason/i)).toHaveValue("Review healing");
		expect(queryByRole("button", { name: /08:30 PM/i, pressed: true })).not.toBeInTheDocument();
		expect(getByRole("status")).toHaveTextContent("That slot is no longer available. Please select another slot.");

		await user.click(getByRole("button", { name: /08:30 PM/i }));
		mocks.createFollowUp.mockRejectedValueOnce(networkError);
		await user.click(getByRole("button", { name: /schedule follow-up/i }));
		await waitFor(() => expect(getByRole("alert")).toHaveTextContent("Network error"));
		expect(getByLabelText(/reason/i)).toHaveValue("Review healing");
	});

	it("keeps required controls reachable on mobile-sized rendering", async () => {
		await setFollowUpLanguage("en");
		mocks.useIsMobile.mockReturnValue(true);
		const { findByRole, getByLabelText, getByRole } = renderWithFollowUpProviders(<FollowUpScheduleDialog open sourceAppointment={completedFollowUpSourceAppointment} onOpenChange={() => undefined} />);
		await findByRole("button", { name: /08:30 PM/i });
		expect(getByLabelText(/follow-up date/i)).toBeInTheDocument();
		expect(getByLabelText(/reason/i)).toBeInTheDocument();
		expect(getByLabelText(/notes/i)).toBeInTheDocument();
		expect(getByRole("button", { name: /cancel/i })).toBeInTheDocument();
		expect(getByRole("button", { name: /schedule follow-up/i })).toBeInTheDocument();
	});
});
