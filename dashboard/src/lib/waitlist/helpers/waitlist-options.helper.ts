import type { DoctorOption, WaitlistEntryDTO } from "@/types";

export function isDoctorJoinable(doctorId: string, entries: WaitlistEntryDTO[]): boolean {
	return !entries.some((entry) => entry.doctorId === doctorId);
}

export function filterJoinableDoctors(
	doctors: DoctorOption[],
	entries: WaitlistEntryDTO[],
): DoctorOption[] {
	return doctors.filter((doctor) => isDoctorJoinable(doctor.id, entries));
}

export function getJoinableDoctors(
	doctors: DoctorOption[],
	entries: WaitlistEntryDTO[],
): DoctorOption[] {
	return filterJoinableDoctors(doctors, entries);
}
