import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("follow-up route entry points", () => {
	it("stay inside the existing protected queue routes", () => {
		const doctorRouteSource = readFileSync(join(process.cwd(), "src/routes/_authenticated._doctor.doctor.queue.tsx"), "utf8");
		const staffRouteSource = readFileSync(join(process.cwd(), "src/routes/_authenticated._receptionist.staff.queue.tsx"), "utf8");

		expect(doctorRouteSource).toContain('createFileRoute("/_authenticated/_doctor/doctor/queue")');
		expect(staffRouteSource).toContain('createFileRoute("/_authenticated/_receptionist/staff/queue")');
		expect(doctorRouteSource).not.toContain("follow-up");
		expect(staffRouteSource).not.toContain("follow-up");
	});
});
