-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "WaitlistOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicConfig" (
    "id" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL,
    "timeZone" TEXT NOT NULL,
    "reminderLeadTime" INTEGER NOT NULL,
    "offerWindowMinutes" INTEGER NOT NULL,
    "arrivalBufferMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingHour" (
    "id" TEXT NOT NULL,
    "clinicConfigId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "clinicConfigId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorScheduleOverride" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "patientProfileId" TEXT NOT NULL,
    "doctorProfileId" TEXT,
    "preferredWindowStart" TIMESTAMP(3),
    "preferredWindowEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistOffer" (
    "id" TEXT NOT NULL,
    "waitlistEntryId" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "newAppointmentId" TEXT,
    "proposedStartTime" TIMESTAMP(3) NOT NULL,
    "proposedEndTime" TIMESTAMP(3) NOT NULL,
    "status" "WaitlistOfferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "WorkingHour_clinicConfigId_idx" ON "WorkingHour"("clinicConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHour_clinicConfigId_dayOfWeek_key" ON "WorkingHour"("clinicConfigId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Holiday_clinicConfigId_idx" ON "Holiday"("clinicConfigId");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_clinicConfigId_date_key" ON "Holiday"("clinicConfigId", "date");

-- CreateIndex
CREATE INDEX "DoctorScheduleOverride_doctorProfileId_idx" ON "DoctorScheduleOverride"("doctorProfileId");

-- CreateIndex
CREATE INDEX "DoctorScheduleOverride_date_idx" ON "DoctorScheduleOverride"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorScheduleOverride_doctorProfileId_date_key" ON "DoctorScheduleOverride"("doctorProfileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Appointment_doctorProfileId_idx" ON "Appointment"("doctorProfileId");

-- CreateIndex
CREATE INDEX "Appointment_patientUserId_idx" ON "Appointment"("patientUserId");

-- CreateIndex
CREATE INDEX "Appointment_startTime_endTime_idx" ON "Appointment"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_idempotencyKey_idx" ON "Appointment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WaitlistEntry_patientProfileId_idx" ON "WaitlistEntry"("patientProfileId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_doctorProfileId_idx" ON "WaitlistEntry"("doctorProfileId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_isActive_idx" ON "WaitlistEntry"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistOffer_newAppointmentId_key" ON "WaitlistOffer"("newAppointmentId");

-- CreateIndex
CREATE INDEX "WaitlistOffer_waitlistEntryId_idx" ON "WaitlistOffer"("waitlistEntryId");

-- CreateIndex
CREATE INDEX "WaitlistOffer_doctorProfileId_idx" ON "WaitlistOffer"("doctorProfileId");

-- CreateIndex
CREATE INDEX "WaitlistOffer_status_idx" ON "WaitlistOffer"("status");

-- CreateIndex
CREATE INDEX "WaitlistOffer_expiresAt_idx" ON "WaitlistOffer"("expiresAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingHour" ADD CONSTRAINT "WorkingHour_clinicConfigId_fkey" FOREIGN KEY ("clinicConfigId") REFERENCES "ClinicConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_clinicConfigId_fkey" FOREIGN KEY ("clinicConfigId") REFERENCES "ClinicConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorScheduleOverride" ADD CONSTRAINT "DoctorScheduleOverride_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistOffer" ADD CONSTRAINT "WaitlistOffer_waitlistEntryId_fkey" FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistOffer" ADD CONSTRAINT "WaitlistOffer_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistOffer" ADD CONSTRAINT "WaitlistOffer_newAppointmentId_fkey" FOREIGN KEY ("newAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
