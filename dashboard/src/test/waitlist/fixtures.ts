import type { WaitlistEntryDTO, DoctorOption, JoinWaitlistDTO, UpdateWaitlistWindowDTO } from "@/types";

export function createWaitlistDoctor(overrides: Partial<DoctorOption> = {}): DoctorOption {
	return {
		id: "doc-1",
		firstName: "Ahmad",
		lastName: "Al-Rashid",
		specialization: "Orthodontics",
		...overrides,
	};
}

export function createWaitlistEntry(overrides: Partial<WaitlistEntryDTO> = {}): WaitlistEntryDTO {
	const doctor = createWaitlistDoctor(overrides.doctor?.id ? undefined : { id: overrides.doctorId as string | undefined });
	return {
		id: "entry-1",
		doctorId: "doc-1",
		patientId: "patient-1",
		position: 3,
		availableFrom: "09:00",
		availableUntil: "13:00",
		createdAt: "2026-05-08T08:00:00.000Z",
		doctor: doctor,
		pendingOffer: null,
		...overrides,
	};
}

export function createJoinWaitlistDTO(overrides: Partial<JoinWaitlistDTO> = {}): JoinWaitlistDTO {
	return {
		doctorId: "doc-1",
		availableFrom: null,
		availableUntil: null,
		...overrides,
	};
}

export function createUpdateWindowDTO(overrides: Partial<UpdateWaitlistWindowDTO> = {}): UpdateWaitlistWindowDTO {
	return {
		availableFrom: null,
		availableUntil: null,
		...overrides,
	};
}

	export const waitlistFixtures = {
	entryWithWindow: createWaitlistEntry(),
	entryWithPendingOffer: createWaitlistEntry({ pendingOffer: { id: "offer-1" } }),
	entryWithoutWindow: createWaitlistEntry({
		id: "entry-2",
		doctorId: "doc-2",
		availableFrom: null,
		availableUntil: null,
		position: 0,
		doctor: createWaitlistDoctor({ id: "doc-2", firstName: "Nour", lastName: "Ali", specialization: null }),
	}),
	entryWithDoctorSpecialization: createWaitlistEntry({
		id: "entry-3",
		doctorId: "doc-3",
		position: 5,
		doctor: createWaitlistDoctor({ id: "doc-3", firstName: "Sara", lastName: "Hassan", specialization: "Pediatric Dentistry" }),
	}),
	doctors: [
		createWaitlistDoctor(),
		createWaitlistDoctor({ id: "doc-2", firstName: "Nour", lastName: "Ali", specialization: null }),
		createWaitlistDoctor({ id: "doc-3", firstName: "Sara", lastName: "Hassan", specialization: "Pediatric Dentistry" }),
		createWaitlistDoctor({ id: "doc-4", firstName: "Omar", lastName: "Khalil", specialization: "Endodontics" }),
	],
	emptyEntries: [] as WaitlistEntryDTO[],
	entryApiResponse: { data: { statusCode: 201, data: createWaitlistEntry() } },
	waitlistApiResponse: { data: { statusCode: 200, data: { items: [createWaitlistEntry()], total: 1, page: 1, pageSize: 20 } } },
	conflictApiResponse: { response: { status: 409, data: { message: "waitlist.alreadyJoined" } } },
};
