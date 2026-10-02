import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";

/** The shared frame for sign-in, sign-up and password pages. */
export function AuthCard({ eyebrow, title, intro, children, footer }: { eyebrow: string; title: string; intro?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return <main className="min-h-screen px-5 py-12 sm:px-6 sm:py-20"><div className="mx-auto max-w-md">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-signal"><ArrowLeft size={16} /> Back</Link>
    <div className="mt-10 rounded-2xl border border-rule bg-card p-7 sm:p-10">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-signal"><LockKeyhole size={14} /> {eyebrow}</p>
      <h1 className="mt-3 font-display text-[2.2rem] font-[400] leading-[1.05] tracking-[-0.02em] text-ink [font-variation-settings:'opsz'_48]">{title}</h1>
      {intro && <div className="mt-4 leading-7 text-ink-soft">{intro}</div>}
      <div className="mt-7">{children}</div>
    </div>
    {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
  </div></main>;
}

export const Divider = ({ label = "or" }: { label?: string }) => <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-ink-faint"><span className="h-px flex-1 bg-rule" />{label}<span className="h-px flex-1 bg-rule" /></div>;

/** Only same-site paths are accepted, so these pages can't redirect people elsewhere. */
export const safeCallback = (value: string | string[] | undefined, fallback = "/account") => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
