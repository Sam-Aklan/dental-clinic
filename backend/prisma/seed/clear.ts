import { PrismaClient } from '../../src/generated/prisma/client';

export async function clearAll(prisma: PrismaClient): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.waitlistOffer.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorScheduleOverride.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.clinicConfig.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}
