export const QUEUE_PASSWORD_RESET = 'password-reset';
export const QUEUE_APPOINTMENT_CONFIRMATION = 'appointment-confirmation';
export const QUEUE_REMINDER = 'reminder';
export const QUEUE_WAITLIST_OFFER = 'waitlist-offer';

export const PASSWORD_RESET_EMAIL_JOB = 'password-reset-email';
export const APPOINTMENT_CONFIRMATION_EMAIL_JOB = 'appointment-confirmation-email';
export const REMINDER_EMAIL_JOB = 'appointment-reminder-email';
export const WAITLIST_OFFER_EMAIL_JOB = 'waitlist-offer-email';

export const NOTIFICATION_RETRY_ATTEMPTS = 3;
export const PASSWORD_RESET_BACKOFF_MS = 2_000;
export const APPOINTMENT_CONFIRMATION_BACKOFF_MS = 2_000;
export const REMINDER_BACKOFF_MS = 5_000;
export const WAITLIST_OFFER_BACKOFF_MS = 2_000;

export const SUPPORTED_NOTIFICATION_LOCALES = ['en', 'ar'] as const;
export type NotificationLocale = (typeof SUPPORTED_NOTIFICATION_LOCALES)[number];
export const DEFAULT_NOTIFICATION_LOCALE: NotificationLocale = 'en';

export const REMINDER_JOB_ID_PREFIX = 'reminder-';
export const MAIL_TRANSPORT = 'MAIL_TRANSPORT';
