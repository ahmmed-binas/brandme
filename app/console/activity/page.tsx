import Link from "next/link";
import { Laptop, Smartphone, Tablet } from "lucide-react";
import AutoRefresh from "@/components/console/AutoRefresh";
import ConsoleLogin from "@/components/console/ConsoleLogin";
import Shell from "@/components/console/Shell";
import {
  ACTIVITY_RANGES,
  LIVE_MINUTES,
  isActivityRange,
  loadActivitySummary,
  loadJourneys,
  placeFromTimeZone,
  type ActivityRange,
  type Journey,
} from "@/lib/console/activity";
import { consoleHref } from "@/lib/console/path";
import { getCurrentUser } from "@/utils/user-account";

export const dynamic = "force-dynamic";

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Laptop } as const;

/** "2 min ago", "3 h ago", or the date. */
function ago(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Seconds between two times as "4:05" (minutes:seconds) or "1 h 12 min". */
function span(fromIso: string, toIso: string): string {
  const seconds = Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 1000));
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Joins the same page opened several times in a row (reloads) into one step with a count. */
function mergeRepeats(steps: Journey["steps"]) {
  const merged: Array<Journey["steps"][number] & { count: number }> = [];
  for (const step of steps) {
    const last = merged.at(-1);
    if (last && last.path === step.path) last.count += 1;
    else merged.push({ ...step, count: 1 });
  }
  return merged;
}

const isLive = (journey: Journey) => Date.now() - new Date(journey.lastAt).getTime() < LIVE_MINUTES * 60_000;

function Tile({ label, value, live = false }: { label: string; value: number; live?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-4">
      <p className="flex items-center gap-2 text-[12px] text-[var(--c-muted)]">
        {live && <span className="size-2 animate-pulse rounded-full bg-emerald-400" />}
        {label}
      </p>
      <p className="mt-2 text-[1.8rem] font-semibold tabular-nums">{value.toLocaleString("en-GB")}</p>
    </div>
  );
}

function JourneyCard({ journey }: { journey: Journey }) {
  const DeviceIcon = DEVICE_ICON[journey.device as keyof typeof DEVICE_ICON] ?? Laptop;
  const place = placeFromTimeZone(journey.timeZone);
  return (
    <li className="rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {journey.user ? (
            <p className="font-medium">
              {journey.user.name || journey.user.email}
              {journey.user.name && journey.user.email && (
                <span className="font-normal text-[var(--c-muted)]"> · {journey.user.email}</span>
              )}
            </p>
          ) : (
            <p className="font-medium text-[var(--c-text2)]">
              Visitor{" "}
              <span className="font-mono text-[12px] text-[var(--c-muted)]">
                #{journey.visitor.slice(0, 6)}
              </span>
            </p>
          )}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--c-muted)]">
            <span className="inline-flex items-center gap-1">
              <DeviceIcon size={13} /> {journey.device}
            </span>
            {place && <span>📍 {place}</span>}
            <span>{journey.referrer ? `from ${journey.referrer}` : "came directly"}</span>
            <span>
              {journey.views} page{journey.views === 1 ? "" : "s"} · {span(journey.firstAt, journey.lastAt)}
            </span>
          </p>
        </div>
        <p className="flex items-center gap-2 text-[12px] text-[var(--c-muted)]">
          {isLive(journey) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
            </span>
          )}
          {ago(journey.lastAt)}
        </p>
      </div>

      <ol className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
        {mergeRepeats(journey.steps).map((step, index) => (
          <li key={`${step.at}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-[var(--c-muted)]">→</span>}
            <a
              href={step.path}
              target="_blank"
              rel="noreferrer"
              title={new Date(step.at).toLocaleTimeString("en-GB")}
              className="rounded-md bg-white/5 px-2 py-1 font-mono text-[var(--c-text2)] hover:bg-white/10 hover:text-[var(--c-text)]"
            >
              {step.path}
              {step.count > 1 && <span className="ml-1 text-[var(--c-muted)]">×{step.count}</span>}
            </a>
          </li>
        ))}
      </ol>
    </li>
  );
}

/** Every visitor's journey through the site, newest first; refreshes itself. */
export default async function ConsoleActivity({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; who?: string }>;
}) {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.isSuperadmin) return <ConsoleLogin />;

  const params = await searchParams;
  const range: ActivityRange = isActivityRange(params.range) ? params.range : "today";
  const signedInOnly = params.who === "signed-in";
  const [summary, journeys] = await Promise.all([loadActivitySummary(), loadJourneys(range, signedInOnly)]);

  const href = (next: { range?: ActivityRange; who?: string }) => {
    const query = new URLSearchParams({ range: next.range ?? range });
    const who = next.who ?? (signedInOnly ? "signed-in" : "everyone");
    if (who === "signed-in") query.set("who", who);
    return `${consoleHref("/activity")}?${query}`;
  };
  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-[12px] transition-colors ${active ? "bg-white/15 text-[var(--c-text)]" : "text-[var(--c-text2)] hover:bg-white/5"}`;

  return (
    <Shell active="Activity" userId={user.id} email={user.email}>
      <AutoRefresh seconds={20} />
      <div className="mx-auto max-w-[1100px] p-6 lg:p-10">
        <h1 className="text-[1.6rem] font-semibold">Activity</h1>
        <p className="mt-1 text-[13px] text-[var(--c-muted)]">
          Every visit as a journey through the site. Signed-in visitors show who they are; everyone else is an
          anonymous code that changes daily. Updates every 20 seconds.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label={`Live now (last ${LIVE_MINUTES} min)`} value={summary.liveNow} live />
          <Tile label="Visitors, last 24 h" value={summary.visitorsToday} />
          <Tile label="Signed-in visitors, last 24 h" value={summary.signedInToday} />
          <Tile label="Page views, last 24 h" value={summary.viewsToday} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {(Object.keys(ACTIVITY_RANGES) as ActivityRange[]).map((id) => (
              <Link key={id} href={href({ range: id })} className={pill(range === id)}>
                Last {ACTIVITY_RANGES[id]}
              </Link>
            ))}
          </div>
          <div className="flex gap-1">
            <Link href={href({ who: "everyone" })} className={pill(!signedInOnly)}>
              Everyone
            </Link>
            <Link href={href({ who: "signed-in" })} className={pill(signedInOnly)}>
              Signed in only
            </Link>
          </div>
        </div>

        {journeys.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-[var(--c-line)] p-8 text-center text-[var(--c-muted)]">
            No visits in this period yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {journeys.map((journey) => (
              <JourneyCard key={journey.visitor} journey={journey} />
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
