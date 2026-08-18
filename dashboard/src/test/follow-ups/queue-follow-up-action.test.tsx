import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithFollowUpProviders, setFollowUpLanguage } from "./test-utils";
import { completedDoctorQueueAppointment, pendingDoctorQueueAppointment, completedStaffQueueAppointment, pendingStaffQueueAppointment } from "./fixtures";
import { StatusActionMenu } from "@/components/doctor-queue/StatusActionMenu";
import { StatusTransitionButtons } from "@/components/queue/StatusTransitionButtons";

const authState = { user: { doctorProfileId: "doctor-1" } };

vi.mock("@/stores", () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

vi.mock("@/hooks/doctors-admin", () => ({ useDoctor: () => ({ data: { firstName: "Omar", lastName: "Saleh" } }) }));

describe("follow-up queue actions", () => {
	it("shows follow-up actions only for eligible doctor rows", async () => {
		await setFollowUpLanguage("en");
		const { getByRole, queryByRole, rerender } = renderWithFollowUpProviders(<StatusActionMenu appointment={completedDoctorQueueAppointment} onStatusChange={() => undefined} onMarkNoFollowUpNeeded={() => undefined} />);
		expect(getByRole("button", { name: "Schedule follow-up" })).toBeInTheDocument();
		expect(getByRole("button", { name: "Mark no follow-up needed" })).toBeInTheDocument();
		rerender(<StatusActionMenu appointment={pendingDoctorQueueAppointment} onStatusChange={() => undefined} onMarkNoFollowUpNeeded={() => undefined} />);
		expect(queryByRole("button", { name: "Schedule follow-up" })).not.toBeInTheDocument();
		expect(queryByRole("button", { name: "Mark no follow-up needed" })).not.toBeInTheDocument();
	});

	it("hides follow-up actions once the source appointment is already scheduled", async () => {
		await setFollowUpLanguage("en");
		const scheduled = { ...completedDoctorQueueAppointment, followUpId: "follow-up-1", needsFollowUp: false };
		const { queryByRole } = renderWithFollowUpProviders(<StatusActionMenu appointment={scheduled} onStatusChange={() => undefined} onMarkNoFollowUpNeeded={() => undefined} />);
		expect(queryByRole("button", { name: "Schedule follow-up" })).not.toBeInTheDocument();
		expect(queryByRole("button", { name: "Mark no follow-up needed" })).not.toBeInTheDocument();
	});

	it("shows schedule follow-up for completed staff rows only", async () => {
		await setFollowUpLanguage("en");
		const { getByRole, queryByRole, rerender } = renderWithFollowUpProviders(<StatusTransitionButtons appointment={completedStaffQueueAppointment} labels={{ PENDING: "Pending", CONFIRMED: "Confirmed", IN_PROGRESS: "In progress", COMPLETED: "Completed", CANCELED: "Canceled", NO_SHOW: "No-show", action: { cancel: "Cancel", noShow: "No-show" } }} onPrimaryAction={() => undefined} onDestructiveAction={() => undefined} onMarkNoFollowUpNeeded={() => undefined} />);
		expect(getByRole("button", { name: "Schedule follow-up" })).toBeInTheDocument();
		expect(getByRole("button", { name: "Mark no follow-up needed" })).toBeInTheDocument();
		rerender(<StatusTransitionButtons appointment={pendingStaffQueueAppointment} labels={{ PENDING: "Pending", CONFIRMED: "Confirmed", IN_PROGRESS: "In progress", COMPLETED: "Completed", CANCELED: "Canceled", NO_SHOW: "No-show", action: { cancel: "Cancel", noShow: "No-show" } }} onPrimaryAction={() => undefined} onDestructiveAction={() => undefined} onMarkNoFollowUpNeeded={() => undefined} />);
		expect(queryByRole("button", { name: "Schedule follow-up" })).not.toBeInTheDocument();
		expect(queryByRole("button", { name: "Mark no follow-up needed" })).not.toBeInTheDocument();
	});

	it("marks completed doctor appointments as needing follow-up", async () => {
		await setFollowUpLanguage("en");
		const user = userEvent.setup();
		const onStatusChange = vi.fn();
		const { getByRole } = renderWithFollowUpProviders(<StatusActionMenu appointment={{ ...completedDoctorQueueAppointment, status: "IN_PROGRESS" }} onStatusChange={onStatusChange} onMarkNoFollowUpNeeded={() => undefined} />);

		await user.click(getByRole("button", { name: "Complete" }));

		expect(onStatusChange).toHaveBeenCalledWith("doctor-queue-1", "COMPLETED", true);
	});
});
