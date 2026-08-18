import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

export async function closeSocket(socket: { close: () => void }) {
  socket.close();
}

export async function connectAsJwt(_token: string) {
  throw new Error('queue e2e helper not wired');
}

export async function connectAsKiosk(_token: string) {
  throw new Error('queue e2e helper not wired');
}

export function waitForEvent<T>(_socket: unknown, _eventName: string): Promise<T> {
  return Promise.reject(new Error('queue e2e helper not wired'));
}

describe.skip('Queue E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });
});
