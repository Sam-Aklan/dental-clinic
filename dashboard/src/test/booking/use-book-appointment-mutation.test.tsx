import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { bookingKeys } from "@/lib/booking";
import { queueKeys } from "@/lib/queue";

const mocks = vi.hoisted(() => ({
	bookAppointment: vi.fn(),
}));

vi.mock("@/lib/booking", async () => {
	const actual = await vi.importActual<typeof import("@/lib/booking")>("@/lib/booking");
	return {
		...actual,
		bookAppointment: mocks.bookAppointment,
	};
});

import { useBookAppointmentMutation } from "@/hooks/booking";

afterEach(() => {
	vi.clearAllMocks();
});

describe("useBookAppointmentMutation", () => {
	it("invalidates booking, admin, and queue analytics after success", async () => {
		mocks.bookAppointment.mockResolvedValueOnce({ id: "appt-1" });
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

		const { result } = renderHook(() => useBookAppointmentMutation("doctor-1"), { wrapper });

		await act(async () => {
			result.current.generateKey();
			await result.current.mutation.mutateAsync({ doctorId: "doctor-1", startsAt: "2026-05-20T08:00:00.000Z" });
		});

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookingKeys.appointments() });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookingKeys.slots("doctor-1", "", "") });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminDashboardKeys.root });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queueKeys.todaySummary() });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queueKeys.todayByDoctor() });
	});
});
