import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { AuditPayloadViewer } from "@/components/audit-log/AuditPayloadViewer";
import { renderWithAuditLogProviders } from "./audit-log-test-utils";

describe("audit payload viewer", () => {
	it("shows an empty state for null payloads", () => {
		renderWithAuditLogProviders(<AuditPayloadViewer payload={null} />);

		expect(screen.getByText("No payload available")).toBeInTheDocument();
	});
});
