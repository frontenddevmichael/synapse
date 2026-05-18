# Continue Production Audit — Waves 2 through 7

Resume from where we left off. UploadDocumentDialog was extracted from Room.tsx. Continue the remaining work end-to-end without stopping.

## Wave 2 (finish) — Room.tsx decomposition
Extract from `src/pages/Room.tsx` into `src/components/room/`:
- `RoomHeader.tsx` — title, join code, member count, settings entry, upload trigger slot
- `DocumentList.tsx` — uploaded docs grid + preview/delete actions
- `QuizLauncher.tsx` — mode + question count selectors + start CTA
- `MembersPanel.tsx` — members list + presence indicators
Keep `Room.tsx` as orchestration only (data fetching, realtime subscriptions, composition). Preserve all behavior, RLS contracts, and Supabase queries exactly.

## Wave 3 — Quiz.tsx decomposition
Split `src/pages/Quiz.tsx`:
- `QuizSetup.tsx` — pre-quiz config
- `QuizPlay.tsx` — active question UI, timer, keyboard nav
- `QuizResults.tsx` — score, retry-mistakes, share
- `useQuizSession.ts` — state machine, scoring, persistence, active-session sync
`Quiz.tsx` becomes a thin phase router. Study / Challenge / Exam mode logic preserved exactly.

## Wave 4 — Skeleton loaders (remaining surfaces)
Replace `Loader2` page-level spinners with shadcn `Skeleton` on Dashboard, Room (docs/members/activity), and ActivityFeed. Keep spinners only for in-button async actions.

## Wave 5 — Targeted design polish
- Empty states: Dashboard (no rooms), Room (no documents) using existing illustrations + clear CTAs.
- `NotFound.tsx`: LostNeuronIllustration, brand voice, CTAs.
- `Auth.tsx`: tighten spacing, error states, Google button alignment.
- Normalize page padding rhythm across authenticated routes.
No token/color/typography changes.

## Wave 7 — Memoization pass
- Memoize hot paths in `useQuizSession` (shuffle, validation, timer callbacks).
- Memoize Dashboard derived stats and room list mapping.
- `React.memo` on leaf list components (room cards, activity items, member chips).
- Stable keys, avoid inline literals in deps.

## Execution rules
- Run all waves sequentially in a single pass; no mid-way questions.
- Verify after each wave with targeted file reads and build output. Fix regressions immediately.
- Preserve business logic, RLS, Supabase contracts, gamification math.
- Delete unused code freely; track a kill-list.

## Deliverable
Final summary: files removed, files refactored (before → after), UX changes, perf wins, anything deferred and why.
