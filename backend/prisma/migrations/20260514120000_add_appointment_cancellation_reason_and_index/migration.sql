ALTER TABLE "Appointment"
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

CREATE INDEX IF NOT EXISTS "Appointment_doctorProfileId_startTime_idx"
ON "Appointment"("doctorProfileId", "startTime");
