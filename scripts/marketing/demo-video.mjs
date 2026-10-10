#!/usr/bin/env node
/**
 * Turns a raw screen recording of the agent console and a voice recording into
 * a short demo video: the voice cleaned up (background noise removed, warmer,
 * evened out and at streaming loudness), the recording cut into its best
 * moments in a story order, an end card, and two exports:
 *   <out>/kestrel-16x9.mp4  (1920×1080, YouTube, LinkedIn, the website)
 *   <out>/kestrel-9x16.mp4  (1080×1920, TikTok, Reels, Shorts)
 *
 *   node scripts/marketing/demo-video.mjs --video rec.mp4 [--voice voice.m4a] [--out marketing/kestrel-demo/out]
 *   node scripts/marketing/demo-video.mjs --video rec.mp4 --lines marketing/kestrel-demo/clone
 *
 * --lines takes a folder of line-01.wav, line-02.wav… (one per moment, then one
 * for the end card), e.g. from marketing/clone.py. Each line starts with its
 * moment, and a moment slows down a little when its line needs longer.
 *
 * Needs ffmpeg and ffprobe on the PATH (Windows: winget install Gyan.FFmpeg).
 * Without --voice it makes silent versions to check the cut.
 * The cut list (SEGMENTS) matches the 10 October 2026 recording and
 * marketing/kestrel-demo/SCRIPT.md; change the times for a new recording.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * [start, end, speed, blur] in seconds of the source recording, in the order they play.
 * blur: boxes [x, y, width, height] in source pixels (1884×918) to blur, so the
 * website's page addresses can't be read.
 */
const SEGMENTS = [
  [8.0, 10.5, 1],    // “OPS secure console” boot screen
  [10.5, 16.0, 1],   // Mission control: the agent network and token burn
  [27.0, 34.5, 1.25], // Indexing team: the agent cards
  [21.0, 26.5, 1.2], // Settings: daily token budgets
  [35.0, 42.0, 1.15, [[40, 780, 900, 138]]], // Indexing progress: 34 confirmed, 40 pending (page list at the bottom blurred)
  [44.0, 50.0, 1], // Impressions: the chart once it has loaded
  [52.0, 54.8, 1, [[40, 100, 940, 818]]], // Pages changed: the table, address column blurred
];
const END_CARD = { title: "Kestrel", subtitle: "Your own SEO & AEO agent · by fuccura", cta: "Link in bio", seconds: 4 };
const BG = "0x100f0d";
const GOLD = "0xe0a43a";
const FONT = process.platform === "win32" ? "C\\:/Windows/Fonts/segoeuib.ttf" : "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

/** Voice clean-up: rumble off, noise reduction, a little presence, de-essed, compressed, then -16 LUFS. */
const VOICE_FILTER = [
  "highpass=f=80",
  "lowpass=f=12000",
  "afftdn=nr=14:nf=-30:tn=1",
  "equalizer=f=200:t=q:w=1:g=-2",
  "equalizer=f=3500:t=q:w=1.2:g=3",
  "deesser=i=0.4",
  "acompressor=threshold=-20dB:ratio=3:attack=5:release=150:makeup=2",
  "loudnorm=I=-16:TP=-1.5:LRA=9",
].join(",");

function args() {
  const out = { out: "marketing/kestrel-demo/out" };
  for (let index = 2; index < process.argv.length; index += 2) out[process.argv[index].replace(/^--/, "")] = process.argv[index + 1];
  if (!out.video) { console.error("Usage: node scripts/marketing/demo-video.mjs --video rec.mp4 [--voice voice.m4a] [--out dir]"); process.exit(1); }
  return out;
}

function run(command, list) {
  const result = spawnSync(command, list, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  if (result.error?.code === "ENOENT") { console.error(`${command} isn't installed. On Windows: winget install Gyan.FFmpeg (then open a new terminal).`); process.exit(1); }
  if (result.status !== 0) { console.error(result.stderr.split("\n").slice(-15).join("\n")); process.exit(1); }
  return result.stdout;
}

const duration = (file) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).trim());
const text = (value, size, y, colour = "white") => `drawtext=fontfile='${FONT}':text='${value.replace(/[':,]/g, "\\$&")}':fontsize=${size}:fontcolor=${colour}:x=(w-text_w)/2:y=${y}`;

const options = args();
const video = resolve(options.video);
const out = resolve(options.out);
if (!existsSync(video)) { console.error(`No video at ${video}`); process.exit(1); }
mkdirSync(out, { recursive: true });

