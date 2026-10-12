import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JournalSubmit } from "@/components/blog/JournalSubmit";
import { brand } from "@/lib/brand";
import { JOURNAL_CATEGORIES, mySubmissions } from "@/lib/content/journal";
import { getCurrentUser } from "@/utils/user-account";

export const metadata: Metadata = {
  title: `Write for the ${brand.name} Journal`,
  description: `Share what you know with ${brand.name}'s readers. Free for every member; your name and your website are credited on the post.`,
  alternates: { canonical: "/blog/write" },
};

// Depends on who is signed in; never pre-render at build time.
export const dynamic = "force-dynamic";

/** Members write a post for the Journal; an admin reviews it before it goes live. */
export default async function WriteForTheJournal() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent("/blog/write")}`);
  return (
    <div className="mx-auto max-w-[920px] px-5 pb-24 pt-12 sm:px-8 lg:pt-16">
      <Link
        href="/blog"
        className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
      >
        ← The Journal
      </Link>
      <h1 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02] tracking-[-0.02em]">
        Write for the Journal
      </h1>
      <p className="mt-4 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink-soft">
        Share something you know: a lesson from your work, how you won a client, what you wish you’d known
        when you started. It’s free. We read every post before it goes live, and published posts credit you by
        name with a link to your {brand.name} website.
      </p>
      <ul className="mt-5 grid gap-2 text-[0.92rem] text-ink-soft sm:grid-cols-3">
        <li className="rounded-xl bg-ink/5 px-4 py-3">Your own words, 300+ characters</li>
        <li className="rounded-xl bg-ink/5 px-4 py-3">Useful for other professionals</li>
        <li className="rounded-xl bg-ink/5 px-4 py-3">No adverts or copied text</li>
      </ul>
      <div className="mt-10">
        <JournalSubmit categories={[...JOURNAL_CATEGORIES]} initial={await mySubmissions(user.id)} />
      </div>
    </div>
  );
}
