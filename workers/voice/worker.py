"""The voice engine for fuccura.com/tools/voice. Runs on a computer with an NVIDIA graphics card.

It asks the website for work every few seconds (only outgoing connections, so
no ports need opening), makes voices and reads text aloud with Chatterbox (MIT
licence, by Resemble AI), and sends the audio back. While it runs, the website
counts the engine as online. Stop it with Ctrl+C; queued jobs wait for it.

Start it with workers/voice/start.ps1 (see workers/voice/README.md).

Settings (environment variables, or workers/voice/.env):
    FUCCURA_URL         the website, e.g. https://fuccura.com (default http://localhost:3000)
    TOOLS_WORKER_TOKEN  the same secret as the website's TOOLS_WORKER_TOKEN
    WORKER_NAME         this computer's name in the website's records (default: "pc")
"""
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
from pathlib import Path

import numpy as np
import requests
import soundfile as sf
import torch

HERE = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


def load_env_file():
    """Reads KEY=value lines from workers/voice/.env (real environment variables win)."""
    env_file = HERE / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        key, sep, value = line.strip().partition("=")
        if sep and key and not key.startswith("#"):
            os.environ.setdefault(key.strip(), value.strip().strip('"'))


load_env_file()
SITE = os.environ.get("FUCCURA_URL", "http://localhost:3000").rstrip("/")
TOKEN = os.environ.get("TOOLS_WORKER_TOKEN", "")
NAME = os.environ.get("WORKER_NAME", "pc")

# How often to ask for work when the queue is empty (the website shows "online" for 90 s after).
IDLE_SECONDS = 3
# The sample a voice speaks from. Chatterbox listens to the first 10 s; a little more is harmless.
SAMPLE_SECONDS = 12
# The least clear speech we accept, in seconds.
MIN_SOURCE_SPEECH = 8
MIN_CONSENT_SPEECH = 3
# How alike the upload and the consent recording must sound (cosine similarity, 0–1).
# Measured October 2026: the owner's voice against itself 0.95, against its own clone 0.81,
# against eight other voices 0.61–0.66. Lower it a little if real people get refused.
SAME_SPEAKER = 0.75
# Chatterbox speaks 24 kHz audio.
RATE = 24_000

# ---------------------------------------------------------------------------
# Talking to the website
# ---------------------------------------------------------------------------

session = requests.Session()
session.headers.update({"Authorization": f"Bearer {TOKEN}", "X-Worker-Name": NAME})


def next_job():
    response = session.post(f"{SITE}/api/tools/worker/next", timeout=30)
    response.raise_for_status()
    return response.json().get("job")


def download_voice(voice_id, part):
    """A voice's audio as mono float samples at 24 kHz."""
    response = session.get(
        f"{SITE}/api/tools/worker/audio", params={"voice": voice_id, "part": part}, timeout=120
    )
    response.raise_for_status()
    samples, rate = sf.read(io.BytesIO(response.content), dtype="float32", always_2d=True)
    return to_rate(samples.mean(axis=1), rate, RATE)


def report(job, error=None, audio=None, filename="audio.wav", similarity=None):
    data = {"type": job["type"], "id": job["id"]}
    if error:
        data["error"] = error
    if similarity is not None:
        data["similarity"] = f"{similarity:.4f}"
    files = {"audio": (filename, audio)} if audio else None
    response = session.post(f"{SITE}/api/tools/worker/done", data=data, files=files, timeout=120)
    response.raise_for_status()


# ---------------------------------------------------------------------------
# Audio helpers
# ---------------------------------------------------------------------------


def to_rate(samples, rate, target):
    if rate == target:
        return samples.astype(np.float32)
    import librosa

    return librosa.resample(samples.astype(np.float32), orig_sr=rate, target_sr=target)


def frame_loudness(samples, rate, frame_seconds=0.1):
    """Loudness (RMS) of each 100 ms frame."""
    size = int(rate * frame_seconds)
    count = len(samples) // size
    if count == 0:
        return np.zeros(0)
    frames = samples[: count * size].reshape(count, size)
    return np.sqrt((frames**2).mean(axis=1))


def speech_frames(samples, rate):
    """True for each 100 ms frame that sounds like speech rather than silence or hiss."""
    loudness = frame_loudness(samples, rate)
    if loudness.size == 0:
        return loudness.astype(bool)
    threshold = max(0.01, 0.15 * np.percentile(loudness, 95))
    return loudness > threshold


