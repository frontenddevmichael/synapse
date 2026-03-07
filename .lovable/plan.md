

## Synapse — What's Left to Implement

### What's Already Working
- Authentication (email/password, sessions, auth context)
- Room creation, joining via codes, room modes (study/challenge/exam)
- Document upload (paste text + PDF parsing via CDN worker)
- AI quiz generation via Supabase Edge Function
- Quiz taking with question navigation, timer, study mode feedback
- Leaderboard per room
- User preferences (difficulty, time limit, answer reveal)
- Gamification basics (XP, levels, streaks, achievements)
- PWA manifest, service worker, install prompt
- Landing page with scroll animations
- Dark/light theme
- Dashboard with rooms list + analytics tab

---

### What's Missing or Incomplete

#### 1. Gamification Logic Not Wired to Quiz Completion
The `useGamification` hook has functions like `recordQuizCompletion` and `checkAchievements`, but the Quiz page (`Quiz.tsx`) does **not call them** after submitting a quiz. XP, streaks, daily activity, and achievement checks are never triggered during actual gameplay.

**Impact:** The entire gamification system is cosmetic — nothing updates.

#### 2. Daily Activity Tracking Not Written
The `daily_activity` table exists but no code writes to it. The `ActivityCalendar` component fetches from it but will always show empty data.

#### 3. Offensive/Defensive Streak Logic Not Implemented
The database has `hot_streak`, `best_hot_streak`, `streak_freeze_count`, `streak_freeze_available`, `xp_multiplier`, `perfect_scores` columns, but no code reads or writes to them. The new achievements (hot_hand, rampage, blitz, comeback_kid, fortress, etc.) exist in the DB but have no trigger logic.

#### 4. Room Settings Management
Room owners cannot:
- Change room mode after creation
- Toggle leaderboard on/off
- Remove members
- Delete the room
- Set room-level time limits

#### 5. Document Management
- No way to delete documents
- No document preview/viewer
- No file size validation before upload
- No Supabase Storage integration (content stored as text in DB only)

#### 6. Quiz Management
- No way to delete quizzes
- No quiz results history per user
- No retake flow for study/challenge modes (only exam mode blocks retakes)
- No quiz sharing or export

#### 7. Profile Page
- No user profile page (display name, avatar, stats overview)
- No way to change username or display name after signup
- No avatar upload

#### 8. Real-time Features
- `ActiveUsersIndicator` component exists but isn't used anywhere
- `useActiveSession` hook exists but isn't integrated into quiz-taking
- No real-time updates when new members join or quizzes are created

#### 9. Notifications
- No in-app notifications for achievements, room invites, or quiz completions
- Push notification support is stubbed in the service worker but not implemented

#### 10. Offline Support
- Service worker caches app shell but doesn't cache room/quiz data
- No offline quiz-taking capability
- No sync-when-back-online flow

#### 11. Error Boundaries and Edge Cases
- No global error boundary
- No 403/unauthorized handling for rooms user doesn't belong to
- No loading states for edge function calls (quiz generation can take 10-30s with no timeout handling)

#### 12. Security
- `generate-quiz` edge function has `verify_jwt = false` — anyone can call it without auth
- No rate limiting on quiz generation
- Room membership isn't verified before allowing document upload or quiz generation

---

### Recommended Priority Order

1. **Wire gamification to quiz completion** — highest impact, makes the existing system functional
2. **Room settings for owners** — basic expected functionality
3. **Profile page** — users need to see and manage their identity
4. **Enable JWT verification on edge function** — security fix
5. **Document/quiz deletion** — basic CRUD completion
6. **Real-time features** — leverage existing components
7. **Offline quiz caching** — PWA differentiation
8. **Push notifications** — engagement driver

