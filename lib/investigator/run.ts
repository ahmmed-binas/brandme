import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { ensureSchema } from "@/utils/db-schema";
import { getUserById, type CurrentUser } from "@/utils/user-account";
import { openAi, settleAi, sumUsage } from "@/lib/ai/metering";
import { applySuggestion, type SuggestionPayload } from "@/lib/autoupdate/apply";
import { findingToSuggestion } from "@/lib/autoupdate/research";
import { githubSuggestions } from "@/lib/autoupdate/github-sync";
import { fingerprint, knownTitles, type NewSuggestion } from "@/lib/autoupdate/suggestions";
import { standardContentSchema, safeLink, type StandardContent } from "@/lib/portfolio/schema";
import { emails } from "@/lib/email/templates";
import { sendMail } from "@/lib/email/mailer";
import { siteUrl } from "@/lib/site";
import { investigate } from "./agent";
import { feedUrl, githubUser, kindInfo, linkUrl, type InvestigatorLink } from "./links";
import { parseFeed, safeFetchText } from "./feeds";
import { accessFor, getSettings, nextRun } from "./settings";

/**
 * One Investigator check, start to finish:
 * 1. Read each profile the owner gave us: GitHub by its API, blogs and
 *    channels by their feeds, everything else through Claude (which also
 *    searches the web around them).
 * 2. Turn what's new into suggestions (duplicates are skipped for good).
 * 3. "Ask me first": they wait in the editor. "Update automatically": the
 *    confident ones are applied to the portfolio and, if it's live, published,
 *    with a snapshot kept so the owner can undo for 30 days.
 * 4. Email the owner what changed.
 */

export interface SourceResult { label: string; url: string; status: "read" | "partly" | "blocked" | "not_found" | "skipped" | "error"; note: string }
interface Candidate { item: NewSuggestion; confident: boolean }

export class InvestigatorError extends Error {
  constructor(message: string, readonly status = 422) { super(message); }
}

const FEED_ITEMS_PER_SOURCE = 3;
const MANUAL_GAP_HOURS = 12;
const UNDO_DAYS = 30;

/** Published pages are cached; refresh them (and any custom domain) after the content changes. */
async function refreshLive(ownerId: string, templateId: string) {
  try {
    const row = (await db.query<{ slug: string | null }>("SELECT slug FROM portfolios WHERE owner_id = $1 AND template_id = $2", [ownerId, templateId])).rows[0];
    if (row?.slug) revalidatePath(`/p/${row.slug}`);
    const domains = await db.query<{ domain: string }>("SELECT domain FROM custom_domains WHERE owner_id = $1 AND template_id = $2", [ownerId, templateId]);
    for (const { domain } of domains.rows) revalidatePath(`/sites/${encodeURIComponent(domain)}`);
  } catch (error) {
    console.error("Couldn’t refresh the published page", error);
  }
}

async function feedCandidates(link: InvestigatorLink, since: Date): Promise<{ candidates: Candidate[]; source: SourceResult }> {
  const label = kindInfo(link.kind).label;
  const url = feedUrl(link)!;
  try {
    const items = parseFeed(await safeFetchText(url)).filter((item) => !item.date || item.date > since).slice(0, FEED_ITEMS_PER_SOURCE);
    const where = link.kind === "youtube" ? "Video" : link.kind === "feed" ? "Post" : `On ${label}`;
    return {
      source: { label, url, status: "read", note: items.length ? `${items.length} new` : "Nothing new" },
      candidates: items.map((item) => ({
        confident: true,
        item: {
          source: "investigator", title: `${where}: ${item.title}`, detail: item.summary || null, sourceUrl: item.link,
          fingerprint: fingerprint("feed", item.link),
          payload: { kind: "add_highlight", highlight: { title: item.title, detail: [label, item.summary].filter(Boolean).join(" — ").slice(0, 400), year: item.date ? String(item.date.getUTCFullYear()) : "", url: safeLink(item.link) } },
        },
      })),
    };
  } catch (error) {
    return { candidates: [], source: { label, url, status: "error", note: (error as Error).message.slice(0, 200) } };
  }
}

/** The portfolio the Investigator keeps current: the chosen one, else the most recently edited. */
async function targetPortfolio(ownerId: string, preferred: string | null) {
  const result = await db.query<{ template_id: string; content: unknown; version: number; slug: string | null; published_at: Date | null; published_content: unknown }>(
    `SELECT template_id, content, version, slug, published_at, published_content FROM portfolios WHERE owner_id = $1 ORDER BY (template_id = $2) DESC, updated_at DESC LIMIT 1`,
    [ownerId, preferred],
  );
  return result.rows[0] ?? null;
}

