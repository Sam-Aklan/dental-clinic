export const waitlistKeys = {
  all: ["waitlist"] as const,
  mine: () => [...waitlistKeys.all, "mine"] as const,
  offers: () => [...waitlistKeys.all, "offers"] as const,
  offer: (offerId: string) => [...waitlistKeys.offers(), offerId] as const,
};
