import dayjs from "dayjs";
import type { WaitlistOfferDTO } from "@/types";

export function createOfferDoctor(overrides: Partial<WaitlistOfferDTO["doctor"]> = {}) {
  return {
    id: "doc-1",
    firstName: "Ahmad",
    lastName: "Al-Rashid",
    specialization: "General Dentistry",
    ...overrides,
  };
}

export function createOfferedSlot(overrides: Partial<WaitlistOfferDTO["offeredSlot"]> = {}) {
  return {
    startsAt: "2026-05-10T10:30:00.000Z",
    endsAt: "2026-05-10T11:00:00.000Z",
    ...overrides,
  };
}

export function createCurrentAppointment(overrides: Partial<NonNullable<WaitlistOfferDTO["currentAppointment"]>> = {}) {
  return {
    id: "appt-1",
    startsAt: "2026-05-15T14:00:00.000Z",
    endsAt: "2026-05-15T14:30:00.000Z",
    status: "SCHEDULED" as const,
    ...overrides,
  };
}

export function createPendingOffer(overrides: Partial<WaitlistOfferDTO> = {}): WaitlistOfferDTO {
  return {
    id: "offer-1",
    status: "PENDING",
    expiresAt: dayjs().add(10, "minute").toISOString(),
    offeredSlot: createOfferedSlot(),
    doctor: createOfferDoctor(),
    currentAppointment: createCurrentAppointment(),
    ...overrides,
  };
}

export function createPendingOfferWithoutCurrentAppointment(overrides: Partial<WaitlistOfferDTO> = {}): WaitlistOfferDTO {
  return createPendingOffer({
    id: "offer-2",
    currentAppointment: null,
    ...overrides,
  });
}

export function createAcceptedOffer(overrides: Partial<WaitlistOfferDTO> = {}): WaitlistOfferDTO {
  return createPendingOffer({
    id: "offer-3",
    status: "ACCEPTED",
    ...overrides,
  });
}

export function createDeclinedOffer(overrides: Partial<WaitlistOfferDTO> = {}): WaitlistOfferDTO {
  return createPendingOffer({
    id: "offer-4",
    status: "DECLINED",
    ...overrides,
  });
}

export function createExpiredOffer(overrides: Partial<WaitlistOfferDTO> = {}): WaitlistOfferDTO {
  return {
    id: "offer-5",
    status: "EXPIRED",
    expiresAt: dayjs().subtract(1, "hour").toISOString(),
    offeredSlot: createOfferedSlot(),
    doctor: createOfferDoctor(),
    currentAppointment: null,
    ...overrides,
  };
}

export function createWaitlistOffer(overrides: Partial<WaitlistOfferDTO> = {}): WaitlistOfferDTO {
  return createPendingOffer(overrides);
}

export const waitlistOfferFixtures = {
  pending: createPendingOffer(),
  pendingWithoutCurrentAppointment: createPendingOfferWithoutCurrentAppointment(),
  accepted: createAcceptedOffer(),
  declined: createDeclinedOffer(),
  expired: createExpiredOffer(),
  notFoundError: {
    status: 404,
    response: { data: { message: "Not Found" } },
  },
  forbiddenError: {
    status: 403,
    response: { data: { message: "Forbidden" } },
  },
  networkError: new Error("Network Error"),
  offerExpiredError: {
    status: 409,
    response: { data: { message: "Offer has expired", code: "OFFER_EXPIRED" } },
  },
  slotUnavailableError: {
    status: 409,
    response: { data: { message: "Slot unavailable", code: "SLOT_UNAVAILABLE" } },
  },
  alreadyAcceptedError: {
    status: 409,
    response: { data: { message: "Already accepted", code: "ALREADY_ACCEPTED" } },
  },
  alreadyDeclinedError: {
    status: 409,
    response: { data: { message: "Already declined", code: "ALREADY_DECLINED" } },
  },
};
