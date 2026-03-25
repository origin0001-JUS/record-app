import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const dbPath = process.env.DB_PATH
  || path.resolve(process.cwd(), "..", "data", "app.db");

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: "file:" + dbPath,
    pragmas: { journal_mode: "WAL", busy_timeout: "5000" },
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
