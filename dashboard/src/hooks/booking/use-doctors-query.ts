import { useQuery } from "@tanstack/react-query";
import { doctorsQueryOptions } from "@/lib/booking";

export function useDoctorsQuery() {
	return useQuery(doctorsQueryOptions());
}
