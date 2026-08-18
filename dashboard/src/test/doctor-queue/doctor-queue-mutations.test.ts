import { describe, expect, it, vi } from "vitest";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { queueKeys } from "@/lib/queue";
import { doctorQueueKeys, appointmentNoteMutationOptions, appointmentStatusMutationOptions } from "@/lib/doctor-queue";

describe("doctor queue mutations", () => {
	it("invalidates admin and queue analytics after note and status updates", async () => {
		const queryClient = { invalidateQueries: vi.fn() };

		await appointmentStatusMutationOptions(queryClient as never).onSuccess?.(undefined, { id: "appt-1", needsFollowUp: false });
		await appointmentNoteMutationOptions(queryClient as never).onSuccess?.(undefined, { id: "appt-1" });

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: adminDashboardKeys.root });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todaySummary() });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todayByDoctor() });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: doctorQueueKeys.appointmentStatus("appt-1") });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: doctorQueueKeys.appointmentNote("appt-1") });
	});
});
