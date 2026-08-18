import { useMutation } from "@tanstack/react-query";
import { issueKioskTokenMutationOptions } from "@/lib/queue";

export function useIssueKioskTokenMutation() {
	return useMutation(issueKioskTokenMutationOptions());
}
