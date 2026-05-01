## Audit Findings

### Critical: Missing headers on every authenticated page
The previous refactor removed each page's local header (Logo + ThemeToggle + back button) and created a shared `PageHeader` component — but `PageHeader` is **never imported or rendered anywhere**. Result on mobile right now:
- No logo, no theme toggle, no back arrow, no sign-out.
- The only navigation is the 5-tab bottom bar (Rooms / Recall / Deck / Profile / Settings).
- No way to return to the marketing landing page (`/`).
- No way to sign out from a phone at all (sign-out only exists in the desktop sidebar).

### Other issues found
1. **Mobile bottom-nav is full** — adding a 6th item would crowd it. Sign-out + landing link belong in an overflow menu in the header instead.
2. **Bookmarks/Recall/Preferences/Profile/Room** all have unused `ArrowLeft`, `Logo`, `ThemeToggle` imports left over from the refactor (lint noise + dead code).
3. **Profile page** has no sign-out, no email shown, no way to verify which account you're on.
4. **Recall page** has no header — once you're deep in a card flip session there's no way back without using the bottom nav.
5. **Room page** has its own large internal header but no consistent global header; back-to-dashboard logic duplicated.
6. **Index (landing)** redirects logged-in users to `/dashboard` with no way to revisit the marketing page once authenticated (the new header will fix this via a "Home" link in the overflow menu).
7. **DesktopNav** has no logo at the top and no link back to the marketing site — feels disconnected.
8. **Auto-redirect race**: `Index.tsx` fires `navigate('/dashboard')` inside `useEffect` while still rendering the landing markup, causing a brief flash. Should render `null` (or a loader) while `loading || user` is true.
9. **MobileNav active state**: `/dashboard` is active only on exact match — visiting `/room/:id` shows nothing highlighted. Should treat room routes as part of the Rooms tab (DesktopNav already does this; MobileNav doesn't).
10. **Quiz page** uses `ProtectedRoute` directly (no layout) — correct, since nav must hide during a quiz. Keep as-is.
11. **Theme toggle** is unreachable on mobile after sign-in (it lived in the old per-page headers). Must be restored.
12. **Skeleton component** exists but is unused — Dashboard uses a hand-rolled `animate-pulse` div, Profile/Bookmarks/Recall use a full-screen spinner. Inconsistent.

## Plan

### Phase 1 — Restore global header (highest priority)

Wire `PageHeader` into `AuthenticatedLayout` so every protected page automatically gets it, and extend it to cover the missing functionality.

**Update `PageHeader.tsx`:**
- Always render the Logo (left) + actions + ThemeToggle (right).
- On mobile only: show a back-arrow that goes to `backTo` (default `/dashboard`).
- Add a **user menu** (avatar/initial dropdown) with: "Home" (→ `/`), "Profile", "Settings", separator, "Sign out". Visible on all screen sizes — this is the mobile sign-out path.
- Use `DropdownMenu` from shadcn (already available).

**Update `AuthenticatedLayout.tsx`:**
- Render `<PageHeader />` above `{children}` so every protected page has it for free.
- Add an optional prop or context if a page needs to override (Room page already has a heavy in-page header — pass a flag to suppress the default header on `/room/:id`, or simplify Room's header to use `PageHeader` with custom `actions`).

**Cleanup pages:** remove dead `Logo`, `ThemeToggle`, `ArrowLeft` imports from Profile, Bookmarks, Recall, Preferences (they're now in the shared header).

### Phase 2 — Navigation polish

- **MobileNav active state**: treat `/room/:id` as part of the Rooms tab (mirror DesktopNav logic).
- **DesktopNav**: add the Logo at the top of the sidebar so the brand is visible from any page.
- **Index page flash**: render a small loader (or `null`) when `loading` or `user` is truthy, instead of rendering full marketing markup before the redirect fires.
- **Sign-out flow**: route through a single `handleSignOut` helper used by both the desktop sidebar button and the new header dropdown — toasts a confirmation and navigates to `/`.

### Phase 3 — UI polish & consistency

- Replace full-screen spinner loading states in Profile / Bookmarks / Recall / Preferences with the existing `Skeleton` component for perceived-performance parity with the rest of the app.
- Show the user's email under their name in the header dropdown so people know which account they're on (useful given the auth issues earlier in this project).
- Add an "Email not verified — resend" inline notice in the header dropdown when `user.email_confirmed_at` is null (uses the existing `resendConfirmation` from AuthContext).
- Tighten the mobile bottom-nav: shrink "Settings" → keep the Settings icon but the drop-down "Sign out" is now the primary mobile sign-out, so we can leave the 5-tab layout intact.

### Phase 4 — Small bug fixes / improvements found during audit

- **Bookmarks**: when a question is deleted upstream, the join filter already drops it — fine. Add a visible empty-state CTA "Bookmark a question from a quiz" linking back to `/dashboard`.
- **Recall**: when `cards.length === 0`, show a friendlier illustration + "Come back tomorrow" copy instead of bare text. Add a "Back to dashboard" CTA.
- **Profile**: add an "Account" section row showing the email (read-only) and a "Sign out" button as a backup affordance.
- **Preferences**: page renders a spinner before paint — replace with skeleton card.
- **Room page**: the big in-page header currently re-implements logo + theme toggle + back. Slim it down to use `PageHeader` (with the room name in the actions slot) for consistency.

### Phase 5 — Verification

- Browse the preview at mobile viewport (375×812): confirm header is present on Dashboard, Profile, Bookmarks, Recall, Preferences, Room. Confirm the avatar dropdown opens and Sign-out works.
- Browse at desktop viewport (1366×768): confirm sidebar logo, sidebar sign-out, and header dropdown all behave; redundancy is intentional.
- Click "Home" from the header dropdown while signed in → lands on `/` without auto-redirecting back to dashboard (we'll allow `?stay=1` or simply skip the redirect when navigating from inside the app — easiest: have the header link go to `/?landing=1` and Index respects that flag).

## Files Changed

| File | Change |
|---|---|
| `src/components/PageHeader.tsx` | Rewrite: always-visible logo, theme toggle, user dropdown with Home/Profile/Settings/Sign out, email + verify-resend in dropdown |
| `src/components/AuthenticatedLayout.tsx` | Render `<PageHeader />` by default; accept `header` override prop |
| `src/components/DesktopNav.tsx` | Add Logo at top of sidebar; treat `/room/*` as Rooms-active (already does) |
| `src/components/MobileNav.tsx` | Treat `/room/*` as Rooms-active |
| `src/pages/Index.tsx` | Render loader/null while redirecting; honor `?landing=1` to stay on landing for signed-in users |
| `src/pages/Dashboard.tsx` | Remove now-redundant top spacing; keep XP strip |
| `src/pages/Profile.tsx` | Drop dead imports; replace spinner with skeleton; add email + sign-out row |
| `src/pages/Bookmarks.tsx` | Drop dead imports; skeleton loader; empty-state CTA |
| `src/pages/Recall.tsx` | Drop dead imports; friendlier empty state |
| `src/pages/Preferences.tsx` | Drop dead imports; skeleton loader |
| `src/pages/Room.tsx` | Slim header to use `PageHeader` with room-name actions |

## Out of Scope
- Google OAuth still requires the dashboard config the user already knows about.
- Custom SMTP for confirmation emails — separate concern.
- Push notifications / offline caching — flagged earlier, not part of this pass.
