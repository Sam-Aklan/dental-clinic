export interface WaitlistEntryDTO {
  id: string;
  doctorId: string;
  patientId: string;
  position: number;
  availableFrom: string | null;
  availableUntil: string | null;
  createdAt: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
  pendingOffer?: { id: string } | null;
}

export interface JoinWaitlistDTO {
  doctorId: string;
  availableFrom?: string | null;
  availableUntil?: string | null;
}

export interface UpdateWaitlistWindowDTO {
  availableFrom?: string | null;
  availableUntil?: string | null;
}

export interface DoctorOption {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
}

export type { AvailabilityWindowFormData } from "@/lib/waitlist";

export type OfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface OfferedSlot {
  startsAt: string;
  endsAt: string;
}

export interface OfferDoctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
}

export interface CurrentAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
}

export interface WaitlistOfferDTO {
  id: string;
  status: OfferStatus;
  expiresAt: string;
  offeredSlot: OfferedSlot;
  doctor: OfferDoctor;
  currentAppointment?: CurrentAppointment | null;
}

export interface OfferTimeRemaining {
  msRemaining: number;
  isExpired: boolean;
  formatted: string;
}

export type OfferPageState =
  | "loading"
  | "pending"
  | "expired"
  | "accepted"
  | "declined"
  | "not-found"
  | "forbidden"
  | "error";

export type OfferErrorCode =
  | "OFFER_EXPIRED"
  | "SLOT_UNAVAILABLE"
  | "ALREADY_ACCEPTED"
  | "ALREADY_DECLINED";
