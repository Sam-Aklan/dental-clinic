export const AUDIT_ACTIONS = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DISABLED: 'USER_DISABLED',
  USER_ENABLED: 'USER_ENABLED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  DOCTOR_CREATED: 'DOCTOR_CREATED',
  DOCTOR_UPDATED: 'DOCTOR_UPDATED',
  SCHEDULE_OVERRIDE_CREATED: 'SCHEDULE_OVERRIDE_CREATED',
  SCHEDULE_OVERRIDE_DELETED: 'SCHEDULE_OVERRIDE_DELETED',
  CLINIC_CONFIG_UPDATED: 'CLINIC_CONFIG_UPDATED',
  WORKING_HOURS_UPDATED: 'WORKING_HOURS_UPDATED',
  HOLIDAY_CREATED: 'HOLIDAY_CREATED',
  HOLIDAY_DELETED: 'HOLIDAY_DELETED',
  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_STATUS_UPDATED: 'APPOINTMENT_STATUS_UPDATED',
  APPOINTMENT_CANCELED: 'APPOINTMENT_CANCELED',
  FOLLOW_UP_CREATED: 'FOLLOW_UP_CREATED',
  FOLLOW_UP_UPDATED: 'FOLLOW_UP_UPDATED',
  FOLLOW_UP_RESCHEDULED: 'FOLLOW_UP_RESCHEDULED',
  FOLLOW_UP_STATUS_UPDATED: 'FOLLOW_UP_STATUS_UPDATED',
  FOLLOW_UP_CANCELED: 'FOLLOW_UP_CANCELED',
  WAITLIST_ENTRY_UPDATED: 'WAITLIST_ENTRY_UPDATED',
  WAITLIST_ENTRY_DELETED: 'WAITLIST_ENTRY_DELETED',
  WAITLIST_OFFER_CREATED: 'WAITLIST_OFFER_CREATED',
  WAITLIST_OFFER_EXPIRED: 'WAITLIST_OFFER_EXPIRED',
} as const;

export const AUDIT_TARGET_TYPES = {
  USER: 'USER',
  DOCTOR: 'DOCTOR',
  APPOINTMENT: 'APPOINTMENT',
  FOLLOW_UP: 'FOLLOW_UP',
  WAITLIST: 'WAITLIST',
  WAITLIST_OFFER: 'WAITLIST_OFFER',
  CLINIC_CONFIG: 'CLINIC_CONFIG',
  HOLIDAY: 'HOLIDAY',
  SCHEDULE_OVERRIDE: 'SCHEDULE_OVERRIDE',
  AUTH: 'AUTH',
  OTHER: 'OTHER',
} as const;

export const REDACTION_MARKER = '[REDACTED]';

export const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'secret',
  'cookie',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizeNestedValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeNestedValue(item, seen))
      .filter((item) => item !== undefined);
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return undefined;
  }

  if (!isPlainObject(value)) {
    return String(value);
  }

  seen.add(value);
  const result: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (nestedValue === undefined || typeof nestedValue === 'function' || typeof nestedValue === 'symbol') {
      continue;
    }

    if (REDACTED_KEYS.has(key.toLowerCase())) {
      result[key] = REDACTION_MARKER;
      continue;
    }

    const sanitized = sanitizeNestedValue(nestedValue, seen);
    if (sanitized !== undefined) {
      result[key] = sanitized;
    }
  }

  seen.delete(value);
  return result;
}

export function sanitizePayload(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }

  const sanitized = sanitizeNestedValue(value, new WeakSet());
  if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) {
    return null;
  }

  return Object.keys(sanitized).length > 0 ? (sanitized as Record<string, unknown>) : null;
}