// 1. The voice: one recording, cleaned up; or separate lines, one per moment.
let voice = null;
const speeds = SEGMENTS.map(([, , speed]) => speed);
let lineEnd = 0;
if (options.lines) {
  const folder = resolve(options.lines);
  const files = readdirSync(folder).filter((name) => /^line-\d+\.wav$/.test(name)).sort().map((name) => join(folder, name));
  if (files.length !== SEGMENTS.length + 1) { console.error(`Expected ${SEGMENTS.length + 1} lines (one per moment and one for the end card), found ${files.length}.`); process.exit(1); }
  const lengths = files.map(duration);
  let at = 0;
  const delays = [];
  SEGMENTS.forEach(([start, end], index) => {
    const scene = Math.max((end - start) / speeds[index], lengths[index] + 0.35);
    speeds[index] = (end - start) / scene;
    delays.push(at);
    at += scene;
  });
  delays.push(at);
  lineEnd = lengths.at(-1) + 0.8;
  voice = join(out, "voice-lines.wav");
  console.log(`Placing ${files.length} lines…`);
  const placed = files.map((_, index) => `[${index}:a]aresample=48000,aformat=channel_layouts=mono,adelay=${Math.round(delays[index] * 1000)}:all=1[l${index}]`).join(";");
  run("ffmpeg", ["-y", ...files.flatMap((file) => ["-i", file]), "-filter_complex", `${placed};${files.map((_, index) => `[l${index}]`).join("")}amix=inputs=${files.length}:normalize=0,highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=150:makeup=1,loudnorm=I=-16:TP=-1.5:LRA=9`, "-ar", "48000", "-ac", "1", voice]);
} else if (options.voice) {
  voice = join(out, "voice-clean.wav");
  console.log("Cleaning the voice…");
  run("ffmpeg", ["-y", "-i", resolve(options.voice), "-af", VOICE_FILTER, "-ar", "48000", "-ac", "1", voice]);
}

// 2. Cut, re-order and join the recording into a 1920-wide picture on the brand background.
const cutLength = SEGMENTS.reduce((sum, [start, end], index) => sum + (end - start) / speeds[index], 0);
const voiceLength = voice ? duration(voice) : 0;
const endSeconds = Math.max(END_CARD.seconds, lineEnd, voiceLength - cutLength + (options.lines ? 0.3 : 1));
/** Blurs each box on the stream named `input`, returning the filters and the final stream's name. */
const blurred = (input, boxes, index) => boxes.reduce(({ chain, name }, [x, y, w, h], box) => {
  const id = `${index}_${box}`;
  return { chain: `${chain};[${name}]split[k${id}][c${id}];[c${id}]crop=${w}:${h}:${x}:${y},boxblur=24:4[b${id}];[k${id}][b${id}]overlay=${x}:${y}[o${id}]`, name: `o${id}` };
}, { chain: "", name: input });
const parts = SEGMENTS.map(([start, end, , boxes = []], index) => {
  const cut = `[0:v]trim=${start}:${end},setpts=(PTS-STARTPTS)/${speeds[index].toFixed(4)}[r${index}]`;
  const { chain, name } = blurred(`r${index}`, boxes, index);
  return `${cut}${chain};[${name}]scale=1920:-2:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=${BG},fps=30,setsar=1,format=yuv420p,fade=t=in:st=0:d=0.25[s${index}]`;
});
const card = `color=c=${BG}:s=1920x1080:d=${endSeconds.toFixed(2)}:r=30,setsar=1,format=yuv420p,${text(END_CARD.title, 150, "(h/2)-170", GOLD)},${text(END_CARD.subtitle, 48, "(h/2)+20")},${text(END_CARD.cta, 40, "(h/2)+110", "0xbbbbbb")},fade=t=in:st=0:d=0.4[card]`;
const join16 = `${parts.join(";")};${card};${SEGMENTS.map((_, index) => `[s${index}]`).join("")}[card]concat=n=${SEGMENTS.length + 1}:v=1:a=0[wide]`;
const wide = join(out, "kestrel-16x9.mp4");
console.log(`Cutting ${SEGMENTS.length} moments (${cutLength.toFixed(1)} s) and the end card (${endSeconds.toFixed(1)} s)…`);
run("ffmpeg", ["-y", "-i", video, ...(voice ? ["-i", voice] : []), "-filter_complex", join16, "-map", "[wide]", ...(voice ? ["-map", "1:a", "-c:a", "aac", "-b:a", "192k"] : ["-an"]),
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", "-shortest", wide]);

// 3. The vertical version: the video in the middle over a blurred copy, with a headline on top.
const tall = join(out, "kestrel-9x16.mp4");
console.log("Making the 9:16 version…");
const vertical = `[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:2,eq=brightness=-0.55:saturation=0.6[bg];[b]crop=1440:1080:240:0,scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,${text("11 AI agents", 84, 230, GOLD)},${text("get my pages onto Google", 64, 340)},${text("while I sleep", 64, 420)},${text("fuccura", 52, "h-260", "0xdddddd")}[tall]`;
run("ffmpeg", ["-y", "-i", wide, "-filter_complex", vertical, "-map", "[tall]", ...(voice ? ["-map", "0:a", "-c:a", "copy"] : ["-an"]), "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", tall]);

console.log(`Done:\n  ${wide}\n  ${tall}${voice ? `\n  ${voice} (the cleaned voice on its own)` : "\n  (silent: add --voice voice.m4a for the voiceover)"}`);
