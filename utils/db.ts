import { Pool, type PoolConfig } from "pg";

/**
 * One connection pool per server process.
 *
 * DATABASE_SSL controls TLS to the database:
 * - unset / "disable": no TLS (a database on the same server or private network)
 * - "require": TLS without certificate checks (most managed Postgres providers)
 * - "verify": TLS with full certificate verification
 */
function sslConfig(): PoolConfig["ssl"] {
  switch (process.env.DATABASE_SSL) {
    case "require": return { rejectUnauthorized: false };
    case "verify": return { rejectUnauthorized: true };
    default: return undefined;
  }
}

function createPool(): Pool {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    // Stop runaway queries from holding connections.
    statement_timeout: 15_000,
    application_name: "formora",
  });
  // An idle client losing its connection (database restart, network blip) must not crash the server.
  pool.on("error", (error) => console.error("[db] idle client error", error.message));
  return pool;
}

const globalForDb = globalThis as unknown as { dbPool: Pool | undefined };
export const db = globalForDb.dbPool ?? createPool();
globalForDb.dbPool = db;

const UNAVAILABLE_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "EAI_AGAIN", "57P01", "57P03", "53300", "08000", "08001", "08003", "08006"]);

/** Whether an error means "the database can't be reached right now" rather than a bug. */
export function isDatabaseUnavailable(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string; cause?: unknown } | null;
  if (!candidate) return false;
  if (candidate.code && UNAVAILABLE_CODES.has(candidate.code)) return true;
  if (/connection terminated|timeout exceeded when trying to connect|connect ECONNREFUSED/i.test(candidate.message ?? "")) return true;
  return candidate.cause ? isDatabaseUnavailable(candidate.cause) : false;
}
