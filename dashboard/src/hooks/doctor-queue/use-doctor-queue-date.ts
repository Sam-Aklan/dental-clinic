import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useQuery } from "@tanstack/react-query";
import { clinicConfigQueryOptions } from "@/lib/doctor-queue";

dayjs.extend(utc);
dayjs.extend(timezone);

export function useDoctorQueueDate() {
	const clinicConfigQuery = useQuery(clinicConfigQueryOptions());
	const timezoneName = clinicConfigQuery.data?.timezone ?? dayjs.tz.guess();
	const clinicDate = dayjs().tz(timezoneName).format("YYYY-MM-DD");

	return {
		clinicDate,
		timezoneName,
		clinicConfigQuery,
	};
}
