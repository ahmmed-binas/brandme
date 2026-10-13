import ConsoleLogin from "@/components/console/ConsoleLogin";
import FeatureToggle from "@/components/console/FeatureToggle";
import Shell from "@/components/console/Shell";
import { getTemplate } from "@/lib/templates/catalog";
import { feedbackOverview, tagLabel } from "@/lib/templates/feedback";
import { getCurrentUser } from "@/utils/user-account";

export const dynamic = "force-dynamic";

const when = (date: Date) =>
  date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });

const templateName = (id: string) => getTemplate(id)?.name ?? id;
const stars = (count: number | null) => (count ? "★".repeat(count) + "☆".repeat(5 - count) : "–");
const minutes = (seconds: number | null) =>
  seconds === null ? "–" : seconds < 120 ? `${seconds}s` : `${Math.round(seconds / 60)} min`;

const panel = "rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)]";

/** Answers to the editor's rating pop-up: per template, the tags people pick, and every answer. */
export default async function ConsoleFeedback() {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.isSuperadmin) return <ConsoleLogin />;
  const { recent, byTemplate, tagCounts } = await feedbackOverview();
  const real = recent.filter((row) => !row.internal);
  const answered = real.filter((row) => !row.skipped).length;

  return (
    <Shell active="Feedback" email={user.email}>
      <header>
        <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--c-muted)]">Feedback</p>
        <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight">Template ratings from the editor</h1>
        <p className="mt-1 text-[13px] text-[var(--c-text2)]">
          Signed-in people are asked once per template after 90 seconds of editing. Numbers count real people
          only; your own answers are listed below, marked “you/team”. A note can go on the home page only when
          the person ticked the box agreeing to it.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Answers", String(answered)],
          ["Skipped", String(real.length - answered)],
          ["Answer rate", real.length ? `${Math.round((answered / real.length) * 100)}%` : "–"],
        ].map(([label, value]) => (
          <div key={label} className={`${panel} px-4 py-3`}>
            <p className="text-[12px] text-[var(--c-muted)]">{label}</p>
            <p className="mt-1 text-[1.4rem] font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <h2 className="text-[14px] font-semibold">By template</h2>
          <div className={`mt-3 overflow-x-auto ${panel}`}>
            <table className="w-full text-left text-[12.5px]">
              <thead className="text-[var(--c-muted)]">
                <tr>
                  {["Template", "Average", "Rated", "Skipped"].map((head) => (
                    <th key={head} className="px-4 py-3 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byTemplate.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--c-muted)]">
                      No answers from real people yet.
                    </td>
                  </tr>
                ) : (
                  byTemplate.map((row) => (
                    <tr key={row.templateId} className="border-t border-[var(--c-line)]">
                      <td className="px-4 py-2.5">{templateName(row.templateId)}</td>
                      <td className="px-4 py-2.5 text-amber-400">
                        {row.average === null ? "–" : `${row.average} ★`}
                      </td>
                      <td className="px-4 py-2.5">{row.answered}</td>
                      <td className="px-4 py-2.5 text-[var(--c-text2)]">{row.skipped}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="text-[14px] font-semibold">What people picked</h2>
          <ul className={`mt-3 space-y-2 p-4 ${panel}`}>
            {tagCounts.length === 0 ? (
              <li className="text-[12.5px] text-[var(--c-muted)]">Nothing yet.</li>
            ) : (
              tagCounts.map((row) => (
                <li key={row.tag} className="flex justify-between text-[13px]">
                  <span>{tagLabel(row.tag)}</span>
                  <span className="text-[var(--c-text2)]">{row.count}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <h2 className="mt-8 text-[14px] font-semibold">Every answer</h2>
      <div className={`mt-3 overflow-x-auto ${panel}`}>
        <table className="w-full min-w-[820px] text-left text-[12.5px]">
          <thead className="text-[var(--c-muted)]">
            <tr>
              {["When (Dubai)", "Who", "Template", "Rating", "Picked", "Note", "Editing", "Home page"].map(
                (head) => (
                  <th key={head} className="px-4 py-3 font-medium">
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--c-muted)]">
                  No answers yet. Open the editor with ?rate=now to see the pop-up yourself.
                </td>
              </tr>
            ) : (
              recent.map((row) => (
                <tr
                  key={`${row.userId}-${row.templateId}`}
                  className="border-t border-[var(--c-line)] align-top"
                >
                  <td className="whitespace-nowrap px-4 py-2.5">{when(row.at)}</td>
                  <td className="px-4 py-2.5">
                    {row.name ?? row.email ?? "–"}
                    {row.internal && (
                      <span className="ml-1 text-[11px] text-[var(--c-muted)]">(you/team)</span>
                    )}
                    {row.email && row.name && (
                      <span className="block text-[11.5px] text-[var(--c-muted)]">{row.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{templateName(row.templateId)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-amber-400">
                    {row.skipped ? <span className="text-[var(--c-muted)]">Skipped</span> : stars(row.stars)}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--c-text2)]">
                    {row.tags.map(tagLabel).join(", ") || "–"}
                  </td>
                  <td className="max-w-[20rem] px-4 py-2.5">{row.comment ?? ""}</td>
                  <td className="px-4 py-2.5 text-[var(--c-text2)]">{minutes(row.secondsEditing)}</td>
                  <td className="px-4 py-2.5">
                    {row.shareOk && row.comment ? (
                      <FeatureToggle userId={row.userId} templateId={row.templateId} initial={row.featured} />
                    ) : (
                      <span className="text-[11.5px] text-[var(--c-muted)]">
                        {row.comment ? "Not agreed" : "–"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
