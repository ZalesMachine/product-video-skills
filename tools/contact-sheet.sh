#!/usr/bin/env bash
# Contact sheet of a stretch of a render, to look at one scene closely.
#
#   tools/contact-sheet.sh <video.mp4> [start_s] [end_s] [step_s] [out.jpg]
#
# Default: the whole video, one frame every 2.5 s, 3 columns at 600 px. If your ffmpeg has the
# `drawtext` filter (Homebrew's doesn't), the time is printed on each frame; otherwise the frames
# have no text and the script prints the list of times. Example for a scene from 61.3 to 76.4 s,
# one frame per beat at 95 BPM (0.6316 s):
#   tools/contact-sheet.sh video/launch/renders/x-en.mp4 61.3 76.4 0.6316 scene.jpg
set -euo pipefail
FILM="${1:?usage: contact-sheet.sh <video.mp4> [start] [end] [step] [out.jpg]}"
START="${2:-0}"
END="${3:-$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FILM")}"
STEP="${4:-2.5}"
OUT="${5:-contact-sheet.jpg}"
N=$(python3 -c "import math;print(max(1,math.ceil(($END-$START)/$STEP)))")
COLS=3
ROWS=$(python3 -c "import math;print(math.ceil($N/$COLS))")
if ffmpeg -hide_banner -filters 2>/dev/null | grep -q ' drawtext '; then
  LABEL="drawtext=text='%{pts\:hms}':x=12:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6,"
else
  LABEL=""
fi
ffmpeg -v error -y -ss "$START" -to "$END" -i "$FILM" \
  -vf "fps=1/$STEP,scale=600:-1,${LABEL}tile=${COLS}x${ROWS}:padding=8:margin=8:color=0x111111" \
  -frames:v 1 "$OUT"
echo "→ $OUT ($N frames, from ${START}s to ${END}s every ${STEP}s, ${COLS} columns)"
if [ -z "$LABEL" ]; then
  echo "   (no drawtext in this ffmpeg; time per frame, left to right and top to bottom:)"
  python3 -c "s=$START;p=$STEP;n=$N;print('   '+'  '.join(f'{s+i*p:.1f}' for i in range(n)))"
fi
