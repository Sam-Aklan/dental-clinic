import { CLINIC_TIMEZONE } from "@/constants";
import { findSlotByStart, formatClinicDate, formatClinicTimeRange, getDayBounds, isPastClinicDate } from "@/lib/booking";
import type { AvailableSlotDTO, DoctorDirectoryItemDTO, StaffBookingSummaryState, StaffPatientSearchDTO } from "@/types";

export interface WalkInSearchParams {
	patientId?: string;
	doctorId?: string;
	date?: string;
}

export function parseWalkInSearchParams(searchParams: Record<string, string | undefined>): WalkInSearchParams {
	return {
		patientId: searchParams.patientId,
		doctorId: searchParams.doctorId,
		date: searchParams.date,
	};
}

export function validateWalkInDate(dateStr: string | undefined): string | null {
	if (!dateStr) return null;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
	if (isPastClinicDate(dateStr)) return null;
	return dateStr;
}

export function getWalkInDateRange(dateStr: string) {
	return getDayBounds(dateStr);
}

export function getPatientDisplayName(patient: StaffPatientSearchDTO | null | undefined): string | null {
	if (!patient) return null;
	return `${patient.firstName} ${patient.lastName}`;
}

export function getDoctorDisplayName(doctor: DoctorDirectoryItemDTO | null | undefined): string | null {
	if (!doctor) return null;
	return `${doctor.firstName} ${doctor.lastName}`;
}

export function findWalkInSlotByStart(slots: AvailableSlotDTO[], startsAt: string | null): AvailableSlotDTO | undefined {
	if (!startsAt) return undefined;
	return findSlotByStart(slots, startsAt);
}

export function buildWalkInSummaryState(args: {
	patient: StaffPatientSearchDTO | null;
	doctor: DoctorDirectoryItemDTO | null;
	selectedDate: string;
	selectedSlot: AvailableSlotDTO | undefined;
	locale: string;
}): StaffBookingSummaryState {
	const { patient, doctor, selectedDate, selectedSlot, locale } = args;
	return {
		patientName: getPatientDisplayName(patient),
		doctorName: getDoctorDisplayName(doctor),
		doctorSpecialization: doctor?.specialization ?? null,
		selectedDateFormatted: selectedDate ? formatClinicDate(selectedDate, locale) : null,
		selectedTimeFormatted: selectedSlot ? formatClinicTimeRange(selectedSlot.startsAt, selectedSlot.endsAt, locale) : null,
		timezone: CLINIC_TIMEZONE,
		canConfirm: Boolean(patient?.id && doctor?.id && selectedSlot?.startsAt),
	};
}
