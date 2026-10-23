# Personal Tools

A hub of small browser utilities. The first tool is **Image Slideshow → Video** (photos → timed MP4/WebM with intro, music, effects).

## Add another tool

1. Create a page in `src/pages/YourToolPage.tsx`
2. Register it in `src/lib/tools.ts` (`available: true`, set `path`)
3. Add a `<Route>` in `src/App.tsx`

## Run locally

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY (and optional PEXELS_API_KEY)
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Excellent117 Research Studio

Routes: `/tools/youtube-ideas` (alias `/tools/research-studio`).

Podcast research hub: generate episode ideas (OpenAI), Pexels reference images, YouTube pack, World Library, terminology, series tracking, saved scripts, thumbnail editor, and export to Slideshow → Video.

- **Data** stays in your browser (`localStorage`) unless you export a JSON backup in Settings.
- **API keys**: OpenAI (required), Pexels (optional). Dev: `.env.local`. Production: Vercel env vars or Research Studio → Settings (browser keys sent only to `/api/*` routes).
- **Tests**: `npm test` (dashboard stats logic).

Calls server routes under `/api/*`. In dev, Vite serves those routes using keys from `.env.local`. On Vercel, set the same variables in the project dashboard.

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

### Vercel (Git)

1. Push this repo to GitHub (`main`).
2. In [Vercel](https://vercel.com/new), **Import** the repository.
3. Leave defaults (Vite): **Build** `npm run build`, **Output** `dist`, **Install** `npm install`.
4. Add environment variables: `OPENAI_API_KEY`, optional `OPENAI_MODEL`, optional `PEXELS_API_KEY`.
5. Deploy. Each push to `main` triggers a new production deploy.

`vercel.json` sets the Vite build, `/api` serverless functions, and SPA rewrites. `postinstall` copies FFmpeg into `public/ffmpeg/` during install so slideshow exports work in production.

### GitHub Pages

The workflow in `.github/workflows/pages.yml` builds with `GITHUB_PAGES=true` for the `/personal_tools/` base path.

### Manual

```bash
npm run build
```

Upload `dist/`. **Note:** First visit loads ~30MB encoder assets from `/ffmpeg/` (created on `npm install`, not committed to git).

## Privacy

Images and audio stay on your device unless you deploy the app yourself; encoding runs entirely in the browser.
