import { describe, expect, it, vi } from "vitest";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { queueKeys, cancelStaffMutationOptions, updateStatusMutationOptions } from "@/lib/queue";

describe("queue mutations", () => {
	it("invalidates admin and queue analytics after successful mutations", async () => {
		const queryClient = { invalidateQueries: vi.fn() };

		await updateStatusMutationOptions(queryClient as never).onSuccess?.();
		await cancelStaffMutationOptions(queryClient as never).onSuccess?.();

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: adminDashboardKeys.root });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todaySummary() });
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queueKeys.todayByDoctor() });
	});
});
