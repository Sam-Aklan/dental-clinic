import "@testing-library/jest-dom/vitest";
import "@/i18n";
import { afterEach } from "vitest";

if (typeof globalThis.ResizeObserver === "undefined") {
	class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}

	globalThis.ResizeObserver = ResizeObserver as typeof globalThis.ResizeObserver;
}

afterEach(() => {
  localStorage.clear();
});

if (typeof window !== "undefined" && !(HTMLElement.prototype as Partial<HTMLElement>).hasPointerCapture) {
	Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
		value: () => false,
		configurable: true,
	});
}

if (typeof window !== "undefined" && !HTMLElement.prototype.scrollIntoView) {
	Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
		value: () => {},
		configurable: true,
	});
}

