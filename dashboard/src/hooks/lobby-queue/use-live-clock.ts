import { useEffect, useState } from "react";
import dayjs from "dayjs";

export function useLiveClock() {
	const [now, setNow] = useState(() => dayjs());

	useEffect(() => {
		const interval = window.setInterval(() => {
			setNow(dayjs());
		}, 1000);

		return () => {
			window.clearInterval(interval);
		};
	}, []);

	return { now } as const;
}
