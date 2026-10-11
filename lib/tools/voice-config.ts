/**
 * The voice tool's settings and shapes, shared by the website's server code
 * (lib/tools/voice.ts) and the page in the browser (components/tools/VoiceClone.tsx).
 * Nothing here touches the database.
 */

/** About 2 minutes of the 24 kHz mono WAV the browser makes from the upload. */
export const MAX_SOURCE_BYTES = 6_000_000;
/** About 40 seconds of the consent recording. */
export const MAX_CONSENT_BYTES = 2_000_000;
/** The longest text read aloud in one clip (about 25 seconds of speech). */
export const MAX_CLIP_CHARS = 400;
export const CLIPS_PER_DAY = 20;
/** Clips are deleted after this many days. */
export const CLIP_DAYS = 30;

/** Read into the microphone; the worker checks it is the same voice as the upload. */
export const CONSENT_SENTENCE =
  "This is my own voice, recorded today. I agree to Fuccura making a copy of my voice for my own use, and I will not use it to pretend to be anyone else.";

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
  voice: { status: VoiceStatus; error: string | null; createdAt: string } | null;
  clips: VoiceClip[];
}
