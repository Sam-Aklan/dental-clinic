// CJS-compatible Prisma client wrapper for Jest e2e tests
// The generated Prisma 7 client uses ESM (import.meta.url) which Jest CJS can't parse.
// This wrapper re-exports everything except the ESM bootstrap code.

import * as $Enums from '../../src/generated/prisma/enums';
import { getPrismaClientClass } from '../../src/generated/prisma/internal/class';
import * as Prisma from '../../src/generated/prisma/internal/prismaNamespace';

const PrismaClient = getPrismaClientClass();

export { PrismaClient, Prisma, $Enums };
export * from '../../src/generated/prisma/enums';
