# Full Audit — Waves 2 through 7

Continue the ruthless production audit, executing every remaining wave back-to-back without stopping for confirmation.

## Wave 2 — Room.tsx Refactor
Split the 1100+ line `src/pages/Room.tsx` into focused components under `src/components/room/`:
- `RoomHeader.tsx` — title, join code, member count, settings entry
- `UploadDialog.tsx` — file input, drag/drop, parser progress, error states (extract from Room)
- `DocumentList.tsx` — uploaded documents grid + previews
- `QuizLauncher.tsx` — mode/question-count selectors and start CTA
- `MembersPanel.tsx` — member list + presence
Keep `Room.tsx` as orchestration only (data fetching + composition). Preserve all existing behavior; no API/schema changes.

## Wave 3 — Quiz.tsx Refactor
Split `src/pages/Quiz.tsx` into:
- `QuizSetup.tsx` — pre-quiz configuration screen
- `QuizPlay.tsx` — active question rendering, timer, keyboard nav
- `QuizResults.tsx` — score, retry-mistakes, share
- `useQuizSession.ts` (hook) — state machine, scoring, persistence
`Quiz.tsx` becomes a thin router between phases. Preserve Study/Challenge/Exam mode logic exactly.

## Wave 4 — UX Polish (Skeletons)
Replace `Loader2` spinners with shadcn `Skeleton` loaders on:
- `Dashboard.tsx` (room cards, stats grid)
- `Room.tsx` (documents, members, activity feed)
- `Bookmarks.tsx` (card list)
- `Recall.tsx` (deck list)
- `ActivityFeed.tsx`
Keep spinners only for in-button / inline async actions.

## Wave 5 — Targeted Design Polish
- Redesign empty states for Bookmarks, Recall, Dashboard (no rooms), Room (no documents) using existing illustration components (`EmptyDeckIllustration`, `EmptyDeskIllustration`, `LostNeuronIllustration`) with clear CTAs.
- Polish `NotFound.tsx` with `LostNeuronIllustration`, brand voice copy, and CTAs to Dashboard / Home.
- Tighten `Auth.tsx` spacing, error states, and Google button alignment.
- Ensure consistent page padding and section rhythm across authenticated routes.
No changes to core flows, colors, or typography tokens — polish only within the existing Ink & Voltage system.

## Wave 6 — Dependency Cleanup
- Run ripgrep to find unused shadcn/ui components in `src/components/ui/` and delete the ones with zero imports.
- Audit `package.json` for unused Radix primitives and remove them via `bun remove`.
- Remove any orphaned hooks/utilities surfaced by the scan.
- Verify build after pruning.

## Wave 7 — Logic Optimization
- Audit `Quiz.tsx` / `useQuizSession` hot paths: memoize question shuffling, answer validation, and timer callbacks with `useMemo`/`useCallback`.
- Memoize Dashboard derived stats and room list mapping.
- Convert expensive list renders to stable keys; avoid inline object/array literals in deps.
- Add `React.memo` to leaf presentational components rendered in lists (room cards, activity items, member chips).

## Execution Rules
- Run all waves sequentially in a single pass; do not stop to ask questions.
- Verify after each wave: build output + targeted file reads. Fix regressions immediately.
- Preserve all business logic, RLS, and Supabase contracts.
- Delete freely when code is unused; keep a short kill-list in the final summary.

## Deliverable
Final summary covering:
- Files removed (with reason)
- Files refactored (before → after structure)
- UX changes (skeletons, empty states, NotFound, Auth)
- Dependencies pruned
- Perf wins (memoization, lazy boundaries)
- Anything intentionally deferred and why
