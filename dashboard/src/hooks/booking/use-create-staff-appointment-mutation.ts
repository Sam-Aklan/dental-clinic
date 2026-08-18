import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStaffAppointment, bookingKeys, getDayBounds } from "@/lib/booking";
import { queueKeys } from "@/lib/queue";
import { staffAppointmentsKeys } from "@/lib/staff-appointments";
import type { StaffCreateAppointmentDTO } from "@/types";

export function useCreateStaffAppointmentMutation(doctorId: string | null, selectedDate: string) {
	const queryClient = useQueryClient();
	const idempotencyKeyRef = useRef<string | null>(null);

	const generateIdempotencyKey = useCallback(() => {
		idempotencyKeyRef.current = crypto.randomUUID();
	}, []);

	const clearIdempotencyKey = useCallback(() => {
		idempotencyKeyRef.current = null;
	}, []);

	const mutation = useMutation({
		mutationFn: (payload: StaffCreateAppointmentDTO) => {
			if (!idempotencyKeyRef.current) {
				generateIdempotencyKey();
			}
			return createStaffAppointment(payload, idempotencyKeyRef.current!);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			await queryClient.invalidateQueries({ queryKey: queueKeys.all });
			await queryClient.invalidateQueries({ queryKey: staffAppointmentsKeys.all });
			if (doctorId) {
				const dayBounds = getDayBounds(selectedDate);
				await queryClient.invalidateQueries({ queryKey: bookingKeys.slots(doctorId, dayBounds.from, dayBounds.to) });
				await queryClient.invalidateQueries({ queryKey: staffAppointmentsKeys.slots(doctorId, selectedDate) });
			}
		},
		onError: async (error: unknown) => {
			const status = (error as { response?: { status?: number } })?.response?.status;
			if (status === 409 && doctorId) {
				const dayBounds = getDayBounds(selectedDate);
				await queryClient.invalidateQueries({ queryKey: bookingKeys.slots(doctorId, dayBounds.from, dayBounds.to) });
				await queryClient.invalidateQueries({ queryKey: staffAppointmentsKeys.slots(doctorId, selectedDate) });
			}
		},
		onSettled: () => {
			clearIdempotencyKey();
		},
	});

	return {
		mutation,
		generateIdempotencyKey,
		clearIdempotencyKey,
		idempotencyKeyRef,
		isPending: mutation.isPending,
	};
}
