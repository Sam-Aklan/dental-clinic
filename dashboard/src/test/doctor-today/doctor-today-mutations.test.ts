import { describe, expect, it, vi } from "vitest";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { queueKeys } from "@/lib/queue";
import { doctorTodayKeys, appointmentNotesMutationOptions, appointmentStatusMutationOptions } from "@/lib/doctor-today";

describe("doctor today mutations", () => {
	it("invalidates admin and queue analytics after status and note updates", async () => {
		const queryClient = { invalidateQueries: vi.fn() };

		await appointmentStatusMutationOptions(queryClient as never).onSuccess?.(undefined, { id: "appt-1" });
		await appointmentNotesMutationOptions(queryClient as never).onSuccess?.(undefined, { id: "appt-1" });

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: adminDashboardKeys.root });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todaySummary() });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todayByDoctor() });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: doctorTodayKeys.appointmentStatus("appt-1") });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: doctorTodayKeys.appointmentNotes("appt-1") });
	});
});
