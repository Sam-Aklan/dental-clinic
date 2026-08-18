// Mock generated Prisma client for unit tests
// The real generated client uses ESM syntax (import.meta.url) incompatible with Jest CJS

class MockPrismaClient {
  user!: ReturnType<typeof createModelMock>;
  doctorProfile!: ReturnType<typeof createModelMock>;
  patientProfile!: ReturnType<typeof createModelMock>;
  appointment!: ReturnType<typeof createModelMock>;
  followUp!: ReturnType<typeof createModelMock>;
  waitlistEntry!: ReturnType<typeof createModelMock>;
  waitlistOffer!: ReturnType<typeof createModelMock>;
  auditLog!: ReturnType<typeof createModelMock>;
  refreshToken!: ReturnType<typeof createModelMock>;
  passwordResetToken!: ReturnType<typeof createModelMock>;
  clinicConfig!: ReturnType<typeof createModelMock>;
  workingHour!: ReturnType<typeof createModelMock>;
  holiday!: ReturnType<typeof createModelMock>;
  doctorScheduleOverride!: ReturnType<typeof createModelMock>;

  constructor() {
    // Instance properties for each model
    this.user = createModelMock();
    this.doctorProfile = createModelMock();
    this.patientProfile = createModelMock();
    this.appointment = createModelMock();
    this.followUp = createModelMock();
    this.waitlistEntry = createModelMock();
    this.waitlistOffer = createModelMock();
    this.auditLog = createModelMock();
    this.refreshToken = createModelMock();
    this.passwordResetToken = createModelMock();
    this.clinicConfig = createModelMock();
    this.workingHour = createModelMock();
    this.holiday = createModelMock();
    this.doctorScheduleOverride = createModelMock();
  }

  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $transaction = jest.fn().mockImplementation(async (fn: unknown) => {
    return typeof fn === 'function' ? fn(new MockPrismaClient()) : Promise.all(fn as []);
  });
  $queryRaw = jest.fn();
  $queryRawUnsafe = jest.fn();
}

function createModelMock() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
}

export const PrismaClient = MockPrismaClient;

export const Prisma = {
  TransactionClient: jest.fn(),
};

export enum Role {
  ADMIN = 'ADMIN',
  RECEPTIONIST = 'RECEPTIONIST',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  NO_SHOW = 'NO_SHOW',
}

export enum WaitlistOfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export enum Locale {
  EN = 'EN',
  AR = 'AR',
}

export enum FollowUpStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  MISSED = 'MISSED',
}
