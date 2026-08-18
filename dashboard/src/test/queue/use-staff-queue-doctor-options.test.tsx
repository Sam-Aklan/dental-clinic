import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStaffQueueDoctorOptions } from "@/hooks/queue";

vi.mock("@/hooks/doctors-admin", () => ({
	useDoctors: vi.fn(),
}));

import { useDoctors } from "@/hooks/doctors-admin";

const mockedUseDoctors = vi.mocked(useDoctors);

describe("useStaffQueueDoctorOptions", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockedUseDoctors.mockReturnValue({ data: { data: [], total: 0, page: 1, pageSize: 5 }, isLoading: false, isFetching: false, isError: false } as never);
	});

	it("loads five active doctors initially and debounces search updates", () => {
		renderHook(() => useStaffQueueDoctorOptions([]));

		expect(mockedUseDoctors).toHaveBeenLastCalledWith({ status: "active", page: 1, pageSize: 5, q: undefined });

		const { result, rerender } = renderHook(() => useStaffQueueDoctorOptions([]));

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

	it("keeps selected doctors visible after the current result set changes", () => {
		let doctorData = [{ id: "doctor-1", firstName: "Omar", lastName: "Saleh", isActive: true }];
		mockedUseDoctors.mockImplementation(() => ({
			data: { data: doctorData, total: doctorData.length, page: 1, pageSize: 5 },
			isLoading: false,
			isFetching: false,
			isError: false,
		}) as never);

		const { result, rerender } = renderHook(() => useStaffQueueDoctorOptions(["doctor-1"]));

		expect(result.current.selectedDoctorLabels).toEqual(["Omar Saleh"]);

		doctorData = [{ id: "doctor-2", firstName: "Lina", lastName: "Yusuf", isActive: true }];
		rerender();

		expect(result.current.selectedDoctorLabels).toEqual(["Omar Saleh"]);
		expect(result.current.options.map((doctor) => doctor.id)).toEqual(["doctor-1", "doctor-2"]);
	});
});
