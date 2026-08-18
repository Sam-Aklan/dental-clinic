import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, Role, WaitlistOfferStatus } from '../generated/prisma/enums';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let prisma: any;
  let queue: any;
  let queueService: any;
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };

  const patientUser = { userId: 'user-p', role: Role.PATIENT, patientProfileId: 'patient-1' } as any;
  const staffUser = { userId: 'user-s', role: Role.RECEPTIONIST } as any;
  const doctorUser = { userId: 'user-d', role: Role.DOCTOR, doctorProfileId: 'doctor-1' } as any;

  beforeEach(() => {
    queue = { add: jest.fn() };
    queueService = { emitUpdated: jest.fn(), emitRemoved: jest.fn() };
    prisma = {
      doctorProfile: { findUnique: jest.fn() },
      waitlistEntry: { aggregate: jest.fn(), create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn(), delete: jest.fn() },
      waitlistOffer: { findUnique: jest.fn(), update: jest.fn() },
      auditLog: { create: jest.fn() },
      appointment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    service = new WaitlistService(prisma as PrismaService, queue, queueService, auditService as unknown as AuditService);
  });

  it('joins a waitlist with the next position', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1', user: { firstName: 'A', lastName: 'B' }, specialization: null });
    prisma.waitlistEntry.aggregate.mockResolvedValue({ _max: { position: 2 } });
    prisma.waitlistEntry.create.mockResolvedValue({ id: 'entry-1', patientProfileId: 'patient-1', doctorProfileId: 'doctor-1', position: 3, availableFrom: null, availableUntil: null, createdAt: new Date(), patientProfile: { id: 'patient-1', user: { firstName: 'Pat', lastName: 'Ient' } }, doctorProfile: { id: 'doctor-1', user: { firstName: 'A', lastName: 'B' }, specialization: null }, offers: [] });

    const result = await service.joinWaitlist({ doctorId: 'doctor-1' } as any, patientUser);

    expect(result.position).toBe(3);
    expect(prisma.waitlistEntry.create).toHaveBeenCalled();
  });

  it('rejects duplicate joins', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    prisma.waitlistEntry.aggregate.mockResolvedValue({ _max: { position: 0 } });
    prisma.waitlistEntry.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.joinWaitlist({ doctorId: 'doctor-1' } as any, patientUser)).rejects.toBeInstanceOf(ConflictException);
  });

  it('forbids non-patients from patient actions', async () => {
    await expect(service.joinWaitlist({ doctorId: 'doctor-1' } as any, staffUser)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns not found for missing entry', async () => {
    prisma.waitlistEntry.findUnique.mockResolvedValue(null);
    await expect(service.updateWindow('entry-1', {} as any, patientUser)).rejects.toBeInstanceOf(NotFoundException);
  });

	it('enqueues slot-opened after decline', async () => {
		prisma.waitlistOffer.findUnique.mockResolvedValue({
      id: 'offer-1',
      waitlistEntryId: 'entry-1',
      patientProfileId: 'patient-1',
      doctorProfileId: 'doctor-1',
      offeredStartsAt: new Date('2026-05-16T09:00:00.000Z'),
      offeredEndsAt: new Date('2026-05-16T09:30:00.000Z'),
      status: WaitlistOfferStatus.PENDING,
      expiresAt: new Date('2099-05-16T10:00:00.000Z'),
      doctorProfile: { id: 'doctor-1', user: { firstName: 'A', lastName: 'B' }, specialization: null },
      waitlistEntry: { patientProfile: { id: 'patient-1', userId: 'user-p', user: { id: 'user-p', firstName: 'A', lastName: 'B' } } },
		});

		prisma.waitlistOffer.update.mockResolvedValue({});
		prisma.waitlistEntry.delete.mockResolvedValue({});

		const result = await service.declineOffer('offer-1', patientUser);
		expect(result.status).toBe(WaitlistOfferStatus.DECLINED);
		expect(queue.add).toHaveBeenCalledWith('slot-opened', expect.objectContaining({ doctorProfileId: 'doctor-1' }));
		expect(prisma.waitlistEntry.delete).toHaveBeenCalledWith({ where: { id: 'entry-1' } });
	});

	it('accepts an offer without deleting the offer record inside the transaction', async () => {
		prisma.waitlistOffer.findUnique.mockResolvedValue({
			id: 'offer-1',
			waitlistEntryId: 'entry-1',
			patientProfileId: 'patient-1',
			doctorProfileId: 'doctor-1',
			offeredStartsAt: new Date('2099-05-16T09:00:00.000Z'),
			offeredEndsAt: new Date('2099-05-16T09:30:00.000Z'),
			status: WaitlistOfferStatus.PENDING,
			expiresAt: new Date('2099-05-16T10:00:00.000Z'),
			doctorProfile: { id: 'doctor-1', user: { firstName: 'A', lastName: 'B' }, specialization: null },
			waitlistEntry: { patientProfile: { id: 'patient-1', userId: 'user-p', user: { id: 'user-p', firstName: 'A', lastName: 'B' } } },
		});
		prisma.appointment.findFirst.mockResolvedValueOnce(null);
		prisma.appointment.findFirst.mockResolvedValueOnce({
			id: 'appt-1',
			doctorProfileId: 'doctor-1',
			patientUserId: 'user-p',
			startTime: new Date('2099-05-16T09:00:00.000Z'),
			endTime: new Date('2099-05-16T09:30:00.000Z'),
			status: AppointmentStatus.CONFIRMED,
			createdAt: new Date('2099-05-16T08:00:00.000Z'),
			updatedAt: new Date('2099-05-16T08:00:00.000Z'),
		});
		prisma.appointment.create.mockResolvedValue({
			id: 'appt-1',
			doctorProfileId: 'doctor-1',
			patientUserId: 'user-p',
			startTime: new Date('2099-05-16T09:00:00.000Z'),
			endTime: new Date('2099-05-16T09:30:00.000Z'),
			status: AppointmentStatus.CONFIRMED,
			createdAt: new Date('2099-05-16T08:00:00.000Z'),
			updatedAt: new Date('2099-05-16T08:00:00.000Z'),
		});
		prisma.waitlistOffer.update.mockResolvedValue({});

		const result = await service.acceptOffer('offer-1', patientUser);

		expect(result.status).toBe(WaitlistOfferStatus.ACCEPTED);
		expect(prisma.waitlistOffer.update).toHaveBeenCalledWith({
			where: { id: 'offer-1' },
			data: { status: WaitlistOfferStatus.ACCEPTED },
		});
		expect(prisma.waitlistEntry.delete).not.toHaveBeenCalled();
	});

  it('rejects doctor access to list', async () => {
    await expect(service.getWaitlist({ page: 1, pageSize: 20 } as any, doctorUser)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns patient names in waitlist list rows', async () => {
    prisma.waitlistEntry.count.mockResolvedValue(1);
    prisma.waitlistEntry.findMany.mockResolvedValue([
      {
        id: 'entry-1',
        patientProfileId: 'patient-1',
        doctorProfileId: 'doctor-1',
        position: 1,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date('2026-05-20T08:00:00.000Z'),
        patientProfile: { id: 'patient-1', user: { firstName: 'Pat', lastName: 'Ient' } },
        doctorProfile: { id: 'doctor-1', user: { firstName: 'Doc', lastName: 'Tor' }, specialization: null },
        offers: [],
      },
    ]);

    const result = await service.getWaitlist({ page: 1, pageSize: 20 } as any, staffUser);

    expect(result.items[0].patient).toEqual({ id: 'patient-1', firstName: 'Pat', lastName: 'Ient' });
  });

  it('writes an audit row for staff deletion', async () => {
    prisma.waitlistEntry.findUnique.mockResolvedValue({ id: 'entry-1', patientProfileId: 'patient-1', doctorProfileId: 'doctor-1' });

    await service.leaveWaitlist('entry-1', staffUser);

    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'WAITLIST_ENTRY_DELETED',
      targetType: 'WAITLIST',
      targetId: 'entry-1',
    }));
  });
});
