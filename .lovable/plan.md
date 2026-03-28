

# Design Refactor: From "Polished SaaS Template" to "Ink & Voltage"

## Aesthetic Diagnosis

The current design is competent but generic. Teal accent on dark background with `Outfit` font, `border-border/50`, `bg-card/80 backdrop-blur-sm` — this is the 2024 shadcn/ui starter kit aesthetic. Every AI-generated SaaS looks like this. The noise overlay and mesh gradients add some depth but they're the same patterns every AI tool produces.

**What makes it forgettable**: uniform rounded corners everywhere, same card pattern repeated on every page, safe teal-on-dark palette, predictable section stacking, no visual tension, no surprise.

## New Direction: "Ink & Voltage"

**Tone**: Editorial meets arcade. Think _The Verge_ crossed with _Notion_ crossed with a pinball machine. High-contrast, typographically aggressive, with electric moments of color that punctuate a mostly monochrome canvas.

**Key Moves**:
- **Color shift**: Drop the teal primary. Move to a near-monochrome base (warm off-white light / deep ink dark) with a single **electric lime** (`#BFFF00`) accent that hits like a highlighter pen on a textbook. The lime is used surgically — buttons, active states, the score number, achievement glows — never as background fill.
- **Typography**: Replace `Outfit` body with **Satoshi** (geometric, modern, more character than Outfit). Replace `DM Serif Display` question font with **Fraunces** (variable optical-size serif — more personality, more ink-on-paper feel). Keep `JetBrains Mono` for codes/stats.
- **Cards**: Kill the uniform `rounded-xl border bg-card/80 backdrop-blur-sm` pattern. Instead: some cards get **hard edges** (rounded-none or rounded-sm), some get **thick left borders** (4px accent), some get **no border at all** (just background shift). Variety creates visual hierarchy.
- **Spatial composition**: Landing page breaks the centered-container monotony with **full-bleed sections**, an **oversized hero number** that bleeds off-screen, and **asymmetric two-column** layouts where text and illustration don't mirror each other.
- **Motion**: Strip the scattered micro-animations. Replace with **one orchestrated entrance sequence** per page — staggered reveal on load, then everything is static. Hover states use subtle `translateY(-2px)` only on interactive cards.
- **Backgrounds**: Replace the blurry radial gradient orbs with a **fine dot grid** pattern (like graph paper) that reinforces the "study" context. In dark mode, the dots are barely visible (`opacity: 0.04`). In light mode, slightly more visible.

---

## File-by-File Changes

### 1. `index.html`
- Update Google Fonts links: add Satoshi (via Fontshare CDN) and Fraunces (via Google Fonts). Remove Outfit import.

### 2. `src/index.css` — Complete Theme Overhaul
- **Light mode**: `--background: 48 20% 97%` (warm parchment), `--foreground: 220 20% 8%` (near-black ink). `--primary: 72 100% 50%` (electric lime). `--card: 48 15% 100%` (clean white).
- **Dark mode**: `--background: 240 10% 6%` (deep ink), `--foreground: 48 10% 92%` (warm off-white). `--primary: 72 100% 50%` (same lime). `--card: 240 8% 10%`.
- **Mode tints**: Study = `210 70% 55%` (cool blue), Challenge = `24 100% 55%` (hot orange), Exam = `0 0% 45%` (steel grey). These stay similar but are used more boldly.
- Replace `.noise-bg` with `.dot-grid` — a CSS-only repeating dot pattern using `radial-gradient`.
- Replace `.mesh-gradient` with a simpler single-gradient or remove entirely. Let the dot grid do the atmospheric work.
- Update `.bento-card` to have **two variants**: `.card-flush` (no border, subtle bg shift, hard corners) and `.card-accent` (thick 3px left border in primary, rounded-sm).
- Update font-family vars: `--font-sans: 'Satoshi', system-ui, sans-serif`, `--font-serif: 'Fraunces', Georgia, serif`.
- Add `.text-electric` utility: `color: hsl(var(--primary))` with a subtle `text-shadow: 0 0 20px hsl(var(--primary) / 0.3)` for glow effect on key numbers.

### 3. `tailwind.config.ts`
- Update `fontFamily.sans` to `['Satoshi', ...]`, `fontFamily.serif` to `['Fraunces', ...]`.
- Adjust color tokens to match new palette.

### 4. `src/components/Logo.tsx`
- Restyle the wordmark: use the new sans font, `font-black`, `uppercase`, `tracking-[0.15em]`, `text-sm` — compact and typographic, like a magazine masthead. The SVG mark stays but gets slightly thicker strokes.

### 5. `src/pages/Index.tsx` — Landing Page Redesign

**Header**: Logo left, single "Enter" button right (no "Sign in" + "Drop your first PDF" — two CTAs in the header is noisy). Ghost-style, minimal.

**Hero section**:
- Remove the pill badge ("Generating quizzes right now") — it's fake social proof
- Headline: massive, full-width, `text-6xl sm:text-7xl lg:text-[8rem]` with tight negative tracking. "STOP RE-READING." on one line, next line is just "START KNOWING." in electric lime. The size itself is the statement.
- Subtext stays conversational but tightened
- Single CTA button: "Get started" in lime with black text. No secondary button in hero.
- Kill the `QuickStat` row (fake numbers)
- Hero illustration: keep `TransformIllustration` but give it more breathing room, allow it to be larger

