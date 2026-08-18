import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { ClinicSettingsPage } from "@/components/clinic-settings";
import { renderClinicSettings, setClinicSettingsLanguage } from "./clinic-settings-test-utils";
import { clinicSettingsBookingFixture, clinicSettingsHolidayListFixture, clinicSettingsWorkingHoursFixture } from "./clinic-settings.fixtures";

const mocks = vi.hoisted(() => ({
	useClinicSettings: vi.fn(),
	useWeeklyHours: vi.fn(),
	useHolidays: vi.fn(),
	useUpdateClinicSettings: vi.fn(),
	useUpdateWeeklyHours: vi.fn(),
	useAddHoliday: vi.fn(),
	useDeleteHoliday: vi.fn(),
}));

vi.mock("@/hooks/clinic-settings", () => ({
	useClinicSettings: mocks.useClinicSettings,
	useWeeklyHours: mocks.useWeeklyHours,
	useHolidays: mocks.useHolidays,
	useUpdateClinicSettings: mocks.useUpdateClinicSettings,
	useUpdateWeeklyHours: mocks.useUpdateWeeklyHours,
	useAddHoliday: mocks.useAddHoliday,
	useDeleteHoliday: mocks.useDeleteHoliday,
}));

describe("clinic settings page", () => {
	beforeEach(async () => {
		await setClinicSettingsLanguage("en");
		mocks.useClinicSettings.mockReturnValue({ data: clinicSettingsBookingFixture, isLoading: false, isError: false, refetch: vi.fn() });
		mocks.useWeeklyHours.mockReturnValue({ data: clinicSettingsWorkingHoursFixture, isLoading: false, isError: false, refetch: vi.fn() });
		mocks.useHolidays.mockReturnValue({ data: clinicSettingsHolidayListFixture, isLoading: false, isError: false, refetch: vi.fn() });
		mocks.useUpdateClinicSettings.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
		mocks.useUpdateWeeklyHours.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
		mocks.useAddHoliday.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
		mocks.useDeleteHoliday.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
	});

	it("renders the page title and the three clinic settings sections", () => {
		renderClinicSettings(<ClinicSettingsPage />);

		expect(screen.getByText("Clinic Settings")).toBeInTheDocument();
		expect(screen.getByText("Booking Rules")).toBeInTheDocument();
		expect(screen.getByText("Weekly Working Hours")).toBeInTheDocument();
		expect(screen.getByText("Holiday Closures")).toBeInTheDocument();
	});
});
