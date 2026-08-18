import { useQuery } from "@tanstack/react-query";
import { waitlistQueryOptions } from "@/lib/waitlist";

export function useWaitlistQuery() {
	return useQuery(waitlistQueryOptions());
}
