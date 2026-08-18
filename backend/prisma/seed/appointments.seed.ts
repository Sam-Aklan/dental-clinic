import { PrismaClient } from '../../src/generated/prisma/client';

export async function seedAppointments(prisma: PrismaClient): Promise<number> {
  const doctors = await prisma.doctorProfile.findMany({
    select: { id: true, user: { select: { firstName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    select: { id: true, firstName: true },
    orderBy: { createdAt: 'asc' },
  });

  const drAhmad = doctors[0];
  const drLayla = doctors[1];
  const omar = patients[0];
  const fatima = patients[1];

  const now = new Date();

  const appointments = [
    {
      doctorProfileId: drAhmad.id,
      patientUserId: omar.id,
      startTime: hourFromNow(now, 24),
      endTime: hourFromNow(now, 24.5),
      status: 'PENDING' as const,
      notes: 'Routine checkup',
    },
    {
      doctorProfileId: drAhmad.id,
      patientUserId: fatima.id,
      startTime: hourFromNow(now, 48),
      endTime: hourFromNow(now, 48.5),
      status: 'CONFIRMED' as const,
      notes: 'Teeth whitening consultation',
    },
    {
      doctorProfileId: drLayla.id,
      patientUserId: omar.id,
      startTime: hourFromNow(now, -24),
      endTime: hourFromNow(now, -23.5),
      status: 'COMPLETED' as const,
      notes: 'Filling completed',
    },
    {
      doctorProfileId: drLayla.id,
      patientUserId: fatima.id,
      startTime: hourFromNow(now, 2),
      endTime: hourFromNow(now, 2.5),
      status: 'CONFIRMED' as const,
      notes: 'Braces adjustment',
    },
    {
      doctorProfileId: drAhmad.id,
      patientUserId: omar.id,
      startTime: hourFromNow(now, 72),
      endTime: hourFromNow(now, 72.5),
      status: 'CONFIRMED' as const,
      notes: 'Crown preparation',
    },
    {
      doctorProfileId: drAhmad.id,
      patientUserId: fatima.id,
      startTime: hourFromNow(now, -48),
      endTime: hourFromNow(now, -47.5),
      status: 'CANCELED' as const,
      cancellationReason: 'Patient requested cancellation',
      notes: 'Root canal',
    },
  ];

  for (const appt of appointments) {
    await prisma.appointment.create({ data: appt });
  }

  return appointments.length;
}

function hourFromNow(base: Date, hours: number): Date {
  const d = new Date(base.getTime());
  d.setUTCHours(d.getUTCHours() + Math.floor(hours), (hours % 1) * 60, 0, 0);
  return d;
}
