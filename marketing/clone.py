"""Reads lines of text in a cloned voice with Chatterbox (MIT), on this computer's GPU.

    marketing/.tts/cb/Scripts/python marketing/clone.py <reference.wav> <out-dir> <lines.json>

lines.json: ["first line", "second line", ...] -> out-dir/line-01.wav, line-02.wav, ...
The reference is 10-20 seconds of the owner's own clean speech.
"""
import json
import sys
from pathlib import Path

import torch
import torchaudio
from chatterbox.models.voice_encoder import voice_encoder
from chatterbox.tts import ChatterboxTTS

# The reference clip is cut and trimmed beforehand, so skip librosa's trim: it
# imports scikit-learn, whose DLL Windows Smart App Control blocks on this PC.
_embeds = voice_encoder.VoiceEncoder.embeds_from_wavs
voice_encoder.VoiceEncoder.embeds_from_wavs = lambda self, wavs, sample_rate, *args, **kwargs: _embeds(self, wavs, sample_rate, *args, **{**kwargs, "trim_top_db": None})

reference, out_dir, lines_file = sys.argv[1:]
out = Path(out_dir)
out.mkdir(parents=True, exist_ok=True)
model = ChatterboxTTS.from_pretrained(device="cuda" if torch.cuda.is_available() else "cpu")
for index, line in enumerate(json.loads(Path(lines_file).read_text(encoding="utf-8")), start=1):
    torch.manual_seed(7)
    wav = model.generate(line, audio_prompt_path=reference, exaggeration=0.45, cfg_weight=0.5, temperature=0.7)
    path = out / f"line-{index:02d}.wav"
    torchaudio.save(str(path), wav, model.sr)
    print(path.name, round(wav.shape[-1] / model.sr, 2), "s", flush=True)
