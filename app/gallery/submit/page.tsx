import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SubmitForm from "@/components/gallery/SubmitForm";
import { canSubmit } from "@/lib/gallery/submissions";
import { databaseConfigured } from "@/utils/db-schema";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = { title: "Share your template", description: "Submit a website template to the gallery. Every submission is reviewed by hand before it goes live.", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const user = databaseConfigured() ? await getCurrentUser().catch(() => null) : null;
  if (!user) redirect("/signup?callbackUrl=/gallery/submit");
  return <div className="mx-auto max-w-[1200px] px-5 pb-28 pt-14 sm:px-8 lg:pt-20">
    <Link href="/gallery" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink">← Gallery</Link>
    <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.6rem)] font-[400] leading-[0.95] tracking-[-0.03em] text-ink">Share your template.</h1>
    <p className="mt-5 max-w-[42rem] text-[1.08rem] leading-[1.7] text-ink-soft">Made something beautiful? Put it in front of people looking for a website. Tell its story, upload the files, and we’ll review it by hand, usually within a few days. Your name and @{user.username ?? "username"} go on it.</p>
    <SubmitForm blocked={canSubmit(user)} />
  </div>;
}
