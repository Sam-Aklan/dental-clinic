import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/common-components/test-utils";
import { DoctorScheduleActions } from "@/components/doctor-today";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

describe("DoctorScheduleActions", () => {
	it("renders valid actions for each appointment status", async () => {
		const onUpdateStatus = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();
		renderWithProviders(<DoctorScheduleActions appointment={{ id: "1", startsAt: "2026-05-11T08:00:00.000Z", endsAt: "2026-05-11T08:30:00.000Z", status: "CONFIRMED", patientSequence: 1, notes: null, createdAt: "2026-05-11T00:00:00.000Z", updatedAt: "2026-05-11T00:00:00.000Z" }} onUpdateStatus={onUpdateStatus} />);

		expect(screen.getByRole("button", { name: "doctorToday.actions.start" })).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "doctorToday.actions.start" }));
		expect(onUpdateStatus).toHaveBeenCalledWith({ id: "1", status: "IN_PROGRESS" });
	});
});
