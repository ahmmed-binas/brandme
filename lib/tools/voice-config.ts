/**
 * The voice tool's settings and shapes, shared by the website's server code
 * (lib/tools/voice.ts) and the page in the browser (components/tools/VoiceClone.tsx).
 * Nothing here touches the database.
 */

/** About 2 minutes of the 24 kHz mono WAV the browser makes from the upload. */
export const MAX_SOURCE_BYTES = 6_000_000;
/** About 40 seconds of the consent recording. */
export const MAX_CONSENT_BYTES = 2_000_000;
/**
 * What each plan gets. Free is enough to try it and use it now and then; Pro is
 * for people who make content every day. Speaking runs on one graphics card, so
 * Pro work goes to the front of the queue. Change the numbers here.
 *   clipsPerDay – clips in any 24 hours
 *   maxChars    – the longest text in one clip (about 15 characters a second of speech)
 *   keepDays    – how long finished clips are kept
 *   voicesPerDay – how often the voice can be made again
 */
export const VOICE_PLANS = {
  free: { label: "Free", clipsPerDay: 5, maxChars: 250, keepDays: 7, voicesPerDay: 2, priority: 0 },
  pro: { label: "Pro", clipsPerDay: 50, maxChars: 1000, keepDays: 90, voicesPerDay: 10, priority: 1 },
} as const;

export type VoicePlan = keyof typeof VOICE_PLANS;

/** Free clips from one internet connection a day, whatever the account (stops sign-up farming). */
export const FREE_CLIPS_PER_IP = 15;

/**
 * Ready-made voices anyone can use without cloning their own. Each is a Kokoro voice
 * (Apache-2.0) whose reference clip lives in workers/voice/builtin/<id>.wav, with a
 * preview at /tools/voice/builtin/<id>.mp3. Remake them with
 * workers/voice/make_builtin_voices.py. "mine" means the person's own cloned voice.
 */
export const BUILTIN_VOICES = [
  { id: "aria", name: "Aria", description: "Warm storyteller, American" },
  { id: "bella", name: "Bella", description: "Bright and friendly, American" },
  { id: "emma", name: "Emma", description: "Calm and clear, British" },
  { id: "michael", name: "Michael", description: "Steady narrator, American" },
  { id: "jordan", name: "Jordan", description: "Deep and confident, American" },
  { id: "george", name: "George", description: "Polished presenter, British" },
] as const;

export type BuiltinVoiceId = (typeof BUILTIN_VOICES)[number]["id"];
/** Which voice reads a clip: the person's own ("mine") or a built-in one. */
export type ClipVoice = "mine" | BuiltinVoiceId;

export const isBuiltinVoice = (value: unknown): value is BuiltinVoiceId =>
  BUILTIN_VOICES.some((voice) => voice.id === value);

export const voiceName = (voice: ClipVoice) =>
  voice === "mine" ? "Your voice" : (BUILTIN_VOICES.find((item) => item.id === voice)?.name ?? "Voice");

/**
 * Ways a clip can be read. The numbers are Chatterbox's settings, passed to the worker:
 *   exaggeration – how expressive (0.25 calm … 1 very lively)
 *   pace         – lower is slower and more deliberate ("cfg_weight", 0.2–0.7)
 *   temperature  – how much the delivery varies (lower is steadier)
 */
export const VOICE_STYLES = {
  natural: {
    label: "Natural",
    hint: "Like you, talking normally",
    settings: { exaggeration: 0.5, pace: 0.5, temperature: 0.8 },
  },
  narrator: {
    label: "Narrator",
    hint: "Calm and clear, for explainers and audiobooks",
    settings: { exaggeration: 0.35, pace: 0.45, temperature: 0.65 },
  },
  presenter: {
    label: "Presenter",
    hint: "Confident and steady, for property tours and news",
    settings: { exaggeration: 0.45, pace: 0.6, temperature: 0.6 },
  },
  advert: {
    label: "Advert",
    hint: "Energetic, for ads, reels and TikToks",
    settings: { exaggeration: 0.8, pace: 0.35, temperature: 0.8 },
  },
  storyteller: {
    label: "Storyteller",
    hint: "Warm and expressive, for stories and podcasts",
    settings: { exaggeration: 0.65, pace: 0.4, temperature: 0.75 },
  },
} as const;

export type VoiceStyle = keyof typeof VOICE_STYLES;

export const isVoiceStyle = (value: unknown): value is VoiceStyle =>
  typeof value === "string" && Object.hasOwn(VOICE_STYLES, value);

/** Read aloud to give the tool your voice (about 30 seconds). Any clear speech works too. */
export const READING_SCRIPT = [
  "Hello, and thank you for listening. I want to tell you a little about what I do and why I enjoy it.",
  "Every day is different. Some mornings start with a coffee and a long list of calls; other days I'm out meeting people, answering questions and solving small problems before lunch.",
  "What I like most is the moment something clicks: when a plan comes together, a customer smiles, or a difficult week finally pays off.",
  "If you'd like to know more, send me a message. I'll be happy to help.",
].join(" ");

export type VoiceStatus = "queued" | "working" | "ready" | "failed";
export type ClipStatus = "queued" | "working" | "done" | "failed";

export interface VoiceClip {
  id: string;
  voice: ClipVoice;
  text: string;
  style: VoiceStyle;
  status: ClipStatus;
  error: string | null;
  createdAt: string;
  /** How many clips (from anyone) are ahead of this one in the queue. */
  ahead: number;
}

export interface VoiceState {
  engineOnline: boolean;
  /** The account's tier and how much of today's allowance is used. */
  plan: VoicePlan;
  clipsToday: number;
  voice: { status: VoiceStatus; error: string | null; createdAt: string } | null;
  clips: VoiceClip[];
}
