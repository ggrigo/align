# Handoff: align rating form redesign

## Overview

A redesign of the interactive HTML form that the [`/align`](https://github.com/ggrigo/align) skill produces — the page where the user rates LLM-generated claims as **correct / wrong / almost / needs-nuance / can't-verify / skip**, writes corrections, and exports a `.md` file.

The redesign rethinks the interaction model from "long scrollable list of cards" to **one-claim-at-a-time, hybrid density**: a tight color-coded rail of all claims on the left, the focused claim in the centre at full headline scale, live review summary + export on the right. Keyboard-first: `1`–`6` rate, `↑`/`↓` (or `j`/`k`) navigate, `N` notes, auto-advance to the next unrated claim after rating.

Three aesthetic presets ship as runtime tweaks so the operator can pick the one that fits their workflow (and switch between them per session if they want). Six rating-button styles, two densities, and curated accent swatches are also exposed as tweaks.

## About the Design Files

The files in `prototype/` are **design references created in HTML** — a React + Babel-in-browser prototype demonstrating intended look, layout, interaction, and state behaviour. They are **not production code to drop in verbatim**.

The integration task is to **port the design into `align-template.html`** (the single, self-contained HTML artifact the `/align` skill writes to disk). The target environment is **vanilla JS in one file** — the current template does not use React, and bringing React + Babel into the runtime artifact would balloon the file and slow first paint. Re-implement the prototype's components as DOM-building functions following the pattern already in the existing `align-template.html` (`render()` function that rebuilds the panel; per-claim `<div>` construction via `document.createElement`).

Preserve the existing template contract:

| Placeholder | Purpose | Source |
|---|---|---|
| `{{CONTEXT}}` | Human-readable context label shown in header (e.g. `rhythm`) | `/align` skill |
| `{{CONTEXT_SLUG}}` | kebab-case slug used in the download filename | `/align` skill |
| `{{DATE}}` | The date being aligned (`YYYY-MM-DD`) | `/align` skill |
| `{{SOURCE}}` | Source label for the header tag | `/align` skill |
| `{{TIMEZONE}}` | IANA timezone for the `Generated:` timestamp | `/align` skill |
| `{{CLAIMS_INJECT}}` | The line `const claims = [...];` injected by the skill | `/align` skill |

Also preserve the **`.md` export shape** consumed by Phase 2 of the skill (Corrections Required, Confirmed/Other, Missing — Not Captured, with `> {{claim text}}` and `> *{{source}}*` quote lines, and a Summary table). See `reference/align-template.original.html`'s `exportMd()` for the canonical format.

## Fidelity

**High-fidelity.** Pixel-perfect mockups with final colors (OKLCH-defined rating palette), typography (three Google Font pairings), spacing, border radii, shadows, and motion. Recreate exactly. The visual system is built around CSS custom properties grouped by `:root[data-preset="…"]` — the cleanest port is to copy that variable set wholesale and only re-implement the JSX as DOM-building JS.

## Screens / Views

The form is a single full-viewport layout. There are **no separate screens** — focus state lives in JS (`focused` index pointing into the `claims` array) and the centre pane renders that one claim large.

### Top bar (64px tall, full width)

- **Left:** brand block.
  - 28×28 square in `var(--accent)` background, `var(--bg)` foreground, `border-radius: 7px`, glyph `◴` (clock-ish). Treat as a real logo once branded; for now the glyph is fine.
  - Word **"align"** in `var(--f-display)`, 20px, weight 600, letter-spacing −0.02em.
  - Context pill: `{{CONTEXT}}` in `var(--f-mono)`, 11px, `var(--surface-2)` bg, `var(--border-soft)` 1px border, 999px radius, `padding: 3px 8px`, `var(--fg-soft)` colour.
- **Centre:** mono meta line, 12px, `var(--fg-muted)`, separated by `·` dots: date · `{N} claims` · `{rated}/{total} rated` · `{accuracy}% accuracy` (accuracy only shown when at least one rating exists and `scoreable > 0`). Numbers (`rated`, `accuracy`) bolded in `var(--fg)` (accuracy in `var(--accent)`).
- **Right:** Export button. `var(--fg)` bg, `var(--bg)` text, 8px radius, `padding: 8px 14px`, label "Export" + `↓` glyph. Hover: `opacity: 0.9`. Active: `scale(0.97)`.

### Body (3-column grid below topbar)

`grid-template-columns: 280px 1fr 320px;` — left rail, main pane, right rail. Border between columns is 1px `var(--border)`. Below 1280px viewport, rail shrinks to 280px and padding tightens. Below 1080px, right rail is hidden entirely.

### Left sidebar (claim rail, 280px wide)

- **Header** (16/20/10 padding): eyebrow "Claims" (mono, 10px, uppercase, letter-spacing 0.12em, `var(--fg-muted)`) + counter `{rated}/{total}` in mono 11px, `var(--fg-soft)`.
- **List:** one row per claim, padding 6/8 around the list, scrollable.
- **Row:** `grid-template-columns: 28px 18px 1fr 18px;`, gap 8px, padding 8/10, radius 7px, 2px transparent left border. Cells:
  1. Claim index `01`, `02`, … (zero-padded), mono 10px, `var(--fg-faint)`.
  2. Source icon (glyph map below), 13px, `var(--fg-muted)`.
  3. Text — single line, ellipsis-truncated, 12.5px, `var(--fg-soft)`.
  4. Rating glyph (only if rated), 11px, colour matches the rating colour (`var(--c-correct)`, etc.).
- **Hover:** `var(--surface-2)` bg, text becomes `var(--fg)`.
- **Focused row:** `var(--surface)` bg, left border becomes `var(--accent)`, index turns `var(--accent)`, small shadow.
- **Rated row** (not focused): text dims to `var(--fg-muted)`. The colored rating glyph remains the only "weight" the row carries.

### Centre main pane (focused claim, max-width 760px centred)

Padding: 32px 56px 40px (28/36 at narrower widths).

In order, top to bottom:

1. **Meta row** (mono, 11px, 24px bottom margin):
   - Counter `{idx+1}/{total}` — current number in `var(--accent)` 14px weight 600, separator faint, total in `var(--fg-muted)`.
   - Source pill: `var(--surface-2)` bg, 999px radius, padding 3/10, icon + source label + optional `· {time}` suffix.
   - If the claim is `verifiable === false`: a **"machine-only"** pill — `var(--c-unknown)` border + text, `var(--c-unknown-tint)` bg, mono 9.5px uppercase letter-spacing 0.04em.

2. **Hero claim text** — the main statement. Font is `var(--f-display)`, size `var(--hero-size)` (38px editorial / 34px modern / 26px terminal / 26px in compact density), `line-height` `var(--hero-lh)`, weight `var(--hero-weight)`, letter-spacing `var(--hero-tracking)`. `text-wrap: pretty`. 14px bottom margin.

3. **Description** (optional, `claim.desc`) — `var(--fg-soft)`, 15px, line-height 1.55, 22px bottom margin.

4. **Detail block** (optional, `claim.detail`) — `var(--f-mono)` 12px line-height 1.65, `var(--fg-soft)`. `var(--surface)` bg, 1px `var(--border-soft)` border, **2px solid `var(--accent)` left border**, 6px radius, padding 14/18, `white-space: pre-wrap`, `max-height: 240px` with vertical overflow scroll. 22px bottom margin.

5. **Tags row** — wrapping flex, gap 6px, 32px bottom margin. Tag base: mono 10.5px, padding 3/9, 999px radius, `var(--surface-2)` bg, `var(--fg-soft)` colour, 1px `var(--border-soft)` border. Three variants:
   - **Category tag** — colour `var(--accent)`, bg = accent at 8% mix with bg, border = accent at 30% mix with border.
   - **File tag** — `var(--fg-muted)` colour.
   - **Link tag** — `var(--accent)` colour, no underline; hover bumps bg to accent at 15% mix.

6. **Rating bar** — 6-column grid with 6px gap, 6px padding, `var(--surface)` bg, 1px `var(--border-soft)` border, 12px radius, small shadow. 24px bottom margin. Each button:
   - Flex column, centred, gap 4px, padding 12/6, 8px radius, transparent border.
   - Key badge: mono 9.5px `var(--fg-faint)` on `var(--surface-2)` bg, 1px `var(--border-soft)` border, padding 1/5, 3px radius. Shows `1`–`6`.
   - Variant content:
     - **labeled:** key badge + text label ("Correct", "Wrong", "Almost", "Nuance", "Can't verify", "Skip").
     - **emoji:** key badge + emoji glyph at 22px (`✓ ✕ ◐ ◍ ? –`).
     - **letter:** key badge + single mono letter at 15px weight 600 (`C W A N ? S`).
   - **Selected state:** background = `var(--c-{rating}-tint)`, text + border = `var(--c-{rating})` at 40% mix, weight 600. Key badge inherits the rating colour.
   - **Hover (unselected):** `var(--surface-2)` bg, text becomes `var(--fg)`. Active: `scale(0.97)`.

7. **Notes panel** — animated max-height collapse. Visible (`max-height: 200px`, `opacity: 1`) only when `rating` is `wrong`, `almost`, or `nuance`. Label is mono 10px uppercase letter-spacing 0.12em, dynamically copy-swapped:
   - wrong → "What's the real story?"
   - almost → "What's missing or off?"
   - nuance → "What nuance is missing?"
   Textarea: full width, min-height 76px, 12/14 padding, 8px radius, 1px `var(--border)`, `var(--surface)` bg, 13.5px line-height 1.5, vertical resize. Focus state: border becomes `var(--accent)`, box-shadow 3px ring at 18% accent.

8. **Foot nav** (sticky bottom of `.main` scroll container, max-width 760px centred) — mono 11px row with `← previous` button, status hint ("press 1–6 to rate" / "rated `{rating}`"), `next →` button. Buttons: 6/12 padding, 6px radius, 1px `var(--border)`, `var(--surface)` bg. Disabled at endpoints with 0.4 opacity. Gradient mask above (`linear-gradient(to bottom, transparent, var(--bg) 30%)`) so content scrolls behind it.

### Right rail (review summary, 320px → 280px responsive)

Padding 24px, gap 24px between sections, vertical flex.

1. **Hero accuracy block**:
   - Eyebrow "Review" (rail eyebrow style: mono 10px uppercase letter-spacing 0.14em `var(--fg-muted)`).
   - Big number: `var(--f-display)`, 56px, line-height 1, weight `var(--hero-weight)`, letter-spacing −0.03em, tabular nums. `{accuracy}` percent + `%` suffix at 24px `var(--fg-muted)` weight 400.
   - Subline: mono 12px `var(--fg-muted)` — "accuracy across {N} rated".

2. **Progress bar** — 6px tall, 3px radius, `var(--surface-2)` track, segments flex-sized by count for each rating + an unrated transparent segment. Tooltip shows label + count on hover.

3. **Stats grid** — 2-column grid, 1px gap on `var(--border-soft)` background = hairlines between cells. 8px radius outer, overflow hidden. Each cell: `var(--surface)` bg, padding 10/12, mono 10px uppercase label (`var(--fg-muted)`) over big display-font number (22px weight `var(--hero-weight)` letter-spacing −0.02em). Number is coloured to the rating. Empty cells (count 0) get 0.5 opacity and `var(--fg-faint)` number.

4. **Missing items** — eyebrow "Missing — not captured" + textarea, 90px min-height, same styling as notes textarea but 12.5px font.

5. **Download button** — `var(--fg)` bg, `var(--bg)` text, 12/16 padding, 8px radius, 13px weight 500, label "Download align.md" + `↓` glyph right-aligned.

6. **Keyboard cheatsheet** — top border 1px `var(--border-soft)`, padding-top 16px. Vertical list with `<kbd>` chips (mono 10px, 1/5 padding, 4px radius, 1px `var(--border)`, `var(--surface)` bg) and labels. Entries: `↑↓ navigate`, `1–6 rate`, `N notes`, `E expand detail`.

## Interactions & Behavior

### Rating

- Clicking a rating button sets that rating on the focused claim. If the claim already has that exact rating, the click **toggles it off** (back to unrated).
- When `autoAdvance` tweak is on (default): 120ms after rating, focus jumps to the **next unrated** claim wrapping around from `focused + 1`. If no unrated claims remain, focus moves to `min(focused + 1, total - 1)`.
- Setting any rating to `wrong`/`almost`/`nuance` reveals the notes textarea (`max-height` transition, 250ms ease). Setting to `correct`/`skip`/`unknown` hides it again.

### Sidebar focus sync

- Clicking a row sets `focused` to that index, opens the claim in the main pane, and the main pane scrolls to top.
- The focused row scrolls itself into view in the sidebar via `scrollIntoView({ block: 'nearest', behavior: 'smooth' })`.

### Keyboard

Global keydown listener; ignored when focus is in a textarea/input except `Escape` which blurs the field.

- `1`–`6` → rate focused claim with the corresponding rating (matches `R_META[r].key`).
- `↑` / `k` → focused = max(0, focused − 1).
- `↓` / `j` → focused = min(total − 1, focused + 1).
- `N` → focuses the notes textarea (if currently visible).
- `E` → toggles expanded detail (the prototype keeps detail always visible in the focused view; if you want it collapsible in the port, wire `E` to a per-claim `_expanded` flag).

### Machine-only pre-rating

Claims with `verifiable === false` are pre-rated as `unknown` on init. The "machine-only" pill is shown next to the source pill. The user can still override.

### Export

The `Export` (topbar) and `Download align.md` (rail) buttons run the same function. Filename pattern: `align-{contextSlug}-{date}.md`. Content shape — preserve **exactly** what the original `align-template.html` produces (see its `exportMd()`):

```
# Alignment Feedback — {date}
Context: {context}
Source: {source}
Generated: {new Date().toLocaleString('en-GB', {timeZone: tz})}

## Summary
| Status | Count |
| ✅ Correct | 5 |
...

## Corrections Required

### Claim {id}: ❌ Wrong
> {claim text}
> *{source}*

**Reality:** {notes or "(no notes provided)"}

## Confirmed / Other

- **Claim {id}** ✅ Correct: {text}

## Missing — Not Captured

- {missing line 1}
- {missing line 2}
```

The status emojis used in the `.md` export are different from the UI emojis: `✅ ❌ 🔶 🔷 🤷 ⬜` (matches the original template, downstream Phase 2 likely greps on these).

### Tweaks (in-page, optional)

A floating Tweaks panel (loaded via `tweaks-panel.jsx` in the prototype) exposes:
- `preset`: `editorial | modern | terminal` (CSS preset)
- `accent`: 4 curated swatches per preset
- `ratingStyle`: `labeled | emoji | letter`
- `density`: `comfy | compact` (only affects `--hero-size` and `--row-h`)
- `autoAdvance`: boolean

This panel is **prototype-only scaffolding**. In the real template, the operator's preferred preset/accent/etc. should be either:
1. **Baked at template-render time** by the `/align` skill — substitute the values into a `<script>window.PREFS = {...}</script>` block before serving — *or*
2. **User-persisted in `localStorage`** with a small settings popover in the topbar.

Either way, drop the Babel-Tweaks plumbing.

## State Management

Only three pieces of state matter:

```js
claims:  Array<{
  id, text, source, time?, icon?, desc?, detail?,
  categories?, files?, link?, verifiable?,
  rating: 'correct' | 'wrong' | 'almost' | 'nuance' | 'unknown' | 'skip' | null,
  notes: string,
}>
focused: number   // index into claims
missing: string   // textarea contents for "Missing — not captured"
```

Plus the (persisted) tweak state if you keep it: `preset`, `accent`, `ratingStyle`, `density`, `autoAdvance`.

Derived (recomputed on every render):
- `counts`: map of rating → count
- `rated`: total rated
- `accuracy`: `round(counts.correct / (rated - skip - unknown) * 100)` — null/`–` if scoreable is 0

## Design Tokens

### Rating palette (OKLCH, equal-chroma)

| Rating | Solid (light preset) | Tint (light preset) | Solid (terminal) | Tint (terminal) |
|---|---|---|---|---|
| correct | `oklch(0.62 0.14 145)` | `oklch(0.95 0.04 145)` | `oklch(0.78 0.18 145)` | `oklch(0.30 0.07 145)` |
| wrong   | `oklch(0.60 0.19 25)`  | `oklch(0.94 0.05 25)`  | `oklch(0.72 0.20 25)`  | `oklch(0.30 0.08 25)` |
| almost  | `oklch(0.72 0.13 75)`  | `oklch(0.95 0.05 75)`  | `oklch(0.82 0.16 75)`  | `oklch(0.30 0.06 75)` |
| nuance  | `oklch(0.58 0.15 260)` | `oklch(0.95 0.04 260)` | `oklch(0.72 0.17 260)` | `oklch(0.30 0.07 260)` |
| unknown | `oklch(0.62 0.10 310)` | `oklch(0.95 0.03 310)` | `oklch(0.74 0.13 310)` | `oklch(0.30 0.05 310)` |
| skip    | `oklch(0.62 0.01 100)` | `oklch(0.95 0.01 100)` | `oklch(0.70 0.01 100)` | `oklch(0.26 0.01 100)` |

### Per-preset surfaces

**Editorial** (warm paper, sienna accent)
- bg `oklch(0.97 0.012 75)` · bg-soft `oklch(0.985 0.008 75)` · surface `oklch(0.995 0.006 75)` · surface-2 `oklch(0.96 0.014 75)`
- fg `oklch(0.22 0.015 60)` · fg-soft `oklch(0.45 0.018 60)` · fg-muted `oklch(0.62 0.015 60)` · fg-faint `oklch(0.78 0.012 60)`
- border `oklch(0.90 0.014 70)` · border-soft `oklch(0.94 0.012 70)`
- accent options: `#b56a3e`, `#3f6b54`, `#3a5a8a`, `#7a3a52`
- shadow: `0 1px 2px rgba(60,40,20,0.04), 0 8px 32px rgba(60,40,20,0.06)`
- type: display `Newsreader` (Google) · body `IBM Plex Sans` · mono `IBM Plex Mono`
- hero: 38px / line-height 1.18 / weight 500 / letter-spacing −0.012em

**Modern** (cool light, electric blue)
- bg `oklch(0.97 0.003 250)` · bg-soft `oklch(0.98 0.002 250)` · surface `oklch(1 0 0)` · surface-2 `oklch(0.96 0.004 250)`
- fg `oklch(0.18 0.012 264)` · fg-soft `oklch(0.40 0.012 264)` · fg-muted `oklch(0.55 0.010 264)` · fg-faint `oklch(0.72 0.008 264)`
- border `oklch(0.91 0.006 264)` · border-soft `oklch(0.94 0.005 264)`
- accent options: `#3d5bdb`, `#0f766e`, `#b54848`, `#7a3aa1`
- shadow: `0 1px 2px rgba(15,23,42,0.04), 0 12px 36px rgba(15,23,42,0.07)`
- type: display + body `Space Grotesk` · mono `JetBrains Mono`
- hero: 34px / 1.18 / 600 / −0.022em

**Terminal** (dark, lime accent)
- bg `oklch(0.16 0.008 130)` · bg-soft `oklch(0.19 0.008 130)` · surface `oklch(0.21 0.008 130)` · surface-2 `oklch(0.24 0.008 130)`
- fg `oklch(0.93 0.012 100)` · fg-soft `oklch(0.78 0.014 100)` · fg-muted `oklch(0.60 0.012 100)` · fg-faint `oklch(0.42 0.010 100)`
- border `oklch(0.30 0.010 130)` · border-soft `oklch(0.26 0.010 130)`
- accent options: `#c4f04a`, `#7ce0c0`, `#f0c14a`, `#e89cc4`
- shadow: `0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.4)`
- type: everything `JetBrains Mono`
- hero: 26px / 1.32 / 500 / −0.002em
- rating colours boosted (see table above)

### Spacing / radii / shadows

- Border radii: `4px` (kbd) · `6px` (small buttons, detail block) · `7px` (sidebar row, brand mark) · `8px` (rating buttons, textareas, stat grid, rail export) · `12px` (rating bar) · `999px` (pills, progress)
- Topbar: 64px tall · Sidebar: 280px · Right rail: 320px (→ 280px ≤1280px · hidden ≤1080px)
- Focused-claim max-width: 760px, centred · padding 32/56/40 (→ 28/36 ≤1280px)
- All transitions: 0.1–0.25s, default ease. Keep them snappy.

### Type scale

| Token | Editorial | Modern | Terminal |
|---|---|---|---|
| Hero (focused claim) | 38px Newsreader 500 | 34px Space Grotesk 600 | 26px JetBrains Mono 500 |
| Rail big number | 56px Newsreader 500 | 56px Space Grotesk 600 | 56px JetBrains Mono 500 |
| Stat number | 22px Newsreader 500 | 22px Space Grotesk 600 | 22px JetBrains Mono 500 |
| Body | 14px Plex Sans | 14px Space Grotesk | 14px JetBrains Mono |
| Description | 15px | 15px | 15px |
| Mono meta | 11–12px Plex Mono | 11–12px JetBrains Mono | 11–12px JetBrains Mono |
| Eyebrow | 10px uppercase 0.12em | same | same |
| kbd | 10px mono | same | same |

## Assets

No images or icons are bundled. The "source icons" in the rail and source pill are single Unicode glyphs:

```js
{ calendar: '◷', gmail: '✉', slack: '#', fireflies: '◉',
  drive: '▤', fabric: '◇', rhythm: '♪', briefing: '☱' }
```

Add new icon types to the map as new sources are added. If the codebase already has an icon set (lucide, feather, etc.), feel free to substitute — keep the visual weight light and monoline, ~13–14px.

The brand mark (`◴` in a coloured square) is intentionally a placeholder. Replace with a real wordmark/logo if one exists.

Fonts are loaded from Google Fonts via a single `<link>` import (see `prototype/index.html` `<head>`).

## Files

In this handoff:

- `prototype/index.html` — the design reference. Loads React + Babel + the three JSX/JS modules below.
- `prototype/app.jsx` — components and state (App, ClaimRow, FocusedClaim, RatingBar, ReviewRail, TweaksUI). The CSS-variable + DOM structure here maps 1:1 to what the port should produce.
- `prototype/claims.js` — 12 mock claims spanning calendar, gmail, slack, fireflies, drive, fabric (smart-memory, machine-only), briefing. Use these as the demo dataset until you wire the real `{{CLAIMS_INJECT}}`.
- `prototype/tweaks-panel.jsx` — the tweaks shell. Drop this from the real template unless you want a runtime preference panel.
- `reference/align-template.original.html` — the **current** `align-template.html` from `ggrigo/align@main`. Use this as the integration target: it contains the placeholders, the `claims` array contract, the keyboard scaffolding, and — critically — the `.md` export format that Phase 2 of the skill reads.

## Integration recipe (suggested order)

1. Copy the entire `<style>` block from `prototype/index.html` into a new `align-template.html` `<head>`. Add the Google Fonts `<link>`.
2. Replace the body markup with: topbar, body grid (sidebar / main / rail), Tweaks-less. Keep `{{CONTEXT}}`, `{{DATE}}`, `{{SOURCE}}`, `{{CONTEXT_SLUG}}` placeholders in the topbar pill, mono meta, hidden input.
3. Port the JSX components in `app.jsx` to vanilla DOM-building functions, matching the existing template's style: a single `render()` that rebuilds the sidebar list + main pane + rail. Per-claim DOM construction in a `renderRow(claim, i)` and `renderFocused(claim, i)` pair.
4. Wire keyboard handlers, rating toggle + auto-advance, sidebar→main focus sync, notes textarea show/hide, missing textarea, export-md. Reuse the export function in `reference/align-template.original.html` almost verbatim — its output shape is the contract.
5. Default preset to `editorial`. If you want runtime preset switching, add a small popover in the topbar (not the full Tweaks panel — that's prototype scaffolding). Persist the choice in `localStorage`.
6. Test against the existing skill: emit the form with a real `claims` array injected at `{{CLAIMS_INJECT}}`, rate a few, download, run Phase 2 (`/align done`). The `.md` must parse identically to the old template's output.
7. Drop the React/Babel script tags from the final artifact — they were prototype-only.

## Known gaps / not-yet-decided

- The current prototype hides the right rail below 1080px viewport. A "stat strip" alternative in the topbar at narrow widths could keep the live summary visible — see verifier note. Not implemented; consider for follow-up.
- Topbar meta wraps mid-phrase at narrow widths. Adding `white-space: nowrap` on each span would fix; held off because it interacts with how truncation should behave on tiny windows.
- `E` (expand detail) keyboard shortcut isn't wired in the prototype — detail is always shown in the focused view. Decide whether to keep always-visible or collapse-by-default behind `E`.
- Mobile is not designed for. The original template had a mobile mode with FABs and a bottom sheet; the redesign assumes desktop. If mobile usage matters, the rail and sidebar should each collapse to drawers triggered by topbar buttons.
- No empty-state for `claims.length === 0` is designed; the skill should never emit a zero-claim form, but a graceful "no claims to align" message is a small polish.
