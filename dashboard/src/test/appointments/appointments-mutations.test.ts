import { describe, expect, it, vi } from "vitest";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { queueKeys } from "@/lib/queue";
import { appointmentsKeys } from "@/lib/appointments";
import { cancelAppointmentMutationOptions } from "@/lib/appointments";

describe("appointments mutations", () => {
	it("invalidates admin and queue analytics after a patient cancel", async () => {
		const queryClient = { invalidateQueries: vi.fn() };

		await cancelAppointmentMutationOptions(queryClient as never).onSuccess?.(undefined, undefined as never, undefined as never, undefined as never);

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: appointmentsKeys.all });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: adminDashboardKeys.root });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todaySummary() });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todayByDoctor() });
	});
});
