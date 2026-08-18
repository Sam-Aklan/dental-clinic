import { describe, expect, it, vi } from "vitest";
import { ROUTE_BOOK_APPOINTMENTS } from "@/constants/routes";

const redirectCalls = vi.hoisted(() => [] as Array<{ to: string; replace?: boolean }>);

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

	return {
		...actual,
		redirect: (value: { to: string; replace?: boolean }) => {
			redirectCalls.push(value);
			return value;
		},
		createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
	};
});

import { Route } from "@/routes/_authenticated._patient.my-appointments";

describe("appointment email redirect route", () => {
	it("redirects /my-appointments to /book-appointments", () => {
		expect(Route.options.beforeLoad).toBeDefined();

		expect(() => {
			(Route.options.beforeLoad as () => never)();
		}).toThrow();

		expect(redirectCalls).toHaveLength(1);
		expect(redirectCalls[0]).toEqual({ to: ROUTE_BOOK_APPOINTMENTS, replace: true });
	});
});
