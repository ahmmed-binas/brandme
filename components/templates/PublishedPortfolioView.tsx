"use client";

import Link from "next/link";
import TemplateRenderer from "./TemplateRenderer";
import type { PortfolioData } from "./template-one/TemplateOne";
import type { PortfolioData as EditorialData } from "./editorial-developer/data";
import type { TemplateId } from "@/lib/templates/types";
import type { ColorTheme, StandardContent } from "@/lib/portfolio/schema";
import { PortfolioWriting, type PublicPost } from "./PortfolioBlog";

/** Renders a published snapshot. Content comes from the server; nothing is read from the visitor's browser. */
/** Shown instead of a portfolio beyond what the owner's plan allows (after Pro ends). Nothing is deleted. */
function Resting({ name }: { name: string | null }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f0e8] px-6 text-center text-[#15140f]">
      <div className="max-w-md">
        <p className="text-[13px] uppercase tracking-[0.2em] text-[#15140f]/60">Taking a short break</p>
        <h1 className="mt-4 font-serif text-[2.4rem] leading-tight">
          {name ? `${name}’s portfolio is resting` : "This portfolio is resting"}
        </h1>
        <p className="mt-4 text-[#15140f]/70">
          It will be back soon. If you’re the owner, sign in to bring it back online; everything you made is
          still there.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-full bg-[#15140f] px-5 py-2.5 text-sm font-medium text-[#f4f0e8]"
        >
          Owner sign in
        </Link>
      </div>
    </main>
  );
}

/**
 * The owner's “Open to work” switch (lib/portfolio/schema.ts). Sits outside the
 * template, bottom left, so it works with every design. Emails the owner when
 * their address is on the page.
 */
function OpenToWork({ job, email }: { job?: string; email?: string }) {
  const label = job ? `Open to work · ${job}` : "Open to work";
  const className =
    "fixed bottom-4 left-4 z-[60] flex max-w-[calc(100%-11rem)] items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-black/10 backdrop-blur";
  const dot = <span aria-hidden className="size-2 shrink-0 rounded-full bg-emerald-500" />;
  const text = <span className="truncate">{label}</span>;
  if (!email) {
    return (
      <p className={className}>
        {dot}
        {text}
      </p>
    );
  }
  return (
    <a href={`mailto:${email}`} className={`${className} transition hover:bg-white`}>
      {dot}
      {text}
    </a>
  );
}

export default function PublishedPortfolioView({
  templateId,
  content,
  theme,
  showsBranding,
  resting = false,
  ownerName = null,
  posts = [],
  home = "",
}: {
  templateId: TemplateId;
  content: Record<string, unknown>;
  theme: ColorTheme | null;
  showsBranding: boolean;
  resting?: boolean;
  ownerName?: string | null;
  posts?: PublicPost[];
  home?: string;
}) {
  if (resting) return <Resting name={ownerName} />;
  const isEditorial = templateId === "editorial-developer";
  const standard = content as StandardContent;
  return (
    <>
      <TemplateRenderer
        templateId={templateId}
        portfolio={isEditorial ? {} : (content as PortfolioData)}
        editorialData={isEditorial ? (content as unknown as EditorialData) : undefined}
        theme={theme ?? undefined}
      />
      <PortfolioWriting
        templateId={templateId}
        content={content as StandardContent}
        home={home}
        posts={posts}
      />
      {!isEditorial && standard.open_to_work === true && (
        <OpenToWork
          job={standard.professional_title?.trim() || undefined}
          email={standard.email?.trim() || undefined}
        />
      )}
      {showsBranding && (
        <Link
          href="/"
          className="fixed bottom-4 right-4 z-[60] rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-black/10 backdrop-blur transition hover:bg-white"
        >
          Made with Kitefolio
        </Link>
      )}
    </>
  );
}