def speech_seconds(samples, rate):
    return float(speech_frames(samples, rate).sum()) * 0.1


def best_window(samples, rate, seconds):
    """The stretch of `seconds` with the most continuous speech (an upload may have music or pauses)."""
    length = int(seconds * rate)
    if len(samples) <= length:
        return samples
    voiced = speech_frames(samples, rate).astype(np.float32)
    frames = int(seconds * 10)
    scores = np.convolve(voiced, np.ones(frames), mode="valid")
    start = int(np.argmax(scores)) * rate // 10
    return samples[start : start + length]


def normalise(samples, peak=0.89):
    top = float(np.max(np.abs(samples))) or 1.0
    return (samples / top * peak).astype(np.float32)


def wav_bytes(samples, rate):
    buffer = io.BytesIO()
    sf.write(buffer, samples, rate, format="WAV", subtype="PCM_16")
    return buffer.getvalue()


def studio_polish(samples, rate):
    """
    Makes a clip sound finished: cuts rumble, evens out the level (−16 LUFS, the
    podcast and social-media standard) and saves an MP3. Plain WAV without ffmpeg.
    """
    if not shutil.which("ffmpeg"):
        return wav_bytes(samples, rate), "clip.wav"
    with tempfile.TemporaryDirectory() as folder:
        raw = Path(folder) / "raw.wav"
        out = Path(folder) / "clip.mp3"
        sf.write(raw, samples, rate, subtype="PCM_16")
        filters = "highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=10:release=200,loudnorm=I=-16:TP=-1.5:LRA=11"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", filters, "-ar", "44100", "-b:a", "160k", str(out)],
            check=True,
        )
        return out.read_bytes(), "clip.mp3"


def sentences(text, longest=160):
    """Splits text into pieces Chatterbox reads well (it drifts on very long input)."""
    parts = re.split(r"(?<=[.!?…])\s+", text.strip())
    pieces, current = [], ""
    for part in parts:
        if current and len(current) + len(part) + 1 > longest:
            pieces.append(current)
            current = part
        else:
            current = f"{current} {part}".strip()
    if current:
        pieces.append(current)
    # A single sentence longer than `longest` is split at commas, then hard-cut.
    result = []
    for piece in pieces:
        while len(piece) > longest:
            cut = piece.rfind(",", 0, longest)
            cut = cut + 1 if cut > longest // 2 else longest
            result.append(piece[:cut].strip())
            piece = piece[cut:].strip()
        if piece:
            result.append(piece)
    return result


# ---------------------------------------------------------------------------
# The model
# ---------------------------------------------------------------------------


def load_model():
    from chatterbox.models.voice_encoder import voice_encoder
    from chatterbox.tts import ChatterboxTTS

    # Skip librosa's silence trim inside Chatterbox: it imports scikit-learn, whose DLL
    # Windows Smart App Control blocks on some PCs. We cut silence ourselves (best_window).
    original = voice_encoder.VoiceEncoder.embeds_from_wavs

    def without_trim(self, wavs, sample_rate, *args, **kwargs):
        return original(self, wavs, sample_rate, *args, **{**kwargs, "trim_top_db": None})

    voice_encoder.VoiceEncoder.embeds_from_wavs = without_trim

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading Chatterbox on {device}…", flush=True)
    return ChatterboxTTS.from_pretrained(device=device)


def speaker_similarity(model, first, second):
    """How alike two recordings sound, 0–1 (Chatterbox's own speaker encoder)."""
    clips = [to_rate(first, RATE, 16_000), to_rate(second, RATE, 16_000)]
    embeds = model.ve.embeds_from_wavs(clips, sample_rate=16_000)
    a, b = embeds[0], embeds[1]
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

samples_cache = {}  # voice id -> path of its sample on disk
cache_folder = Path(tempfile.mkdtemp(prefix="fuccura-voices-"))


