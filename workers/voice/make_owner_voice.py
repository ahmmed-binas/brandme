"""Makes the built-in voice "Ahmed" from the owner's own recording.

    marketing/.tts/cb/Scripts/python workers/voice/make_owner_voice.py <recording>

The owner (Ahmed Binas) agreed on 12 October 2026 that Fuccura may offer his voice
as a built-in voice. Keeps the clearest 15 seconds of the recording (the same
choice the engine makes for cloned voices) as workers/voice/builtin/ahmed.wav.
"""
import io
import subprocess
import sys
from pathlib import Path

import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import worker  # noqa: E402  (its helpers: best_window, normalise)

recording = sys.argv[1]
raw = subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-i", recording, "-ac", "1", "-ar", str(worker.RATE), "-f", "wav", "-"],
    capture_output=True,
    check=True,
).stdout
samples, rate = sf.read(io.BytesIO(raw), dtype="float32")
clip = worker.normalise(worker.best_window(samples, rate, 15))
out = HERE / "builtin" / "ahmed.wav"
sf.write(out, clip, rate, subtype="PCM_16")
print(out, round(len(clip) / rate, 1), "s, speech", worker.speech_seconds(clip, rate), "s")
