import dayjs from "dayjs";
import type { CreateDoctorDTO, CreateScheduleOverrideDTO, DoctorDTO, DoctorFilters, DoctorsAdminUrlState, ScheduleOverrideDTO, UpdateDoctorDTO } from "@/types";

export function parseDoctorsAdminSearch(raw: Record<string, string | undefined>): DoctorsAdminUrlState {
	const page = Number.parseInt(raw.page ?? "", 10);
	const status = raw.status === "active" || raw.status === "inactive" ? raw.status : "";
	const tab = raw.tab === "overrides" ? "overrides" : "profile";
	return {
		q: raw.q?.trim() ?? "",
		specialization: raw.specialization?.trim() ?? "",
		status,
		page: Number.isFinite(page) && page > 0 ? page : 1,
		doctorId: raw.doctorId?.trim() ?? "",
		tab,
	};
}

export function normalizeOptionalString(value: string | null | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export function normalizeApiError(error: unknown): string {
	if (typeof error === "string") return error.trim();

	const responseMessage = (error as { response?: { data?: { message?: unknown } } } | null)?.response?.data?.message;
	if (typeof responseMessage === "string" && responseMessage.trim()) {
		return responseMessage.trim();
	}

	if (Array.isArray(responseMessage)) {
		const messages = responseMessage.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
		if (messages.length > 0) return messages.join(", ");
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message.trim();
	}

	const fallbackMessage = (error as { message?: unknown } | null)?.message;
	if (typeof fallbackMessage === "string" && fallbackMessage.trim()) {
		return fallbackMessage.trim();
	}

	return "Unknown error";
}

export function hasStatusSupport(doctors: DoctorDTO[]) {
	return doctors.some((doctor) => doctor.isActive !== undefined && doctor.isActive !== null);
}

export type PaginatedLike<T> = { data?: T[]; total?: number; page?: number; pageSize?: number } | T[] | { data?: { data?: T[]; total?: number; page?: number; pageSize?: number } };

export function unwrapPaginated<T>(payload: PaginatedLike<T>): { data: T[]; total: number; page: number; pageSize: number } {
	if (Array.isArray(payload)) {
		return { data: payload, total: payload.length, page: 1, pageSize: payload.length || 1 };
	}

	const maybeData = (payload as { data?: { data?: T[]; total?: number; page?: number; pageSize?: number } }).data;
	if (maybeData && Array.isArray(maybeData.data)) {
		return {
			data: maybeData.data,
			total: maybeData.total ?? maybeData.data.length,
			page: maybeData.page ?? 1,
			pageSize: maybeData.pageSize ?? (maybeData.data.length || 1),
		};
	}

	if (Array.isArray((payload as { data?: T[] }).data)) {
		const data = (payload as { data: T[] }).data;
		return { data, total: (payload as { total?: number }).total ?? data.length, page: (payload as { page?: number }).page ?? 1, pageSize: (payload as { pageSize?: number }).pageSize ?? (data.length || 1) };
	}

	return { data: [], total: 0, page: 1, pageSize: 1 };
}

export function toDoctorFilters(state: DoctorsAdminUrlState): DoctorFilters {
	return {
		q: normalizeOptionalString(state.q),
		specialization: normalizeOptionalString(state.specialization),
		status: state.status || undefined,
		page: state.page > 1 ? state.page : undefined,
	};
}

export function createDoctorPayload(values: { firstName: string; lastName: string; email: string; phone?: string; specialization?: string; bio?: string; isActive?: boolean }): CreateDoctorDTO {
	return {
		firstName: values.firstName.trim(),
		lastName: values.lastName.trim(),
		email: values.email.trim(),
		phone: normalizeOptionalString(values.phone) ?? null,
		specialization: normalizeOptionalString(values.specialization) ?? null,
		bio: normalizeOptionalString(values.bio) ?? null,
	};
}

export function updateDoctorPayload(values: Partial<{ firstName: string; lastName: string; phone?: string; specialization?: string; bio?: string; isActive?: boolean }>): UpdateDoctorDTO {
	return {
		...(values.firstName !== undefined ? { firstName: values.firstName.trim() } : {}),
		...(values.lastName !== undefined ? { lastName: values.lastName.trim() } : {}),
		...(values.phone !== undefined ? { phone: normalizeOptionalString(values.phone) ?? null } : {}),
		...(values.specialization !== undefined ? { specialization: normalizeOptionalString(values.specialization) ?? null } : {}),
		...(values.bio !== undefined ? { bio: normalizeOptionalString(values.bio) ?? null } : {}),
		...(values.isActive !== undefined ? { isActive: values.isActive } : {}),
	};
}

export function createScheduleOverridePayload(values: { date: string; isUnavailable: boolean; startTime?: string | null; endTime?: string | null; reason?: string | null }): CreateScheduleOverrideDTO {
	return {
		date: values.date,
		isUnavailable: values.isUnavailable,
		startTime: values.isUnavailable ? null : normalizeOptionalString(values.startTime) ?? null,
		endTime: values.isUnavailable ? null : normalizeOptionalString(values.endTime) ?? null,
		reason: normalizeOptionalString(values.reason) ?? null,
	};
}

export function formatDoctorName(doctor: Pick<DoctorDTO, "firstName" | "lastName">) {
	return `${doctor.firstName} ${doctor.lastName}`.trim();
}

export function formatAvailability(doctor: Pick<DoctorDTO, "defaultAvailability">) {
	return doctor.defaultAvailability?.trim() || "Derived from clinic hours";
}

export function formatOverrideTime(overrideItem: Pick<ScheduleOverrideDTO, "startTime" | "endTime" | "isUnavailable">) {
	if (overrideItem.isUnavailable) return "Unavailable all day";
	return `${overrideItem.startTime ?? "--:--"} - ${overrideItem.endTime ?? "--:--"}`;
}

export function toIsoDate(value: Date) {
	return dayjs(value).format("YYYY-MM-DD");
}

export function isPastIsoDate(date: string) {
	return dayjs(date).isBefore(dayjs().startOf("day"), "day");
}
