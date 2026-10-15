"""
Brain-rot style short #1 for Kitefolio: split screen (top = the joke and our
templates, bottom = our own 3D car weaving down the road as "gameplay"), a fast
AI voice, and big word-by-word captions in the middle.

    py -3 marketing/brainrot-01/build.py

Inputs (in this folder): voice/line-0N.wav (Kokoro), shots/road.mp4 and
shots/pdf.png; the 3D template shots come from ../tiktok-02/shots. Needs ffmpeg.
"""

import subprocess
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
SHOTS = HERE / "shots"
TEMPLATES = HERE.parent / "tiktok-02" / "shots"
OUT = HERE / "out"
FONT = "C\\:/Windows/Fonts/impact.ttf"
GAP = 0.15
TAIL = 1.6

LINES = [
    "POV: your client asks for your portfolio, and you send them a PDF from 2014.",
    "Bro is cooked.",
    "Meanwhile, the driving instructor down the road has a 3D car on his website.",
    "The content marketer? Her projects are literally objects on a desk.",
    "Comment your job. I'll rate how cooked you are, and build your site for free.",
]


def seconds(path):
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def esc(text):
    """Text for ffmpeg drawtext: escape the characters it treats specially."""
    return text.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%").replace(",", "\\,")


def main():
    OUT.mkdir(exist_ok=True)
    durations = [seconds(HERE / "voice" / f"line-0{i + 1}.wav") for i in range(len(LINES))]
    starts, t = [], 0.0
    for d in durations:
        starts.append(t)
        t += d + GAP
    total = t + TAIL

    # Word-by-word captions: each word's share of the line follows its length.
    captions = []
    for line, start, length in zip(LINES, starts, durations):
        words = line.split()
        weights = [len(w) + 2 for w in words]
        clock = start
        for word, weight in zip(words, weights):
            span = length * weight / sum(weights)
            colour = "0xffd400" if word.lower().strip(".,?!") in {"cooked", "3d", "free", "pdf", "2014"} else "white"
            captions.append(
                f"drawtext=fontfile='{FONT}':text='{esc(word.upper())}':fontsize=108:fontcolor={colour}:"
                f"borderw=9:bordercolor=black:x=(w-text_w)/2:y=900-text_h/2:enable='between(t,{clock:.3f},{clock + span:.3f})'"
            )
            clock += span

    # Top-half scenes, each 1080x960, timed to its line.
    s = starts
    scenes = [
        # 0-1: the PDF meme, slowly zooming, then a red "cooked" flash with a shake.
        f"[1:v]loop=-1:1:0,fps=30,scale=1080:960,zoompan=z='min(1+on/600,1.18)':d=1:s=1080x960:fps=30,trim=0:{s[2]:.3f},setpts=PTS-STARTPTS,"
        f"eq=saturation='1':enable='gte(t,{s[1]:.3f})',"
        f"crop=1080:960:'if(gte(t,{s[1]:.3f}),8*sin(t*60),0)':0,"
        f"drawbox=0:0:1080:960:color=red@0.35:t=fill:enable='gte(t,{s[1]:.3f})'[a]",
        # 2: the driving instructor's 3D car.
        f"[2:v]trim=0:{durations[2] + GAP:.3f},setpts=PTS-STARTPTS,crop=1080:960:0:150,fps=30[b]",
        # 3: the content marketer's 3D desk.
        f"[3:v]trim=0:{durations[3] + GAP:.3f},setpts=PTS-STARTPTS,crop=1080:960:0:420,fps=30[c]",
        # 4: end card.
        f"color=c=0x100f0d:s=1080x960:r=30:d={durations[4] + TAIL:.3f},"
        f"drawtext=fontfile='{FONT}':text='KITEFOLIO.COM':fontsize=120:fontcolor=0xe0a43a:x=(w-text_w)/2:y=330,"
        f"drawtext=fontfile='{FONT}':text='COMMENT YOUR JOB':fontsize=84:fontcolor=white:x=(w-text_w)/2:y=500[d]",
        "[a][b][c][d]concat=n=4:v=1:a=0,setsar=1[top]",
        # Bottom half: the car weaving down the road, zoomed onto the road.
        f"[0:v]trim=0:{total:.3f},setpts=PTS-STARTPTS,crop=540:480:270:410,scale=1080:960:flags=lanczos,fps=30,setsar=1[bottom]",
        "[top][bottom]vstack=inputs=2[stack]",
        "[stack]" + ",".join(captions) + "[v]",
    ]
    audio_inputs = []
    for i in range(len(LINES)):
        audio_inputs += ["-i", str(HERE / "voice" / f"line-0{i + 1}.wav")]
    delays = "".join(f"[{4 + i}:a]adelay={int(starts[i] * 1000)}|{int(starts[i] * 1000)}[a{i}];" for i in range(len(LINES)))
    mix = delays + "".join(f"[a{i}]" for i in range(len(LINES))) + f"amix=inputs={len(LINES)}:normalize=0,apad,atrim=0:{total:.3f},loudnorm=I=-13:TP=-1.0:LRA=7[aout]"
    script = OUT / "filters.txt"
    script.write_text(";\n".join(scenes) + ";\n" + mix, encoding="utf-8")
    command = [
        "ffmpeg", "-y", "-v", "error",
        "-i", str(SHOTS / "road.mp4"),
        "-i", str(SHOTS / "pdf.png"),
        "-i", str(TEMPLATES / "lane.mp4"),
        "-i", str(TEMPLATES / "studio-desk.mp4"),
        *audio_inputs,
        "-/filter_complex", str(script),
        "-map", "[v]", "-map", "[aout]",
        "-t", f"{total:.3f}",
        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart",
        str(OUT / "brainrot-01.mp4"),
    ]
    subprocess.run(command, check=True)
    print("Done:", OUT / "brainrot-01.mp4", f"{total:.1f}s")


if __name__ == "__main__":
    main()
