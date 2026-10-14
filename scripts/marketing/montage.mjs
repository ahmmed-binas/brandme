#!/usr/bin/env node
/**
 * Makes a vertical (1080×1920) montage for TikTok, Reels and Shorts from the
 * gallery's template clips (public/gallery/<id>.mp4), one voice line per scene
 * and big captions, so it works with the sound off too.
 *
 *   node scripts/marketing/montage.mjs marketing/every-job/video.json
 *
 * video.json: { out, lines, scenes: [{ clip | clips, top?: [line, line], label?, sub? }] }
 * lines: a folder of line-01.wav, line-02.wav… (one per scene, e.g. from
 * marketing/clone.py). A scene lasts as long as its line plus a breath.
 * Also writes <out>-silent.mp4 for posting with a sound picked in TikTok.
 * Needs ffmpeg and ffprobe on the PATH.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const BG = "0x100f0d";
const GOLD = "0xe0a43a";
const FONT = process.platform === "win32" ? "C\\:/Windows/Fonts/segoeuib.ttf" : "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const CLIP = 1080; // the template clip, square, full width
const CLIP_Y = 330; // keeps the captions above TikTok's own caption and buttons

function run(list, cwd) {
  const result = spawnSync("ffmpeg", ["-y", "-v", "error", ...list], { cwd, encoding: "utf8" });
  if (result.error?.code === "ENOENT") { console.error("ffmpeg isn't installed. On Windows: winget install Gyan.FFmpeg"); process.exit(1); }
  if (result.status !== 0) { console.error(result.stderr.split("\n").slice(-15).join("\n")); process.exit(1); }
}
const duration = (file) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).stdout.trim());

const config = JSON.parse(readFileSync(resolve(process.argv[2] ?? "marketing/every-job/video.json"), "utf8"));
const out = resolve(config.out);
const tmp = join(tmpdir(), "fuccura-montage");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
mkdirSync(dirname(out), { recursive: true });

const lines = config.scenes.map((_, index) => resolve(config.lines, `line-${String(index + 1).padStart(2, "0")}.wav`));
const lengths = lines.map(duration);
const last = config.scenes.length - 1;
const seconds = lengths.map((length, index) => Math.max(1.4, length + (index === last ? 1.2 : 0.3)));

/** Text that fades and slides up into place at the start of the scene. textfile= avoids escaping. */
let files = 0;
const caption = (value, size, y, colour = "white") => {
  const name = `t${files++}.txt`;
  writeFileSync(join(tmp, name), value, "utf8");
  return `drawtext=fontfile='${FONT}':textfile=${name}:fontsize=${size}:fontcolor=${colour}:x=(w-text_w)/2:y=${y}+30*max(0\\,1-t/0.2):alpha='min(1,t/0.15)'`;
};

config.scenes.forEach((scene, index) => {
  const clips = scene.clips ?? [scene.clip];
  const each = seconds[index] / clips.length;
  const inputs = clips.flatMap((id) => ["-ss", "0.2", "-t", each.toFixed(3), "-i", resolve("public/gallery", `${id}.mp4`)]);
  const parts = clips.map((_, n) => `[${n}:v]scale=${CLIP}:${CLIP}:flags=lanczos,fps=30,setsar=1,setpts=PTS-STARTPTS[c${n}]`).join(";");
  const texts = [
    ...(scene.top ?? []).map((value, n) => caption(value, 76, 110 + n * 96)),
    ...(scene.label ? [caption(scene.label, scene.sub ? 120 : 128, CLIP_Y + CLIP + 50, GOLD)] : []),
    ...(scene.sub ? [caption(scene.sub, 56, CLIP_Y + CLIP + 205, "0xdddddd")] : []),
  ];
  const graph = `${parts};${clips.map((_, n) => `[c${n}]`).join("")}concat=n=${clips.length}:v=1:a=0[clip];` +
    `color=c=${BG}:s=1080x1920:r=30:d=${seconds[index].toFixed(3)}[bg];[bg][clip]overlay=(W-w)/2:${CLIP_Y}:shortest=1,` +
    `${[...texts, "format=yuv420p"].join(",")}[v]`;
  run([...inputs, "-filter_complex", graph, "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-r", "30", `scene-${index}.mp4`], tmp);
  console.log(`Scene ${index + 1}/${config.scenes.length}: ${seconds[index].toFixed(1)} s`);
});

// Join the scenes, then lay each voice line at the start of its scene.
writeFileSync(join(tmp, "list.txt"), config.scenes.map((_, index) => `file 'scene-${index}.mp4'`).join("\n"));
run(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "picture.mp4"], tmp);
let at = 0;
const delays = seconds.map((length) => { const start = at; at += length; return start; });
const placed = lines.map((_, index) => `[${index}:a]aresample=48000,aformat=channel_layouts=mono,adelay=${Math.round(delays[index] * 1000 + 120)}:all=1[l${index}]`).join(";");
run([...lines.flatMap((file) => ["-i", file]), "-filter_complex",
  `${placed};${lines.map((_, index) => `[l${index}]`).join("")}amix=inputs=${lines.length}:normalize=0,highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=150:makeup=1,loudnorm=I=-14:TP=-1.5:LRA=9,apad=whole_dur=${at.toFixed(3)}`,
  "-ar", "48000", "-ac", "1", "voice.wav"], tmp);
run(["-i", join(tmp, "picture.mp4"), "-i", join(tmp, "voice.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]);
run(["-i", join(tmp, "picture.mp4"), "-c", "copy", "-movflags", "+faststart", out.replace(/\.mp4$/, "-silent.mp4")]);
console.log(`Done (${at.toFixed(1)} s):\n  ${out}\n  ${out.replace(/\.mp4$/, "-silent.mp4")}`);
