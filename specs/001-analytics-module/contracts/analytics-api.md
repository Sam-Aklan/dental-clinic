# API Contract: Analytics Module

**Base URL**: `/api/analytics`
**Auth**: All endpoints require `Authorization: Bearer <access_token>` (JwtAuthGuard)
**Response envelope**: `{ "statusCode": number, "data": <payload> }`
**Error envelope**: `{ "statusCode": number, "message": string | string[], "error": string }`

---

## Authorization Matrix

| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | PATIENT |
|---|:---:|:---:|:---:|:---:|
| `GET /trends` | ✓ | ✓ | — | — |
| `GET /status-distribution` | ✓ | ✓ | — | — |
| `GET /doctor-utilization` | ✓ | — | — | — |
| `GET /appointments-by-weekday` | ✓ | ✓ | — | — |
| `GET /cancellation-trends` | ✓ | ✓ | — | — |
| `GET /kpi-summary` | ✓ | ✓ | — | — |
| `GET /follow-ups` | ✓ | ✓ | own patients | — |
| `GET /waitlist-summary` | ✓ | ✓ | — | — |
| `GET /today-summary` | ✓ | ✓ | — | — |
| `GET /today-by-doctor` | ✓ | ✓ | — | — |
| `GET /my-stats` | — | — | own data | — |
| `GET /my-trends` | — | — | own data | — |
| `GET /my-hourly-load` | — | — | own data | — |
| `GET /my-status-distribution` | — | — | own data | — |

---

## Shared Query Parameters

### Date Range Parameters (used by most staff endpoints)

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `from` | `string` (YYYY-MM-DD) | yes | Valid ISO date |
| `to` | `string` (YYYY-MM-DD) | yes | Valid ISO date; `to >= from` |

Additional for clinic-level reports: `to - from <= 366 days`.

### Bucketed Range Parameters (extends date range)

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `from` | `string` | yes | See above |
| `to` | `string` | yes | See above |
| `bucket` | `'day' \| 'week' \| 'month'` | yes | Enum value; `'month'` only when range > 31 days |

---

## Endpoints

### `GET /api/analytics/trends`

**Roles**: ADMIN, RECEPTIONIST
**Query**: `BucketedRangeQueryDto` (`from`, `to`, `bucket`)

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": [
    {
      "date": "2026-01-01",
      "total": 12,
      "confirmed": 3,
      "completed": 7,
      "canceled": 1,
      "noShow": 1
    }
  ]
}
```

- Array length equals number of complete buckets in range (including zero-count buckets)
- `date` is the bucket start date in clinic timezone

**Errors**: 400 (invalid dates, invalid bucket, range > 366 days, `month` on short range), 401, 403

---

### `GET /api/analytics/status-distribution`

**Roles**: ADMIN, RECEPTIONIST
**Query**: `DateRangeQueryDto`

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": {
    "PENDING": 5,
    "CONFIRMED": 10,
    "IN_PROGRESS": 2,
    "COMPLETED": 30,
    "CANCELED": 4,
    "NO_SHOW": 1
  }
}
```

- All six statuses always present; missing statuses return `0`

**Errors**: 400, 401, 403

---

### `GET /api/analytics/doctor-utilization`

**Roles**: ADMIN only
**Query**: `DateRangeQueryDto`

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": [
    {
      "doctorId": "clxyz123",
      "doctorName": "Dr. Ahmed Al-Rashid",
      "bookedSlots": 14,
      "totalSlots": 20,
      "utilizationPct": 0.7
    }
  ]
}
```

- `utilizationPct` is a decimal in [0, 1]; overbooked doctors are capped at `1.0`
- Doctors with `totalSlots = 0` return `utilizationPct = 0`
- Sorted by `utilizationPct` desc, then `doctorName` asc

**Errors**: 400, 401, 403 (RECEPTIONIST or DOCTOR tokens return 403)

---

### `GET /api/analytics/appointments-by-weekday`

**Roles**: ADMIN, RECEPTIONIST
**Query**: `DateRangeQueryDto`

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": [
    { "dayOfWeek": 0, "label": "Sun", "count": 3 },
    { "dayOfWeek": 1, "label": "Mon", "count": 15 },
    { "dayOfWeek": 2, "label": "Tue", "count": 12 },
    { "dayOfWeek": 3, "label": "Wed", "count": 10 },
    { "dayOfWeek": 4, "label": "Thu", "count": 8 },
    { "dayOfWeek": 5, "label": "Fri", "count": 0 },
    { "dayOfWeek": 6, "label": "Sat", "count": 0 }
  ]
}
```

