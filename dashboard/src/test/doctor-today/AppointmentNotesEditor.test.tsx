import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/common-components/test-utils";
import { AppointmentNotesEditor } from "@/components/doctor-today";

describe("AppointmentNotesEditor", () => {
	it("saves notes and keeps the draft when save fails", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn().mockRejectedValue(new Error("network error"));

		renderWithProviders(<AppointmentNotesEditor appointmentId="1" patientSequence={1} initialNotes="old note" onSave={onSave} />);

		const textarea = screen.getByRole("textbox");
		await user.clear(textarea);
		await user.type(textarea, "new note");
		await user.click(screen.getByRole("button", { name: /Save/i }));

		expect(onSave).toHaveBeenCalledWith({ id: "1", notes: "new note" });
		expect(textarea).toHaveValue("new note");
	});
});
