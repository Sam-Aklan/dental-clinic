import { FollowUpsController } from '../src/follow-ups/follow-ups.controller';
import { FollowUpStatus, Role } from '../src/generated/prisma/enums';

describe('Follow-ups E2E smoke', () => {
  it('wires controller methods to the service contract', async () => {
    const service = {
      create: jest.fn().mockResolvedValue({ id: 'follow-up-id' }),
      list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
      getOne: jest.fn().mockResolvedValue({ id: 'follow-up-id' }),
      update: jest.fn().mockResolvedValue({ id: 'follow-up-id' }),
      updateStatus: jest.fn().mockResolvedValue({ id: 'follow-up-id' }),
      cancel: jest.fn().mockResolvedValue({ id: 'follow-up-id' }),
    } as never;

    const controller = new FollowUpsController(service);

    await expect(
      controller.updateStatus(
        'follow-up-id',
        { status: FollowUpStatus.CANCELED, cancelReason: 'Patient requested cancellation' },
        { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
      ),
    ).resolves.toEqual({ id: 'follow-up-id' });
  });
});
