import type { AvailableSlot, CreateFollowUpRequest } from "@/types";

export const followUpKeys = {
	all: ["follow-ups"] as const,
	create: () => [...followUpKeys.all, "create"] as const,
	slots: (doctorId: string, from: string, to: string) => [...followUpKeys.all, "slots", doctorId, { from, to }] as const,
	preview: (payload: CreateFollowUpRequest) => [...followUpKeys.all, "preview", payload] as const,
	selectedSlots: (doctorId: string, slots: AvailableSlot[]) => [...followUpKeys.all, "selected-slots", doctorId, slots] as const,
};
