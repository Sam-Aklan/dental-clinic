import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should export PrismaService', () => {
    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
  });

  it('should provide the same PrismaService instance (singleton)', () => {
    const service1 = module.get<PrismaService>(PrismaService);
    const service2 = module.get<PrismaService>(PrismaService);
    expect(service1).toBe(service2);
  });

  it('should not import any feature modules', () => {
    // PrismaModule should be self-contained with only its own providers
    const imports = Reflect.getMetadata('imports', PrismaModule) ?? [];
    expect(imports.length).toBe(0);
  });
});
