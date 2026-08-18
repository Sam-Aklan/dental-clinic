import { useEffect, useState } from "react";

export function useCreatedAppointmentHighlight(appointmentId: string, createdAppointmentId: string | null) {
	const [expired, setExpired] = useState(false);

	useEffect(() => {
		if (createdAppointmentId !== appointmentId) {
			const resetTimer = window.setTimeout(() => setExpired(false), 0);
			return () => window.clearTimeout(resetTimer);
		}

		const resetTimer = window.setTimeout(() => setExpired(false), 0);
		const expireTimer = window.setTimeout(() => setExpired(true), 5_000);
		return () => {
			window.clearTimeout(resetTimer);
			window.clearTimeout(expireTimer);
		};
	}, [appointmentId, createdAppointmentId]);

	return createdAppointmentId === appointmentId && !expired;
}
