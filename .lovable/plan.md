

# Audit & Improvement Plan for Synapse

## Findings

### 1. Room Joining
- The `join_room_by_code` RPC is correctly implemented as a `SECURITY DEFINER` function, bypassing RLS.
- Dashboard join flow uses auto-submit on 6 characters and the RPC — working correctly.
- `/join/:code` route exists with auth persistence via sessionStorage — working correctly.
- **Issue found:** After joining via Dashboard dialog, the user is NOT navigated to the room on `status === 'joined'`. They stay on the dashboard and have to find/click the room manually.

### 2. Independent Quiz Answering
- `Quiz.tsx` line 166: `user_id: user.id` — correct, each user gets their own attempt.
- `useGamification.ts`: all XP, streaks, achievements scoped to `user.id` — correct.
- Leaderboard in `Room.tsx` aggregates by individual `user_id` — correct.
- **No issues found.** Each member's quiz data is fully independent.

### 3. Google Sign-In
- **Not implemented.** No `signInWithOAuth` or Google references exist anywhere in the codebase. Needs to be added.

### 4. Navigation Gaps
- Room page and Quiz page have no bottom nav and no way to get to Profile/Bookmarks/Recall without going back to Dashboard first.
- No desktop sidebar — just icon buttons in the Dashboard header. Other pages (Bookmarks, Profile, Preferences, Recall) have no desktop nav at all beyond a back button.
- `MobileNav` only shows on 5 specific paths — not on Room or Quiz pages.
- **No "Forgot Password" flow** exists despite being a standard auth feature.

### 5. Other Improvements Identified
- No loading/empty states for the Analytics tab.
- Room page doesn't show which rooms the user owns vs. joined.
- No way to leave a room as a member.
- No confirmation before deleting a quiz or document (documents have AlertDialog but quizzes do not).

---

## Implementation Plan

### Step 1: Fix Join Room Navigation
**File:** `src/pages/Dashboard.tsx`
- After `status === 'joined'`, navigate to `room/${result.room_id}` (currently missing).

### Step 2: Add Google OAuth Sign-In
**Files:** `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`
- Add `signInWithGoogle` method to AuthContext using `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Add a "Continue with Google" button on the Auth page with a divider ("or").
- Note: The user must configure Google OAuth credentials in their Supabase dashboard (Authentication > Providers > Google) for this to work.

### Step 3: Add Forgot Password Flow
**Files:** `src/pages/Auth.tsx` (add link), new `src/pages/ResetPassword.tsx`, `src/App.tsx` (add route)
- Add "Forgot password?" link on the sign-in form.
- Implement password reset request using `supabase.auth.resetPasswordForEmail()`.
- Create `/reset-password` page that handles the `type=recovery` callback and calls `supabase.auth.updateUser({ password })`.

### Step 4: Improve Sitewide Navigation
**Files:** `src/components/MobileNav.tsx`, `src/App.tsx`, `src/pages/Room.tsx`, `src/pages/Quiz.tsx`
- Extend `MOBILE_NAV_PATHS` to include `/room/` prefix paths so bottom nav appears in rooms (but not during active quizzes).
- Add a consistent desktop sidebar/nav component that appears on all authenticated pages (Dashboard, Room, Bookmarks, Profile, Preferences, Recall).

### Step 5: Add "Leave Room" for Members
**File:** `src/pages/Room.tsx`
- Add a "Leave room" button (visible only to non-owner members) that deletes the user's `room_members` row and navigates back to Dashboard.

### Step 6: Minor UX Fixes
- Add delete confirmation for quizzes (AlertDialog like documents already have).
- Show owner badge on room cards in the Dashboard.
- Add a "Forgot password?" link on the sign-in form.

---

## Files Affected

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Google OAuth button, forgot password link, reset email form |
| `src/contexts/AuthContext.tsx` | `signInWithGoogle`, `resetPassword` methods |
| `src/pages/ResetPassword.tsx` | New — password reset page |
| `src/pages/Dashboard.tsx` | Navigate to room after joining, owner badge on cards |
| `src/pages/Room.tsx` | Leave room button for members, quiz delete confirmation |
| `src/components/MobileNav.tsx` | Show on room pages |
| `src/App.tsx` | Add `/reset-password` route, update mobile nav paths |

## Prerequisites (User Action Required)
- **Google OAuth:** Configure Google OAuth in Supabase dashboard (Authentication > Providers > Google) with your Google Cloud credentials. The code will be ready, but sign-in won't work until this is configured.

