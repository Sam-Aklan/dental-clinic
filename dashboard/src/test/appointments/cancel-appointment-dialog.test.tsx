import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { CancelAppointmentDialog } from "@/components/appointments";
import { renderWithAppointmentsProviders } from "./test-utils";
import { appointmentFixtures } from "./fixtures";

describe("CancelAppointmentDialog", () => {
	it("renders a summary and actions", () => {
		renderWithAppointmentsProviders(
			<CancelAppointmentDialog
				appointment={appointmentFixtures.futurePending}
				open
				locale="en"
				errorMessage={null}
				isPending={false}
				onOpenChange={() => undefined}
				onConfirm={() => undefined}
				title="Cancel appointment"
				description="This cannot be undone."
				confirmLabel="Confirm cancellation"
				cancelLabel="Keep appointment"
				retryLabel="Cancelling..."
				bookingDateLabel="Booked on"
				doctorLabel="Doctor"
				dateLabel="Date"
				timeLabel="Time"
			/>,
		);

		expect(screen.getByText("Cancel appointment")).toBeInTheDocument();
		expect(screen.getByText(/Doctor:/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Confirm cancellation" })).toBeInTheDocument();
	});
});
