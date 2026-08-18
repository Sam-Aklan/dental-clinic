import { createFollowUp } from "./follow-up.api";
import type { CreateFollowUpRequest } from "@/types";

export function createFollowUpMutationFn(payload: CreateFollowUpRequest) {
	return createFollowUp(payload, crypto.randomUUID());
}
