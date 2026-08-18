import type { DoctorDirectoryItemDTO } from "@/types";
import { isPastClinicDate } from "./booking-date.helper";

export interface BookingSearchParams {
	doctorId?: string;
	date?: string;
}

export function parseBookingSearch(searchParams: Record<string, string | undefined>): BookingSearchParams {
	return {
		doctorId: searchParams.doctorId,
		date: searchParams.date,
	};
}

export function validatePreselectedDoctor(
	doctorId: string | undefined,
	doctors: DoctorDirectoryItemDTO[],
): string | null {
	if (!doctorId) return null;
	const doctor = doctors.find((d) => d.id === doctorId);
	if (!doctor || !doctor.isActive) return null;
	return doctorId;
}

export function validatePreselectedDate(dateStr: string | undefined): string | null {
	if (!dateStr) return null;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
	if (isPastClinicDate(dateStr)) return null;
	return dateStr;
}
