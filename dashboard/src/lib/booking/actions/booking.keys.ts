export const bookingKeys = {
	all: ["booking"] as const,
	doctors: () => [...bookingKeys.all, "doctors"] as const,
	slots: (doctorId: string, from: string, to: string, includeReserved = false) =>
		[...bookingKeys.all, "slots", doctorId, { from, to, includeReserved }] as const,
	appointments: () => [...bookingKeys.all, "appointments"] as const,
};
