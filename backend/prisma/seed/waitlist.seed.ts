import { PrismaClient } from '../../src/generated/prisma/client';

export interface WaitlistSeedCounts {
  waitlistEntries: number;
  waitlistOffers: number;
}

export async function seedWaitlist(prisma: PrismaClient): Promise<WaitlistSeedCounts> {
  const doctors = await prisma.doctorProfile.findMany({
    select: { id: true, user: { select: { firstName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const patients = await prisma.patientProfile.findMany({
    select: { id: true, user: { select: { firstName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const drAhmad = doctors[0];
  const drLayla = doctors[1];
  const omar = patients[0];
  const fatima = patients[1];

  const entry1 = await prisma.waitlistEntry.create({
    data: {
      patientProfileId: omar.id,
      doctorProfileId: drAhmad.id,
      position: 1,
      availableFrom: '09:00',
      availableUntil: '14:00',
    },
  });

  const entry2 = await prisma.waitlistEntry.create({
    data: {
      patientProfileId: fatima.id,
      doctorProfileId: drAhmad.id,
      position: 2,
      availableFrom: null,
      availableUntil: null,
    },
  });

  const entry3 = await prisma.waitlistEntry.create({
    data: {
      patientProfileId: fatima.id,
      doctorProfileId: drLayla.id,
      position: 1,
      availableFrom: '12:00',
      availableUntil: '17:00',
    },
  });

  const now = new Date();

  await prisma.waitlistOffer.create({
    data: {
      waitlistEntryId: entry1.id,
      patientProfileId: omar.id,
      doctorProfileId: drAhmad.id,
      offeredStartsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      offeredEndsAt: new Date(now.getTime() + 24.5 * 60 * 60 * 1000),
      status: 'PENDING',
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    },
  });

  await prisma.waitlistOffer.create({
    data: {
      waitlistEntryId: entry2.id,
      patientProfileId: fatima.id,
      doctorProfileId: drAhmad.id,
      offeredStartsAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      offeredEndsAt: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
      status: 'EXPIRED',
      expiresAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    waitlistEntries: 3,
    waitlistOffers: 2,
  };
}
