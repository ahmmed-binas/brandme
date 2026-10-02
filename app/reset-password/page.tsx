import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <AuthCard eyebrow="Password help" title="Choose a new password." footer={<Link href="/forgot-password" className="underline underline-offset-4">Need a new link?</Link>}>
    {token ? <ResetForm token={token} /> : <p className="text-ink-soft">This link is incomplete. Open the link from your email again, or ask for a new one.</p>}
  </AuthCard>;
}
