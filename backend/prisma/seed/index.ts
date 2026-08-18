import { PrismaClient } from '../../src/generated/prisma/client';
import { clearAll } from './clear';
import { seedUsers, SeedCounts } from './users.seed';
import { seedClinic, ClinicSeedCounts } from './clinic.seed';
import { seedAppointments } from './appointments.seed';
import { seedWaitlist, WaitlistSeedCounts } from './waitlist.seed';
import { seedAudit } from './audit.seed';

export async function seed(prisma: PrismaClient): Promise<void> {
  console.log('Clearing existing data...');
  await clearAll(prisma);
  console.log('Database cleared.\n');

  console.log('--- Seeding Users & Profiles ---');
  const userCounts: SeedCounts = await seedUsers(prisma);
  console.log(`  Users:             ${userCounts.users}`);
  console.log(`  DoctorProfiles:    ${userCounts.doctorProfiles}`);
  console.log(`  PatientProfiles:   ${userCounts.patientProfiles}`);

  console.log('\n--- Seeding Clinic Config ---');
  const clinicCounts: ClinicSeedCounts = await seedClinic(prisma);
  console.log(`  ClinicConfig:              ${clinicCounts.clinicConfig}`);
  console.log(`  WorkingHours:              ${clinicCounts.workingHours}`);
  console.log(`  Holidays:                  ${clinicCounts.holidays}`);
  console.log(`  DoctorScheduleOverrides:   ${clinicCounts.doctorScheduleOverrides}`);

  console.log('\n--- Seeding Appointments ---');
  const appointmentCount: number = await seedAppointments(prisma);
  console.log(`  Appointments:   ${appointmentCount}`);

  console.log('\n--- Seeding Waitlist ---');
  const waitlistCounts: WaitlistSeedCounts = await seedWaitlist(prisma);
  console.log(`  WaitlistEntries: ${waitlistCounts.waitlistEntries}`);
  console.log(`  WaitlistOffers:  ${waitlistCounts.waitlistOffers}`);

  console.log('\n--- Seeding Audit Logs ---');
  const auditCount: number = await seedAudit(prisma);
  console.log(`  AuditLogs: ${auditCount}`);

  console.log('\nSeeding complete.');
}
