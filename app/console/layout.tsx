import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Console" }, robots: { index: false, follow: false } };

/** The superadmin console's own look: always dark, no site header or footer (see AppShell). */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <div className="console min-h-dvh bg-[var(--c-bg)] font-sans text-[var(--c-text)] [color-scheme:dark]" style={{
    "--c-bg": "#0d0d0c", "--c-panel": "#141413", "--c-line": "#2a2a27", "--c-grid": "#232321",
    "--c-text": "#f4f3ef", "--c-text2": "#c3c2b7", "--c-muted": "#8f8d84", "--c-accent": "#3987e5",
  } as React.CSSProperties}>{children}</div>;
}
