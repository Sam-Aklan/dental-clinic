import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsKeys, createDoctorMutationOptions, updateDoctorMutationOptions, createScheduleOverrideMutationOptions, deleteScheduleOverrideMutationOptions } from "@/lib/doctors-admin";

function invalidateDoctorScope(queryClient: ReturnType<typeof useQueryClient>, doctorId?: string) {
	void queryClient.invalidateQueries({ queryKey: doctorsKeys.all });
	void queryClient.invalidateQueries({ queryKey: ["slots"] });
	void queryClient.invalidateQueries({ queryKey: ["appointments"] });
	void queryClient.invalidateQueries({ queryKey: ["waitlist"] });
	void queryClient.invalidateQueries({ queryKey: ["analytics/today-by-doctor"] });
	if (doctorId) {
		void queryClient.invalidateQueries({ queryKey: doctorsKeys.detail(doctorId) });
		void queryClient.invalidateQueries({ queryKey: doctorsKeys.overrides(doctorId) });
	}
}

export function useCreateDoctor() {
	const queryClient = useQueryClient();
	return useMutation({
		...createDoctorMutationOptions(),
		onSuccess: (doctor) => {
			invalidateDoctorScope(queryClient, doctor.id);
		},
	});
}

export function useUpdateDoctor() {
	const queryClient = useQueryClient();
	return useMutation({
		...updateDoctorMutationOptions(),
		onSuccess: (doctor, variables) => {
			invalidateDoctorScope(queryClient, variables.id);
			void queryClient.invalidateQueries({ queryKey: doctorsKeys.detail(doctor.id) });
		},
	});
}

export function useCreateOverride() {
	const queryClient = useQueryClient();
	return useMutation({
		...createScheduleOverrideMutationOptions(),
		onSuccess: (_override, variables) => {
			invalidateDoctorScope(queryClient, variables.doctorId);
		},
	});
}

export function useDeleteOverride() {
	const queryClient = useQueryClient();
	return useMutation({
		...deleteScheduleOverrideMutationOptions(),
		onSuccess: (_voidValue, variables) => {
			invalidateDoctorScope(queryClient, variables.doctorId);
		},
	});
}