**Diagonal divider**: Replace with a simple `<hr>` styled as a thin primary-color line, or remove entirely. The diagonal SVG is a cliche.

**Process section**:
- "90 SECONDS" as the oversized typographic anchor (like a massive `text-[6rem]` number that's `text-muted/10` behind the content, not a heading)
- Three steps as **horizontal strips** (not cards) — each is a full-width row with step number (oversized, left), illustration (center-left), text (right). No border, no card wrapper. Just spatial composition with a thin divider between each.

**Modes section**:
- "PICK YOUR POISON" stays — it's good
- Cards get the thick left-border treatment: Study = blue left border, Challenge = orange, Exam = grey. No fill colors, no "Popular" badge. Let the copy do the selling.
- Remove the `featured` scale/ring treatment on Challenge — it's generic. Instead, Challenge card gets a subtle background pattern (diagonal stripes at `opacity: 0.03`).

**CTA section**:
- Black/dark full-bleed section with large white text. "YOUR NEXT EXAM IS CLOSER THAN YOU THINK" in all-caps at `text-4xl`. Single lime button. The `SynapsePatternBg` stays but more prominent.

**Footer**: Minimal. One line. `border-t-0` — just text floating at the bottom.

### 6. `src/pages/Auth.tsx`
- Kill the decorative blur orbs. Use the dot-grid background only.
- Form card: `rounded-none sm:rounded-lg`, thick top border in primary (`border-t-4 border-primary`). No diagonal accent.
- Headings stay ("Back already?" etc.) — the copy is already good.

### 7. `src/pages/Dashboard.tsx`
- "HOME BASE" as uppercase heading
- Room cards: instead of uniform bento cards, each room card has a **colored left strip** (3px, mode color) and sharp corners (`rounded-sm`). On hover, the strip widens to 6px.
- Action cards (Create/Join): styled as outlined buttons with plus/users icons, not full bento cards. Save vertical space.

### 8. `src/pages/Quiz.tsx`
- The quiz in-progress screen stays mostly the same (it's functional and focused)
- Score on results: the `AnimatedScore` number gets the `.text-electric` glow treatment
- Answer option buttons: use `rounded-lg` (not `rounded-xl`), 2px border instead of `border-2`
- Review section: remove `sm:ml-10` indent, use full width

### 9. `src/pages/Room.tsx`
- Tab strip: style as underline tabs (no background pill), with primary underline on active
- Quiz cards: same left-strip treatment as dashboard room cards
- Leaderboard podium: keep the desktop podium but give rank numbers the `.text-electric` treatment

### 10. `src/pages/NotFound.tsx`, `Profile.tsx`, `Bookmarks.tsx`, `Preferences.tsx`
- Apply new card styles, font, and dot-grid background consistently
- No structural changes needed — these pages are already well-structured

### 11. `src/components/illustrations/*.tsx`
- Update SVG colors to use new primary (lime) instead of teal. Swap `fill-primary/X` references.
- The illustrations themselves are fine structurally — they just need color alignment.

---

## What Gets Removed
- Blurry radial gradient orbs (`.mesh-gradient` and the fixed `div` orbs in every page)
- Diagonal accent stripe (`.diagonal-accent`)
- Fake stats on landing page
- Hero pill badge
- Dual CTA in landing header
- "Popular" badge on Challenge mode
- Uniform `rounded-xl border bg-card/80 backdrop-blur-sm` on every card

## What Gets Added
- Dot-grid background pattern
- Electric lime accent color with glow utility
- Two card variants (flush + accent-border)
- Oversized typographic anchors on landing page
- Horizontal-strip process steps
- Full-bleed CTA section
- Underline tab navigation style

## Typography Summary
```text
Display (headings):  Satoshi Black, uppercase, tight tracking
Questions (serif):   Fraunces, optical-size variable
Body:                Satoshi Regular/Medium
Code/stats:          JetBrains Mono (unchanged)
```

## Color Summary
```text
Light:  warm parchment bg → ink black text → electric lime accent
Dark:   deep ink bg → warm white text → electric lime accent
Study:  cool blue
Challenge: hot orange  
Exam:   steel grey
```

---

## Files Affected

| File | Type |
|------|------|
| `index.html` | Edit — font imports |
| `src/index.css` | Major rewrite — colors, patterns, card styles, fonts |
| `tailwind.config.ts` | Edit — font families, color tokens |
| `src/components/Logo.tsx` | Edit — wordmark style |
| `src/pages/Index.tsx` | Major rewrite — layout, copy, structure |
| `src/pages/Auth.tsx` | Edit — card style, remove orbs |
| `src/pages/Dashboard.tsx` | Edit — card variants, heading style |
| `src/pages/Quiz.tsx` | Edit — score glow, card corners |
| `src/pages/Room.tsx` | Edit — tab style, card variants |
| `src/pages/NotFound.tsx` | Minor — apply new patterns |
| `src/pages/Profile.tsx` | Minor — apply new patterns |
| `src/pages/Bookmarks.tsx` | Minor — apply new patterns |
| `src/pages/Preferences.tsx` | Minor — apply new patterns |
| `src/components/MobileNav.tsx` | Edit — color alignment |
| `src/components/illustrations/*.tsx` | Edit — color references |

Estimated: ~15 files modified, 0 new files.

