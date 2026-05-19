## Remaining Work — Waves 2, 3, 7

Picking up the deferred items. Waves 1, 4, 5 are done; this plan finishes the audit.

### Wave 2 — Finish `Room.tsx` decomposition

Extract from `src/pages/Room.tsx` into `src/components/room/`:

- `RoomHeader.tsx` — title, join code copy, member count, settings entry, slot for upload trigger
- `DocumentList.tsx` — uploaded docs grid + preview/delete actions
- `QuizLauncher.tsx` — mode selector + question count + start CTA
- `MembersPanel.tsx` — members list + presence indicators

`Room.tsx` becomes orchestration only: data fetching, realtime subscriptions, state owners, composition. All Supabase queries, RLS contracts, gamification calls preserved verbatim — only JSX and local UI state move.

### Wave 3 — `Quiz.tsx` decomposition

Split `src/pages/Quiz.tsx` into:

- `src/hooks/useQuizSession.ts` — state machine, scoring, persistence, active-session sync, retry-mistakes flow
- `src/components/quiz/QuizSetup.tsx` — pre-quiz config (mode, count)
- `src/components/quiz/QuizPlay.tsx` — active question UI, timer, keyboard nav, Ghost/Exam mode behavior
- `src/components/quiz/QuizResults.tsx` — score, share, retry-mistakes CTA

`Quiz.tsx` becomes a thin phase router. Study/Challenge/Exam logic, XP awards, attempt persistence, hot-streak math preserved exactly.

### Wave 7 — Memoization pass

- Memoize hot paths in `useQuizSession` (shuffle, validation, callbacks via `useCallback`)
- Memoize Dashboard derived stats + room list mapping with `useMemo`
- `React.memo` on leaf list components (room cards, activity items, member chips, document cards)
- Audit deps arrays; remove inline object/array literals from deps

### Rules

- Sequential execution, no mid-way questions
- Verify after each wave with file reads; fix regressions immediately
- Preserve business logic, RLS, Supabase contracts, gamification math
- Delete dead code freely; track a kill-list

### Deliverable

Final summary: files added/removed, before→after line counts for `Room.tsx` and `Quiz.tsx`, perf wins, anything deferred with reason.
