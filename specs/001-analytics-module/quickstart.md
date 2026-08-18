# Quickstart: Analytics Module

**Branch**: `035-analytics-module`

## Prerequisites

- Node.js 20+, pnpm installed
- PostgreSQL running (Docker or local)
- Redis running (for BullMQ — required by the app even though analytics is read-only)
- Backend `.env` configured (copy `backend/.env.example` if available)

## Run the Backend

```bash
cd backend

# Install dependencies (if not done)
pnpm install

# Run database migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Start in development mode
pnpm start:dev
```

Swagger UI is available at `http://localhost:3000/api/docs` — look for the `analytics` tag.

## Seed Data for Manual Testing

The analytics module is read-only. To test it, you need existing appointment, doctor, and waitlist data.

Use the existing e2e seed helpers or insert records directly:

```bash
# Verify clinic config has a timezone set
psql $DATABASE_URL -c "SELECT id, \"timeZone\" FROM \"ClinicConfig\" LIMIT 1;"

# If empty, insert clinic config
psql $DATABASE_URL -c "INSERT INTO \"ClinicConfig\" (id, \"timeZone\", \"slotDurationMinutes\", \"reminderHoursBefore\", \"offerWindowMinutes\", \"minArrivalMinutes\", \"createdAt\", \"updatedAt\") VALUES ('config1', 'Asia/Riyadh', 30, 24, 30, 45, now(), now());"
```

## Run Unit Tests

```bash
cd backend

# Run analytics unit tests only
pnpm test -- --testPathPattern=analytics

# Run all unit tests
pnpm test
```

## Run E2E Tests

```bash
cd backend

# Run analytics e2e tests
pnpm test:e2e -- --testPathPattern=analytics

# Run all e2e tests
pnpm test:e2e
```

## Quick API Check

After seeding, get a JWT token for an admin user:

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@clinic.test","password":"password"}' \
  | jq -r '.data.accessToken')

# KPI summary
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/kpi-summary?from=2026-01-01&to=2026-01-31"

# Today summary
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/today-summary"

# Doctor utilization (admin only)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/doctor-utilization?from=2026-01-01&to=2026-01-31"
```

## Key Design Notes

1. **Timezone**: All date boundaries use `ClinicConfig.timeZone`. Missing timezone rejects requests with `400`.
2. **Read-only**: No mutations. No audit events written by analytics endpoints.
3. **Zero-fill**: Trend and weekday responses always return complete shapes — empty periods have zero counts, not missing keys.
4. **RBAC**: Doctor endpoints (`/my-*`) require a linked `DoctorProfile`. Doctor users without a profile get `403`.
5. **Slot calculation**: Doctor utilization uses `SlotGeneratorService` — results depend on working hours, holidays, and overrides being configured.

## Build Check

```bash
cd backend
pnpm build
pnpm prisma format
```
