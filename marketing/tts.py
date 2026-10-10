"""Text to speech with Kokoro (Apache-2.0), on this computer.

    marketing/.tts/Scripts/python marketing/tts.py <voice> <speed> <out.wav> "text" ["more text" ...]

Each text is a line; lines are joined with a short pause. Voices: af_heart,
af_bella, am_michael, am_fenrir, bm_george, bf_emma, and more.
"""
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

models = Path(__file__).parent / ".tts" / "models"
voice, speed, out, *lines = sys.argv[1:]
kokoro = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))
pieces = []
rate = 24000
for line in lines:
    audio, rate = kokoro.create(line, voice=voice, speed=float(speed), lang="en-us" if voice[0] == "a" else "en-gb")
    pieces += [audio, np.zeros(int(rate * 0.28), dtype=audio.dtype)]
sf.write(out, np.concatenate(pieces), rate)
print(out, round(sum(len(p) for p in pieces) / rate, 2), "s")
