

# Synapse -- Pixel-Perfect Responsive Refactor Plan

## The Problem

Every page currently uses the same lazy responsive pattern: `sm:` and `lg:` breakpoints sprinkle slightly different padding and font sizes, but the **information architecture, layout flow, and interaction patterns are identical** between a 375px phone and a 1400px desktop. The result is a shrunken desktop on mobile -- not a mobile-native experience.

## Design Philosophy: Device-Native, Not Device-Shrunk

Three distinct layout personas:

```text
┌─────────────┐  ┌───────────────────┐  ┌──────────────────────────┐
│   MOBILE    │  │      TABLET       │  │        DESKTOP           │
│  < 640px    │  │   640px-1024px    │  │       > 1024px           │
│             │  │                   │  │                          │
│ Single col  │  │ 2-col adaptive   │  │ Bento grid, panels,      │
│ Bottom nav  │  │ Collapsible side │  │ persistent sidebar       │
│ Stacked     │  │ Hybrid layout    │  │ Full spatial layout      │
│ Thumb-zone  │  │                   │  │                          │
└─────────────┘  └───────────────────┘  └──────────────────────────┘
```

---

## 1. Global Infrastructure Changes

### A. Mobile Navigation Bar (Bottom Nav)
Currently: Header with 5+ icon buttons crammed horizontally on mobile.
**New**: On `< 640px`, replace the header icon row with a **fixed bottom navigation bar** (thumb-friendly, 5 items max: Rooms, Progress, Bookmarks, Profile, Settings). The header simplifies to just Logo + ThemeToggle.

### B. Safe Area & Viewport Awareness
- Add `env(safe-area-inset-bottom)` padding to bottom nav and fixed banners for notch phones
- Add `viewport-fit=cover` to `index.html` meta tag
- PWA banner must stack above the bottom nav, not overlap it

### C. Touch Target Minimums
- Audit every button, tab trigger, and interactive element: enforce 44px minimum touch targets on mobile
- Quiz answer options: increase to `min-h-[56px]` on mobile (currently `p-5` which can compress)
- Question dot navigation at quiz bottom: increase from `w-2.5 h-2.5` to `w-3.5 h-3.5` on mobile with `gap-2`

### D. Responsive Type Scale
Add a mobile-specific type scale. Currently `text-display-lg` is `3.5rem` on all sizes -- far too large on 375px screens.
```
Mobile:  display-lg → 2rem,  display-md → 1.75rem
Tablet:  display-lg → 2.75rem, display-md → 2.25rem
Desktop: unchanged
```

---

## 2. Landing Page (Index.tsx)

### Current Issues
- Hero h1 `text-display-lg` (3.5rem) overflows on small screens
- QuickStat row uses fixed `gap-8` which forces horizontal scroll at 320px
- "How it works" 3-card grid collapses to 1-col but cards are oversized
- Mode cards: `sm:grid-cols-2` means the "featured" Challenge card gets no special treatment on mobile
- CTA section buttons `w-full sm:w-auto` is fine but padding `px-8` is excessive on mobile
- Mockup is `hidden lg:block` -- 100% of mobile users never see it

### Plan
- **Hero**: Stack vertically. H1 uses mobile type scale (2rem). Pill badge shrinks to `text-xs`. CTA buttons stack full-width with reduced height (`h-12` not `h-14`).
- **QuickStats**: Horizontal scroll snap on mobile (`flex overflow-x-auto snap-x snap-mandatory gap-4`), or reduce to 2 stats inline.
- **Mockup**: Instead of hiding entirely, show a **condensed inline preview card** below the CTA on mobile -- a simplified version of the quiz card, not the full desktop mockup.
- **Process Cards**: On mobile, render as a **horizontal scroll carousel** with snap points (using `overflow-x-auto snap-x`) instead of a stacked column of 3 tall cards. Each card becomes a compact horizontal strip.
- **Mode Cards**: On mobile, the featured "Challenge" card goes first (reorder via `order-first`), rendered full-width. Other two stack below at 50% width each (2-col grid).
- **Footer**: add `pb-safe` (safe area) padding.

---

## 3. Auth Page

### Current Issues
- Form card `max-w-md` with `p-8` leaves almost no breathing room on a 375px screen
- Input fields are fine but the diagonal accent decoration clips awkwardly on small screens

