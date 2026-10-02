import { db } from "@/utils/db";
import { runMigrations } from "@/db/migrations.mjs";

/**
 * Makes sure the schema is current before the first query in this process.
 * Deploys should also run `npm run db:migrate`; this is the safety net that
 * keeps development and single-server setups working without that step.
 */
let ready: Promise<void> | undefined;

export function ensureSchema(): Promise<void> {
  ready ??= runMigrations(db, (message) => console.info(`[db] ${message}`)).then(() => undefined).catch((error) => {
    ready = undefined; // Retry on the next request instead of caching a failure.
    throw error;
  });
  return ready;
}

export const databaseConfigured = () => Boolean(process.env.DATABASE_URL);