- Always 7 items; missing weekdays return `count: 0`
- Weekday assignment uses clinic-local date of appointment `startTime`

**Errors**: 400, 401, 403

---

### `GET /api/analytics/cancellation-trends`

**Roles**: ADMIN, RECEPTIONIST
**Query**: `from`, `to`, `bucket` (`'day' | 'week'` only)

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": [
    {
      "date": "2026-01-01",
      "canceledByPatient": 2,
      "canceledByStaff": 3,
      "noShow": 1
    }
  ]
}
```

- `canceledByPatient`: CANCELED appointments where AuditLog actor role = PATIENT
- `canceledByStaff`: CANCELED where actor role ≠ PATIENT, or no audit record found
- `noShow`: NO_SHOW status count
- Zero-filled buckets included

**Errors**: 400 (invalid dates, `month` bucket not allowed), 401, 403

---

### `GET /api/analytics/kpi-summary`

**Roles**: ADMIN, RECEPTIONIST
**Query**: `DateRangeQueryDto`

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": {
    "totalAppointments": 52,
    "completed": 40,
    "cancellationRate": 0.077,
    "noShowRate": 0.038,
    "activePatients": 28,
    "waitlistSize": 6,
    "deltaTotalPct": 0.15,
    "deltaCompletedPct": -0.05
  }
}
```

- `cancellationRate = CANCELED / totalAppointments`; `0` if denominator is `0`
- `noShowRate = NO_SHOW / totalAppointments`; `0` if denominator is `0`
- `activePatients`: distinct patients with ≥1 non-CANCELED appointment in range
- `waitlistSize`: total current `WaitlistEntry` records (not range-scoped)
- `delta*Pct`: `(current - previous) / previous`; `0` if previous period total is `0`

**Errors**: 400, 401, 403

---

### `GET /api/analytics/follow-ups`

**Roles**: ADMIN, RECEPTIONIST, DOCTOR (own patients only)
**Query**:

| Parameter | Type | Default | Validation |
|---|---|---|---|
| `thresholdDays` | `integer` | `90` | 1–365 |
| `page` | `integer` | `1` | ≥1 |
| `pageSize` | `integer` | `20` | 1–100 |

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": {
    "items": [
      {
        "patientId": "cluser456",
        "patientName": "Sara Al-Fahad",
        "lastAppointmentDate": "2026-01-10",
        "daysSince": 126,
        "hasUpcoming": false
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 43
  }
}
```

- DOCTOR role: only patients who completed appointments with that doctor
- `hasUpcoming`: true if any PENDING | CONFIRMED | IN_PROGRESS appointment has `startTime > now`
- Sorted by `daysSince` desc, then `patientName` asc
- DOCTOR without linked profile returns `403`

**Errors**: 400 (invalid pagination or threshold), 401, 403

---

### `GET /api/analytics/waitlist-summary`

**Roles**: ADMIN, RECEPTIONIST
**Query**: none

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": {
    "totalActive": 9,
    "byDoctor": [
      { "doctorId": "cldoc789", "doctorName": "Dr. Layla Hassan", "count": 5 },
      { "doctorId": "cldoc012", "doctorName": "Dr. Ahmed Al-Rashid", "count": 4 }
    ]
  }
}
```

- `byDoctor` sorted by `count` desc
- All `WaitlistEntry` records counted (no status filter — all existing entries are active)

**Errors**: 401, 403

---

### `GET /api/analytics/today-summary`

