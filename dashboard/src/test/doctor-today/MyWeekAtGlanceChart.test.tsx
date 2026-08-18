import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/common-components/test-utils";
import { MyWeekAtGlanceChart } from "@/components/doctor-today/MyWeekAtGlanceChart";

describe("MyWeekAtGlanceChart", () => {
	it("renders day totals from count-like API fields", async () => {
		const onSelectDay = vi.fn();
		const user = userEvent.setup();

		renderWithProviders(
			<MyWeekAtGlanceChart
				data={[
					{ date: "2026-05-11", count: 3, dominantStatus: "PENDING", confirmed: 0, completed: 0, canceled: 0, noShow: 0 } as never,
					{ date: "2026-05-12", appointmentsTotal: 5, dominantStatus: "CONFIRMED", confirmed: 0, completed: 0, canceled: 0, noShow: 0 } as never,
				]}
				title="Week at a glance"
				description="Weekly totals"
				errorLabel="Error"
				retryLabel="Retry"
				onSelectDay={onSelectDay}
				selectedDate="2026-05-11"
				locale="en"
			/>,
		);

		expect(screen.getByRole("button", { name: /Mon 11.*Pending.*3/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Tue 12.*Confirmed.*5/i })).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /Tue 12.*Confirmed.*5/i }));
		expect(onSelectDay).toHaveBeenCalledWith("2026-05-12");
	});
});
