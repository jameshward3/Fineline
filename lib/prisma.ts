import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// pg-connection-string treats sslmode=require as an alias for verify-full,
// which rejects Supabase's certificate chain. uselibpqcompat=true restores
// the classic libpq semantics (encrypt without strict CA verification).
export function withLibpqCompat(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: withLibpqCompat(
      process.env.fineline_POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL!
    ),
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
