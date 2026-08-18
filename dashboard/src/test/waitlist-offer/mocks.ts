import { vi } from "vitest";
import type { AxiosResponse } from "axios";

export function createAxiosResponse<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {},
    config: {} as AxiosResponse["config"],
  };
}

export function mockApiGet(returnValue: unknown) {
  return vi.fn().mockResolvedValue(returnValue);
}

export function mockApiPost(returnValue: unknown) {
  return vi.fn().mockResolvedValue(returnValue);
}

export function mockApiRejected(error: unknown) {
  return vi.fn().mockRejectedValue(error);
}

export function mockApiGetOnce(returnValue: unknown) {
  return vi.fn().mockResolvedValueOnce(returnValue);
}

export function mockApiPostOnce(returnValue: unknown) {
  return vi.fn().mockResolvedValueOnce(returnValue);
}

export function mockApiRejectedOnce(error: unknown) {
  return vi.fn().mockRejectedValueOnce(error);
}

export function mockPageVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
}

export function dispatchVisibilityChange() {
  document.dispatchEvent(new Event("visibilitychange"));
}

export function setupFakeTimers() {
  vi.useFakeTimers();
}

export function advanceTimersByTime(ms: number) {
  vi.advanceTimersByTime(ms);
}

export function clearAllMocks() {
  vi.clearAllMocks();
}

export function resetAllTimers() {
  vi.useRealTimers();
}

export function useFakeTimers() {
  vi.useFakeTimers();
}
