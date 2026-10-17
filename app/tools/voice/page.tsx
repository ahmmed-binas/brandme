import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, Check } from "lucide-react";
import { VoiceClone } from "@/components/tools/VoiceClone";
import { VoiceDemo, type DemoSample } from "@/components/tools/VoiceDemo";
import { about } from "@/lib/about";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import { BUILTIN_VOICES, VOICE_PLANS, VOICE_STYLES } from "@/lib/tools/voice-config";

/**
 * The free AI voice clone: Kitefolio's main way in from search and social.
 * Top to bottom: a hero with a real before/after demo, the tool itself, uses,
 * how it works, why it's safe, tips, FAQ and a route to a free website.
 * Search engines get the same story as structured data (WebApplication, FAQ,
 * breadcrumbs). The tool and its limits: components/tools/VoiceClone.tsx and
 * lib/tools/voice-config.ts.
 */

const { free, pro } = VOICE_PLANS;
const TITLE = "Free AI Voice Clone: Text to Speech in Your Own Voice";
const DESCRIPTION =
  "Clone your voice free in 30 seconds. Record or upload a video of yourself, type anything, and download a realistic MP3 in your own voice for reels, TikToks, property tours and ads.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "free AI voice clone",
    "clone my voice",
    "text to speech in my own voice",
    "AI voice generator",
    "voice cloning online",
    "realistic AI voiceover",
    "TikTok voiceover",
    "real estate video voiceover",
  ],
  alternates: { canonical: "/tools/voice" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/tools/voice", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/** Real, unedited output from this tool, made from 33 seconds of the founder's voice. */
const DEMO: DemoSample[] = [
  {
    id: "real",
    label: "Real voice",
    note: "Recorded on a phone",
    src: "/tools/voice/ahmed-real.mp3",
  },
  {
    id: "presenter",
    label: "AI clone · Presenter",
    note: "Made with this tool",
    src: "/tools/voice/ahmed-clone-presenter.mp3",
    transcript:
      "Welcome to this two-bedroom apartment in Dubai Marina. Floor-to-ceiling windows, views across the water, and the metro is a five-minute walk. Message me today to book a viewing.",
  },
  {
    id: "advert",
    label: "AI clone · Advert",
    note: "Made with this tool",
    src: "/tools/voice/ahmed-clone-advert.mp3",
    transcript:
      "Stop scrolling! Your dream home in Dubai is one message away. Tap the link and book your viewing today.",
  },
];

const PROMISES = [
  "Free with a Kitefolio account",
  "30 seconds of your voice is enough",
  `${BUILTIN_VOICES.length} ready-made voices, one a real human voice`,
  "Download as MP3",
];

const USES: Array<[string, string]> = [
  [
    "Property tours and listings",
    "Narrate every listing video in your voice without recording each one. Agents in Dubai and Abu Dhabi use it for off-plan launches and walk-throughs.",
  ],
  [
    "TikTok, Reels and Shorts",
    "Post daily without filming yourself every time. Type the hook, pick Advert, and drop the MP3 into CapCut.",
  ],
  [
    "Ads and promotions",
    "Test five versions of an ad script in an afternoon, all in your voice, all at the same loudness.",
  ],
  [
    "YouTube and explainers",
    "Narrator style for tutorials and explainers that sound calm and clear, even when you’re tired.",
  ],
  ["Podcasts and intros", "Intros, outros and sponsor reads that match the rest of your show."],
  [
    "Courses and training",
    "Update a lesson by retyping a sentence instead of re-recording the whole module.",
  ],
];

const STEPS: Array<[string, string]> = [
  ["Pick a voice", `Use one of ${BUILTIN_VOICES.length} ready-made voices straight away, or clone your own.`],
  [
    "Give it your voice",
    "Record about 30 seconds, or upload a video or voice note of you talking. The meter tells you when it’s enough.",
  ],
  ["Train", "Our voice engine learns how you sound. It usually takes under a minute."],
  [
    "Type and download",
    "Type anything, pick a style, and download a polished MP3, levelled for social media and podcasts.",
  ],
];

const SAFE: Array<[string, string]> = [
  [
    "Your own voice, by your word",
    "You confirm a cloned voice is your own. Copying someone else’s voice without their permission breaks our terms, and we remove it.",
  ],
  [
    "Watermarked",
    "Every clip carries an inaudible watermark that marks it as AI-made, so it can be identified later.",
  ],
  [
    "Private by design",
    "Your video never leaves your device; only the sound does. Uploads are deleted as soon as your voice is made.",
  ],
  [
    "No AI company in the middle",
    "It runs on an open-source model on our own computer. Your voice isn’t sent to OpenAI, Google or anyone else.",
  ],
];

const TIPS = [
  "Record in a quiet room; curtains and soft furnishings help.",
  "Speak naturally, as you would to a client. Don’t read like a robot.",
  "Hold the phone a hand’s width from your mouth.",
  "Uploading? Choose a clip of only you talking, without music or other voices.",
  "Write the way you speak: short sentences, and spell numbers as words (“twenty-five”).",
  "Not quite you? Make it again with a clearer or longer recording.",
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Is the AI voice clone really free?",
    answer: `Yes. Making your voice is free with a free ${brand.name} account, and you get ${free.clipsPerDay} clips a day of up to ${free.maxChars} characters (about 40 seconds). Pro gets ${pro.clipsPerDay} clips a day of up to ${pro.maxChars} characters (about a minute), and its clips go first in the queue.`,
  },
  {
    question: "How realistic does my cloned voice sound?",
    answer:
      "Listen to the samples at the top of this page: the founder’s real voice, then clones made with this exact tool from 33 seconds of audio. Results depend most on how clean your recording is: a quiet room matters more than a fancy microphone.",
  },
  {
    question: "How much of my voice do you need?",
    answer:
      "At least 10 seconds of clear speech; about 30 seconds gives the closest result. You can record live on the page or upload a video or audio file of yourself talking. The first two minutes are used.",
  },
  {
    question: "Which files can I upload?",
    answer:
      "Any video or audio your browser can play: MP4, MOV, WebM, MP3, M4A, WAV and WhatsApp voice notes. Only the sound is taken from a video.",
  },
  {
    question: "Can I clone someone else’s voice?",
    answer:
      "No. Before cloning, you confirm it’s your own voice, and copying anyone else’s voice without their permission breaks our terms; we remove those voices and close the account. Every clip also carries an inaudible watermark that marks it as AI-made.",
  },
  {
    question: "Can I use it without cloning my voice?",
    answer: `Yes. Pick one of ${BUILTIN_VOICES.length} ready-made voices, including Ahmed, a real human voice from Dubai, plus storytellers, narrators and presenters with British and American accents. They’re free to use in your videos, ads and reels.`,
  },
  {
    question: "Can I use the clips in ads and paid work?",
    answer:
      "Yes. Clips of your own voice are yours to use, including ads, client work and monetised videos. Don’t use them to mislead people into thinking a recording is live or comes from someone else.",
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
    question: "What happens to my recordings?",
    answer: `Only the sound leaves your device, never the video. Once your voice is made, we delete your upload and keep a 12-second sample to speak from. Clips are deleted after ${free.keepDays} days (${pro.keepDays} on Pro), and you can delete your voice at any time.`,
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
      name: "Kitefolio AI Voice Clone",
      url: `${siteUrl}/tools/voice`,
      description: DESCRIPTION,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (in the browser)",
      isAccessibleForFree: true,
      featureList: [
        "Voice cloning from 30 seconds of audio",
        "Record live or upload a video",
        "Five speaking styles",
        "MP3 download levelled to -16 LUFS",
        "Speaker check and AI watermark",
      ],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@type": "Organization", name: brand.name, url: siteUrl },
      audio: DEMO.map((sample) => ({
        "@type": "AudioObject",
        name: sample.label,
        contentUrl: `${siteUrl}${sample.src}`,
        encodingFormat: "audio/mpeg",
        ...(sample.transcript ? { transcript: sample.transcript } : {}),
      })),
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
    <div className="pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />

      {/* Hero: the promise on the left, the real before/after demo on the right. */}
      <section className="mx-auto grid max-w-[1240px] gap-12 px-5 pt-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-14">
        <div>
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
          <p className="mt-6 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[0.8rem] font-medium text-emerald-900">
            Free AI voice clone
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,5.4vw,4.6rem)] leading-[1] tracking-[-0.02em]">
            Clone your voice. Type anything. Hear yourself say it.
          </h1>
          <p className="mt-5 max-w-[36rem] text-[1.1rem] leading-relaxed text-ink-soft">
            Give it 30 seconds of your voice, live or from a video, and get a realistic AI copy that reads
            your property tours, reels, ads and voiceovers for you. Or pick a ready-made voice and start
            straight away. Free and private.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-center gap-2 text-[0.95rem] text-ink">
                <Check size={16} className="shrink-0 text-emerald-600" />
                {promise}
              </li>
            ))}
          </ul>
          <a
            href="#make"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition hover:bg-signal hover:text-signal-ink"
          >
            Clone my voice free
            <ArrowDown size={16} />
          </a>
        </div>
        <VoiceDemo name={about.founder.name} portrait={about.founder.portrait} samples={DEMO} />
      </section>

      <section id="make" className="mx-auto mt-20 max-w-[1240px] scroll-mt-24 px-5 sm:px-8">
        <h2 className="font-display text-3xl sm:text-4xl">Make your AI voice</h2>
        <p className="mt-2 max-w-prose text-ink-soft">
          Two steps on one page. Your voice is ready in about a minute, and stays private to your account.
        </p>
        <div className="mt-8">
          <VoiceClone />
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:px-8">
        <h2 className="font-display text-3xl sm:text-4xl">What people use their AI voice for</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USES.map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-rule p-6">
              <h3 className="font-medium text-ink">{title}</h3>
              <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-soft">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 grid max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl">How voice cloning works here</h2>
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
          <h2 className="font-display text-2xl">Tips for the most realistic copy</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[0.94rem] text-ink-soft">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:px-8">
        <h2 className="font-display text-3xl sm:text-4xl">Safe by design</h2>
        <p className="mt-2 max-w-prose text-ink-soft">
          Voice cloning is powerful, so we built it to work only for the person speaking.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAFE.map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-rule p-6">
              <h3 className="font-medium text-ink">{title}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[52rem] px-5 sm:px-8">
        <h2 className="font-display text-3xl sm:text-4xl">Questions about the AI voice clone</h2>
        <div className="mt-6 divide-y divide-rule border-y border-rule">
          {FAQ.map((entry) => (
            <details key={entry.question} className="group py-4">
              <summary className="cursor-pointer list-none font-medium text-ink">{entry.question}</summary>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{entry.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:px-8">
        <div className="rounded-3xl bg-ink px-6 py-10 text-paper sm:px-10">
          <h2 className="font-display text-3xl">Let your voice market you</h2>
          <p className="mt-3 max-w-prose text-paper/75">
            Your clips get people interested; your own website closes the deal. {brand.name} makes portfolio
            websites for every kind of professional, and real estate agents in the UAE most of all. Pick a
            free template, click to edit, and publish in minutes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/templatechooser"
              className="inline-flex rounded-full bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:bg-signal hover:text-signal-ink"
            >
              See the free templates
            </Link>
            <Link
              href="/tools"
              className="inline-flex rounded-full border border-paper/30 px-5 py-3 text-sm font-medium text-paper transition hover:border-paper"
            >
              More free tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
