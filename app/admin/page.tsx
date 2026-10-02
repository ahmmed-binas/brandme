import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { isModeratorEmail } from "@/lib/community/rules";
import { runSetupChecks, type CheckState } from "@/lib/setup-checks";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const TOOLS = [
  ["/templates/review", "Template approvals", "Approve, reject or ask for changes before customers see a template."],
  ["/admin/journal", "Journal", "Write and edit posts for /blog."],
  ["/admin/gallery", "Gallery submissions", "Review templates people share before they go into the gallery."],
  ["/community/moderation", "Community moderation", "Posts and comments held for review."],
  ["/community/support", "Support inbox", "Reply to customers’ support requests."],
] as const;

const ICON: Record<CheckState, React.ReactNode> = {
  ok: <CheckCircle2 size={18} className="text-emerald-600" aria-label="Done" />,
  warn: <CircleAlert size={18} className="text-amber-600" aria-label="Check" />,
  todo: <CircleDashed size={18} className="text-red-600" aria-label="To do" />,
};

/** Admin home: tools, and a live go-live checklist. */
export default async function AdminHome() {
  const viewer = await getCurrentUser().catch(() => null);
  if (!isModeratorEmail(viewer?.email)) notFound();
  const checks = await runSetupChecks();
  const groups = [...new Set(checks.map((check) => check.group))];
  const todo = checks.filter((check) => check.state === "todo").length;

  return <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-12 sm:px-8">
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Admin</p>
    <h1 className="mt-3 font-display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[1] tracking-[-0.02em]">{todo ? `${todo} thing${todo === 1 ? "" : "s"} to set up before launch` : "Ready to launch"}</h1>
    <ul className="mt-10 grid gap-4 sm:grid-cols-2">{TOOLS.map(([href, title, text]) => <li key={href}><Link href={href} className="block rounded-xl border border-rule bg-card p-5 hover:border-ink"><span className="font-display text-[1.3rem]">{title}</span><span className="mt-1 block text-[0.92rem] text-ink-soft">{text}</span></Link></li>)}</ul>
    <h2 className="mt-16 font-display text-[1.9rem]">Go-live checklist</h2>
    <p className="mt-2 text-ink-soft">Read live from this server’s settings. Change a value in <code>.env</code>, restart, and reload this page. The full steps are in docs/LAUNCH.md.</p>
    {groups.map((group) => <section key={group} className="mt-8" aria-labelledby={`g-${group}`}>
      <h3 id={`g-${group}`} className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{group}</h3>
      <ul className="mt-3 divide-y divide-rule rounded-xl border border-rule bg-card">{checks.filter((check) => check.group === group).map((check) => <li key={check.id} className="flex gap-3 p-4">
        <span className="mt-0.5 shrink-0">{ICON[check.state]}</span>
        <div><p className="font-medium text-ink">{check.title}</p><p className="text-[0.92rem] text-ink-soft">{check.detail}</p>{check.fix && check.state !== "ok" && <p className="mt-1 text-[0.9rem] text-ink">{check.fix}</p>}</div>
      </li>)}</ul>
    </section>)}
  </div>;
}