/** Stores new suggestions for this run; returns only the ones that weren't seen before. */
async function store(ownerId: string, runId: string, candidates: Candidate[]): Promise<Array<Candidate & { id: string }>> {
  const stored: Array<Candidate & { id: string }> = [];
  for (const candidate of candidates) {
    const { item } = candidate;
    const row = (await db.query<{ id: string }>(
      `INSERT INTO profile_suggestions (owner_id, source, kind, title, detail, payload, source_url, fingerprint, run_id) VALUES ($1, 'investigator', $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (owner_id, fingerprint) DO NOTHING RETURNING id`,
      [ownerId, item.payload.kind, item.title.slice(0, 300), item.detail?.slice(0, 600) ?? null, JSON.stringify(item.payload), item.sourceUrl ?? null, item.fingerprint, runId],
    )).rows[0];
    if (row) stored.push({ ...candidate, id: row.id });
  }
  return stored;
}

export interface RunSummary { id: string; found: number; applied: number; sources: SourceResult[]; changes: { title: string; applied: boolean }[]; error: string | null }

export async function runInvestigator(userId: string, trigger: "schedule" | "manual"): Promise<RunSummary> {
  await ensureSchema();
  const user = await getUserById(userId);
  if (!user) throw new InvestigatorError("Account not found.", 404);
  const settings = await getSettings(userId);
  const access = await accessFor(user);
  if (!access.scheduled && !(trigger === "manual" && access.trialRunAvailable)) throw new InvestigatorError(access.reason ?? "The Investigator isn’t included in your plan.", 402);
  if (trigger === "schedule" && !settings.enabled) throw new InvestigatorError("The Investigator is switched off.");
  if (!settings.links.length) throw new InvestigatorError("Add at least one of your profiles first.");
  if (trigger === "manual" && access.scheduled) {
    const recent = await db.query("SELECT 1 FROM investigator_runs WHERE owner_id = $1 AND trigger = 'manual' AND started_at > NOW() - make_interval(hours => $2)", [userId, MANUAL_GAP_HOURS]);
    if (recent.rowCount) throw new InvestigatorError(`You can run a check by hand every ${MANUAL_GAP_HOURS} hours. Your scheduled checks carry on as usual.`, 429);
  }
  const portfolio = await targetPortfolio(userId, settings.templateId);
  const parsed = portfolio ? standardContentSchema.safeParse(portfolio.content) : null;
  if (!portfolio || !parsed?.success || !parsed.data.name?.trim()) throw new InvestigatorError("Make your portfolio (with your name) before the Investigator can keep it up to date.");
  const content: StandardContent = parsed.data;

  const run = (await db.query<{ id: string }>("INSERT INTO investigator_runs (owner_id, trigger, template_id) VALUES ($1, $2, $3) RETURNING id", [userId, trigger, portfolio.template_id])).rows[0]!;
  const sources: SourceResult[] = [];
  const candidates: Candidate[] = [];
  const since = settings.lastRunAt ? new Date(settings.lastRunAt) : new Date(Date.now() - 180 * 86_400_000);
  try {
    // 1. Free sources: GitHub's API and public feeds.
    for (const link of settings.links) {
      const user = githubUser(link);
      if (user) {
        try {
          const items = await githubSuggestions(userId, user, "investigator");
          candidates.push(...items.map((item) => ({ item, confident: true })));
          sources.push({ label: "GitHub", url: linkUrl(link)!, status: "read", note: items.length ? `${items.length} new` : "Nothing new" });
        } catch (error) {
          sources.push({ label: "GitHub", url: linkUrl(link)!, status: "error", note: (error as Error).message.slice(0, 200) });
        }
      } else if (feedUrl(link)) {
        const result = await feedCandidates(link, since);
        candidates.push(...result.candidates);
        sources.push(result.source);
      }
    }
    // 2. Everything else (and a web search around them) through Claude, paid from credits or their own key.
    const pageLinks = settings.links.filter((link) => !githubUser(link) && !feedUrl(link));
    const gate = await openAi(user);
    if (!gate.ok) {
      for (const link of pageLinks) sources.push({ label: kindInfo(link.kind).label, url: linkUrl(link)!, status: "skipped", note: gate.error });
    } else {
      const outcome = await investigate(gate.access.client, content, pageLinks);
      await settleAi(gate.access, outcome.usage.length ? sumUsage(outcome.usage) : null, "Investigator check");
      // If the AI step fails, keep what the free sources found and say so per source.
      if (!outcome.ok) for (const link of pageLinks) sources.push({ label: kindInfo(link.kind).label, url: linkUrl(link)!, status: "error", note: outcome.error });
      const reported = new Map((outcome.ok ? outcome.sources : []).map((source) => [source.url.replace(/\/+$/, ""), source]));
      for (const link of outcome.ok ? pageLinks : []) {
        const url = linkUrl(link)!;
        const report = reported.get(url.replace(/\/+$/, ""));
        sources.push({ label: kindInfo(link.kind).label, url, status: report?.status ?? "read", note: report?.note ?? "" });
      }
      const known = await knownTitles(userId);
      for (const finding of outcome.ok ? outcome.findings : []) {
        if (finding.confidence === "low" || !safeLink(finding.source_url) || known.has(finding.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())) continue;
        candidates.push({ item: findingToSuggestion(finding, "investigator"), confident: finding.confidence === "high" });
      }
    }

    // 3. Save what's new; apply the confident ones if the owner chose automatic updates.
    const fresh = await store(userId, run.id, candidates);
    const toApply = settings.mode === "auto" ? fresh.filter((candidate) => candidate.confident) : [];
    let applied = 0;
    if (toApply.length) {
      let next = content;
      for (const candidate of toApply) next = applySuggestion(next, candidate.item.payload as SuggestionPayload);
      const live = Boolean(portfolio.published_at) && user.standing.standing !== "paused";
      await db.query("UPDATE investigator_runs SET content_before = $2, published_before = $3 WHERE id = $1", [run.id, JSON.stringify(portfolio.content), live ? JSON.stringify(portfolio.published_content) : null]);
      await db.query(
        `UPDATE portfolios SET content = $3, version = version + 1, updated_at = NOW()${live ? ", published_content = $3, published_at = NOW()" : ""} WHERE owner_id = $1 AND template_id = $2`,
        [userId, portfolio.template_id, JSON.stringify(next)],
      );
      await db.query("UPDATE profile_suggestions SET status = 'applied', decided_at = NOW() WHERE id = ANY($1::uuid[])", [toApply.map((candidate) => candidate.id)]);
      applied = toApply.length;
      if (live) await refreshLive(userId, portfolio.template_id);
    }
    const changes = fresh.map((candidate) => ({ title: candidate.item.title, applied: toApply.includes(candidate) }));
    await db.query("UPDATE investigator_runs SET status = 'done', sources = $2, found = $3, applied = $4, finished_at = NOW() WHERE id = $1", [run.id, JSON.stringify(sources), fresh.length, applied]);
    await db.query(
      `INSERT INTO investigator_settings (owner_id, last_run_at, next_run_at) VALUES ($1, NOW(), NULL)
       ON CONFLICT (owner_id) DO UPDATE SET last_run_at = NOW(), failures = 0, next_run_at = CASE WHEN investigator_settings.enabled THEN $2::timestamptz ELSE investigator_settings.next_run_at END`,
      [userId, nextRun(settings.frequency)],
    );

    // 4. Tell them, when there's something to tell.
    if (fresh.length && user.email) {
      const unreadable = sources.filter((source) => source.status === "blocked" || source.status === "partly").map((source) => source.label);
      const liveUrl = portfolio.published_at && portfolio.slug ? `${siteUrl}/p/${portfolio.slug}` : null;
      await sendMail({ to: user.email, ...emails.investigatorReport(user.name, changes, unreadable, liveUrl) }).catch((error) => console.error("Investigator email failed", error));
    }
    return { id: run.id, found: fresh.length, applied, sources, changes, error: null };
  } catch (error) {
    const message = error instanceof InvestigatorError ? error.message : "Something went wrong during the check. It will try again later.";
    if (!(error instanceof InvestigatorError)) console.error("Investigator run failed", userId, error);
    await db.query("UPDATE investigator_runs SET status = 'failed', sources = $2, error = $3, finished_at = NOW() WHERE id = $1", [run.id, JSON.stringify(sources), message]);
    // Back off: retry tomorrow; after five failures in a row, switch off and say so.
    const failures = (await db.query<{ failures: number }>(
      `UPDATE investigator_settings SET failures = failures + 1, next_run_at = CASE WHEN enabled THEN NOW() + INTERVAL '1 day' ELSE next_run_at END WHERE owner_id = $1 RETURNING failures`,
      [userId],
    )).rows[0]?.failures ?? 0;
    if (failures >= 5) {
      await db.query("UPDATE investigator_settings SET enabled = FALSE WHERE owner_id = $1", [userId]);
      if (user.email) await sendMail({ to: user.email, subject: "The Investigator is paused", text: `Hi ${user.name ?? "there"},\n\nThe Investigator couldn’t complete its last five checks (${message}), so it’s paused. You can check your profile links and switch it back on here: ${siteUrl}/account/investigator` }).catch(() => undefined);
    }
    return { id: run.id, found: 0, applied: 0, sources, changes: [], error: message };
  }
}

