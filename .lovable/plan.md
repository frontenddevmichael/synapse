# Fix Document Upload + Sitewide Cleanup

## Phase 1 — Fix Upload (root cause)

The upload picker in `src/pages/Room.tsx` uses `accept=".pdf,.txt,.md"` and only branches on `file.type === 'application/pdf'`. On many devices (Safari/iOS, some Android, even desktop when MIME is unknown) this either blocks the picker silently or accepts a file that can't be parsed — matching your "nothing happens at all" symptom. There's also no console output, so failures are invisible.

**Fixes:**
- Broaden `accept` to `.pdf,.txt,.md,.docx,.csv,application/pdf,text/plain,text/markdown,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document` so the OS picker doesn't silently filter the file out.
- Detect type by **extension** (not just `file.type`) and route accordingly:
  - `.pdf` → existing pdf.js path
  - `.txt`, `.md`, `.csv` → `file.text()`
  - `.docx` → add `mammoth` (`bun add mammoth`) and use `extractRawText({ arrayBuffer })`
  - Unknown → clear toast: "Unsupported file type — use PDF, DOCX, TXT, MD".
- Add a top-level try/catch around `handleFileSelect` with `console.error` so failures surface in logs.
- Add **drag-and-drop** to the dropzone (currently click-only).
- Reset `<input value="">` after each pick so re-selecting the same file re-fires `onChange`.
- Update help text from "PDF, TXT, or MD" → "PDF, DOCX, TXT, MD, CSV (max 10 MB)".
- Show inline error message in the dialog when parsing fails (not just a toast that auto-dismisses).

## Phase 2 — Sitewide Bug Sweep

Issues spotted in audit:

1. **Service worker over-aggressive caching** (`public/service-worker.js`) — caches every successful GET into `synapse-dynamic-v1` including the SPA HTML, so users can see stale UI after deploys. Switch SPA navigations to network-first with no-store fallback to `/`, only cache static assets + fonts.
2. **Index page redirect race** — even with the recent hooks fix, the `?landing=1` flow still flashes for ~1 frame. Render `null` while `loading`.
3. **Activity feed query** (`ActivityFeed.tsx`) filters `quiz.room_id` via embedded join — Supabase ignores this filter when the FK alias resolves ambiguously. Replace with: fetch quiz IDs for the room first, then `attempts.in('quiz_id', ids)`.
4. **Room.tsx leaderboard / fetchRoomData** is called twice on mount in some paths (after upload). Confirm and dedupe.
5. **MobileNav** active state for `/quiz/:id` — currently no tab is active during a quiz; highlight the originating "Rooms" tab.
6. **Profile page** "Sign out" button has no loading state — disable + spinner during signOut.
7. **Empty bookmark/recall states** — add a "Browse rooms" CTA to dead-end empty states.
8. **Dialog scroll lock on mobile** — Upload dialog content can overflow on 360px viewports; add `max-h-[90vh] overflow-y-auto` to `DialogContent`.
9. **Toast duplication** — `handleUploadDocument` calls `fetchRoomData()` *and* optimistically prepends, causing a brief duplicate row. Drop the optimistic insert (refetch is fast enough) or dedupe by id.
10. **Auth.tsx** — pressing Enter inside the username field on signup doesn't submit because the form lacks `onSubmit`; convert div to `<form>`.

## Phase 3 — UI Polish

- Add a subtle "Drop file here" highlight when dragging over the dropzone.
- Show extracted character count + a 200-char preview before allowing Upload.
- Replace the two stacked spinners in the Upload button (lines 637–638) with a single one.
- Standardize the destructive-confirmation copy across Room (delete doc / delete quiz / leave room).
- Verify all pages clear loading state on error (currently `Recall` and `Bookmarks` get stuck on a spinner if Supabase rejects).

## Files Affected

| File | Change |
|------|--------|
| `src/pages/Room.tsx` | Upload handler, accept attr, drag-drop, dialog overflow, dedupe |
| `src/lib/pdfParser.ts` | Add `extractTextFromDocx` helper (or new `documentParser.ts`) |
| `package.json` | Add `mammoth` |
| `public/service-worker.js` | Network-first for navigations |
| `src/pages/Index.tsx` | Render null while loading |
| `src/components/room/ActivityFeed.tsx` | Two-step query for attempts |
| `src/components/MobileNav.tsx` | Active state for `/quiz/:id` |
| `src/pages/Profile.tsx` | Sign-out loading state |
| `src/pages/Bookmarks.tsx`, `src/pages/Recall.tsx` | Error-clears-loading + CTA |
| `src/pages/Auth.tsx` | Wrap fields in `<form>` |

No DB migrations, no new secrets, no breaking changes. Edge functions untouched.
