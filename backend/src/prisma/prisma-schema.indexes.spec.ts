import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function readAllSchemas(): string {
  const schemaDir = join(__dirname, '..', '..', 'prisma', 'schema');
  const baseConfig = readFileSync(
    join(__dirname, '..', '..', 'prisma', 'base.prisma'),
    'utf-8',
  );
  const files = readdirSync(schemaDir).filter((f) => f.endsWith('.prisma'));
  const schemaContent = files
    .map((f) => readFileSync(join(schemaDir, f), 'utf-8'))
    .join('\n');
  return baseConfig + '\n' + schemaContent;
}

const EXPECTED_MODELS = [
  'User',
  'RefreshToken',
  'PasswordResetToken',
  'DoctorProfile',
  'PatientProfile',
  'ClinicConfig',
  'WorkingHour',
  'Holiday',
  'DoctorScheduleOverride',
  'Appointment',
  'WaitlistEntry',
  'WaitlistOffer',
  'AuditLog',
];

describe('Prisma Schema Indexes', () => {
  let schema: string;

  beforeAll(() => {
    schema = readAllSchemas();
  });

  describe('all 14 models exist', () => {
    for (const model of EXPECTED_MODELS) {
      it(`should define model ${model}`, () => {
        expect(schema).toMatch(new RegExp(`model\\s+${model}\\s*\\{`));
      });
    }
  });

  describe('uniqueness constraints', () => {
    it('should have unique constraint on User.email', () => {
      expect(schema).toMatch(/email\s+\S+\s+@unique/);
    });

    it('should have unique constraint on RefreshToken.tokenHash', () => {
      expect(schema).toMatch(/tokenHash\s+\S+\s+@unique/);
    });

    it('should have unique constraint on PasswordResetToken.tokenHash', () => {
      const pwResetBlock = schema.match(/model\s+PasswordResetToken\s*\{[^}]*tokenHash\s+\S+\s+@unique/s);
      expect(pwResetBlock).not.toBeNull();
    });

    it('should have unique constraint on DoctorProfile.userId', () => {
      const dpBlock = schema.match(/model\s+DoctorProfile\s*\{[^}]*userId\s+\S+\s+@unique/s);
      expect(dpBlock).not.toBeNull();
    });

    it('should have unique constraint on PatientProfile.userId', () => {
      const ppBlock = schema.match(/model\s+PatientProfile\s*\{[^}]*userId\s+\S+\s+@unique/s);
      expect(ppBlock).not.toBeNull();
    });

    it('should have unique constraint on WorkingHour(dayOfWeek)', () => {
      expect(schema).toMatch(/@@unique\(\[dayOfWeek\]\)/);
    });

    it('should have unique constraint on Holiday(date)', () => {
      expect(schema).toMatch(/@@unique\(\[date\]\)/);
    });

    it('should have unique composite on DoctorScheduleOverride(doctorProfileId, date)', () => {
      expect(schema).toMatch(/@@unique\(\[doctorProfileId,\s*date\]\)/);
    });

    it('should have unique constraint on Appointment.idempotencyKey', () => {
      expect(schema).toMatch(/idempotencyKey\s+String\?\s+@unique/);
    });

    it('should have unique composite on WaitlistEntry(patientProfileId, doctorProfileId)', () => {
      expect(schema).toMatch(/@@unique\(\[patientProfileId,\s*doctorProfileId\]\)/);
    });
  });

  describe('required indexes', () => {
    it('should have index on User(role)', () => {
      expect(schema).toMatch(/@@index\(\[role\]\)/);
    });

    it('should have index on User(isActive)', () => {
      expect(schema).toMatch(/@@index\(\[isActive\]\)/);
    });

    it('should have index on RefreshToken(userId)', () => {
      const rtBlock = schema.match(/model\s+RefreshToken\s*\{[^}]*@@index\(\[userId\]\)/s);
      expect(rtBlock).not.toBeNull();
    });

    it('should have index on PasswordResetToken(userId)', () => {
      const prtBlock = schema.match(/model\s+PasswordResetToken\s*\{[^}]*@@index\(\[userId\]\)/s);
      expect(prtBlock).not.toBeNull();
    });

    it('should have index on Appointment(doctorProfileId)', () => {
      expect(schema).toMatch(/@@index\(\[doctorProfileId\]\)/);
    });

    it('should have index on Appointment(patientUserId)', () => {
      expect(schema).toMatch(/@@index\(\[patientUserId\]\)/);
    });

    it('should have index on Appointment(startTime, endTime)', () => {
      expect(schema).toMatch(/@@index\(\[startTime,\s*endTime\]\)/);
    });

    it('should have index on Appointment(status)', () => {
      const apptBlock = schema.match(/model\s+Appointment\s*\{[^}]*@@index\(\[status\]\)/s);
      expect(apptBlock).not.toBeNull();
    });

    it('should have index on Appointment(idempotencyKey)', () => {
      expect(schema).toMatch(/@@index\(\[idempotencyKey\]\)/);
    });

    it('should have index on WaitlistEntry(doctorProfileId, position)', () => {
      const weBlock = schema.match(/model\s+WaitlistEntry\s*\{[^}]*@@index\(\[doctorProfileId,\s*position\]\)/s);
      expect(weBlock).not.toBeNull();
    });

    it('should have index on WaitlistOffer(patientProfileId, status)', () => {
      const woPatientStatusBlock = schema.match(/model\s+WaitlistOffer\s*\{[^}]*@@index\(\[patientProfileId,\s*status\]\)/s);
      expect(woPatientStatusBlock).not.toBeNull();
    });

    it('should have index on WaitlistOffer(doctorProfileId, status)', () => {
      const woBlock = schema.match(/model\s+WaitlistOffer\s*\{[^}]*@@index\(\[doctorProfileId,\s*status\]\)/s);
      expect(woBlock).not.toBeNull();
    });

    it('should have index on WaitlistOffer(status)', () => {
      const woStatusBlock = schema.match(/model\s+WaitlistOffer\s*\{[^}]*@@index\(\[status\]\)/s);
      expect(woStatusBlock).not.toBeNull();
    });

    it('should have index on WaitlistOffer(expiresAt)', () => {
      expect(schema).toMatch(/@@index\(\[expiresAt\]\)/);
    });

    it('should have index on AuditLog(actorId)', () => {
      expect(schema).toMatch(/@@index\(\[actorId\]\)/);
    });

    it('should have index on AuditLog(action)', () => {
      expect(schema).toMatch(/@@index\(\[action\]\)/);
    });

    it('should have index on AuditLog(entityType, entityId)', () => {
      expect(schema).toMatch(/@@index\(\[entityType,\s*entityId\]\)/);
    });

    it('should have index on AuditLog(createdAt)', () => {
      const alBlock = schema.match(/model\s+AuditLog\s*\{[^}]*@@index\(\[createdAt\]\)/s);
      expect(alBlock).not.toBeNull();
    });

    it('should have Holiday index on date', () => {
      const hDateBlock = schema.match(/model\s+Holiday\s*\{[^}]*@@index\(\[date\]\)/s);
      expect(hDateBlock).not.toBeNull();
    });

    it('should have DoctorScheduleOverride index on doctorProfileId', () => {
      const dsoBlock = schema.match(/model\s+DoctorScheduleOverride\s*\{[^}]*@@index\(\[doctorProfileId\]\)/s);
      expect(dsoBlock).not.toBeNull();
    });

    it('should have DoctorScheduleOverride index on date', () => {
      const dsoDateBlock = schema.match(/model\s+DoctorScheduleOverride\s*\{[^}]*@@index\(\[date\]\)/s);
      expect(dsoDateBlock).not.toBeNull();
    });
  });
});
