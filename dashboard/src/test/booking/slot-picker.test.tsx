import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { createSlot } from "@/test/booking/test-utils";

describe("SlotPicker", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-10T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not show earlier same-day slots", () => {
		render(
			<SlotPicker
				selectedDate="2026-05-10"
				onSelectDate={vi.fn()}
				slots={[
					createSlot({ startsAt: "2026-05-10T06:00:00.000Z", endsAt: "2026-05-10T06:30:00.000Z" }),
					createSlot({ startsAt: "2026-05-10T13:00:00.000Z", endsAt: "2026-05-10T13:30:00.000Z" }),
				]}
				isLoading={false}
				isError={false}
				onRetry={vi.fn()}
				selectedSlotStart={null}
				onSelectSlot={vi.fn()}
				selectedDoctorId="doc-1"
			/>,
		);

		expect(screen.queryByRole("button", { name: /9:00/i })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /4:00/i })).toBeInTheDocument();
	});

	it("does not show waitlist CTA when today only has past slots", () => {
		render(
			<SlotPicker
				selectedDate="2026-05-10"
				onSelectDate={vi.fn()}
				slots={[
					createSlot({ startsAt: "2026-05-10T06:00:00.000Z", endsAt: "2026-05-10T06:30:00.000Z" }),
				]}
				isLoading={false}
				isError={false}
				onRetry={vi.fn()}
				selectedSlotStart={null}
				onSelectSlot={vi.fn()}
				selectedDoctorId="doc-1"
				showWaitlistCta
				selectedDoctorName="Ahmad Al-Rashid"
			/>,
		);

		expect(screen.queryByRole("button", { name: /9:00/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: /join waitlist/i })).not.toBeInTheDocument();
	});

	it("does not show waitlist link when no slots are available", () => {
		render(
			<SlotPicker
				selectedDate="2026-05-11"
				onSelectDate={vi.fn()}
				slots={[]}
				isLoading={false}
				isError={false}
				onRetry={vi.fn()}
				selectedSlotStart={null}
				onSelectSlot={vi.fn()}
				selectedDoctorId="doc-1"
				showWaitlistCta
				selectedDoctorName="Ahmad Al-Rashid"
			/>,
		);

		expect(screen.getByText("No available slots for this date.")).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: /join waitlist/i })).not.toBeInTheDocument();
	});
});
