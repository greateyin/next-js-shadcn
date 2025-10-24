/**
 * @fileoverview Database configuration using Prisma ORM
 * @module lib/db
 * @description Configures and exports a singleton Prisma client instance
 * following Next.js best practices for connection management. When Prisma
 * has not been generated (e.g. in an offline environment), a descriptive
 * stub client is provided so the application can still build.
 */

import { createRequire } from "module";
import { existsSync } from "fs";
import path from "path";

type PrismaClientLike = Record<string, unknown>;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientLike | undefined;
}

const require = createRequire(import.meta.url);

const prismaClientPath = path.join(process.cwd(), "node_modules", ".prisma", "client", "default.js");
const hasGeneratedClient = existsSync(prismaClientPath);

const prismaNotGeneratedMessage =
  "Prisma Client has not been generated. Run `pnpm prisma:generate` to enable database access.";

const createPrismaStub = (): PrismaClientLike => {
  const callableProxy = new Proxy(function () {
    /* noop */
  }, {
    apply() {
      throw new Error(prismaNotGeneratedMessage);
    },
    get() {
      return callableProxy;
    },
  });

  return new Proxy(
    {},
    {
      get(_target, property) {
        if (property === "$connect" || property === "$disconnect" || property === "$transaction") {
          return async () => {
            throw new Error(prismaNotGeneratedMessage);
          };
        }

        return callableProxy;
      },
    },
  ) as PrismaClientLike;
};

const createPrismaClient = (): PrismaClientLike => {
  if (!hasGeneratedClient) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(prismaNotGeneratedMessage);
    }
    return createPrismaStub();
  }

  if (globalThis.prisma) {
    return globalThis.prisma;
  }

  const { PrismaClient } = require("@prisma/client");
  const client = new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = client;
  }

  return client as PrismaClientLike;
};

export const db: PrismaClientLike = createPrismaClient();
