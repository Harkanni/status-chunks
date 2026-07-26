# Status Splitter

A local React app that cuts a video into fixed-length chunks — built for slicing
long videos into 90-second pieces for WhatsApp status, but the length is
adjustable to anything you need.

Everything runs **in your browser**, on your machine. No file is uploaded to
any server. The only network request is a one-time ~30 MB download of the
video-processing engine (`ffmpeg.wasm`) the first time you use it — do that
part on Wi-Fi. Every split after that works fully offline.

## Setup

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## How to use it

1. Drop in a video, or click "Choose a file".
2. Set the clip length in seconds (90s is pre-selected for WhatsApp status).
3. Pick a cut mode:
   - **Fast** — no re-encoding, so it's near-instant, but a clip's actual
     length can drift slightly because it snaps to the nearest keyframe in
     the source video.
   - **Precise** — re-encodes the video so every clip is exactly the length
     you asked for. Slower, especially on longer videos.
4. Click **Split**. When it's done, preview each clip, download them one by
   one, or grab all of them as a single `.zip`.

## Notes

- Works in any modern desktop browser (Chrome, Edge, Firefox). Large 4K
  files can be slow or memory-heavy since everything processes in-browser —
  if a big file struggles, try trimming it down first or use Precise mode
  with a lower resolution source.
- To build a static production version instead of running the dev server:
  `npm run build`, then serve the `dist/` folder however you like.