/** Puts the portfolio back as it was before an automatic update (within 30 days). */
export async function undoRun(user: CurrentUser, runId: string): Promise<void> {
  await ensureSchema();
  if (!/^[0-9a-f-]{36}$/i.test(runId)) throw new InvestigatorError("That check doesn’t exist.", 404);
  const run = (await db.query<{ template_id: string; content_before: unknown; published_before: unknown; applied: number; undone_at: Date | null; started_at: Date }>(
    "SELECT template_id, content_before, published_before, applied, undone_at, started_at FROM investigator_runs WHERE id = $1 AND owner_id = $2", [runId, user.id],
  )).rows[0];
  if (!run || !run.applied || !run.content_before) throw new InvestigatorError("That check didn’t change anything, so there’s nothing to undo.", 404);
  if (run.undone_at) throw new InvestigatorError("That change was already undone.", 409);
  if (run.started_at.getTime() < Date.now() - UNDO_DAYS * 86_400_000) throw new InvestigatorError(`Changes can be undone for ${UNDO_DAYS} days. Edit your portfolio instead.`, 409);
  await db.query(
    `UPDATE portfolios SET content = $3, version = version + 1, updated_at = NOW()${run.published_before ? ", published_content = $4" : ""} WHERE owner_id = $1 AND template_id = $2`,
    run.published_before ? [user.id, run.template_id, JSON.stringify(run.content_before), JSON.stringify(run.published_before)] : [user.id, run.template_id, JSON.stringify(run.content_before)],
  );
  await db.query("UPDATE profile_suggestions SET status = 'pending', decided_at = NULL WHERE run_id = $1 AND status = 'applied'", [runId]);
  await db.query("UPDATE investigator_runs SET undone_at = NOW() WHERE id = $1", [runId]);
  if (run.published_before) await refreshLive(user.id, run.template_id);
}

