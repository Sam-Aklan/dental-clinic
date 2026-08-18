import { useMemo, useState } from "react";
import { useDoctor, useDoctors } from "@/hooks/doctors-admin";
import { useDebounce } from "@/hooks/shared";
import type { DoctorDTO } from "@/types";

const DOCTOR_FILTER_PAGE_SIZE = 5;
const DOCTOR_FILTER_DEBOUNCE_MS = 300;

function isDoctorActive(doctor?: DoctorDTO | null) {
	return doctor?.isActive !== false;
}

export function useAdminDashboardDoctorOptions(selectedDoctorId: string) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery.trim(), DOCTOR_FILTER_DEBOUNCE_MS);

	const doctorsQuery = useDoctors({
		status: "active",
		page: 1,
		pageSize: DOCTOR_FILTER_PAGE_SIZE,
		q: debouncedSearchQuery || undefined,
	});
	const selectedDoctorQuery = useDoctor(selectedDoctorId);

	const options = useMemo(() => {
		const directoryDoctors = doctorsQuery.data?.data.filter(isDoctorActive) ?? [];
		const selectedDoctor = isDoctorActive(selectedDoctorQuery.data) ? selectedDoctorQuery.data : null;

		if (!selectedDoctor || directoryDoctors.some((doctor) => doctor.id === selectedDoctor.id)) {
			return directoryDoctors;
		}

		return [selectedDoctor, ...directoryDoctors];
	}, [doctorsQuery.data?.data, selectedDoctorQuery.data]);

	const selectedDoctorName = useMemo(() => {
		const selectedDoctor = options.find((doctor) => doctor.id === selectedDoctorId);
		return selectedDoctor ? [selectedDoctor.firstName, selectedDoctor.lastName].filter(Boolean).join(" ") : "";
	}, [options, selectedDoctorId]);

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
		selectedDoctorName,
		isLoading: doctorsQuery.isLoading || selectedDoctorQuery.isLoading,
		isFetching: doctorsQuery.isFetching,
		isError: doctorsQuery.isError,
		debouncedSearchQuery,
	} as const;
}
