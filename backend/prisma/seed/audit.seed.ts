import { PrismaClient } from '../../src/generated/prisma/client';

export async function seedAudit(prisma: PrismaClient): Promise<number> {
  const admin = await prisma.user.findFirstOrThrow({
    where: { email: 'admin@clinic.local' },
    select: { id: true },
  });

  const receptionist = await prisma.user.findFirstOrThrow({
    where: { email: 'receptionist@clinic.local' },
    select: { id: true },
  });

  const clinicConfig = await prisma.clinicConfig.findFirstOrThrow({
    select: { id: true },
  });

  const firstDoctor = await prisma.doctorProfile.findFirstOrThrow({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  const firstAppointment = await prisma.appointment.findFirstOrThrow({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'CLINIC_CONFIG_UPDATED',
      entityType: 'ClinicConfig',
      entityId: clinicConfig.id,
      metadata: { changes: { slotDurationMinutes: 30 } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'DOCTOR_CREATED',
      entityType: 'DoctorProfile',
      entityId: firstDoctor.id,
      metadata: { specialization: 'General Dentistry' },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: receptionist.id,
      action: 'APPOINTMENT_CREATED',
      entityType: 'Appointment',
      entityId: firstAppointment.id,
      metadata: undefined,
    },
  });

  return 3;
}
