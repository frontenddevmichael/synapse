# Synapse

Collaborative learning powered by AI-generated quizzes and spaced repetition. Upload study materials, generate quizzes, compete on leaderboards, and reinforce weak areas — all within private rooms.

---

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, SWC, Tailwind CSS, framer-motion, shadcn/ui (Radix primitives)

**Backend:** Supabase (Auth, Postgres, Storage, Edge Functions)

**AI:** OpenAI/Groq-compatible API for quiz generation

**PWA:** Installable, offline app shell with push notification support

---

## Features

- **Authentication** — Email/password + Google OAuth, password reset, email confirmation
- **Rooms** — Create/join via code, owner + admin roles, settings (mode, leaderboard), code regeneration
- **Documents → AI Quizzes** — Upload PDFs/DOCX or paste text; AI generates multiple-choice and true/false quizzes at configurable difficulty
- **Quiz modes** — Study (instant feedback), Challenge (timed, leaderboard), Exam (timed, no answers until end)
- **Spaced Repetition (Recall)** — SM-2 algorithm automatically identifies weak questions and schedules reviews
- **Pulse Analytics** — Member activity, weak questions, difficulty curves, untouched documents
- **Gamification** — XP, levels, streaks, hot streaks, 6 achievements (first_quiz, perfect_score, streak_7, hot_hand, collaborator, fortress), streak freeze
- **Bookmarks** — Save questions with personal notes
- **Leaderboards** — Per-room, per-quiz rankings
- **Preferences** — Default difficulty, time limits, answer reveal behavior
- **Offline support** — Read-only cache with 30-min TTL, offline banner
- **Error monitoring** — Global error boundary + console error logging to `error_logs` table

---

## Local Development

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Set your Supabase credentials in `.env`:
   - `VITE_SUPABASE_URL` — your project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — your anon key
   - `VITE_SUPABASE_PROJECT_ID` — your project reference

4. Run migrations against your Supabase project (via Dashboard SQL editor or `supabase link` + `supabase db push`)

5. Start the dev server:
   ```bash
   npm run dev
   ```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 8080 |
| `npm run build` | Production build |
| `npm test` | Run unit tests (vitest) |
| `npm test:e2e` | Run Playwright E2E tests |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview production build |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project reference |
| `VITE_VAPID_PUBLIC_KEY` | No | Web push VAPID key (for push notifications) |
| `RESEND_API_KEY` | No | Resend API key (for SMTP emails) |

---

## Project Structure

```
src/
├── components/       # UI components (shadcn + custom)
│   ├── analytics/    # ProgressChart, AnalyticsDashboard
│   ├── gamification/ # AchievementToast, LevelUpOverlay, XpProgress
│   ├── illustrations/# SVG illustration components
│   ├── quiz/         # QuizResults, QuizIntro, EditQuestionsDialog
│   ├── room/         # Room settings, PulseTab, ForgeTab, DocumentCard, etc.
│   └── ui/           # shadcn/ui primitives (button, dialog, select, etc.)
├── contexts/         # AuthContext, ThemeContext
├── hooks/            # useGamification, useOnlineStatus, usePushNotifications, etc.
├── lib/              # Motion config, document parsing, PDF parsing
├── pages/            # Route-level page components
└── utils/            # Level/XP math, SM-2 recall, Pulse analytics, tests
```

---

## Security Model

- **RLS on all tables** — Row-level security enforced at the Postgres level
- **`questions_public` view** — Excludes `correct_answer` from pre-submission reads
- **Server-side scoring** — `grade_quiz` and `award_xp` are SECURITY DEFINER RPCs
- **Gamification protection** — `prevent_gamification_tampering` trigger blocks direct XP/level writes; only `award_xp` RPC (w/ `set_config` bypass) can modify these fields
- **Room membership** — `join_room_by_code` RPC is the only insertion path; raw INSERT policy on `room_members` was dropped
- **Rate limiting** — Edge functions use `check_rate_limit` RPC (configurable per-function window)
- **CSP headers** — Configured in `vercel.json`

---

## License

MIT
