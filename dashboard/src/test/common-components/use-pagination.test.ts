import { describe, it, expect } from "vitest";
import { usePagination } from "@/hooks/use-pagination";
import { act, renderHook } from "@testing-library/react";

describe("usePagination", () => {
  it("defaults to page 1 and page size 10", () => {
    const { result } = renderHook(() => usePagination(50));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
  });

  it("calculates total pages correctly", () => {
    const { result } = renderHook(() => usePagination(50));
    expect(result.current.totalPages).toBe(5);
  });

  it("returns total pages of at least 1 for zero records", () => {
    const { result } = renderHook(() => usePagination(0));
    expect(result.current.totalPages).toBe(1);
  });

  it("calculates offset correctly", () => {
    const { result } = renderHook(() => usePagination(50));
    expect(result.current.offset).toBe(0);
    act(() => result.current.setPage(3));
    expect(result.current.offset).toBe(20);
  });

  it("clamps setPage to minimum 1", () => {
    const { result } = renderHook(() => usePagination(50));
    act(() => result.current.setPage(-5));
    expect(result.current.page).toBe(1);
  });

  it("clamps setPage to maximum totalPages", () => {
    const { result } = renderHook(() => usePagination(50));
    act(() => result.current.setPage(100));
    expect(result.current.page).toBe(5);
  });

  it("resets to page 1 when page size changes", () => {
    const { result } = renderHook(() => usePagination(100));
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    act(() => result.current.setPageSize(20));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20);
  });

  it("reset restores initial page size", () => {
    const { result } = renderHook(() => usePagination(100, 25));
    act(() => result.current.setPageSize(50));
    act(() => result.current.setPage(2));
    act(() => result.current.reset());
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
  });

  it("handles shrinking total and reclamps page", () => {
    const { result, rerender } = renderHook(
      ({ total }) => usePagination(total),
      { initialProps: { total: 50 } }
    );
    act(() => result.current.setPage(5));
    expect(result.current.page).toBe(5);
    rerender({ total: 15 });
    expect(result.current.page).toBe(2);
  });

  it("accepts custom initialPageSize", () => {
    const { result } = renderHook(() => usePagination(100, 20));
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(5);
  });
});
