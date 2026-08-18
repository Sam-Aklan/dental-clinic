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

describe('Prisma Schema Contract', () => {
  let schema: string;

  beforeAll(() => {
    schema = readAllSchemas();
  });

  describe('generator', () => {
    it('should define prisma-client generator', () => {
      expect(schema).toMatch(/generator\s+client\s*\{/);
      expect(schema).toMatch(/provider\s*=\s*"prisma-client"/);
    });

    it('should set output to ../src/generated/prisma', () => {
      expect(schema).toMatch(/output\s*=\s*"\.\.\/src\/generated\/prisma"/);
    });
  });

  describe('datasource', () => {
    it('should define postgresql provider', () => {
      expect(schema).toMatch(/datasource\s+db\s*\{/);
      expect(schema).toMatch(/provider\s*=\s*"postgresql"/);
    });
  });

  describe('enums', () => {
    it('should define Role enum with ADMIN, RECEPTIONIST, DOCTOR, PATIENT', () => {
      expect(schema).toMatch(/enum\s+Role\s*\{/);
      expect(schema).toMatch(/\bADMIN\b/);
      expect(schema).toMatch(/\bRECEPTIONIST\b/);
      expect(schema).toMatch(/\bDOCTOR\b/);
      expect(schema).toMatch(/\bPATIENT\b/);
    });

    it('should define AppointmentStatus enum with all six values', () => {
      expect(schema).toMatch(/enum\s+AppointmentStatus\s*\{/);
      expect(schema).toMatch(/\bPENDING\b/);
      expect(schema).toMatch(/\bCONFIRMED\b/);
      expect(schema).toMatch(/\bIN_PROGRESS\b/);
      expect(schema).toMatch(/\bCOMPLETED\b/);
      expect(schema).toMatch(/\bCANCELED\b/);
      expect(schema).toMatch(/\bNO_SHOW\b/);
    });

    it('should define WaitlistOfferStatus enum with PENDING, ACCEPTED, DECLINED, EXPIRED', () => {
      expect(schema).toMatch(/enum\s+WaitlistOfferStatus\s*\{/);
      expect(schema).toMatch(/\bPENDING\b/);
      expect(schema).toMatch(/\bACCEPTED\b/);
      expect(schema).toMatch(/\bDECLINED\b/);
      expect(schema).toMatch(/\bEXPIRED\b/);
    });
  });

  describe('clinic setup models', () => {
    it('should define the canonical ClinicConfig singleton fields', () => {
      const configBlock = schema.match(/model\s+ClinicConfig\s*\{[^}]*slotDurationMinutes\s+Int\s+@default\(30\)[^}]*timeZone\s+String\s+@default\("UTC"\)[^}]*reminderHoursBefore\s+Int\s+@default\(24\)[^}]*offerWindowMinutes\s+Int\s+@default\(30\)[^}]*minArrivalMinutes\s+Int\s+@default\(45\)/s);
      expect(configBlock).not.toBeNull();
    });

    it('should define standalone WorkingHour and Holiday models with canonical fields', () => {
      expect(schema).toMatch(/model\s+WorkingHour\s*\{[^}]*isClosed\s+Boolean\s+@default\(false\)[^}]*startTime\s+String\?[^}]*endTime\s+String\?[^}]*@@unique\(\[dayOfWeek\]\)/s);
      expect(schema).toMatch(/model\s+Holiday\s*\{[^}]*date\s+DateTime\s+@db\.Date[^}]*updatedAt\s+DateTime\s+@updatedAt[^}]*@@unique\(\[date\]\)[^}]*@@index\(\[date\]\)/s);
    });
  });
});
