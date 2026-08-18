import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLiveClock } from "@/hooks/lobby-queue";

afterEach(() => {
	vi.useRealTimers();
});

describe("useLiveClock", () => {
	it("ticks once per second", async () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useLiveClock());
		const initial = result.current.now.valueOf();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(result.current.now.valueOf()).toBeGreaterThanOrEqual(initial + 1000);
	});
});
