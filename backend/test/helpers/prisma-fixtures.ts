import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { Role } from '../../src/generated/prisma/enums';

export async function createAdminUser(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      email: 'admin@clinic.test',
      passwordHash: 'hashed-admin-password',
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
    },
  });
}

export async function createReceptionistUser(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      email: 'receptionist@clinic.test',
      passwordHash: 'hashed-receptionist-password',
      role: Role.RECEPTIONIST,
      firstName: 'Reception',
      lastName: 'Ist',
    },
  });
}

export async function createDoctorUser(prisma: PrismaClient) {
  const user = await prisma.user.create({
    data: {
      email: 'doctor@clinic.test',
      passwordHash: 'hashed-doctor-password',
      role: Role.DOCTOR,
      firstName: 'Doctor',
      lastName: 'One',
    },
  });
  const profile = await prisma.doctorProfile.create({
    data: {
      userId: user.id,
      specialization: 'General Dentistry',
    },
  });
  return { user, profile };
}

export async function createPatientUser(prisma: PrismaClient) {
  const user = await prisma.user.create({
    data: {
      email: 'patient@clinic.test',
      passwordHash: 'hashed-patient-password',
      role: Role.PATIENT,
      firstName: 'Patient',
      lastName: 'One',
    },
  });
  const profile = await prisma.patientProfile.create({
    data: {
      userId: user.id,
    },
  });
  return { user, profile };
}

export async function createClinicConfig(prisma: PrismaClient) {
  const config = await prisma.clinicConfig.create({
    data: {
      slotDurationMinutes: 30,
      timeZone: 'Asia/Riyadh',
      reminderHoursBefore: 24,
      offerWindowMinutes: 60,
      minArrivalMinutes: 30,
    },
  });

  const days = [0, 1, 2, 3, 4, 5, 6];
  for (const day of days) {
    await prisma.workingHour.create({
      data: {
        dayOfWeek: day,
        startTime: day >= 0 && day <= 4 ? '09:00' : null,
        endTime: day >= 0 && day <= 4 ? '17:00' : null,
        isClosed: !(day >= 0 && day <= 4),
      },
    });
  }

  return config;
}

export async function createAppointment(
  prisma: PrismaClient,
  doctorProfileId: string,
  patientUserId: string,
  startTime: Date,
  endTime: Date,
) {
  return prisma.appointment.create({
    data: {
      doctorProfileId,
      patientUserId,
      startTime,
      endTime,
      status: 'CONFIRMED',
    },
  });
}

export async function createWaitlistEntry(
  prisma: PrismaClient,
  patientProfileId: string,
  doctorProfileId: string,
) {
  return prisma.waitlistEntry.create({
    data: {
      patientProfileId,
      doctorProfileId,
      position: 1,
      availableFrom: null,
      availableUntil: null,
    },
  });
}

export async function createWaitlistOffer(
  prisma: PrismaClient,
  waitlistEntryId: string,
  patientProfileId: string,
  doctorProfileId: string,
  offeredStartsAt: Date,
  offeredEndsAt: Date,
  expiresAt: Date,
) {
  return prisma.waitlistOffer.create({
    data: {
      waitlistEntryId,
      patientProfileId,
      doctorProfileId,
      offeredStartsAt,
      offeredEndsAt,
      expiresAt,
      status: 'PENDING',
    },
  });
}

export async function createAuditLog(
  prisma: PrismaClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: (metadata as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });
}
