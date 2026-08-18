import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DoctorsAdminPage } from "@/components/doctors-admin";
import type { DoctorDTO } from "@/types";
import { renderDoctorsAdmin } from "./doctors-admin.test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

const directoryState = {
	data: { data: [] as DoctorDTO[], total: 0, page: 1, pageSize: 1 },
	isLoading: false,
	isError: false,
	refetch: vi.fn(),
};

const doctorState = {
	data: null as DoctorDTO | null,
	isLoading: false,
	isError: false,
};

const layoutState = {
	isXl: false,
};

const updateDoctorMutation = {
	mutateAsync: vi.fn(),
	isPending: false,
};

const createOverrideMutation = {
	mutateAsync: vi.fn(),
	isPending: false,
};

const deleteOverrideMutation = {
	mutateAsync: vi.fn(),
	isPending: false,
	variables: null as any,
};

const overridesState = {
	data: { data: [] as any[] },
	isLoading: false,
	isError: false,
};

vi.mock("@/hooks/doctors-admin", () => ({
	useCreateDoctor: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useUpdateDoctor: () => updateDoctorMutation,
	useCreateOverride: () => createOverrideMutation,
	useDeleteOverride: () => deleteOverrideMutation,
	useDoctors: () => directoryState,
	useDoctor: () => doctorState,
	useDoctorOverrides: () => overridesState,
}));

vi.mock("@/hooks/shared", () => ({
	useIsXl: () => layoutState.isXl,
}));

beforeEach(() => {
	directoryState.data = { data: [], total: 0, page: 1, pageSize: 1 };
	doctorState.data = null;
	layoutState.isXl = false;
	overridesState.data = { data: [] };
	updateDoctorMutation.mutateAsync.mockReset();
	createOverrideMutation.mutateAsync.mockReset();
	deleteOverrideMutation.mutateAsync.mockReset();
	vi.clearAllMocks();
});

describe("DoctorsAdminPage", () => {
	it("renders the empty state when no doctor is selected", () => {
		layoutState.isXl = true;
		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "", tab: "profile" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>
		);

		expect(screen.getByText("No doctor selected")).toBeInTheDocument();
	});

	it("shows active and inactive directory items and keeps controls keyboard accessible", async () => {
		directoryState.data = {
			data: [
				{ id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true },
				{ id: "doc-2", firstName: "Omar", lastName: "Hassan", email: "omar@example.com", phone: null, specialization: "Endodontics", bio: null, isActive: false },
			],
			total: 2,
			page: 1,
			pageSize: 10,
		};

		const onUpdateSearch = vi.fn();
		const user = userEvent.setup();

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "", tab: "profile" }}
				onUpdateSearch={onUpdateSearch}
				onResetSearch={vi.fn()}
			/>,
		);

		expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
		expect(screen.getByText("Omar Hassan")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "View profile" })).toHaveLength(2);
		expect(screen.getAllByText("Active")).toHaveLength(1);
		expect(screen.getAllByText("Inactive")).toHaveLength(1);
		expect(screen.getByRole("button", { name: "Create Doctor" })).toBeInTheDocument();

		const viewProfileButton = screen.getAllByRole("button", { name: "View profile" })[0];
		viewProfileButton.focus();
		await user.keyboard("{Enter}");
		expect(onUpdateSearch).toHaveBeenCalled();
	});

	it("opens the doctor detail panel in a dialog below xl screens", () => {
		layoutState.isXl = false;
		doctorState.data = { id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true };

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "doc-1", tab: "profile" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>,
		);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
		expect(screen.queryByText("No doctor selected")).not.toBeInTheDocument();
	});

	it("keeps the inline split view on xl screens", () => {
		layoutState.isXl = true;
		doctorState.data = { id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true };

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "doc-1", tab: "profile" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>,
		);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
	});

	it("shows toast notification on successful profile update", async () => {
		layoutState.isXl = true;
		doctorState.data = { id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true };
		updateDoctorMutation.mutateAsync.mockResolvedValueOnce({});

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "doc-1", tab: "profile" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Save changes" }));

		expect(updateDoctorMutation.mutateAsync).toHaveBeenCalled();
		expect(toast.success).toHaveBeenCalled();
	});

	it("shows toast notification on failed profile update", async () => {
		layoutState.isXl = true;
		doctorState.data = { id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true };
		updateDoctorMutation.mutateAsync.mockRejectedValueOnce(new Error("Failed to update"));

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "doc-1", tab: "profile" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Save changes" }));

		expect(updateDoctorMutation.mutateAsync).toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalled();
	});

	it("shows toast notification on successful override creation", async () => {
		layoutState.isXl = true;
		doctorState.data = { id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true };
		createOverrideMutation.mutateAsync.mockResolvedValueOnce({});

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "doc-1", tab: "overrides" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>
		);

		const user = userEvent.setup();
		await user.type(screen.getByLabelText("Reason"), "Holiday");
		await user.click(screen.getByRole("button", { name: "Add override" }));

		expect(createOverrideMutation.mutateAsync).toHaveBeenCalled();
		expect(toast.success).toHaveBeenCalled();
	});

	it("shows toast notification on failed override creation", async () => {
		layoutState.isXl = true;
		doctorState.data = { id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true };
		createOverrideMutation.mutateAsync.mockRejectedValueOnce(new Error("Failed to create"));

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "doc-1", tab: "overrides" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>
		);

		const user = userEvent.setup();
		await user.type(screen.getByLabelText("Reason"), "Holiday");
		await user.click(screen.getByRole("button", { name: "Add override" }));

		expect(createOverrideMutation.mutateAsync).toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalled();
	});

	it("shows toast notification on successful override deletion", async () => {
		layoutState.isXl = true;
		doctorState.data = { id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true };
		overridesState.data = {
			data: [{ id: "override-1", date: "2026-06-15", isUnavailable: true, startTime: null, endTime: null, reason: "Vacation" }]
		};
		deleteOverrideMutation.mutateAsync.mockResolvedValueOnce({});

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "doc-1", tab: "overrides" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>
		);

		const user = userEvent.setup();
		// Click delete trigger
		await user.click(screen.getByRole("button", { name: "Delete" }));
		// Click confirm button (which is also labeled "Delete" in the dialog)
		const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
		await user.click(deleteButtons[deleteButtons.length - 1]);

		expect(deleteOverrideMutation.mutateAsync).toHaveBeenCalledWith({ doctorId: "doc-1", overrideId: "override-1" });
		expect(toast.success).toHaveBeenCalled();
	});

	it("shows toast notification on failed override deletion", async () => {
		layoutState.isXl = true;
		doctorState.data = { id: "doc-1", firstName: "Sara", lastName: "Ahmed", email: "sara@example.com", phone: null, specialization: "Orthodontics", bio: null, isActive: true };
		overridesState.data = {
			data: [{ id: "override-1", date: "2026-06-15", isUnavailable: true, startTime: null, endTime: null, reason: "Vacation" }]
		};
		deleteOverrideMutation.mutateAsync.mockRejectedValueOnce(new Error("Failed to delete"));

		renderDoctorsAdmin(
			<DoctorsAdminPage
				search={{ q: "", specialization: "", status: "", page: 1, doctorId: "doc-1", tab: "overrides" }}
				onUpdateSearch={vi.fn()}
				onResetSearch={vi.fn()}
			/>
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Delete" }));
		const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
		await user.click(deleteButtons[deleteButtons.length - 1]);

		expect(deleteOverrideMutation.mutateAsync).toHaveBeenCalledWith({ doctorId: "doc-1", overrideId: "override-1" });
		expect(toast.error).toHaveBeenCalled();
	});
});
