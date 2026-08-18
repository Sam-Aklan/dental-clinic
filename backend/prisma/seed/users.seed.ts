import * as argon2 from 'argon2';
import { PrismaClient } from '../../src/generated/prisma/client';
import { Role } from '../../src/generated/prisma/enums';

export interface SeedCounts {
  users: number;
  doctorProfiles: number;
  patientProfiles: number;
}

export async function seedUsers(prisma: PrismaClient): Promise<SeedCounts> {
  const passwordHash = await argon2.hash('SecurePass1', { type: argon2.argon2id });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@clinic.local',
      passwordHash,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'System',
      phone: '+962790000001',
      preferredLocale: 'EN',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      email: 'receptionist@clinic.local',
      passwordHash,
      role: 'RECEPTIONIST',
      firstName: 'Noor',
      lastName: 'Hassan',
      phone: '+962790000002',
      preferredLocale: 'AR',
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      email: 'dr.ahmad@clinic.local',
      passwordHash,
      role: 'DOCTOR',
      firstName: 'Ahmad',
      lastName: 'Al-Rashid',
      phone: '+962790000003',
      preferredLocale: 'AR',
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      email: 'dr.layla@clinic.local',
      passwordHash,
      role: 'DOCTOR',
      firstName: 'Layla',
      lastName: 'Mahmoud',
      phone: '+962790000004',
      preferredLocale: 'EN',
    },
  });

  const patient1 = await prisma.user.create({
    data: {
      email: 'omar@example.com',
      passwordHash,
      role: 'PATIENT',
      firstName: 'Omar',
      lastName: 'Khalil',
      phone: '+962790000005',
      preferredLocale: 'AR',
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      email: 'fatima@example.com',
      passwordHash,
      role: 'PATIENT',
      firstName: 'Fatima',
      lastName: 'Youssef',
      phone: '+962790000006',
      preferredLocale: 'EN',
    },
  });

  const doctorProfile1 = await prisma.doctorProfile.create({
    data: {
      userId: doctor1.id,
      specialization: 'General Dentistry',
      bio: 'Over 10 years of experience in general and cosmetic dentistry.',
      avatarUrl: null,
    },
  });

  const doctorProfile2 = await prisma.doctorProfile.create({
    data: {
      userId: doctor2.id,
      specialization: 'Orthodontics',
      bio: 'Specializing in braces, aligners, and dentofacial orthopedics.',
      avatarUrl: null,
    },
  });

  const patientProfile1 = await prisma.patientProfile.create({
    data: {
      userId: patient1.id,
      dateOfBirth: new Date('1990-05-15'),
      address: '123 Main Street, Amman',
      notes: 'Prefers morning appointments.',
    },
  });

  const patientProfile2 = await prisma.patientProfile.create({
    data: {
      userId: patient2.id,
      dateOfBirth: new Date('1985-11-22'),
      address: '456 King Faisal Street, Dubai',
      notes: null,
    },
  });

  return {
    users: 6,
    doctorProfiles: 2,
    patientProfiles: 2,
  };
}
