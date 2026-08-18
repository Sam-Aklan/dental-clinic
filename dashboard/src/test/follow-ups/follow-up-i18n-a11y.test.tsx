import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithFollowUpProviders, setFollowUpLanguage } from "./test-utils";
import { completedFollowUpSourceAppointment, futureFollowUpSlots, followUpSuccessResponse } from "./fixtures";
import { FollowUpScheduleDialog } from "@/components/follow-ups";
import i18n from "@/i18n";
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

function FollowUpDialogHarness() {
	const [open, setOpen] = useState(false);

	return (
		<div>
			<button type="button" onClick={() => setOpen(true)}>Open follow-up dialog</button>
			<FollowUpScheduleDialog open={open} sourceAppointment={completedFollowUpSourceAppointment} onOpenChange={setOpen} />
		</div>
	);
}

describe("follow-up i18n and a11y", () => {
	it("restores focus to the trigger after closing", async () => {
		await setFollowUpLanguage("en");
		mocks.getFollowUpSlots.mockResolvedValue(futureFollowUpSlots);
		mocks.createFollowUp.mockResolvedValue(followUpSuccessResponse);
		const { user, getByRole, findByRole } = renderWithFollowUpProviders(<FollowUpDialogHarness />);
		const trigger = getByRole("button", { name: /open follow-up dialog/i });
		await user.click(trigger);
		const title = await findByRole("heading", { name: "Schedule follow-up" });
		await waitFor(() => expect(document.activeElement).toBe(title));
		await user.click(getByRole("button", { name: /cancel/i }));
		await waitFor(() => expect(document.activeElement).toBe(trigger));
	});

	it("announces success through a polite live region", async () => {
		await setFollowUpLanguage("en");
		mocks.getFollowUpSlots.mockResolvedValue(futureFollowUpSlots);
		mocks.createFollowUp.mockResolvedValue(followUpSuccessResponse);
		const { user, findByRole, getByRole, getByLabelText } = renderWithFollowUpProviders(<FollowUpScheduleDialog open sourceAppointment={completedFollowUpSourceAppointment} onOpenChange={() => undefined} />);
		await user.click(await findByRole("button", { name: /08:30 PM/i }));
		await user.type(getByLabelText(/reason/i), "Review healing");
		await user.click(getByRole("button", { name: /schedule follow-up/i }));
		const status = await findByRole("status");
		expect(status).toHaveAttribute("aria-live", "polite");
		expect(status).toHaveTextContent("Follow-up scheduled successfully");
	});

	it("renders Arabic labels and rtl direction", async () => {
		await setFollowUpLanguage("ar");
		mocks.getFollowUpSlots.mockResolvedValue(futureFollowUpSlots);
		const { getByRole } = renderWithFollowUpProviders(<FollowUpScheduleDialog open sourceAppointment={completedFollowUpSourceAppointment} onOpenChange={() => undefined} />);
		await waitFor(() => expect(mocks.getFollowUpSlots).toHaveBeenCalled());
		expect(getByRole("dialog")).toBeInTheDocument();
		expect(i18n.t("followUps.scheduling.title")).toBe("جدولة متابعة");
		expect(document.documentElement.dir).toBe("rtl");
	});
});
