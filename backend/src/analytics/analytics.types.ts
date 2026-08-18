import { AppointmentStatus } from '../generated/prisma/enums';

export const ANALYTICS_BUCKETS = ['day', 'week', 'month'] as const;
export type AnalyticsBucket = (typeof ANALYTICS_BUCKETS)[number];

export const ANALYTICS_DAY_AND_WEEK_BUCKETS = ['day', 'week'] as const;
export type AnalyticsDayOrWeekBucket = (typeof ANALYTICS_DAY_AND_WEEK_BUCKETS)[number];

export const APPOINTMENT_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELED,
  AppointmentStatus.NO_SHOW,
] as const;

export const BOOKED_APPOINTMENT_STATUSES = [
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
] as const;

export const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
] as const;

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MAX_CLINIC_RANGE_DAYS = 366;
export const FOLLOW_UP_DEFAULT_THRESHOLD_DAYS = 90;
export const FOLLOW_UP_MAX_THRESHOLD_DAYS = 365;
export const FOLLOW_UP_DEFAULT_PAGE = 1;
export const FOLLOW_UP_DEFAULT_PAGE_SIZE = 20;
export const FOLLOW_UP_MAX_PAGE_SIZE = 100;

export const APPOINTMENT_STATUS_ZERO_MAP = Object.fromEntries(APPOINTMENT_STATUSES.map((status) => [status, 0])) as Record<
  AppointmentStatus,
  number
>;
