import type { StaffQueueAppointmentDTO, TodayByDoctorDTO, TodaySummaryDTO } from "@/types";

export const queueAppointmentFixture: StaffQueueAppointmentDTO = {
	id: "appt-1",
	startsAt: "2026-05-09T08:00:00.000Z",
	endsAt: "2026-05-09T08:30:00.000Z",
	status: "CONFIRMED",
	bookedByRole: "RECEPTIONIST",
	createdAt: "2026-05-08T10:00:00.000Z",
	patient: {
		id: "patient-1",
		firstName: "Amina",
		lastName: "Hassan",
		phone: "+123456789",
	},
	doctor: {
		id: "doctor-1",
		firstName: "Omar",
		lastName: "Saleh",
		specialization: "Dentistry",
	},
};

export const backendQueueAppointmentFixture = {
	id: "appt-1",
	doctorId: "doctor-1",
	patientId: "patient-1",
	startsAt: "2026-05-09T08:00:00.000Z",
	endsAt: "2026-05-09T08:30:00.000Z",
	status: "CONFIRMED",
	createdAt: "2026-05-08T10:00:00.000Z",
	updatedAt: "2026-05-08T10:00:00.000Z",
	cancellationReason: null,
	notes: null,
	patient: {
		id: "patient-1",
		firstName: "Amina",
		lastName: "Hassan",
		phone: "+123456789",
	},
	doctor: {
		id: "doctor-1",
		firstName: "Omar",
		lastName: "Saleh",
		specialization: "Dentistry",
	},
} satisfies Record<string, unknown>;

export const normalizedBackendQueueAppointmentFixture: StaffQueueAppointmentDTO = {
	...queueAppointmentFixture,
};

export const anotherQueueAppointmentFixture: StaffQueueAppointmentDTO = {
	...queueAppointmentFixture,
	id: "appt-2",
	startsAt: "2026-05-09T08:15:00.000Z",
	patient: {
		id: "patient-2",
		firstName: "Noor",
		lastName: "Ali",
		phone: null,
	},
};

export const summaryFixture: TodaySummaryDTO = {
	total: 12,
	inProgress: 2,
	waiting: 4,
	completed: 3,
	canceledToday: 2,
	noShow: 1,
	pendingConfirmation: 1,
};

export const byDoctorFixture: TodayByDoctorDTO[] = [
	{ doctorId: "doctor-1", doctorName: "Omar Saleh", confirmed: 3, inProgress: 1, completed: 2, canceled: 0 },
	{ doctorId: "doctor-2", doctorName: "Lina Yusuf", confirmed: 2, inProgress: 0, completed: 1, canceled: 1 },
];
