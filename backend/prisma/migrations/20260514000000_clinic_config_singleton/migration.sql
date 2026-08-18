DROP TABLE IF EXISTS "Holiday";
DROP TABLE IF EXISTS "WorkingHour";
DROP TABLE IF EXISTS "ClinicConfig";

CREATE TABLE "ClinicConfig" (
  "id" TEXT NOT NULL,
  "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
  "timeZone" TEXT NOT NULL DEFAULT 'UTC',
  "reminderHoursBefore" INTEGER NOT NULL DEFAULT 24,
  "offerWindowMinutes" INTEGER NOT NULL DEFAULT 30,
  "minArrivalMinutes" INTEGER NOT NULL DEFAULT 45,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ClinicConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkingHour" (
  "id" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "startTime" TEXT,
  "endTime" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "WorkingHour_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkingHour_dayOfWeek_key" UNIQUE ("dayOfWeek")
);

CREATE TABLE "Holiday" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Holiday_date_key" UNIQUE ("date")
);

CREATE INDEX "Holiday_date_idx" ON "Holiday" ("date");

INSERT INTO "ClinicConfig" (
  "id",
  "slotDurationMinutes",
  "timeZone",
  "reminderHoursBefore",
  "offerWindowMinutes",
  "minArrivalMinutes",
  "createdAt",
  "updatedAt"
) VALUES (
  'clinic-config-singleton',
  30,
  'UTC',
  24,
  30,
  45,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
