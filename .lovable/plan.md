

## Diagnosis

### 1. Confirmation email redirects to broken page
The signup code sets `emailRedirectTo: window.location.origin + "/"`. In the preview environment, `window.location.origin` is `https://id-preview--8afeb885-c383-49cd-a25f-97bd4f6e6a7a.lovable.app`. However, Supabase only allows redirects to URLs that match the **Site URL** or are listed in **Redirect URLs** in the Supabase dashboard (Authentication > URL Configuration).

If the Supabase dashboard Site URL is set to the published URL (`https://synapse-quiz-wiz.lovable.app`) but you're testing in preview, the confirmation link will redirect to the published URL -- which may not match where you started, causing a "broken page" experience.

**Fix:** This is a Supabase dashboard configuration issue, not a code bug. You need to add both URLs to the allowed redirect list in Supabase:
- Go to https://supabase.com/dashboard/project/yhdwpzopbhdfpahpsouo/auth/url-configuration
- Set **Site URL** to your published URL: `https://synapse-quiz-wiz.lovable.app`
- Under **Redirect URLs**, add these patterns:
  - `https://id-preview--8afeb885-c383-49cd-a25f-97bd4f6e6a7a.lovable.app/**`
  - `https://synapse-quiz-wiz.lovable.app/**`
  - `http://localhost:3000/**` (for local dev)

### 2. Google sign-in button not working
The code calls `supabase.auth.signInWithOAuth({ provider: 'google' })` but Google OAuth must be configured in your Supabase dashboard first. Without it, the button will silently fail or show an error.

**Fix:** Configure Google OAuth in Supabase:
1. Go to https://console.cloud.google.com and create OAuth credentials (Web application type)
2. Set **Authorized JavaScript origins** to your site URLs (both preview and published)
3. Set **Authorized redirect URI** to `https://yhdwpzopbhdfpahpsouo.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret
5. Go to https://supabase.com/dashboard/project/yhdwpzopbhdfpahpsouo/auth/providers
6. Enable Google provider and paste the credentials

### 3. Room and QR code invitation
The code for join-by-code and QR sharing looks correct based on the previous audit. The `/join/:code` route exists, the `join_room_by_code` RPC is a `SECURITY DEFINER` function, and `sessionStorage` preserves the join destination through auth. **Testing on the published URL is recommended** to confirm it works end-to-end, since preview URL auth redirects may interfere.

### 4. Code improvement (minor)
Update the signup `emailRedirectTo` to point to `/dashboard` instead of `/` for a smoother post-confirmation experience.

---

## Summary of actions

**Dashboard configuration (you do manually):**
- Add redirect URLs in Supabase Auth URL Configuration
- Configure Google OAuth provider in Supabase dashboard

**Code change (I will implement):**
- Update `emailRedirectTo` in `AuthContext.tsx` to redirect to `/dashboard` after email confirmation
- Test the published URL for room/QR invitation flows

