

## Current Feature Inventory & Production Readiness Audit

### What You Have Now
- **Auth**: Email/password signup, Google OAuth (needs dashboard config), password reset flow, session hardening
- **Rooms**: Create/join with 6-char codes, Study/Challenge/Exam modes, QR sharing, invite links
- **Documents**: PDF/text upload with progress, content extraction
- **Quiz Engine**: AI-generated quizzes from documents, multiple choice + true/false, timed modes, keyboard navigation, retry mistakes, bookmark questions
- **Gamification**: XP/levels, streaks, achievements, confetti, daily activity tracking
- **Spaced Repetition (Recall)**: Auto-populated from wrong answers, SM-2 algorithm
- **Bookmarks**: Save and review questions
- **Analytics**: Progress charts, stats cards
- **PWA**: Service worker, install prompt
- **Realtime**: Active users indicator, activity feed
- **User Forge**: Community-submitted questions

---

### Improvements to Existing Features

**1. Loading & Error States (High Priority)**
Every page does `if (!user) navigate('/auth')` inline -- no route guards. A single `ProtectedRoute` wrapper would prevent flash-of-content and centralize auth redirects.

**2. Room Page is 1,050 lines (High Priority)**
`Room.tsx` handles upload, quiz generation, leaderboard, members, documents, settings, and sharing all in one file. Splitting into composable components would improve maintainability.

**3. Quiz -- No "Review All Answers" Screen**
After completing a quiz, users see their score but can't scroll through all questions with explanations side-by-side. A post-quiz review screen showing each question, selected answer, correct answer, and explanation is standard for education apps.

**4. Profile -- No Avatar Upload**
The `profiles` table has an `avatar_url` column but there's no UI to upload or change an avatar. No Supabase storage bucket exists yet.

**5. Search & Filtering**
No way to search rooms, quizzes, documents, or bookmarks. As users accumulate content, this becomes critical.

**6. Room Owner Controls**
Room owners can't remove members, transfer ownership, or archive/delete rooms from the UI.

**7. Recall Page -- No Stats**
The spaced repetition page shows cards but no metrics (cards mastered, retention rate, review streak). Users can't see their learning progress over time.

---

### Features to Add for Production Grade

**8. Email Verification Gate**
Currently, unverified users can access everything. Add a check: if `user.email_confirmed_at` is null, show a "verify your email" banner and restrict quiz creation.

**9. Account Deletion**
GDPR/privacy compliance requires users to be able to delete their account and data. This needs a Supabase edge function with service role access to cascade-delete user data.

**10. Rate Limiting on Quiz Generation**
The AI edge function has no per-user rate limiting. A user could spam quiz generation and exhaust credits. Add a cooldown or daily quota.

**11. Notifications System**
No in-app notifications when: someone joins your room, a new quiz is created in a room you belong to, or your recall cards are due. A `notifications` table + bell icon would drive engagement.

**12. Public/Discoverable Rooms**
Rooms have a `broadcast` flag in the schema but there's no "Explore" or "Discover" page where users can browse public rooms and join.

**13. Export & Print**
Users can't export quiz results, bookmarks, or recall cards as PDF/CSV for offline study.

**14. Accessibility (a11y)**
No skip-to-content links, some interactive elements lack proper ARIA labels, quiz answer selection doesn't announce correctness to screen readers.

**15. SEO & Meta Tags**
The landing page has no dynamic `<meta>` tags for social sharing (OG image, description). Adding `react-helmet-async` would improve link previews when sharing.

---

### Recommended Priority Order

| Priority | Item | Effort |
|----------|------|--------|
| 1 | ProtectedRoute wrapper (auth guard) | Small |
| 2 | Post-quiz review screen | Medium |
| 3 | Room page refactor (split components) | Medium |
| 4 | Search/filter for rooms & bookmarks | Medium |
| 5 | Avatar upload (storage bucket + UI) | Medium |
| 6 | Room owner controls (kick/transfer) | Medium |
| 7 | Email verification gate | Small |
| 8 | Account deletion | Medium |
| 9 | Discover public rooms page | Medium |
| 10 | Notifications system | Large |
| 11 | Quiz generation rate limiting | Small |
| 12 | Export/print results | Medium |
| 13 | Recall stats dashboard | Medium |
| 14 | SEO meta tags | Small |
| 15 | Accessibility audit | Medium |

Let me know which items you'd like to tackle first and I'll create a detailed implementation plan.

