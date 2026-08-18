import { vi } from "vitest";

export const apiMock = {
	get: vi.fn(),
	patch: vi.fn(),
	delete: vi.fn(),
};
