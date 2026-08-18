import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { AppointmentCard } from "@/components/appointments";
import { renderWithAppointmentsProviders } from "./test-utils";
import { appointmentFixtures, createAppointment } from "./fixtures";

describe("AppointmentCard", () => {
	it("renders doctor details, appointment details, and cancel action when eligible", () => {
		renderWithAppointmentsProviders(
			<AppointmentCard
				appointment={appointmentFixtures.futurePending}
				locale="en"
				statusLabel="Pending"
				cancelLabel="Cancel"
				onCancel={() => undefined}
				createdAppointmentId={null}
				recentlyCreatedLabel="Recently booked"
				noSpecializationLabel="Specialization not listed"
				cancellationNoticeLabel=""
				bookingDateLabel="Booked on"
				dateLabel="Date"
				timeLabel="Time"
			/>,
		);

		expect(screen.getByText(/Ahmad Al-Rashid/)).toBeInTheDocument();
		expect(screen.getByText(/Pending/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
	});

	it("omits specialization text when it is missing", () => {
		const appointmentWithoutSpecialization = createAppointment({ doctor: appointmentFixtures.doctorWithoutSpecialization, doctorId: appointmentFixtures.doctorWithoutSpecialization.id });
		renderWithAppointmentsProviders(
			<AppointmentCard
				appointment={appointmentWithoutSpecialization}
				locale="en"
				statusLabel="Canceled"
				cancelLabel="Cancel"
				onCancel={() => undefined}
				createdAppointmentId={null}
				recentlyCreatedLabel="Recently booked"
				noSpecializationLabel="Specialization not listed"
				cancellationNoticeLabel=""
				bookingDateLabel="Booked on"
				dateLabel="Date"
				timeLabel="Time"
			/>,
		);

		expect(screen.getByText("Specialization not listed")).toBeInTheDocument();
	});
});