**Roles**: ADMIN, RECEPTIONIST
**Query**: none

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": {
    "total": 18,
    "inProgress": 2,
    "waiting": 3,
    "completed": 10,
    "canceledToday": 1,
    "pendingConfirmation": 2
  }
}
```

- "Today" = clinic-local current day, converted to UTC bounds
- `waiting`: CONFIRMED appointments where `startTime <= now`
- `pendingConfirmation`: PENDING status count

**Errors**: 400 (missing clinic timezone), 401, 403

---

### `GET /api/analytics/today-by-doctor`

**Roles**: ADMIN, RECEPTIONIST
**Query**: none

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": [
    {
      "doctorId": "cldoc789",
      "doctorName": "Dr. Layla Hassan",
      "confirmed": 3,
      "inProgress": 1,
      "completed": 5,
      "canceled": 0
    }
  ]
}
```

- All active `DoctorProfile` records appear, even with zero counts
- "Today" = clinic-local current day

**Errors**: 400 (missing clinic timezone), 401, 403

---

### `GET /api/analytics/my-stats`

**Roles**: DOCTOR (own data only)
**Query**:

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `date` | `string` (YYYY-MM-DD) | clinic-local today | Specific date for stats |

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": {
    "todayTotal": 8,
    "completedToday": 5,
    "remainingToday": 2,
    "inSession": 1,
    "noShowsToday": 0,
    "weekTotal": 34
  }
}
```

- All counts scoped to `AuthenticatedUser.doctorProfileId`
- DOCTOR without linked profile returns `403`
- `remainingToday`: PENDING + CONFIRMED for the requested date
- `weekTotal`: current clinic-local week

**Errors**: 400, 401, 403

---

### `GET /api/analytics/my-trends`

**Roles**: DOCTOR (own data only)
**Query**:

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `week` | `string` (YYYY-MM-DD) | yes | Any date inside the target clinic-local week |

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": [
    { "date": "2026-05-11", "dayLabel": "Mon", "count": 4 },
    { "date": "2026-05-12", "dayLabel": "Tue", "count": 6 },
    { "date": "2026-05-13", "dayLabel": "Wed", "count": 3 },
    { "date": "2026-05-14", "dayLabel": "Thu", "count": 5 },
    { "date": "2026-05-15", "dayLabel": "Fri", "count": 2 },
    { "date": "2026-05-16", "dayLabel": "Sat", "count": 1 },
    { "date": "2026-05-17", "dayLabel": "Sun", "count": 0 }
  ]
}
```

- Always 7 items (Mon–Sun of the clinic-local week containing `week`)
- DOCTOR without linked profile returns `403`

**Errors**: 400, 401, 403

---

### `GET /api/analytics/my-hourly-load`

**Roles**: DOCTOR (own data only)
**Query**: `DateRangeQueryDto` (`from`, `to`)

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": [
    { "hour": 8, "count": 3 },
    { "hour": 9, "count": 5 },
    { "hour": 10, "count": 4 }
  ]
}
```

- Only hours with `count > 0` are included (sparse array; consumer fills remaining hours with 0)
- Hour = clinic-local hour of appointment `startTime`
- Scoped to authenticated doctor's profile

**Errors**: 400, 401, 403

---

### `GET /api/analytics/my-status-distribution`

**Roles**: DOCTOR (own data only)
**Query**: `DateRangeQueryDto` (`from`, `to`)

**Response** `200`:
```json
{
  "statusCode": 200,
  "data": {
    "PENDING": 0,
    "CONFIRMED": 2,
    "IN_PROGRESS": 1,
    "COMPLETED": 18,
    "CANCELED": 1,
    "NO_SHOW": 0
  }
}
```

- Same shape as clinic status distribution but scoped to authenticated doctor's profile
- All six statuses always present

**Errors**: 400, 401, 403

---

## Common Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["to must be after or equal to from"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Swagger

All endpoints are documented under the `analytics` tag at `GET /api/docs`. Swagger examples use the shapes above. No patient names, tokens, or sensitive data appear in Swagger examples.
