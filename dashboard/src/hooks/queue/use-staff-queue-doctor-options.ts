import { useEffect, useMemo, useState } from "react";
import { useDoctors } from "@/hooks/doctors-admin";
import { useDebounce } from "@/hooks/shared";
import type { DoctorDTO } from "@/types";

const DOCTOR_FILTER_PAGE_SIZE = 5;
const DOCTOR_FILTER_DEBOUNCE_MS = 300;

function isDoctorActive(doctor?: DoctorDTO | null) {
	return doctor?.isActive !== false;
}

function mergeDoctors(previous: DoctorDTO[], incoming: DoctorDTO[]) {
	const byId = new Map(previous.map((doctor) => [doctor.id, doctor]));
	for (const doctor of incoming) {
		byId.set(doctor.id, doctor);
	}
	return Array.from(byId.values());
}

export function useStaffQueueDoctorOptions(selectedDoctorIds: string[]) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [cachedDoctors, setCachedDoctors] = useState<DoctorDTO[]>([]);
	const debouncedSearchQuery = useDebounce(searchQuery.trim(), DOCTOR_FILTER_DEBOUNCE_MS);

	const doctorsQuery = useDoctors({
		status: "active",
		page: 1,
		pageSize: DOCTOR_FILTER_PAGE_SIZE,
		q: debouncedSearchQuery || undefined,
	});

	useEffect(() => {
		const nextDoctors = (doctorsQuery.data?.data ?? []).filter(isDoctorActive);
		if (nextDoctors.length === 0) {
			return;
		}
		setCachedDoctors((current) => mergeDoctors(current, nextDoctors));
	}, [doctorsQuery.data?.data]);

	const options = useMemo(() => {
		const fetchedDoctors = (doctorsQuery.data?.data ?? []).filter(isDoctorActive);
		const selectedDoctors = cachedDoctors.filter((doctor) => selectedDoctorIds.includes(doctor.id) && isDoctorActive(doctor));
		return mergeDoctors(selectedDoctors, fetchedDoctors);
	}, [cachedDoctors, doctorsQuery.data?.data, selectedDoctorIds]);

	const selectedDoctorLabels = useMemo(() => {
		const labelsById = new Map(cachedDoctors.map((doctor) => [doctor.id, [doctor.firstName, doctor.lastName].filter(Boolean).join(" ")]));
		return selectedDoctorIds.map((doctorId) => labelsById.get(doctorId) ?? doctorId);
	}, [cachedDoctors, selectedDoctorIds]);

	function handleOpenChange(open: boolean) {
		setIsOpen(open);
		if (!open) {
			setSearchQuery("");
		}
	}

	return {
		isOpen,
		handleOpenChange,
		searchQuery,
		setSearchQuery,
		options,
		selectedDoctorLabels,
		isLoading: doctorsQuery.isLoading,
		isFetching: doctorsQuery.isFetching,
		isError: doctorsQuery.isError,
		debouncedSearchQuery,
	} as const;
}
