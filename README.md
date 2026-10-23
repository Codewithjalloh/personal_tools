# Image Slideshow → Video

Browser-based slideshow editor: upload images, intro/outro titles, music, effects, and export MP4/WebM — no server upload required.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Features

- Upload & auto-resize large photos (max 1920px edge)
- Drag-reorder slides, per-slide custom duration, keyboard ← →
- Intro & outro title cards (text, colour, duration 3–15s, size, position, bar)
- Templates: Instagram Story, YouTube Short, Wedding
- Crossfade, Ken Burns zoom, background music
- Fast draft preset (720p, quick MP4)
- Project auto-saves in browser (IndexedDB + localStorage)
- Export MP4/WebM via FFmpeg WASM (`public/ffmpeg/` copied on `npm install`)

## Deploy

Static hosting works (Vercel, Netlify, GitHub Pages with SPA fallback).

```bash
npm run build
```

Deploy the `dist/` folder. `vercel.json` includes SPA rewrites.

**Note:** First visit loads ~30MB encoder assets from `/ffmpeg/`; ensure those files are deployed (from `public/ffmpeg`).

## Privacy

Images and audio stay on your device unless you deploy the app yourself; encoding runs entirely in the browser.
