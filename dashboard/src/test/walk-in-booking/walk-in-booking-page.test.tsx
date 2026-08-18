import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createWalkInQueryClient } from "./walk-in-booking-test-utils";
import { createWalkInDoctor } from "./walk-in-booking.fixtures";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	useSearch: () => ({}),
}));

import { api } from "@/lib/axios-instance";
import { WalkInBookingPage } from "@/components/walk-in";

const mockedGet = vi.mocked(api.get);

beforeEach(() => {
	vi.clearAllMocks();
	mockedGet.mockImplementation((url: string) => {
		if (url === "/doctors") {
			return Promise.resolve({ data: { data: [createWalkInDoctor()] } });
		}
		return Promise.reject(new Error(`Unexpected URL: ${url}`));
	});
});

describe("WalkInBookingPage", () => {
	it("renders the walk-in booking title", async () => {
		const queryClient = createWalkInQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<WalkInBookingPage />
			</QueryClientProvider>,
		);

		expect(await screen.findByText("Walk-in Booking")).toBeInTheDocument();
		expect(screen.getByRole("navigation", { name: "Walk-in booking progress" })).toBeInTheDocument();
	});
});
