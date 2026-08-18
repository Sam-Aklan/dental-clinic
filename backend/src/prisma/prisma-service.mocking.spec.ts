import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
class TestFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async findUser(id: string) {
    return (this.prisma as any).user.findUnique({ where: { id } });
  }

  async createUser(data: any) {
    return (this.prisma as any).user.create({ data });
  }
}

describe('PrismaService Mocking (Feature Service Unit Test Pattern)', () => {
  let service: TestFeatureService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (fn) => {
        return typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn);
      }),
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestFeatureService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TestFeatureService>(TestFeatureService);
  });

  it('should allow feature services to call model accessors through the mock', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.findUser('user-1');
    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('should allow feature services to create records through the mock', async () => {
    const mockUser = { id: 'user-2', email: 'new@example.com' };
    mockPrisma.user.create.mockResolvedValue(mockUser);

    const result = await service.createUser({ email: 'new@example.com' });
    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { email: 'new@example.com' },
    });
  });

  it('should run without a real database connection', async () => {
    expect(mockPrisma.$connect).not.toHaveBeenCalled();
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'any-id' });
    const result = await service.findUser('any-id');
    expect(result).toBeDefined();
  });

  it('should support $transaction mocking for interactive transactions', async () => {
    const mockTxResult = { tx: true };
    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn(mockPrisma);
    });

    const result = await mockPrisma.$transaction(async (tx: any) => {
      await tx.user.create({ data: { email: 'tx@test.com' } });
      return mockTxResult;
    });

    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(result).toEqual(mockTxResult);
  });
});
