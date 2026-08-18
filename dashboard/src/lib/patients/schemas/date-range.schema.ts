import { z } from "zod";

export const dateRangeSchema = z
  .object({
    fromDate: z.string().optional().nullable(),
    toDate: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) return true;
      return new Date(data.fromDate) < new Date(data.toDate);
    },
    {
      message: "From date must be less than to date",
      path: ["fromDate"],
    }
  );
