/*
  Warnings:

  - You are about to drop the column `isAvailable` on the `DoctorScheduleOverride` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClinicConfig" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DoctorProfile" ALTER COLUMN "specialization" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DoctorScheduleOverride" DROP COLUMN "isAvailable",
ADD COLUMN     "isUnavailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reason" TEXT,
ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "Holiday" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkingHour" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);
