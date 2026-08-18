import type { CreateAppointmentDTO } from "@/types";
import { bookAppointment } from "./booking.api";

export function createBookAppointmentMutationFn(payload: CreateAppointmentDTO, idempotencyKey: string) {
	return bookAppointment(payload, idempotencyKey);
}
