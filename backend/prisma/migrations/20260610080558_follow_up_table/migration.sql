-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED', 'MISSED');

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "sourceAppointmentId" TEXT,
    "patientUserId" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "scheduledById" TEXT NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowUp_appointmentId_key" ON "FollowUp"("appointmentId");

-- CreateIndex
CREATE INDEX "FollowUp_doctorProfileId_status_idx" ON "FollowUp"("doctorProfileId", "status");

-- CreateIndex
CREATE INDEX "FollowUp_patientUserId_status_idx" ON "FollowUp"("patientUserId", "status");

-- CreateIndex
CREATE INDEX "FollowUp_sourceAppointmentId_idx" ON "FollowUp"("sourceAppointmentId");

-- CreateIndex
CREATE INDEX "FollowUp_createdAt_idx" ON "FollowUp"("createdAt");

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_sourceAppointmentId_fkey" FOREIGN KEY ("sourceAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_scheduledById_fkey" FOREIGN KEY ("scheduledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
