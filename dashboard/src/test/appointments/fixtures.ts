import type { AppointmentDoctor, AppointmentListResult, AppointmentStatus, PatientAppointment } from "@/types";

export function createDoctor(overrides: Partial<AppointmentDoctor> = {}): AppointmentDoctor {
	return {
		id: "doc-1",
		firstName: "Ahmad",
		lastName: "Al-Rashid",
		specialization: "General Dentistry",
		...overrides,
	};
}

export function createAppointment(overrides: Partial<PatientAppointment> = {}): PatientAppointment {
	return {
		id: "appt-1",
		patientId: "patient-1",
		doctorId: "doc-1",
		startsAt: "2026-05-09T10:00:00.000Z",
		endsAt: "2026-05-09T10:30:00.000Z",
		status: "PENDING",
		createdAt: "2026-05-08T08:00:00.000Z",
		updatedAt: "2026-05-08T08:00:00.000Z",
		cancellationReason: null,
		notes: null,
		doctor: createDoctor(),
		...overrides,
	};
}

export function createAppointmentListResult(items: PatientAppointment[]): AppointmentListResult {
	return {
		items,
		page: 1,
		pageSize: 10,
		total: items.length,
	};
}

export const appointmentFixtures = {
	futurePending: createAppointment({
		id: "appt-pending-future",
		status: "PENDING",
		startsAt: "2026-05-10T10:00:00.000Z",
		endsAt: "2026-05-10T10:30:00.000Z",
	}),
	futureConfirmedAt24Hours: createAppointment({
		id: "appt-confirmed-24",
		status: "CONFIRMED",
		startsAt: "2026-05-09T08:00:00.000Z",
		endsAt: "2026-05-09T08:30:00.000Z",
	}),
	futureConfirmedUnder24Hours: createAppointment({
		id: "appt-confirmed-under",
		status: "CONFIRMED",
		startsAt: "2026-05-08T20:00:00.000Z",
		endsAt: "2026-05-08T20:30:00.000Z",
	}),
	futureInProgress: createAppointment({
		id: "appt-in-progress",
		status: "IN_PROGRESS",
		startsAt: "2026-05-10T11:00:00.000Z",
		endsAt: "2026-05-10T11:30:00.000Z",
	}),
	pastCompleted: createAppointment({
		id: "appt-completed",
		status: "COMPLETED",
		startsAt: "2026-05-06T10:00:00.000Z",
		endsAt: "2026-05-06T10:30:00.000Z",
	}),
	pastNoShow: createAppointment({
		id: "appt-no-show",
		status: "NO_SHOW",
		startsAt: "2026-05-05T10:00:00.000Z",
		endsAt: "2026-05-05T10:30:00.000Z",
	}),
	canceledWithReason: createAppointment({
		id: "appt-canceled",
		status: "CANCELED",
		startsAt: "2026-05-07T10:00:00.000Z",
		endsAt: "2026-05-07T10:30:00.000Z",
		cancellationReason: "Patient requested cancellation",
	}),
	doctorWithSpecialization: createDoctor({ specialization: "Orthodontics" }),
	doctorWithoutSpecialization: createDoctor({ id: "doc-2", firstName: "Nour", lastName: "Ali", specialization: null }),
	emptyResult: createAppointmentListResult([]),
	failureResponse: { message: "Failed to load appointments" },
	successfulCancellation: { success: true as const, appointmentId: "appt-pending-future" },
	ownershipRejection: { message: "Not owned", code: "APPOINTMENT_NOT_OWNED" },
	tooLateRejection: { message: "Too late", code: "APPOINTMENT_CANCELLATION_TOO_LATE" },
	networkFailure: new Error("Network failure"),
};

export function listWithMixedAppointments() {
	return createAppointmentListResult([
		appointmentFixtures.futurePending,
		appointmentFixtures.futureConfirmedAt24Hours,
		appointmentFixtures.futureConfirmedUnder24Hours,
		appointmentFixtures.futureInProgress,
		appointmentFixtures.pastCompleted,
		appointmentFixtures.pastNoShow,
		appointmentFixtures.canceledWithReason,
	]);
}

export function createAppointmentWithStatus(status: AppointmentStatus) {
	return createAppointment({ status });
}
