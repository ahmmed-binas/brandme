import type { Metadata } from "next";
import { AgentProfile } from "@/components/agents/AgentProfile";
import { EllisAvatar } from "@/components/agents/AgentAvatars";
import { ratingSummary } from "@/lib/templates/ratings";
import { PRO_CUSTOM_EDITS } from "@/lib/plans";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Ellis, the Editor: change your website by asking",
  description: `Ellis is the ${brand.name} editor’s AI assistant: tell it what to change in plain words and it rewrites your site’s text, keeping your facts and your voice.`,
  alternates: { canonical: "/agents/editor" },
};

// Shows the live star rating.
export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const rating = await ratingSummary("agent:editor").catch(() => ({ average: null, count: 0 }));
  return (
    <AgentProfile
      slug="editor"
      role="The Editor"
      greeting="Meet Ellis."
      rating={rating}
      title={
        <>
          Say what you want. <em className="font-[300] text-signal">Ellis writes it.</em>
        </>
      }
      intro="Ellis lives in your editor. Ask in plain words, like “make my introduction warmer” or “shorten every listing description”, and Ellis rewrites your website’s text in seconds. It runs on Claude, Anthropic’s most capable model, with a set of rules it always follows, so it knows what you mean and what it must never touch."
      avatar={<EllisAvatar size={260} className="drop-shadow-sm" />}
      actions={[
        { href: "/templatechooser", label: "Try Ellis in the editor", primary: true },
        { href: "/agents", label: "Meet the other agents" },
      ]}
      steps={[
        [
          "Open the AI tab",
          "In the editor, next to your live preview. Your site is on one side, Ellis on the other.",
        ],
        [
          "Ask in your own words",
          "“Rewrite my services for families relocating to Dubai.” “Make the tagline punchier.” “Translate my about section into Arabic.”",
        ],
        [
          "Ellis edits the text",
          "Every heading, paragraph, listing and service, in your voice, keeping every fact, name and number you gave.",
        ],
        [
          "You see it instantly",
          "The preview updates and Ellis tells you what it changed. Don’t like it? Ask again or undo.",
        ],
        [
          "Bring in what you have",
          "Paste a CV, a LinkedIn export or your GitHub, and Ellis turns it into a first draft of your site.",
        ],
      ]}
      never={{
        intro:
          "Ellis only works on your words. Design, links and facts are protected by rules it can’t break.",
        items: [
          "Change your name, links, photos, email or phone number",
          "Invent achievements, clients, prices or qualifications",
          "Move sections or change the layout",
          "Publish your site without you",
        ],
        promise: "Tell you when a request needs facts only you have",
      }}
      faq={[
        [
          "What does it cost?",
          "Ellis uses AI, so requests are paid with credits at cost plus 5%, or nothing extra with your own Claude or OpenAI key. New accounts start with welcome credits to try it.",
        ],
        [
          "Can Ellis change my design?",
          `Not by itself: the template controls the layout, and you change colours and fonts in the Design panel. For a new section or layout, Pro includes up to ${PRO_CUSTOM_EDITS} changes made for you by our team.`,
        ],
        [
          "Which model does it use?",
          "Claude, by Anthropic. If you connect your own OpenAI key, Ellis uses that instead.",
        ],
        [
          "Is my content used to train AI?",
          "Requests go to the AI provider only to answer them. Anthropic and OpenAI don’t train their models on API requests by default.",
        ],
      ]}
    />
  );
}
