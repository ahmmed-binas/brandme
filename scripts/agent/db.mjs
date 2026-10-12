// The agents' private database, on the owner's laptop only (never the server or git):
// C:\Users\binas\.fuccura\agents.db (SQLite, built into Node). Ahmed Agent and the
// seo-aeo agent keep their history here so each run can see what happened before.
//
//   node scripts/agent/db.mjs snapshot-gsc [days]     save today's Search Console numbers
//   node scripts/agent/db.mjs note <agent> <topic> <text>   write a note (decision, test, result)
//   node scripts/agent/db.mjs notes [agent] [limit]    read recent notes
//   node scripts/agent/db.mjs metric <name> <value>    record a number (e.g. leads 3)
//   node scripts/agent/db.mjs trend <name> [days]      a metric over time
//   node scripts/agent/db.mjs sql "<query>"            anything else (read or write)
//
// Tables (created on first use):
//   gsc_queries / gsc_pages  one row per day per query/page: clicks, impressions, ctr, position
//   gsc_totals               one row per day
//   notes                    what an agent decided, tried or learned, with the date
//   metrics                  any number worth tracking over time
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const FOLDER = join(homedir(), ".fuccura");
mkdirSync(FOLDER, { recursive: true });
const db = new DatabaseSync(join(FOLDER, "agents.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS gsc_totals (day TEXT PRIMARY KEY, days INTEGER, clicks INTEGER, impressions INTEGER, ctr REAL, position REAL);
  CREATE TABLE IF NOT EXISTS gsc_queries (day TEXT, query TEXT, clicks INTEGER, impressions INTEGER, ctr REAL, position REAL, PRIMARY KEY (day, query));
  CREATE TABLE IF NOT EXISTS gsc_pages (day TEXT, page TEXT, clicks INTEGER, impressions INTEGER, ctr REAL, position REAL, PRIMARY KEY (day, page));
  CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, at TEXT DEFAULT (datetime('now')), agent TEXT, topic TEXT, body TEXT);
  CREATE TABLE IF NOT EXISTS metrics (at TEXT DEFAULT (datetime('now')), name TEXT, value REAL);
`);

const today = () => new Date().toISOString().slice(0, 10);
const [command, ...args] = process.argv.slice(2);

/** Saves the Search Console report (scripts/agent/search-console.mjs) under today's date. */
function snapshotSearchConsole(days = "28") {
  const report = JSON.parse(
    execFileSync(process.execPath, [join(import.meta.dirname, "search-console.mjs"), days], {
      encoding: "utf8",
    }),
  );
  const day = today();
  const totals = report.totals ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  db.prepare("INSERT OR REPLACE INTO gsc_totals VALUES (?, ?, ?, ?, ?, ?)").run(
    day,
    Number(days),
    totals.clicks,
    totals.impressions,
    totals.ctr,
    totals.position,
  );
  const save = (table, rows) => {
    const insert = db.prepare(`INSERT OR REPLACE INTO ${table} VALUES (?, ?, ?, ?, ?, ?)`);
    for (const row of rows) insert.run(day, row.keys[0], row.clicks, row.impressions, row.ctr, row.position);
  };
  save("gsc_queries", report.queries);
  save("gsc_pages", report.pages);
  console.log(
    `Saved ${day}: ${totals.impressions} impressions, ${totals.clicks} clicks, ${report.queries.length} queries, ${report.pages.length} pages.`,
  );
}

switch (command) {
  case "snapshot-gsc":
    snapshotSearchConsole(args[0]);
    break;
  case "note": {
    const [agent, topic, ...words] = args;
    if (!agent || !topic || !words.length) throw new Error("Usage: note <agent> <topic> <text>");
    db.prepare("INSERT INTO notes (agent, topic, body) VALUES (?, ?, ?)").run(agent, topic, words.join(" "));
    console.log("Noted.");
    break;
  }
  case "notes": {
    const [agent, limit = "20"] = args;
    const rows = agent
      ? db
          .prepare("SELECT at, agent, topic, body FROM notes WHERE agent = ? ORDER BY id DESC LIMIT ?")
          .all(agent, Number(limit))
      : db.prepare("SELECT at, agent, topic, body FROM notes ORDER BY id DESC LIMIT ?").all(Number(limit));
    for (const row of rows) console.log(`${row.at}  [${row.agent}] ${row.topic}: ${row.body}`);
    break;
  }
  case "metric":
    db.prepare("INSERT INTO metrics (name, value) VALUES (?, ?)").run(args[0], Number(args[1]));
    console.log("Recorded.");
    break;
  case "trend": {
    const [name, days = "30"] = args;
    const rows = db
      .prepare(
        "SELECT date(at) AS day, value FROM metrics WHERE name = ? AND at > datetime('now', ?) ORDER BY at",
      )
      .all(name, `-${Number(days)} days`);
    for (const row of rows) console.log(`${row.day}  ${row.value}`);
    break;
  }
  case "sql": {
    const statement = db.prepare(args.join(" "));
    const rows = /^\s*(select|with|pragma)/i.test(args.join(" ")) ? statement.all() : [statement.run()];
    console.log(JSON.stringify(rows, null, 2));
    break;
  }
  default:
    console.log(
      'Commands: snapshot-gsc [days] | note <agent> <topic> <text> | notes [agent] [limit] | metric <name> <value> | trend <name> [days] | sql "<query>"',
    );
}