def make_voice(model, job):
    source = download_voice(job["id"], "source")
    consent = download_voice(job["id"], "consent")
    if speech_seconds(consent, RATE) < MIN_CONSENT_SPEECH:
        return report(job, error="We couldn’t hear the consent sentence. Please record it again, a little closer to the microphone.")
    if speech_seconds(source, RATE) < MIN_SOURCE_SPEECH:
        return report(job, error="We need more of your voice: at least 10 seconds of clear speech, without music.")

    sample = normalise(best_window(source, RATE, SAMPLE_SECONDS))
    similarity = speaker_similarity(model, sample, consent)
    print(f"  voice {job['id'][:8]}: similarity {similarity:.3f}", flush=True)
    if similarity < SAME_SPEAKER:
        return report(
            job,
            similarity=similarity,
            error="The voice in your upload doesn’t sound like your consent recording. You can only copy your own voice.",
        )
    report(job, audio=wav_bytes(sample, RATE), filename="sample.wav", similarity=similarity)


def voice_sample_path(voice_id):
    if voice_id not in samples_cache:
        path = cache_folder / f"{voice_id}.wav"
        sf.write(path, download_voice(voice_id, "sample"), RATE, subtype="PCM_16")
        samples_cache[voice_id] = path
    return str(samples_cache[voice_id])


def tighten_pauses(samples, rate, longest=0.45):
    """Cuts silence at the start and end, and shortens any pause longer than `longest` seconds."""
    voiced = speech_frames(samples, rate)
    if not voiced.any():
        return samples
    size = rate // 10
    keep, quiet_run = [], 0
    first, last = int(np.argmax(voiced)), len(voiced) - int(np.argmax(voiced[::-1])) - 1
    for index in range(first, last + 1):
        quiet_run = 0 if voiced[index] else quiet_run + 1
        if quiet_run * 0.1 <= longest:
            keep.append(samples[index * size : (index + 1) * size])
    return np.concatenate(keep)


def speak(model, text, settings, attempts=3):
    """
    Reads one piece of text. Chatterbox now and then fails to stop and adds long
    silence or mumbling; a result far longer than the text needs is made again.
    """
    longest_ok = len(text) / 9 + 2  # about 12 characters a second is normal speech
    best = None
    for attempt in range(attempts):
        wav = model.generate(
            text,
            exaggeration=settings["exaggeration"],
            cfg_weight=settings["pace"],
            temperature=settings["temperature"],
        )
        wav = tighten_pauses(wav.squeeze(0).cpu().numpy(), model.sr)
        if best is None or len(wav) < len(best):
            best = wav
        if len(wav) / model.sr <= longest_ok:
            break
        print(f"  piece ran long ({len(wav) / model.sr:.1f} s), trying again", flush=True)
    return best


def make_clip(model, job):
    settings = job["settings"]
    model.prepare_conditionals(voice_sample_path(job["voiceId"]), exaggeration=settings["exaggeration"])
    pause = np.zeros(int(RATE * 0.3), dtype=np.float32)
    pieces = []
    for piece in sentences(job["text"]):
        pieces += [speak(model, piece, settings), pause]
    audio, filename = studio_polish(np.concatenate(pieces[:-1]), model.sr)
    report(job, audio=audio, filename=filename)


def run_job(model, job):
    started = time.time()
    print(f"{job['type']} {job['id'][:8]}…", flush=True)
    try:
        if job["type"] == "voice":
            make_voice(model, job)
        else:
            make_clip(model, job)
        print(f"  done in {time.time() - started:.1f} s", flush=True)
    except requests.RequestException:
        raise  # The website is unreachable; the main loop waits and retries.
    except Exception:
        traceback.print_exc()
        message = "Something went wrong on our side. Please try again in a minute."
        report(job, error=message)


def main():
    if len(TOKEN) < 24:
        sys.exit("Set TOOLS_WORKER_TOKEN (the same long secret as on the website) in workers/voice/.env")
    model = load_model()
    print(f"Ready. Asking {SITE} for work every {IDLE_SECONDS} s. Ctrl+C to stop.", flush=True)
    while True:
        try:
            job = next_job()
        except requests.RequestException as error:
            print(f"Can’t reach {SITE} ({error.__class__.__name__}); trying again in 15 s.", flush=True)
            time.sleep(15)
            continue
        if job:
            try:
                run_job(model, job)
            except requests.RequestException as error:
                print(f"Lost the website mid-job ({error}); it will be offered again.", flush=True)
                time.sleep(15)
        else:
            time.sleep(IDLE_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Stopped.")
