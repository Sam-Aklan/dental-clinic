import { describe, expect, it, vi } from "vitest";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { queueKeys } from "@/lib/queue";
import { createCancelStaffAppointmentMutationOptions, createMarkStaffNoShowMutationOptions, createRemoveStaffWaitlistEntryMutationOptions, createRescheduleStaffAppointmentMutationOptions } from "@/lib/staff-appointments";

describe("staff appointment mutations", () => {
	it("invalidates admin and queue analytics after successful staff mutations", async () => {
		const queryClient = { invalidateQueries: vi.fn() };
		const mutationFactories = [
			createCancelStaffAppointmentMutationOptions,
			createRescheduleStaffAppointmentMutationOptions,
			createMarkStaffNoShowMutationOptions,
			createRemoveStaffWaitlistEntryMutationOptions,
		];

	for (const createOptions of mutationFactories) {
		queryClient.invalidateQueries.mockClear();
		const options = createOptions(queryClient as never);
		await options.onSuccess?.(undefined, undefined as never, undefined as never, undefined as never);

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: adminDashboardKeys.root });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todaySummary() });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todayByDoctor() });
		}
	});
});
