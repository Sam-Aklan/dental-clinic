import { describe, expect, it, vi } from "vitest";
import { renderWithFollowUpProviders, setFollowUpLanguage } from "./test-utils";
import { FollowUpSlotPicker } from "@/components/follow-ups";
import { mixedFollowUpSlots } from "./fixtures";
import { filterFutureFollowUpSlots, groupFollowUpSlotsByPeriod } from "@/lib/follow-ups";

describe("follow-up slot picker", () => {
	it("renders groups and selected semantics", async () => {
		await setFollowUpLanguage("en");
		const future = filterFutureFollowUpSlots(mixedFollowUpSlots, new Date("2026-06-09T07:00:00.000Z"));
		const onDateChange = vi.fn();
		const { user, getByRole, getByText, queryByText } = renderWithFollowUpProviders(<FollowUpSlotPicker selectedDate="2026-06-09" onDateChange={onDateChange} groups={groupFollowUpSlotsByPeriod(future)} isLoading={false} isError={false} onRetry={() => undefined} selectedSlotStartsAt={future[1].startsAt} onSelectSlot={() => undefined} />);
		expect(getByText("Jun 9, 2026")).toBeInTheDocument();
		await user.click(getByRole("button", { name: /follow-up date/i }));
		await user.click(getByText("10"));
		expect(onDateChange).toHaveBeenCalledWith("2026-06-10");
		expect(queryByText("10")).not.toBeInTheDocument();
		expect(getByText(/morning/i)).toBeInTheDocument();
		expect(getByRole("button", { pressed: true })).toBeInTheDocument();
	});

	it("shows loading and empty states", async () => {
		await setFollowUpLanguage("en");
		const { getByText } = renderWithFollowUpProviders(<FollowUpSlotPicker selectedDate="2026-06-09" onDateChange={() => undefined} groups={[]} isLoading={true} isError={false} onRetry={() => undefined} selectedSlotStartsAt={null} onSelectSlot={() => undefined} />);
		expect(getByText("Loading available slots...")).toBeInTheDocument();
	});
});
