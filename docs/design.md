# Visual design — "Kaagada" (ಕಾಗದ, paper)

A well-used exam notebook under a desk lamp. Light theme: cream paper, iron-gall indigo ink. Dark theme: the same
notebook at night — warm charcoal (never blue-black), lamp-amber tones. Confidence from a high-contrast serif for
headings and big tabular numbers; warmth from paper neutrals. Nothing glassy, no gradients, no corporate grey.
The test screen is the quietest page: almost no colour except state.

## Type (self-hosted via @fontsource)
- Display: `@fontsource-variable/fraunces` (headings, score numerals, dashboard stats), weight 600, opsz auto.
- UI + question text: `@fontsource-variable/instrument-sans`.
- Mono: `@fontsource-variable/jetbrains-mono` — timer, palette numbers, ids only. Elsewhere `tabular-nums`.
- KaTeX CSS/fonts bundled; `.katex { font-size: 1.08em }`.

| Role | Size/LH | Weight |
|---|---|---|
| Display (score, hero stat) | 40/44 Fraunces | 600 |
| H1 | 28/34 Fraunces | 600 |
| H2 | 20/28 Fraunces | 600 |
| Question text | 18/30 | 450 |
| Option text | 16/26 | 450 |
| UI body | 15/22 | 450 |
| Label | 13/18 | 600, +0.02em |
| Caption | 12/16 | 500 |
Headings -0.01em letter-spacing, `text-wrap: balance`; body `text-wrap: pretty`. Max weight 700.

## Colour tokens
| Token | Light | Dark |
|---|---|---|
| bg | #FBF7EF | #14120F |
| surface | #FFFDF8 | #1C1915 |
| raised | #FFFFFF | #25211C |
| border | #E6DDCB | #36302A |
| border-strong | #CDBFA6 | #4A4238 |
| text | #1F1B16 | #EDE6D8 |
| muted | #6B6256 | #A59B8A |
| accent (indigo ink) | #4F46B5 (white text on it) | #9C94F0 (dark text on it) |
| accent-tint | #E9E7FA | #26234A |
| physics | #97600A | #E0A33A |
| chemistry | #0E7C7B | #3FC1BE |
| mathematics | #9333A0 | #D58BE0 |
| correct / tint | #23763F / #E3F2E5 | #5CC47F / #1E3324 |
| wrong / tint | #C0392B / #FBE5E1 | #F27C6E / #40201C |
| marked | #6B5FD6 | #A79CF5 |
| unanswered border | #8A7F6E | #6F6657 |
| timer-warn | #B42318 | #F27C6E |
Subject colours only for subject chips, chart lines, a 3px top edge on subject cards — never option states.
State is never colour-only: always an icon/shape/text too.

## Layout (target viewport ~1093×614 = 1366×768 @125%; must also work on phones)
4px spacing base (4/8/12/16/20/24/32/48). Radius 8 controls, 14 cards, 10 option cards. Shadows: light = 1px border + `0 1px 0`; dark = borders only. Top bar 48px.
1. **Login** — centred 360px card on paper bg, big Fraunces "Kaagada" wordmark + small "KCET practice", two 44px fields, one button, inline errors, autofocus username.
2. **Home** — max-w 1040. Row 1: "Continue" strip if an unfinished test exists (72px card, time left, primary button). Row 2: three subject cards (1/3 each, ~140px, 3px subject top edge, accuracy as Fraunces 28, questions practised, Start button). Row 3: recent attempts (7/12) + weak chapters (5/12, max 5 rows, mini bars). The first screen at 614px must show the continue strip and all three subject cards.
3. **Setup** — left: mode radio-cards (2×3 grid, ~96px) + Exam/Practice segmented control + timed toggle + out-of-syllabus toggle; right: chapter picker (scrollable checkbox list, grouped by class 11/12, counts per chapter) or year list for year-wise. Sticky footer "60 Q · 70 min · Exam" + Start.
4. **Test** — no nav. Top bar: subject + "Q 14 / 60" left, timer (mono 18) centre, Submit right. Question column max 72ch, left-aligned in remaining space; palette right rail 280px: 5-col grid of 40px cells, 6px gap, legend below with answered/marked/unanswered counts. Sticky 56px footer: Prev, Mark for review, Clear, Next + shortcut hints (muted 12px). Question area scrolls internally, never the page. <700px: palette becomes a bottom drawer ("Q 14 / 60"), 48px footer buttons.
5. **Results** — Display score beside correct/wrong/skipped/time stats. Chapter breakdown table with inline bars. Review list below with filter chips (All, Wrong, Skipped, Marked, Slow); rows collapsed to ~56px, expand to show options, his answer, the correct one, time taken.
6. **Progress** — subject segmented control; trend chart full width 220px; chapter grid of tiles (~96×56) with accuracy % printed; "Sort by weakest" toggle switches to a list.

## Components
- Buttons 40px (44 touch). Primary indigo fill, 600. Secondary 1px border-strong on surface. Ghost. Active translateY(1px). `:focus-visible` 2px accent outline offset 2px. Disabled 45%.
- Option cards ≥56px tall, padding 14/16, 1px border-strong, surface; 28px letter badge A–D (mono 13) at left.
  idle; hover = accent 50% border + raised bg; selected (exam) = accent-tint bg, 1.5px accent border, filled badge — never reveals correctness; correct = correct tint + border + check icon + "Correct"; wrong pick = wrong tint + border + X + "Your answer"; in review the correct option is always marked. Keyboard focus ring separate from selection.
- Palette cells 40px, radius 8, mono 13: answered = accent-tint fill + accent text; unanswered = 1.5px unanswered border; marked = 10px flag corner top-right (marked colour) over base state; current = 2px text-colour ring offset 3px.
- Timer pill mono 18/600 tabular, mm:ss or h:mm:ss. ≤5:00 turns timer-warn + clock icon; one 400ms border pulse at 5:00 and 1:00 only; aria-live at 5:00 and 1:00 only.
- Cards: surface, 1px border, radius 14, padding 20.
- Charts: 2px line, dots only on hover + last point, faint dashed grid at 25/50/75%, direct label at line end (no legend), subject colours. Heatmap single hue (light #F3E3D0→#4F46B5, dark #2A2540→#9C94F0) with % printed in each tile. 11px tabular numerals.
- Icons: `@phosphor-icons/react`, Regular weight.

## Motion
120–200ms, `cubic-bezier(0.22,1,0.36,1)`. Animate: option state colour (120), palette fills (120), question swap = opacity fade only (120, no slide), card hover, practice reveal panel (opacity + 4px translate, 180), submit dialog (scale .98→1 + fade, 160), results score count-up (600, once). `prefers-reduced-motion`: instant/opacity only, no count-up, no pulse. Only transform/opacity.

## Don'ts
1. Red/green alone for correctness. 2. Confetti, streaks, fire emojis, celebratory popups. 3. Anything flashing while a question is being read. 4. Marketing hero, pill eyebrows, gradients. 5. Running score during an exam-mode test (only answered/marked/unanswered counts).
Copy: calm, specific, no exclamation marks. No `alert()`/`confirm()` — in-app dialogs only.
