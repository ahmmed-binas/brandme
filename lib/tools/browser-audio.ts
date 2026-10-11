/**
 * Audio helpers for the voice tool, run in the browser. Videos and recordings
 * are turned into small mono WAV files here, so only the sound is uploaded
 * (a 2-minute video becomes about 6 MB instead of hundreds).
 */

/** Chatterbox's own sample rate; the worker uses it as-is. */
export const RATE = 24_000;

export interface Sound {
  samples: Float32Array;
  rate: number;
}

/** Decodes any audio or video file the browser can play, as mono at 24 kHz, cut to `maxSeconds`. */
export async function decodeToMono(file: Blob, maxSeconds: number): Promise<Sound> {
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const seconds = Math.min(decoded.duration, maxSeconds);
    // Render through an offline context: mixes to one channel and resamples to 24 kHz.
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(seconds * RATE)), RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0, 0, seconds);
    const rendered = await offline.startRendering();
    return { samples: rendered.getChannelData(0).slice(), rate: RATE };
  } finally {
    void context.close();
  }
}

/** Joins sounds end to end (several recorded takes become one). */
export function joinSounds(sounds: Sound[]): Sound {
  const total = sounds.reduce((sum, sound) => sum + sound.samples.length, 0);
  const samples = new Float32Array(total);
  let offset = 0;
  for (const sound of sounds) {
    samples.set(sound.samples, offset);
    offset += sound.samples.length;
  }
  return { samples, rate: RATE };
}

export const durationOf = (sound: Sound | null) => (sound ? sound.samples.length / sound.rate : 0);

/**
 * Roughly how many seconds of actual speech a sound has (not silence or hiss).
 * The same rule as the worker's: 100 ms frames louder than 15% of the loud parts.
 */
export function speechSeconds(sound: Sound | null): number {
  if (!sound) return 0;
  const size = Math.round(sound.rate / 10);
  const loudness: number[] = [];
  for (let start = 0; start + size <= sound.samples.length; start += size) {
    let sum = 0;
    for (let index = start; index < start + size; index++) sum += sound.samples[index]! ** 2;
    loudness.push(Math.sqrt(sum / size));
  }
  if (!loudness.length) return 0;
  const sorted = [...loudness].sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const threshold = Math.max(0.01, 0.15 * loud);
  return loudness.filter((value) => value > threshold).length / 10;
}

/** A 16-bit PCM WAV file. */
export function toWav(sound: Sound): Blob {
  const { samples, rate } = sound;
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true); // size of the format block
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per sample
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  });
  return new Blob([buffer], { type: "audio/wav" });
}

/** A microphone recording in progress. `stop()` returns what was said. */
export interface Recording {
  stop: () => Promise<Blob>;
  /** 0–1, for a level meter. */
  level: () => number;
}

/** Starts recording from the microphone. Throws if the person says no or has no microphone. */
export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };

  // A small analyser for the level meter.
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  context.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.fftSize);

  recorder.start();
  return {
    level() {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const value of data) peak = Math.max(peak, Math.abs(value - 128) / 128);
      return peak;
    },
    stop() {
      return new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          void context.close();
          resolve(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      });
    },
  };
}
