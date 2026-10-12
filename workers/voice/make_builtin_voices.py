"""Makes the reference clips for the built-in voices (lib/tools/voice-config.ts BUILTIN_VOICES).

    marketing/.tts/cb/Scripts/python workers/voice/make_builtin_voices.py

Each built-in voice is a Kokoro voice (Apache-2.0, free for commercial use) reading
a short, natural passage. The voice engine (worker.py) then speaks any text "in"
that voice with Chatterbox, in every style. Writes:
  workers/voice/builtin/<id>.wav           the reference the engine listens to
  public/tools/voice/builtin/<id>.mp3      a short preview for the voice picker
Needs the Kokoro model files in marketing/.tts/models (kokoro-v1.0.onnx, voices-v1.0.bin).
"""
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / "marketing" / ".tts" / "models"
REFERENCES = ROOT / "workers" / "voice" / "builtin"
PREVIEWS = ROOT / "public" / "tools" / "voice" / "builtin"

# id -> Kokoro voice. Names and descriptions shown to people live in voice-config.ts.
VOICES = {
    "aria": "af_heart",
    "bella": "af_bella",
    "emma": "bf_emma",
    "michael": "am_michael",
    "jordan": "am_fenrir",
    "george": "bm_george",
}

PASSAGE = [
    "Let me tell you a story. Last spring, a young couple walked into a small apartment by the sea.",
    "The light poured in through tall windows, and for a moment, nobody said a word.",
    "That is the feeling I want you to have, every time you open the door.",
]


def main():
    REFERENCES.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    for voice_id, kokoro_voice in VOICES.items():
        language = "en-gb" if kokoro_voice.startswith("b") else "en-us"
        pieces, rate = [], 24_000
        for line in PASSAGE:
            audio, rate = kokoro.create(line, voice=kokoro_voice, speed=0.95, lang=language)
            pieces += [np.asarray(audio, dtype=np.float32), np.zeros(int(rate * 0.3), dtype=np.float32)]
        clip = np.concatenate(pieces)
        reference = REFERENCES / f"{voice_id}.wav"
        sf.write(reference, clip, rate, subtype="PCM_16")
        preview = PREVIEWS / f"{voice_id}.mp3"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(reference), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ac", "1", "-b:a", "96k", str(preview)],
            check=True,
        )
        print(voice_id, round(len(clip) / rate, 1), "s")


if __name__ == "__main__":
    main()
