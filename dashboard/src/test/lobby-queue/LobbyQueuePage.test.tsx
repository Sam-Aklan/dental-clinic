import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { lobbyActiveEntriesFixture, lobbyDoctorFixture } from "./fixtures";
import { renderWithLobbyQueueProviders, setLobbyQueueLanguage } from "./test-utils";
import { LobbyQueuePageView } from "@/components/lobby-queue";

afterEach(async () => {
	await setLobbyQueueLanguage("en");
});

describe("LobbyQueuePage", () => {
	it("renders loading and error states", () => {
		renderWithLobbyQueueProviders(
			<LobbyQueuePageView
				doctorName={lobbyDoctorFixture.displayName}
				timeLabel="10:30:00 AM"
				loading={true}
				error={null}
				connectionState="connecting"
				sections={{ inProgress: null, nextUp: null, waiting: [], visibleWaiting: [], waitingOverflow: 0 }}
				lastUpdated={null}
				dir="ltr"
			/>,
		);
		expect(screen.getByRole("status")).toHaveAccessibleName("Loading queue…");
	});

	it("renders the public queue in English and Arabic", async () => {
		await setLobbyQueueLanguage("en");
		const { container, rerender } = renderWithLobbyQueueProviders(
			<LobbyQueuePageView
				doctorName={lobbyDoctorFixture.displayName}
				timeLabel="10:30:00 AM"
				loading={false}
				error={null}
				connectionState="offline"
				sections={{ inProgress: lobbyActiveEntriesFixture[0], nextUp: lobbyActiveEntriesFixture[1], waiting: lobbyActiveEntriesFixture.slice(2, 10), visibleWaiting: lobbyActiveEntriesFixture.slice(2, 10), waitingOverflow: 0 }}
				lastUpdated={new Date("2026-05-11T10:30:00Z")}
				dir="ltr"
			/>,
		);

		expect(screen.getByText(lobbyDoctorFixture.displayName)).toBeInTheDocument();
		expect(screen.getByText("Patient #3")).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent("Connection lost");
		expect(container.firstElementChild).toHaveAttribute("dir", "ltr");

		await setLobbyQueueLanguage("ar");
		rerender(
			<LobbyQueuePageView
				doctorName={lobbyDoctorFixture.displayName}
				timeLabel="10:30:00 AM"
				loading={false}
				error={null}
				connectionState="offline"
				sections={{ inProgress: lobbyActiveEntriesFixture[0], nextUp: lobbyActiveEntriesFixture[1], waiting: lobbyActiveEntriesFixture.slice(2, 10), visibleWaiting: lobbyActiveEntriesFixture.slice(2, 10), waitingOverflow: 0 }}
				lastUpdated={new Date("2026-05-11T10:30:00Z")}
				dir="rtl"
			/>,
		);
		expect(screen.getByText("جلسة حالية")).toBeInTheDocument();
		expect(container.firstElementChild).toHaveAttribute("dir", "rtl");
	});

	it("shows doctor not found errors", () => {
		renderWithLobbyQueueProviders(
			<LobbyQueuePageView
				doctorName="doctor-404"
				timeLabel="10:30:00 AM"
				loading={false}
				error={{ message: "Doctor not found", status: 404 }}
				connectionState="connecting"
				sections={{ inProgress: null, nextUp: null, waiting: [], visibleWaiting: [], waitingOverflow: 0 }}
				lastUpdated={null}
				dir="ltr"
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("Doctor not found");
	});

	it("shows invalid link errors", () => {
		renderWithLobbyQueueProviders(
			<LobbyQueuePageView
				doctorName="doctor-1"
				timeLabel="10:30:00 AM"
				loading={false}
				error={{ message: "Invalid lobby link", status: 401 }}
				connectionState="connecting"
				sections={{ inProgress: null, nextUp: null, waiting: [], visibleWaiting: [], waitingOverflow: 0 }}
				lastUpdated={null}
				dir="ltr"
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("Invalid lobby link");
	});
});
