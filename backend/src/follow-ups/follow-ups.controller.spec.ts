import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsService } from './follow-ups.service';
import { FollowUpStatus, Role } from '../generated/prisma/enums';

describe('FollowUpsController', () => {
  const service = {
    create: jest.fn(),
    list: jest.fn(),
    getOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    cancel: jest.fn(),
  } as unknown as jest.Mocked<FollowUpsService>;

  const controller = new FollowUpsController(service);

  it('delegates create requests', async () => {
    service.create.mockResolvedValue({ id: 'follow-up-id' } as never);

    await controller.create(
      { patientId: 'abcdefghijklmnopqrstuvwxy', doctorId: 'bcdefghijklmnopqrstuvwxyz', startsAt: '2026-06-20T08:00:00.000Z', reason: 'Checkup' },
      { userId: 'staff-id', email: 'staff@example.com', role: Role.ADMIN },
      '8cc8cb9d-7f68-4fc4-9155-4c7348a5363f',
    );

    expect(service.create).toHaveBeenCalled();
  });

  it('delegates status changes', async () => {
    service.updateStatus.mockResolvedValue({ id: 'follow-up-id' } as never);

    await controller.updateStatus(
      'follow-up-id',
      { status: FollowUpStatus.CANCELED, cancelReason: 'Patient requested cancellation' },
      { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
    );

    expect(service.updateStatus).toHaveBeenCalledWith(
      'follow-up-id',
      expect.objectContaining({ status: FollowUpStatus.CANCELED }),
      expect.any(Object),
    );
  });
});
