import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { DoctorDirectoryItemDTO, AvailableSlotDTO, AppointmentDTO } from "@/types";

export function createQueryClientWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	}

	Wrapper.displayName = "QueryClientWrapper";

	return { queryClient, Wrapper };
}

export function createAuthUser() {
	return {
		id: "test-patient-id",
		email: "patient@test.com",
		role: "PATIENT" as const,
		isActive: true,
		firstName: "Test",
		lastName: "Patient",
		preferredLocale: "EN" as const,
	};
}

export type TestDoctor = DoctorDirectoryItemDTO;

export function createDoctor(overrides: Partial<TestDoctor> = {}): TestDoctor {
	return {
		id: "doc-1",
		firstName: "Ahmad",
		lastName: "Al-Rashid",
		specialization: "General Dentistry",
		bio: "10 years of experience",
		isActive: true,
		...overrides,
	};
}

export type TestSlot = AvailableSlotDTO;

export function createSlot(overrides: Partial<TestSlot> = {}): TestSlot {
	return {
		startsAt: "2026-05-10T07:00:00.000Z",
		endsAt: "2026-05-10T07:30:00.000Z",
		doctorId: "doc-1",
		status: "available",
		...overrides,
	};
}

export type TestAppointment = AppointmentDTO;

export function createAppointment(overrides: Partial<TestAppointment> = {}): TestAppointment {
	return {
		id: "appt-1",
		doctorId: "doc-1",
		patientId: "test-patient-id",
		startsAt: "2026-05-10T07:00:00.000Z",
		endsAt: "2026-05-10T07:30:00.000Z",
		status: "PENDING",
		createdAt: "2026-05-08T10:00:00.000Z",
		updatedAt: "2026-05-08T10:00:00.000Z",
		cancellationReason: null,
		notes: null,
		doctor: {
			id: "doc-1",
			firstName: "Ahmad",
			lastName: "Al-Rashid",
			specialization: "General Dentistry",
		},
		patient: {
			id: "test-patient-id",
			firstName: "Test",
			lastName: "Patient",
		},
		...overrides,
	};
}

export function mockNavigate() {
	return () => {};
}
