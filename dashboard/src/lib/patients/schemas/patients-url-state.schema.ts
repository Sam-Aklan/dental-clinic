import { z } from "zod";

const appointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW",
]);

export const patientsUrlStateSchema = z.object({
  q: z.string().default(""),
  patientId: z.string().optional(),
  status: z.array(appointmentStatusSchema).default([]),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to);
    }
    return true;
  },
  { message: "from date must be before or equal to to date" },
);
