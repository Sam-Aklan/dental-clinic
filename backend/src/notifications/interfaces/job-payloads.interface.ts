import type { NotificationLocale } from '../notifications.constants';

export interface PasswordResetJobPayload {
  userId: string;
  tokenId: string;
  resetUrl: string;
  locale: NotificationLocale;
}

export interface AppointmentConfirmationJobPayload {
  appointmentId: string;
  patientUserId: string;
  locale: NotificationLocale;
}

export interface ReminderJobPayload {
  appointmentId: string;
  patientUserId: string;
  locale: NotificationLocale;
}

export interface WaitlistOfferJobPayload {
  offerId: string;
  patientUserId: string;
  offerUrl: string;
  locale: NotificationLocale;
}

export interface PasswordResetTemplateVars {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
  clinicName: string;
  clinicEmail: string;
}

export interface AppointmentConfirmationTemplateVars {
  firstName: string;
  doctorName: string;
  date: string;
  time: string;
  clinicName: string;
  myAppointmentsUrl: string;
  clinicEmail: string;
}

export interface AppointmentReminderTemplateVars {
  firstName: string;
  doctorName: string;
  date: string;
  time: string;
  hoursUntil: number;
  clinicName: string;
  myAppointmentsUrl: string;
  clinicEmail: string;
}

export interface WaitlistOfferTemplateVars {
  firstName: string;
  doctorName: string;
  date: string;
  time: string;
  offerUrl: string;
  expiresAt: string;
  clinicName: string;
  clinicEmail: string;
}