export interface RunView { id: string; trigger: string; status: string; found: number; applied: number; sources: SourceResult[]; error: string | null; startedAt: string; canUndo: boolean; undoneAt: string | null; changes: { title: string; status: string }[] }

export async function recentRuns(ownerId: string, limit = 10): Promise<RunView[]> {
  await ensureSchema();
  const runs = (await db.query<{ id: string; trigger: string; status: string; found: number; applied: number; sources: SourceResult[]; error: string | null; started_at: Date; undone_at: Date | null; has_snapshot: boolean }>(
    "SELECT id, trigger, status, found, applied, sources, error, started_at, undone_at, content_before IS NOT NULL AS has_snapshot FROM investigator_runs WHERE owner_id = $1 ORDER BY started_at DESC LIMIT $2", [ownerId, limit],
  )).rows;
  const changes = runs.length ? (await db.query<{ run_id: string; title: string; status: string }>("SELECT run_id, title, status FROM profile_suggestions WHERE run_id = ANY($1::uuid[]) ORDER BY created_at", [runs.map((run) => run.id)])).rows : [];
  return runs.map((run) => ({
    id: run.id, trigger: run.trigger, status: run.status, found: run.found, applied: run.applied, sources: run.sources, error: run.error, startedAt: run.started_at.toISOString(),
    undoneAt: run.undone_at?.toISOString() ?? null, canUndo: run.has_snapshot && run.applied > 0 && !run.undone_at && run.started_at.getTime() > Date.now() - UNDO_DAYS * 86_400_000,
    changes: changes.filter((change) => change.run_id === run.id).map((change) => ({ title: change.title, status: change.status })),
  }));
}

/** Hourly: run the checks that are due, a few at a time. */
export async function runDueInvestigations(limit = 10): Promise<{ ran: number; failed: number }> {
  await ensureSchema();
  const due = await db.query<{ owner_id: string }>("SELECT owner_id FROM investigator_settings WHERE enabled AND next_run_at <= NOW() ORDER BY next_run_at LIMIT $1", [limit]);
  let ran = 0, failed = 0;
  for (const row of due.rows) {
    try {
      const result = await runInvestigator(row.owner_id, "schedule");
      if (result.error) failed += 1; else ran += 1;
    } catch (error) {
      // Plan lapsed or settings no longer valid: stop scheduling until they fix it.
      failed += 1;
      await db.query("UPDATE investigator_settings SET next_run_at = NOW() + INTERVAL '7 days' WHERE owner_id = $1", [row.owner_id]);
      if (!(error instanceof InvestigatorError)) console.error("Investigator scheduling failed", row.owner_id, error);
    }
  }
  return { ran, failed };
}
