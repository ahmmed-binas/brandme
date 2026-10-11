import type { Metadata } from "next";
import { AgentProfile } from "@/components/agents/AgentProfile";
import { RowanAvatar } from "@/components/agents/AgentAvatars";
import { ratingSummary } from "@/lib/templates/ratings";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Rowan, the Reviewer: every blog post checked before it goes live",
  description: `Rowan reads your ${brand.name} blog posts before you publish: spelling, clarity, the title, claims that need a source, and a summary for search results.`,
  alternates: { canonical: "/agents/reviewer" },
};

// Shows the live star rating.
export const dynamic = "force-dynamic";

export default async function ReviewerPage() {
  const rating = await ratingSummary("agent:reviewer").catch(() => ({ average: null, count: 0 }));
  return (
    <AgentProfile
      slug="reviewer"
      role="The Reviewer"
      greeting="Meet Rowan."
      rating={rating}
      title={
        <>
          A second pair of eyes <em className="font-[300] text-signal">before you hit publish.</em>
        </>
      }
      intro="Everyone who writes needs an editor. Rowan reads your blog post the way a careful client would, then tells you exactly what to fix: typos, muddled sentences, a vague title, a number with no source. You decide what to change."
      avatar={<RowanAvatar size={260} className="drop-shadow-sm" />}
      actions={[
        { href: "/templatechooser", label: "Start writing", primary: true },
        { href: "/agents", label: "Meet the other agents" },
      ]}
      steps={[
        [
          "You write",
          "In the Blog tab of the editor, as you would anywhere else. Your post saves as you type.",
        ],
        ["You ask Rowan", "Press “Review my post”. Rowan reads the title, the summary and every paragraph."],
        [
          "You get a verdict",
          "Ready to publish, almost there, or needs work first, with what’s already working well.",
        ],
        [
          "You see each fix",
          "The exact words that need attention and what to do about them: spelling, clarity, structure, tone, links that look broken.",
        ],
        [
          "You choose",
          "Use Rowan’s better title or search summary with one click, or ignore them. Nothing changes on its own.",
        ],
      ]}
      never={{
        intro: "Rowan reviews; you write. Your words and your facts stay yours.",
        items: [
          "Change your post without you choosing to",
          "Invent facts, numbers, clients or sources",
          "Publish anything for you",
          "Share your draft with anyone else",
        ],
        promise: "Flag every claim a reader would want a source for",
      }}
      faq={[
        [
          "What does a review cost?",
          "Reviews use AI, so they’re paid like every AI feature: a few credits, sold at cost plus 5%, or nothing extra if you connect your own Claude or OpenAI key. New accounts start with welcome credits.",
        ],
        [
          "Which AI does Rowan use?",
          "Claude, by Anthropic, unless you’ve connected your own OpenAI key, in which case it uses that.",
        ],
        [
          "Can Rowan check my links?",
          "Rowan points out links that look broken or incomplete in the text. It doesn’t open them, so check important links yourself before publishing.",
        ],
        ["Does it work in Arabic?", "Yes. Rowan reviews in the language you write in."],
      ]}
    />
  );
}
