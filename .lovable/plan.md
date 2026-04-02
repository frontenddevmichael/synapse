

## Audit & Enhancement Plan

### Audit Findings

**1. Document Upload** -- Looks solid now. Progress feedback with `extractTextFromPDFWithProgress`, stage indicators (`parsing`/`saving`/`error`/`done`), optimistic insert, and file size guards are all in place. No bugs found.

**2. Join-by-Code** -- RPC `join_room_by_code` is correctly implemented as `SECURITY DEFINER`. Dashboard calls it properly with auto-submit on 6 chars. JoinRoom page preserves destination through auth via `sessionStorage`. No bugs found.

**3. Share/QR** -- QR code via external API, copy link, native share all wired up correctly. No bugs found.

**4. Auth** -- Missing: password reset flow, stale refresh token handling. The auth logs show `Invalid Refresh Token: Refresh Token Not Found` errors that leave users in a broken state. No "Forgot password" option exists.

**5. Navigation** -- No consistent back-navigation pattern. Pages like Bookmarks, Preferences, Recall, Profile all have their own back buttons but there's no breadcrumb or unified nav on desktop. The landing page has no way to reach dashboard for logged-in users besides redirect.

---

### Implementation Plan

#### 1. Password Reset Flow
- Add "Forgot password?" link to Auth.tsx sign-in form
- Create `src/pages/ResetPassword.tsx` -- checks for `type=recovery` in URL hash, shows new password form, calls `supabase.auth.updateUser({ password })`
- Update `AuthContext.tsx` to expose `resetPassword(email)` which calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- Add `/reset-password` route to App.tsx

#### 2. Auth Hardening
- In `AuthContext.tsx`, handle `TOKEN_REFRESHED` and `SIGNED_OUT` events from `onAuthStateChange`
- On `SIGNED_OUT` event with stale token, clear local state cleanly to prevent broken session loops
- Add error boundary around auth state changes

#### 3. Google OAuth (optional enhancement)
- Add "Sign in with Google" button to Auth.tsx
- Call `supabase.auth.signInWithOAuth({ provider: 'google' })` -- requires user to configure Google provider in Supabase dashboard
- Will provide instructions for dashboard setup

#### 4. Better Navigation
- Create a shared `PageHeader` component used across all inner pages (Profile, Bookmarks, Preferences, Recall) with consistent back button, page title, and optional actions
- Add a desktop sidebar/top nav bar for authenticated pages showing: Rooms, Recall, Deck, Profile, Settings, Sign Out
- Ensure the mobile bottom nav and desktop nav stay in sync

#### 5. Minor Fixes
- JoinRoom: handle edge case where `code` param is empty
- Auth page: clear form errors when toggling between sign-in/sign-up
- Profile: add email display (read-only) so users know which account they're on

### Files to Create
- `src/pages/ResetPassword.tsx`

### Files to Modify
- `src/contexts/AuthContext.tsx` -- add `resetPassword`, handle stale tokens
- `src/pages/Auth.tsx` -- forgot password link, Google OAuth button, form reset on toggle
- `src/App.tsx` -- add `/reset-password` route
- `src/pages/Profile.tsx` -- show email
- `src/pages/Dashboard.tsx` -- refine desktop nav
- `src/components/MobileNav.tsx` -- minor consistency tweaks

### Validation
- Test forgot password: request reset, receive email, click link, set new password, sign in
- Test sign in/up toggle clears errors
- Test stale session recovery (clear cookies, reload)
- Test navigation consistency across all pages on both mobile and desktop

