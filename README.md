
# 集験アプリ — Shuken Apuri 🌸💕

~ A kawaii flashcard app for focused, fun learning!! ~

Shuken Apuri is a playful blend of "shuchuu" (focus) and "shiken" (exam) — like turning study sessions into cozy adventures! (＾▽＾) Designed for short, happy bursts of learning with soft pastels and gentle animations. Whether memorizing hiragana or math facts, make studying feel like a warm hug. ✨

---

## ✨ Features ~ Cute & Clever ~

- **Deck Magic**: Create, edit, and organize decks with adorable titles and descriptions 🌸
- **Card Fun**: Add front/back cards — supports multi-line answers and emojis! 💕
- **Study Modes**: Flip cards (spacebar magic), multiple choice (auto-distractors), or type answers (fuzzy match) 🎴
- **Smart Repetition**: Leitner-style spaced learning — cards move boxes based on your smarts! 🧠
- **Progress Glow**: Track mastery, due cards, and accuracy with pastel progress bars 📊
- **Share & Save**: Import decks from JSON or CSV, and export as JSON — share with friends or backup your brain! 📁

---

## 🛠️ Tech Stack ~ Kawaii Tools ~

- **Frontend**: React + Vite + Tailwind CSS (soft pastels & smooth vibes) 🌈
- **Routing**: React Router (navigating cutely) 🧭
- **Utils**: Fuse.js (fuzzy matching), Lucide icons (adorable icons) ✨
- **Backend (Optional)**: Node.js + Express (tiny server for sync) — falls back to localStorage if offline 💾
- **Extras**: ESLint + Prettier (keeping code cute), Vitest (tiny tests) 🧹

---

## 🚀 Quick Start ~ Let's Play! ~

```bash
cd c:\Users\pejan\Projects\shuken-apuri
npm install
npm run dev    # Open http://localhost:3000 and start studying! (๑˃ᴗ˂)ﻭ
# Optional: npm run server for backend sync
```

Create a deck, add cards, and study — that's it! � Happy learning, little scholar! (≧◡≦)っ ♡

---

## 🌐 Deployment (Student Free Path)

Recommended stack:

- **Frontend**: Vercel Hobby (or Netlify Free)
- **Backend API**: Render Free Web Service
- **Database**: Supabase Free Postgres

Why this combo:

- Keeps monthly cost near $0 for early usage
- Better persistence than file-based storage on ephemeral hosts
- Easy upgrade path when traffic grows

### 1) Create Supabase project

- Create a free project in Supabase
- Run SQL from `server/supabase/schema.sql` in Supabase SQL Editor
- Save these values:
	- `SUPABASE_URL`
	- `SUPABASE_SERVICE_ROLE_KEY` (backend only, never expose in frontend)

### 2) Deploy backend to Render

- Create a new **Web Service** from this repo
- Build command: `npm install`
- Start command: `npm run server`
- Add environment variables:
	- `PORT` = `10000` (Render sets this automatically, keep server using `process.env.PORT`)
	- `SUPABASE_URL` = your Supabase URL
	- `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service key

Backend behavior:

- If Supabase vars exist, API uses Supabase
- If Supabase vars are missing, API falls back to local JSON files in `server/data`

Important:

- Render production installs runtime deps only. Server packages must be in `dependencies`.

### 3) Deploy frontend to Vercel (or Netlify)

- Import repo in Vercel
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Add env var:
	- `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`

### 4) CORS and sync checks

- Ensure backend CORS allows your frontend domain
- Verify these endpoints after deploy:
	- `GET /api/health`
	- `GET /api/decks`

### Free-tier caveats

- Render free services can sleep when idle (first request may be slow)
- Supabase free projects can pause after inactivity
- App still has localStorage fallback when API unavailable

### 5) Optional: migrate existing local data to Supabase

Use this if you already have decks in `server/data/decks.json` and progress in `server/data/progress.json`.

```bash
# In project root, with Supabase env vars set
npm run migrate:supabase
```

Optional reset mode (destructive):

```bash
npm run migrate:supabase:reset
```

Reset mode deletes rows in `decks`, `cards`, and `deck_progress` before import.

