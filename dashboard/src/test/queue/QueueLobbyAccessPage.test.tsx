import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/common-components/test-utils";
import { QueueLobbyAccessPage } from "@/components/queue";

const doctorsState = {
	data: {
		data: [
			{ id: "doctor-1", firstName: "Sara", lastName: "Ahmed", email: null, phone: null, specialization: "Orthodontics", bio: null, isActive: true },
		],
	},
	isLoading: false,
	isFetching: false,
	isError: false,
};

vi.mock("@/hooks/doctors-admin", () => ({
	useDoctors: () => doctorsState,
}));

vi.mock("@/hooks/queue", () => ({
	useIssueKioskTokenMutation: () => ({
		isPending: false,
		mutateAsync: vi.fn(),
	}),
}));

describe("QueueLobbyAccessPage", () => {
	beforeEach(() => {
		doctorsState.isError = false;
	});

	it("renders the doctor selector and disabled actions before generating a link", () => {
		renderWithProviders(<QueueLobbyAccessPage />);

		expect(screen.getByText("Lobby access")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Generate link" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Copy link" })).toBeDisabled();
	});
});