### Plan
- On mobile: remove `p-8`, use `p-5`. The form card goes edge-to-edge with rounded top corners only (bottom-sheet aesthetic).
- Hide the diagonal accent on `< 640px`
- Position the heading (`text-display-md`) above the card rather than inside the scroll, so it stays visible as the user fills the form
- Add `pb-safe` for keyboard avoidance awareness

---

## 4. Dashboard

### Current Issues
- Header has 6 icon buttons in a row -- on mobile they compress into an unusable cluster
- XP/Streak badges are `hidden sm:flex` -- mobile users never see their progress
- TabsList (Rooms / Progress) is fine but should be full-width on mobile
- Room grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` is acceptable but cards could use a more compact mobile variant
- Create/Join action cards waste vertical space with large padding on mobile

### Plan
- **Header**: On mobile, show only Logo + ThemeToggle. Move Profile, Bookmarks, Settings, Logout into the bottom nav.
- **XP/Streak**: Show a **compact inline XP bar** below the header on mobile (always visible, since it's hidden on desktop's `hidden sm:flex`). Single horizontal strip: level pill + thin XP bar + streak flame.
- **Tabs**: Full-width `w-full` TabsList on mobile, with equal-width triggers.
- **Action cards**: On mobile, render Create and Join as **two equal pill buttons** side by side instead of tall bento cards. Saves ~120px vertical space.
- **Room cards**: On mobile, use a **list layout** instead of grid cards. Each room becomes a horizontal row: mode color strip (left edge), name + code, mode badge. More scannable, denser, thumb-friendly.

---

## 5. Room Page

### Current Issues
- Room Hero has room name + code + member count + active users + quiz count all in one flex-wrap line -- wraps chaotically on mobile
- TabsList has up to 5 tabs (Quizzes, Documents, Members, Leaderboard, Settings) -- overflows horizontally on small screens
- Quiz Generator form has a 5-column grid (`lg:grid-cols-5`) that collapses poorly
- Upload dialog textarea is `rows={10}` which is too tall on mobile
- Leaderboard podium layout needs rethinking for narrow screens

### Plan
- **Room Hero**: Two-line layout on mobile. Line 1: room name (full width, larger). Line 2: code chip + member count. Upload button goes full-width below.
- **Tabs**: Use a **horizontally scrollable TabsList** on mobile (`overflow-x-auto whitespace-nowrap`) with no wrapping. Or convert to a `Select` dropdown when there are 4+ tabs.
- **Quiz Generator**: Full stack on mobile. Each field gets its own row. The Generate button anchors to the bottom full-width.
- **Upload Dialog**: Reduce textarea to `rows={6}` on mobile. File drop zone padding shrinks.
- **Leaderboard**: On mobile, **linear ranked list** instead of podium. Position 1/2/3 get left-edge color strips (gold/silver/bronze) but no spatial separation. Each entry is a horizontal row with rank number, avatar initial, username, score.
- **Document/Quiz grids**: Single column on mobile with compact row-style cards.

---

## 6. Quiz Page (In-Progress State)

### Current Issues
- Question text `text-2xl sm:text-3xl lg:text-4xl` is appropriate but the bookmark button next to it creates a cramped layout on mobile
- Answer options `p-5` with letter circle + text is fine but the letter circle `h-7 w-7` should scale
- Previous/Next navigation is `flex justify-between` which works but buttons are small
- Question dots `w-2.5 h-2.5` are impossible to tap accurately on mobile
- Timer + mode badge + question counter in header are cramped

### Plan
- **Question area**: On mobile, bookmark button moves **below** the question text (full-width row with bookmark + question number), freeing the question to use full width.
- **Answer options**: Increase mobile padding to `p-4` min, ensure `min-h-[52px]`. Letter circles stay at `h-7 w-7` -- they're fine.
- **Navigation**: On mobile, Previous/Next become **full-width stacked buttons** when at the last question (Submit), or a **sticky bottom bar** with Previous (left) and Next (right) always visible.
- **Question dots**: On mobile, replace dots with a simple `3/12` text counter. Dots become unusable past ~15 questions on mobile.
- **Header**: Rearrange to two rows on mobile. Row 1: Logo + mode badge. Row 2: Timer (centered) + question counter.

---

## 7. Quiz Results Screen

### Current Issues
- Score `text-7xl sm:text-8xl` is massive but works
- Review section uses `ml-10` indent which wastes mobile space
- Answer review cards are fine but explanation blocks could be tighter

### Plan
- Remove `ml-10` on mobile for answer review -- use full width
- Explanation blocks: reduce padding on mobile
- XP earned / Level up row: stack vertically on mobile instead of `flex gap-6`
- "Back to Room" button: full-width on mobile

---

## 8. Profile Page

### Current Issues
- Stats grid `grid-cols-2 lg:grid-cols-4` works but the `text-4xl` numbers are too large on mobile
- Trophy Cabinet grid can overflow

### Plan
- Stats: reduce number size to `text-2xl` on mobile
- Trophy Cabinet: ensure grid uses `grid-cols-3` on mobile (vs whatever it uses now), with smaller badge sizes
- XP Progress card: full-width, compact variant on mobile

---

## 9. Bookmarks (Study Deck)

### Current Issues
- Each bookmark card has question text + 4 options + reveal button + badge -- long vertical scroll
- Trash button is tiny on mobile

### Plan
- Add a **swipe-to-reveal** pattern on mobile: swipe left on a card to reveal the delete action, instead of the small trash icon
- Or: enlarge trash to a proper button row at card bottom
- Option text: reduce to `text-sm` with `p-2.5` on mobile
- Add a **flashcard mode toggle**: tap the card to flip between question and answer, instead of the current reveal button. More mobile-native interaction.

---

## 10. Analytics Dashboard

### Current Issues  
- Activity Calendar `w-3 h-3` cells are tiny and not tappable on mobile -- tooltip won't work on touch
- Stats grid `grid-cols-2 lg:grid-cols-4` works but is dense
- StreakBadgeEnhanced appears twice (in XP row and in Streak Details) -- redundant on mobile
- Progress Chart may overflow on narrow screens

### Plan
- Activity Calendar: increase cell size to `w-4 h-4` on mobile, reduce weeks shown from 12 to 8. Replace tooltip with tap-to-show-detail (show info in a fixed bar below the calendar on tap, instead of tooltip).
- Remove duplicate StreakBadgeEnhanced on mobile -- show it only once.
- Progress Chart: ensure it has `min-h-[200px]` and the recharts `ResponsiveContainer` handles narrow widths.

---

## 11. Preferences Page

Mostly fine. Minor fixes:
- Select dropdowns: ensure they open as bottom sheets (Drawer) on mobile instead of floating popovers
- Save button: make sticky at bottom on mobile so it's always reachable

---

## 12. Creative Mobile-First Ideas (Not Generic)

### A. Quiz Swipe Navigation
Instead of Previous/Next buttons, allow **horizontal swipe** between questions on mobile (like Tinder cards). Each question slides in from the right, slides out to the left. The question dots become a progress bar.

### B. Haptic Feedback Hooks
Add `navigator.vibrate()` calls on mobile for:
- Correct answer: short pulse (50ms)
- Wrong answer: double pulse (50ms, 50ms gap, 50ms)  
- Quiz complete: long pulse (200ms)
- Achievement unlock: pattern (100ms, 50ms, 100ms, 50ms, 200ms)

### C. Pull-to-Refresh on Dashboard
Instead of relying on page reload, add a pull-to-refresh gesture on the room list.

### D. Contextual Action Sheets
Replace all confirmation AlertDialogs on mobile with **bottom sheet drawers** (vaul Drawer). Delete room, remove member, remove bookmark -- all should slide up from the bottom on mobile, not appear as centered modals.

### E. Compact Quiz Entry
On mobile, when tapping a quiz card in a room, show a **bottom sheet** with quiz details + Start button, instead of navigating to a full-screen intro page. Saves one navigation step.

---

## Technical Implementation Summary

| Area | Files Affected |
|------|---------------|
| Bottom nav + safe areas | New `MobileNav.tsx`, `index.html`, `index.css` |
| Responsive type scale | `tailwind.config.ts`, `index.css` |
| Landing page | `Index.tsx` |
| Auth | `Auth.tsx` |
| Dashboard | `Dashboard.tsx` |
| Room | `Room.tsx` |
| Quiz | `Quiz.tsx` |
| Profile | `Profile.tsx` |
| Bookmarks | `Bookmarks.tsx` |
| Analytics | `AnalyticsDashboard.tsx`, `ActivityCalendar.tsx` |
| Preferences | `Preferences.tsx` |
| Mobile interactions | New `useHaptics.ts`, swipe utilities |
| Action sheets | Conditional Drawer vs AlertDialog wrapper |

Estimated scope: ~14 files modified, ~3 new files created.

