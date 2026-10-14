# Voice engine (for /tools/voice)

The free voice tool's speaking is done here, on a PC with an NVIDIA graphics card,
not on the web server (which has no graphics card). The worker asks the website for
jobs every few seconds, using outgoing connections only, so nothing needs opening on the router.

- **New voice:** downloads the upload and the spoken consent and checks they sound like
  the same person. Then it keeps the clearest 12 seconds as the voice's sample. The
  website deletes the upload and the consent recording straight after.
- **Clip:** reads the text in that voice (Pro clips first), in the chosen style, adds a studio polish
  (rumble cut, even loudness) and sends back an MP3.
- **Watermark:** every clip carries Chatterbox's inaudible watermark (Resemble AI's Perth),
  so it can be identified as AI-made.

When the worker isn't running, people can still queue work. The page tells them it's
"not available right now" and their request runs when the worker is back.

## Run it

```powershell
.\workers\voice\start.ps1
```

## Settings: `workers/voice/.env` (not in git)

```
KITEFOLIO_URL=http://localhost:3000      # or https://kitefolio.com for the live site
TOOLS_WORKER_TOKEN=<long secret>       # must match TOOLS_WORKER_TOKEN on the website
WORKER_NAME=pc
```

The website needs the same `TOOLS_WORKER_TOKEN`: in `.env.local` for development, and in
`/opt/fuccura/.env` on the server (then restart the app). Without it, the worker routes
answer 404. Use a different secret for live than for local.

## First-time setup (already done on the owner's PC)

Python 3.11 with Chatterbox and CUDA PyTorch, in `marketing/.tts/cb`:

```powershell
py install 3.11
py -3.11 -m venv marketing\.tts\cb
marketing\.tts\cb\Scripts\pip install chatterbox-tts
marketing\.tts\cb\Scripts\pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121 --force-reinstall
```

`ffmpeg` on the PATH gives the MP3 and studio polish (`winget install Gyan.FFmpeg`).
Without it, clips are sent as WAV.

## Tuning

At the top of `worker.py`:

- `SAME_SPEAKER`: how alike the upload and consent must sound.
- `SAMPLE_SECONDS`: the length of the sample kept.
- `MIN_*_SPEECH`: the least speech accepted.

The styles (Natural, Narrator, Presenter, Advert, Storyteller) are set in `VOICE_STYLES` in
`lib/tools/voice.ts`.
