import { useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { bookAppointment } from "@/lib/booking";
import { bookingKeys } from "@/lib/booking";
import { queueKeys } from "@/lib/queue";
import type { CreateAppointmentDTO } from "@/types";

export function useBookAppointmentMutation(doctorId: string | null) {
	const queryClient = useQueryClient();
	const idempotencyKeyRef = useRef<string | null>(null);

	const generateKey = useCallback(() => {
		idempotencyKeyRef.current = crypto.randomUUID();
	}, []);

	const mutation = useMutation({
		mutationFn: (payload: CreateAppointmentDTO) =>
			bookAppointment(payload, idempotencyKeyRef.current!),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.appointments() });
			if (doctorId) {
				queryClient.invalidateQueries({ queryKey: bookingKeys.slots(doctorId, "", "") });
			}
			queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
			queryClient.invalidateQueries({ queryKey: queueKeys.todaySummary() });
			queryClient.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
		},
	});

	return {
		mutation,
		generateKey,
		isPending: mutation.isPending,
	};
}
