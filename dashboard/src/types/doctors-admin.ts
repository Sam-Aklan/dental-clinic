export interface DoctorDTO {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string | null;
	specialization: string | null;
	bio: string | null;
	isActive?: boolean | null;
	defaultAvailability?: string | null;
	emailEditable?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateDoctorDTO {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string | null;
	specialization?: string | null;
	bio?: string | null;
}

export interface UpdateDoctorDTO {
	firstName?: string;
	lastName?: string;
	phone?: string | null;
	specialization?: string | null;
	bio?: string | null;
	isActive?: boolean;
}

export interface ScheduleOverrideDTO {
	id: string;
	doctorId: string;
	date: string;
	startTime: string | null;
	endTime: string | null;
	isUnavailable: boolean;
	reason: string | null;
	createdAt: string;
}

export interface CreateScheduleOverrideDTO {
	date: string;
	isUnavailable: boolean;
	startTime?: string | null;
	endTime?: string | null;
	reason?: string | null;
}

export interface DoctorsAdminUrlState {
	q: string;
	specialization: string;
	status: "active" | "inactive" | "";
	page: number;
	doctorId: string;
	tab: "profile" | "overrides";
}

export interface DoctorFilters {
	q?: string;
	specialization?: string;
	status?: "active" | "inactive";
	page?: number;
	pageSize?: number;
}
