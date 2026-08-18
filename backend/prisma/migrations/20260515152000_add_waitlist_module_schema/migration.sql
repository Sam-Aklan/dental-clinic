-- Waitlist module schema reset

DROP TABLE IF EXISTS "WaitlistOffer" CASCADE;
DROP TABLE IF EXISTS "WaitlistEntry" CASCADE;

CREATE TABLE "WaitlistEntry" (
  "id" TEXT NOT NULL,
  "patientProfileId" TEXT NOT NULL,
  "doctorProfileId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "availableFrom" TEXT,
  "availableUntil" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistEntry_patientProfileId_doctorProfileId_key"
  ON "WaitlistEntry"("patientProfileId", "doctorProfileId");
CREATE INDEX "WaitlistEntry_doctorProfileId_position_idx"
  ON "WaitlistEntry"("doctorProfileId", "position");

ALTER TABLE "WaitlistEntry"
  ADD CONSTRAINT "WaitlistEntry_patientProfileId_fkey"
  FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WaitlistEntry"
  ADD CONSTRAINT "WaitlistEntry_doctorProfileId_fkey"
  FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "WaitlistOffer" (
  "id" TEXT NOT NULL,
  "waitlistEntryId" TEXT NOT NULL,
  "patientProfileId" TEXT NOT NULL,
  "doctorProfileId" TEXT NOT NULL,
  "offeredStartsAt" TIMESTAMP(3) NOT NULL,
  "offeredEndsAt" TIMESTAMP(3) NOT NULL,
  "status" "WaitlistOfferStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WaitlistOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WaitlistOffer_patientProfileId_status_idx"
  ON "WaitlistOffer"("patientProfileId", "status");
CREATE INDEX "WaitlistOffer_doctorProfileId_status_idx"
  ON "WaitlistOffer"("doctorProfileId", "status");
CREATE INDEX "WaitlistOffer_status_idx"
  ON "WaitlistOffer"("status");
CREATE INDEX "WaitlistOffer_expiresAt_idx"
  ON "WaitlistOffer"("expiresAt");

ALTER TABLE "WaitlistOffer"
  ADD CONSTRAINT "WaitlistOffer_waitlistEntryId_fkey"
  FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WaitlistOffer"
  ADD CONSTRAINT "WaitlistOffer_patientProfileId_fkey"
  FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WaitlistOffer"
  ADD CONSTRAINT "WaitlistOffer_doctorProfileId_fkey"
  FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
