import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAdminDashboardDoctorOptions } from "@/hooks/admin-dashboard";

vi.mock("@/hooks/doctors-admin", () => ({
	useDoctors: vi.fn(),
	useDoctor: vi.fn(),
}));

import { useDoctor, useDoctors } from "@/hooks/doctors-admin";

const mockedUseDoctors = vi.mocked(useDoctors);
const mockedUseDoctor = vi.mocked(useDoctor);

describe("useAdminDashboardDoctorOptions", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockedUseDoctors.mockReturnValue({ data: { data: [], total: 0, page: 1, pageSize: 5 }, isLoading: false, isFetching: false, isError: false } as never);
		mockedUseDoctor.mockReturnValue({ data: undefined, isLoading: false } as never);
	});

	it("loads five active doctors initially and debounces search updates", () => {
		renderHook(() => useAdminDashboardDoctorOptions(""));

		expect(mockedUseDoctors).toHaveBeenLastCalledWith({ status: "active", page: 1, pageSize: 5, q: undefined });

		const { result, rerender } = renderHook(() => useAdminDashboardDoctorOptions(""));

		act(() => {
			result.current.setSearchQuery("om");
		});

		rerender();
		expect(mockedUseDoctors).toHaveBeenLastCalledWith({ status: "active", page: 1, pageSize: 5, q: undefined });

		act(() => {
			vi.advanceTimersByTime(300);
		});

		rerender();
		expect(mockedUseDoctors).toHaveBeenLastCalledWith({ status: "active", page: 1, pageSize: 5, q: "om" });
	});

	it("keeps the selected doctor visible when it is outside the current result set", () => {
		mockedUseDoctors.mockReturnValue({
			data: { data: [{ id: "doctor-2", firstName: "Lina", lastName: "Yusuf", isActive: true }], total: 1, page: 1, pageSize: 5 },
			isLoading: false,
			isFetching: false,
			isError: false,
		} as never);
		mockedUseDoctor.mockReturnValue({
			data: { id: "doctor-1", firstName: "Omar", lastName: "Saleh", isActive: true },
			isLoading: false,
		} as never);

		const { result } = renderHook(() => useAdminDashboardDoctorOptions("doctor-1"));

		expect(result.current.selectedDoctorName).toBe("Omar Saleh");
		expect(result.current.options.map((doctor) => doctor.id)).toEqual(["doctor-1", "doctor-2"]);
	});
});
