import { useMemo, useState } from "react";
import { createDefaultStaffAppointmentState } from "@/lib/staff-appointments";

export function useStaffAppointmentUrlState() {
	const [state, setState] = useState(() => createDefaultStaffAppointmentState());
	const api = useMemo(() => ({
		state,
		setState,
		setTab: (tab: typeof state.tab) => setState((current) => ({ ...current, tab, page: 1 })),
		reset: () => setState(createDefaultStaffAppointmentState()),
	}), [state]);

	return api;
}
