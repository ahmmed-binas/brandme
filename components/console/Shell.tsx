import Link from "next/link";
import { BarChart3, CalendarDays, ExternalLink, FileText, Images, Inbox, LayoutTemplate, Mail, MessagesSquare, Settings2, Users } from "lucide-react";
import { consoleHref } from "@/lib/console/path";
import SignOut from "./SignOut";

const NAV = [
  { href: "", label: "Dashboard", icon: BarChart3 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/calls", label: "Calls", icon: CalendarDays },
] as const;

const TOOLS = [
  { href: "/templates/review", label: "Template approvals", icon: LayoutTemplate },
  { href: "/admin/gallery", label: "Gallery submissions", icon: Images },
  { href: "/community/moderation", label: "Moderation", icon: MessagesSquare },
  { href: "/community/support", label: "Support inbox", icon: Inbox },
  { href: "/admin/journal", label: "Journal", icon: FileText },
  { href: "/admin/email", label: "Email settings", icon: Mail },
  { href: "/admin", label: "Go-live checklist", icon: Settings2 },
] as const;

/** The console frame: a sidebar and the page. */
export default function Shell({ active, email, children }: { active: string; email: string | null; children: React.ReactNode }) {
  const item = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors";
  return <div className="flex min-h-dvh flex-col lg:flex-row">
    <aside className="border-b border-[var(--c-line)] bg-[var(--c-panel)] lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6 p-4">
        <Link href={consoleHref()} className="flex items-center gap-2 px-2 pt-1"><span className="grid size-7 place-items-center rounded-md bg-[var(--c-accent)] text-[13px] font-bold text-white">F</span><span className="text-[14px] font-semibold">Console</span></Link>
        <nav aria-label="Console" className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => <Link key={label} href={consoleHref(href)} aria-current={active === label ? "page" : undefined} className={`${item} ${active === label ? "bg-white/10 text-[var(--c-text)]" : "text-[var(--c-text2)] hover:bg-white/5 hover:text-[var(--c-text)]"}`}><Icon size={15} />{label}</Link>)}
        </nav>
        <div className="hidden lg:block">
          <p className="px-3 text-[11px] uppercase tracking-[0.16em] text-[var(--c-muted)]">Tools</p>
          <nav aria-label="Tools" className="mt-2 flex flex-col gap-0.5">{TOOLS.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`${item} text-[var(--c-text2)] hover:bg-white/5 hover:text-[var(--c-text)]`}><Icon size={15} />{label}</Link>)}</nav>
        </div>
        <div className="mt-auto hidden space-y-1 border-t border-[var(--c-line)] pt-4 lg:block">
          <a href="/" target="_blank" rel="noreferrer" className={`${item} text-[var(--c-text2)] hover:bg-white/5 hover:text-[var(--c-text)]`}><ExternalLink size={15} /> View the site</a>
          <p className="truncate px-3 text-[12px] text-[var(--c-muted)]" title={email ?? ""}>{email}</p>
          <SignOut to={consoleHref()} />
        </div>
      </div>
    </aside>
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">{children}</main>
  </div>;
}
