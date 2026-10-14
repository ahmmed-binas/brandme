#!/usr/bin/env bash
# Builds TikTok #2: the owner's face intro, then three 3D templates being played
# with (voice: the owner's cloned voice), then a quick flick through job
# templates and the kitefolio.com end card. 1080×1920, 30 fps, loud and clean.
#   bash marketing/tiktok-02/build.sh <intro.mov>
set -euo pipefail
cd "$(dirname "$0")"
INTRO="$1"
FONT="C\\:/Windows/Fonts/segoeuib.ttf"
BG="0x100f0d"
GOLD="0xe0a43a"
mkdir -p tmp out
# Speech: rumble cut, denoise, then loud and even (TikTok plays around -14 LUFS).
VOICE="highpass=f=90,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-13:TP=-1.0:LRA=7"
ENC=(-c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 -ac 2)

text() { # text, size, y, colour
  printf "drawtext=fontfile='%s':text='%s':fontsize=%s:fontcolor=%s:x=(w-text_w)/2:y=%s:shadowcolor=black@0.6:shadowx=0:shadowy=3" "$FONT" "$1" "$2" "${4:-white}" "$3"
}

# 1. Intro: the owner's face, last second cut, voice cleaned and louder, a caption.
ffmpeg -y -v error -i "$INTRO" -t 4.15 \
  -vf "scale=1080:1920,fps=30,$(text 'Tell me your job' 76 1430),$(text 'I will make you a website' 64 1530 $GOLD)" \
  -af "$VOICE" "${ENC[@]}" tmp/0-intro.mp4

# 2–4. The 3D shots: the part of the phone screen with the 3D, big, with a title above.
scene() { # index, shot, crop y, voice line, seconds, title
  local index=$1 shot=$2 y=$3 line=$4 seconds=$5 title=$6
  ffmpeg -y -v error -i "shots/$shot.mp4" -i "voice/$line.wav" \
    -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=3,crop=830:960:125:$y,scale=1080:1250:flags=lanczos,pad=1080:1920:0:420:$BG,$(text "$title" 84 200),$(text 'kitefolio.com' 44 1740 $GOLD)[v];[1:a]$VOICE,apad[a]" \
    -map "[v]" -map "[a]" -t "$seconds" "${ENC[@]}" "tmp/$index-$shot.mp4"
}
scene 1 lane 200 line-01 7.6 "Driving instructor"
scene 2 studio-desk 380 line-02 7.5 "Content marketer"
scene 3 control-room 470 line-03 5.3 "Operations manager"

# 5. A quick flick through other jobs' templates, then the end card.
JOBS=(clinic counsel mise skyline darkroom training-log)
inputs=()
for id in "${JOBS[@]}"; do inputs+=(-loop 1 -t 0.45 -i "../../public/templates/$id-phone.webp"); done
chain=""
for i in "${!JOBS[@]}"; do chain+="[$i:v]scale=880:-1,crop=880:1250:0:0,pad=1080:1920:100:420:$BG,setsar=1,fps=30[f$i];"; done
for i in "${!JOBS[@]}"; do chain+="[f$i]"; done
chain+="concat=n=${#JOBS[@]}:v=1:a=0,$(text 'Over 150 jobs' 84 200)[flick]"
ffmpeg -y -v error "${inputs[@]}" -filter_complex "$chain" -map "[flick]" -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -r 30 tmp/flick.mp4
ffmpeg -y -v error -f lavfi -i "color=c=$BG:s=1080x1920:r=30:d=3.4" \
  -vf "$(text 'kitefolio.com' 120 760 $GOLD),$(text 'Free to start' 64 920),$(text 'Comment your job below' 64 1010)" \
  -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p tmp/card.mp4
ffmpeg -y -v error -i tmp/flick.mp4 -i tmp/card.mp4 -i voice/line-04.wav \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[2:a]$VOICE,apad[a]" \
  -map "[v]" -map "[a]" -t 6.1 "${ENC[@]}" tmp/4-end.mp4

# Join everything.
# Paths in the list are relative to the list file itself (tmp/).
printf "file '%s'\n" 0-intro.mp4 1-lane.mp4 2-studio-desk.mp4 3-control-room.mp4 4-end.mp4 > tmp/list.txt
ffmpeg -y -v error -f concat -safe 0 -i tmp/list.txt -c copy -movflags +faststart out/tiktok-02.mp4
echo "Done: marketing/tiktok-02/out/tiktok-02.mp4"
