// Applies pending database migrations. Run on every deploy: `npm run db:migrate`.
import pg from "pg";
import { runMigrations } from "../db/migrations.mjs";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const ssl = process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : process.env.DATABASE_SSL === "verify" ? { rejectUnauthorized: true } : undefined;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl, max: 1 });
try {
  const applied = await runMigrations(pool, (message) => console.log(message));
  console.log(applied.length ? `Done: ${applied.length} migration(s) applied.` : "Database is up to date.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
