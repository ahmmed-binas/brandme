import type { Metadata } from "next";
import Link from "next/link";
import { VoiceClone } from "@/components/tools/VoiceClone";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import { CLIP_DAYS, CLIPS_PER_DAY, VOICE_STYLES } from "@/lib/tools/voice-config";

const TITLE = "Free AI Voice Clone: text to speech in your own voice";
const DESCRIPTION =
  "Clone your voice free. Record 30 seconds or upload a video of yourself talking, then type anything and download it read aloud in your own voice: natural, narrator, presenter, advert or storyteller.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/voice" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/tools/voice" },
};

const STEPS: Array<[string, string]> = [
  ["Read one line", "A short sentence into your microphone confirms the voice is yours."],
  [
    "Give it your voice",
    "Record about 30 seconds, or upload a video or voice note of you talking. The meter tells you when it’s enough.",
  ],
  ["Train", "Our voice engine learns how you sound. It usually takes under a minute."],
  [
    "Type and download",
    "Type anything, pick a style, and download a polished MP3 in your voice, ready for reels, tours and ads.",
  ],
];

const TIPS = [
  "Record in a quiet room; soft furnishings help.",
  "Speak naturally, as you would to a client. Don’t read like a robot.",
  "Hold the phone or microphone a hand’s width from your mouth.",
  "Uploading? Choose a clip of only you talking, without music or other voices.",
  "Not quite you? Make it again with a clearer or longer recording.",
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Is the AI voice clone really free?",
    answer: `Yes. Making your voice is free, and you can make up to ${CLIPS_PER_DAY} clips a day, each up to about 25 seconds. You only need a free ${brand.name} account.`,
  },
  {
    question: "How much of my voice do you need?",
    answer:
      "At least 10 seconds of clear speech; about 30 seconds gives the closest result. You can record live on the page or upload a video or audio file of yourself talking. The first two minutes are used.",
  },
  {
    question: "Can I clone someone else’s voice?",
    answer:
      "No. You read a consent line into your microphone, and we check it matches the voice you give. If they don’t sound like the same person, the voice isn’t made. Every clip also carries an inaudible watermark that marks it as AI-made.",
  },
  {
    question: "What happens to my recordings?",
    answer: `Only the sound leaves your device, never the video. Once your voice is made, we delete your upload and consent recording and keep a 12-second sample to speak from. Clips are deleted after ${CLIP_DAYS} days, and you can delete your voice at any time.`,
  },
  {
    question: "What styles can my voice speak in?",
    answer: `${Object.values(VOICE_STYLES)
      .map((style) => `${style.label} (${style.hint.toLowerCase()})`)
      .join("; ")}. Every clip is levelled to the loudness used by podcasts and social media.`,
  },
  {
    question: "Which languages does it speak?",
    answer:
      "English for now. Your voice can come from any accent, and it keeps your accent when it speaks English.",
  },
  {
    question: "What powers it?",
    answer:
      "Chatterbox, an open-source voice model by Resemble AI (MIT licence), running on our own graphics card. Your voice isn’t sent to any other AI company.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "AI Voice Clone",
      url: `${siteUrl}/tools/voice`,
      description: DESCRIPTION,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (in the browser)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@type": "Organization", name: brand.name, url: siteUrl },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: brand.name, item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${siteUrl}/tools` },
        { "@type": "ListItem", position: 3, name: "AI Voice Clone", item: `${siteUrl}/tools/voice` },
      ],
    },
  ],
};

export default function VoiceToolPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-10 sm:px-8 lg:pt-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <nav
        aria-label="Breadcrumb"
        className="flex gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft"
      >
        <Link href="/tools" className="hover:text-ink">
          Tools
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink">AI Voice Clone</span>
      </nav>

      <header className="mt-5 max-w-[46rem]">
        <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[0.8rem] font-medium text-emerald-900">
          Free · no credit card
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.3rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em]">
          Your voice, reading anything you type.
        </h1>
        <p className="mt-4 text-[1.08rem] leading-relaxed text-ink-soft">
          Give it 30 seconds of your voice, live or from a video, and get a free AI copy that reads your
          property tours, reels, ads and voiceovers for you. It sounds like you, not a robot.
        </p>
      </header>

      <div className="mt-10">
        <VoiceClone />
      </div>

      <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <h2 className="font-display text-3xl">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {STEPS.map(([title, body], index) => (
              <li key={title} className="rounded-2xl border border-rule p-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                  Step {index + 1}
                </span>
                <h3 className="mt-2 font-medium text-ink">{title}</h3>
                <p className="mt-1 text-[0.94rem] text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </div>
        <aside className="rounded-2xl bg-ink/5 p-6">
          <h2 className="font-display text-2xl">Tips for the best copy</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.94rem] text-ink-soft">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="mt-20 max-w-[46rem]">
        <h2 className="font-display text-3xl">Questions</h2>
        <div className="mt-6 divide-y divide-rule border-y border-rule">
          {FAQ.map((entry) => (
            <details key={entry.question} className="group py-4">
              <summary className="cursor-pointer list-none font-medium text-ink">{entry.question}</summary>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{entry.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-3xl bg-ink px-6 py-10 text-paper sm:px-10">
        <h2 className="font-display text-3xl">Put your voice on your own website</h2>
        <p className="mt-3 max-w-prose text-paper/75">
          {brand.name} makes portfolio websites for every kind of professional, and real estate agents in the
          UAE most of all. Pick a free template, click to edit, and publish in minutes.
        </p>
        <Link
          href="/templatechooser"
          className="mt-6 inline-flex rounded-full bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:bg-signal hover:text-signal-ink"
        >
          See the templates
        </Link>
      </section>
    </div>
  );
}
