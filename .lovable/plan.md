

## Plan: Fix Account Creation + Proceed with Remaining Plan Items

### Issue 1: Account Creation (Supabase Confirmation Email)

**Root cause:** The Supabase project has no custom SMTP configured, so it relies on Supabase's built-in email service. Looking at the database, some users DO have confirmed emails (e.g., `ogundeleademilade@gmail.com` confirmed successfully), while others don't (e.g., `sebube2008@gmail.com`). This means Supabase's default email sending works intermittently — it's subject to rate limits (Supabase free tier: 2 emails/hour for auth).

**Fix approach — two options combined:**

1. **Immediate fix**: Go to the Supabase dashboard (Authentication > Providers > Email) and either:
   - Disable "Confirm email" toggle so users can sign in immediately without verification, OR
   - Configure a custom SMTP provider for reliable delivery

2. **Code-side improvement**: Update the Auth page to handle the unconfirmed state better — show a clear "check your email" screen with a resend button, and handle the "Email not confirmed" error gracefully on sign-in.

**What I will implement:**
- Add a "Resend confirmation" option on the Auth page when signup succeeds
- Improve error messaging for "Email not confirmed" on sign-in attempts
- Add a post-signup state that clearly tells the user to check their email (including spam folder)
- The user should go to their Supabase dashboard to either disable email confirmation or configure SMTP for reliable delivery

### Issue 2: Room Joining Independence (Already Working)

The code review confirms this is already correctly implemented:
- Quiz attempts use `user_id: user.id` (the authenticated user, not the room owner)
- XP, streaks, and achievements in `useGamification.ts` all query by `user.id`
- The `join_room_by_code` RPC is deployed and correctly inserts members with `role: 'member'`
- The leaderboard groups by individual user

No code changes needed here — the independence is already in place. The issue was that testing with multiple accounts was blocked by the signup problem (Issue 1).

### Remaining Plan Items

3. **Room sharing with QR code** — already implemented in Room.tsx (Share dialog with QR + copy link)
4. **`/join/:code` route** — already implemented in JoinRoom.tsx with auth persistence via sessionStorage

### Implementation Steps

| Step | File | Change |
|------|------|--------|
| 1 | `src/pages/Auth.tsx` | Add post-signup confirmation screen with "Resend email" button and spam folder hint |
| 2 | `src/pages/Auth.tsx` | Add resend confirmation flow for users who try to sign in but haven't confirmed |
| 3 | `src/contexts/AuthContext.tsx` | Add `resendConfirmation` method |

### What YOU Need to Do (Supabase Dashboard)

Go to your Supabase dashboard > Authentication > Providers > Email and either:
- **Option A**: Turn OFF "Confirm email" — users can sign in immediately (simpler, good for testing)
- **Option B**: Keep it ON but configure a custom SMTP (Gmail, SendGrid, etc.) for reliable delivery

The code changes I'll make will work with either option — they improve the UX around email confirmation regardless.

