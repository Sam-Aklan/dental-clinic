import { Logger } from '@nestjs/common';

// Import via moduleNameMapper mock
import { PrismaClient } from '../generated/prisma/client';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    service = new PrismaService();
  });

  describe('onModuleInit', () => {
    it('should call $connect once', async () => {
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalledTimes(1);
    });

    it('should propagate $connect failures', async () => {
      const error = new Error('Connection refused');
      (service.$connect as jest.Mock).mockRejectedValue(error);
      await expect(service.onModuleInit()).rejects.toThrow('Connection refused');
    });

    it('should log a stable message on successful connection', async () => {
      await service.onModuleInit();
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Database connected'),
      );
    });

    it('should not log DATABASE_URL in success messages', async () => {
      await service.onModuleInit();
      const calls = (Logger.prototype.log as jest.Mock).mock.calls.flat();
      const allMessages = calls.join(' ');
      expect(allMessages).not.toContain('postgresql://');
      expect(allMessages).not.toContain('DATABASE_URL');
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect once', async () => {
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should propagate $disconnect failures', async () => {
      const error = new Error('Disconnect failed');
      (service.$disconnect as jest.Mock).mockRejectedValue(error);
      await expect(service.onModuleDestroy()).rejects.toThrow('Disconnect failed');
    });

    it('should log a stable message on successful disconnect', async () => {
      await service.onModuleDestroy();
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Database disconnected'),
      );
    });

    it('should not log DATABASE_URL in disconnect messages', async () => {
      await service.onModuleDestroy();
      const calls = (Logger.prototype.log as jest.Mock).mock.calls.flat();
      const allMessages = calls.join(' ');
      expect(allMessages).not.toContain('postgresql://');
      expect(allMessages).not.toContain('DATABASE_URL');
    });
  });
});
