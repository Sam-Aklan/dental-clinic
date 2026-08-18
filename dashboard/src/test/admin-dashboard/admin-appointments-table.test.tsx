import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "@/test/common-components/test-utils";
import { AdminAppointmentsTable } from "@/components/admin-dashboard";

const mutate = vi.fn();

vi.mock("@/hooks/admin-dashboard", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/hooks/admin-dashboard")>();
	return {
		...actual,
		useCancelAdminAppointmentMutation: () => ({
			mutate,
			isPending: false,
			variables: undefined,
		}),
	};
});

describe("AdminAppointmentsTable", () => {
	it("shows the cancel action menu for cancellable appointments", async () => {
		const user = setupUser();
		renderWithProviders(
			<AdminAppointmentsTable
				data={[{
					id: "appointment-1",
					startsAt: "2026-05-20T08:00:00.000Z",
					endsAt: "2026-05-20T08:30:00.000Z",
					status: "CONFIRMED",
					createdAt: "2026-05-01T07:00:00.000Z",
					patient: { id: "patient-1", firstName: "Amina", lastName: "Ali" },
					doctor: { id: "doctor-1", firstName: "Omar", lastName: "Saleh" },
				}]}
				filters={{ from: "2026-05-01", to: "2026-05-31", page: 1, pageSize: 20, sortBy: "startsAt", sortDir: "asc" }}
				total={1}
				errorLabel="Error"
				retryLabel="Retry"
				labels={{ from: "From", to: "To", doctor: "Doctor", patient: "Patient", status: "Status", bookedAt: "Booked at", action: "Action", cancel: "Cancel appointment", canceling: "Canceling...", noActions: "No actions", empty: "Empty", export: "Export", exporting: "Exporting", page: "Page", previous: "Previous", next: "Next" }}
				onPageChange={vi.fn()}
				onSortChange={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Action" }));
		await user.click(screen.getByRole("menuitem", { name: "Cancel appointment" }));

		expect(mutate).toHaveBeenCalledWith("appointment-1");
	});

	it("disables the action button when no appointment actions are available", () => {
		renderWithProviders(
			<AdminAppointmentsTable
				data={[{
					id: "appointment-2",
					startsAt: "2026-05-20T08:00:00.000Z",
					endsAt: "2026-05-20T08:30:00.000Z",
					status: "COMPLETED",
					createdAt: "2026-05-01T07:00:00.000Z",
					patient: { id: "patient-1", firstName: "Amina", lastName: "Ali" },
					doctor: { id: "doctor-1", firstName: "Omar", lastName: "Saleh" },
				}]}
				filters={{ from: "2026-05-01", to: "2026-05-31", page: 1, pageSize: 20, sortBy: "startsAt", sortDir: "asc" }}
				total={1}
				errorLabel="Error"
				retryLabel="Retry"
				labels={{ from: "From", to: "To", doctor: "Doctor", patient: "Patient", status: "Status", bookedAt: "Booked at", action: "Action", cancel: "Cancel appointment", canceling: "Canceling...", noActions: "No actions", empty: "Empty", export: "Export", exporting: "Exporting", page: "Page", previous: "Previous", next: "Next" }}
				onPageChange={vi.fn()}
				onSortChange={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: "No actions" })).toBeDisabled();
	});
});
