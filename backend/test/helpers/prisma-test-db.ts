import { PrismaClient } from '../../src/generated/prisma/client';

export function assertTestDatabaseUrl(): void {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.includes('test')) {
    throw new Error(
      `Refusing to run e2e tests outside test database. DATABASE_URL must contain "test", got: ${url.replace(/\/\/.*@/, '//<redacted>@')}`,
    );
  }
}

export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.waitlistOffer.deleteMany(),
    prisma.waitlistEntry.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.doctorScheduleOverride.deleteMany(),
    prisma.holiday.deleteMany(),
    prisma.workingHour.deleteMany(),
    prisma.clinicConfig.deleteMany(),
    prisma.patientProfile.deleteMany(),
    prisma.doctorProfile.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function disconnectTestDb(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect();
}
