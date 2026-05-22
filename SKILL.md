<!-- v0.3.3 — May 22, 2026. Phase 1 cross-surface parity. Replaced the Cowork-only
     `computer://` link handoff with a surface-neutral path + file:// link, keeping
     `computer://` as an additive Cowork affordance. Dropbox lookup is now
     surface-agnostic: checks all common locations and picks the most recent matching
     .md by mtime. Smart-memory writes are guarded by tool availability with a
     queue-file fallback (align-corrections-pending.md in the archive folder), drained
     on the next session that has smart-memory available. Timezone for the exported
     .md "Generated:" line is now a `{{TIMEZONE}}` placeholder; the template falls
     back to the browser's local zone if the placeholder is left unsubstituted.
     v0.3.2 — May 22, 2026. Phase 0 spec compliance. Dropped `version` field from
     YAML frontmatter (Anthropic spec uses git history + this changelog, not a
     frontmatter version). Documented the `verifiable` claim flag. Reconciled the
     manifest schema spec with the actual align-index.md column order (# | Date |
     Source | Claims | ✅ | ❌ | 🔶 | 🔷 | 🤷 | ➖ | ⬜ | File). Driven by the
     cross-surface packaging roadmap at /Projects/rhythm/sessions/research-align/.
     v0.3.1 — May 20, 2026. Template bumped to v0.4.1: always-visible header Download
     button, export controls always enabled. Driven by the team-lineup /align session —
     the download control was not discoverable.
     v0.3.0 — March 15, 2026. Correction SDK integration. Source-agnostic claim format,
     new template (light theme, mobile-first, two-panel desktop, keyboard shortcuts,
     expandable detail, chronological timeline support). Compartmentalized architecture
     for future standalone extraction. Built from BRIEF-align-retro-plugins.md.
     v0.2.1 — March 13, 2026. Doc update: fabric source is now Turso database.
     v0.2.0 — March 11, 2026. Added: incoming-docs/ pickup, align-archive/ cataloguing,
     manifest (align-index.md) auto-append, /retro integration point.
     v0.1.0 — March 11, 2026. Created during /rhythm session to close the epistemic
     feedback loop. -->
---
name: align
description: |
  Epistemic feedback loop. After /rhythm, /digest, or any claim-producing session, generates an interactive HTML form where you rate each claim as correct, wrong, almost, needs-nuance, or skip — plus add notes and flag missing items. Submit downloads an align.md that Claude reads back to apply corrections.

  Source-agnostic: works with rhythm claims, digest entries, commitment detections, briefing assertions, or any structured claim list.

  Trigger words: "/align", "align", "give feedback", "correct the rhythm", "that's not right", "let me correct", "alignment feedback", "epistemic feedback", "calibrate".

  IMPORTANT: This skill writes output to the ACTIVE WORKING FOLDER — not the root selected folder. The active folder is wherever the conversation says we're working (e.g., rhythm/, clients/adidas/, etc.). If no active folder is specified, ask.
---

# Align — Epistemic Feedback Loop

## Purpose

LLM outputs contain claims. Some are right, some are wrong, some need nuance. This skill structures the correction process into a persistent, machine-readable feedback loop:

1. **System produces claims** (rhythm, digest, commitment list, briefing, code review)
2. **User rates them** in an interactive HTML form (correct / wrong / almost / nuance / skip + notes)
3. **Corrections get archived** as structured datapoints
4. **Patterns emerge** from accumulated corrections (`/retro`)
5. **Patterns become rules** — skill patches, CLAUDE.md guardrails, prompt improvements

## Architecture: Compartmentalization

This skill is designed for eventual extraction into a standalone Correction SDK.

**Current state (v0.3.0):** `/align` lives inside the karoulis plugin. It handles claim extraction, form generation, correction processing, and archiving as one skill.

**Extraction boundary:** The HTML template (`align-template.html`) is the reusable component. It accepts a generic claim array and produces a generic correction markdown. The SKILL.md provides the karoulis-specific claim extraction and context routing. When `/align` becomes standalone, the template ships as-is, and this SKILL.md becomes the thin wrapper.

## Claim Format (Source-Agnostic)

The template accepts claims as a JavaScript array. Each claim has:

```javascript
{
  id: 1,                          // sequential number (required)
  text: "Nikos shared K16 doc",   // the assertion to verify (required)
  source: "fabric digest",        // where the claim came from (required)
  time: "13:26",                  // timestamp (optional — for chronological view)
  icon: "slack",                  // source icon key (optional: calendar, gmail, slack, fireflies, drive, fabric, rhythm, commitment, briefing)
  desc: "Longer description...",  // supporting context below the claim text (optional)
  detail: "Full raw content...",  // expandable raw content (optional)
  categories: ["adidas/lsr"],     // topic tags (optional)
  files: ["doc.pdf (5MB)"],       // file attachment labels (optional)
  attendees: "Thomas Tsotsos",    // meeting attendees (optional)
  link: "https://slack.com/...",  // source link (optional)
  verifiable: true                // (optional, default true) Set false for claims derived from filesystem state, smart-memory, or LLM inference the user cannot independently verify. Pre-rates the claim as 🤷 "can't verify" with a badge — the user can still override.
}
```

**Two modes based on input shape:**
- **Claim mode** (from /rhythm): `id`, `text`, `source`. No `time` or `icon`. Cards show "Claim N" header.
- **Timeline mode** (from /digest): `id`, `text`, `source`, `time`, `icon`. Cards show timestamp header, entries appear chronological.

The template auto-detects mode based on whether `time` is present.

**The `verifiable: false` affordance.** Some claims are derived from sources the user cannot inspect from memory (filesystem state, smart-memory recall, multi-step LLM inference). Surfacing those to the user for a yes/no rating is a calibration trap — they'll guess. Mark them `verifiable: false` so they pre-render as 🤷 "can't verify" with a visible badge; the user can still up- or down-rate, but the default acknowledges the epistemic gap.

## Two Phases

### Phase 1: Generate the HTML form

1. **Identify the active working folder.** This is NOT always the root selected folder. Ask the user or infer from context:
   - If we just ran `/rhythm` → active folder is `rhythm/`
   - If we're working on adidas → active folder is `clients/adidas/...`
   - If reviewing a digest → active folder is `rhythm/`
   - If ambiguous → ask: "Where should I save the alignment feedback?"

2. **Extract claims from the most recent output.** Scan the current conversation for the last claim-producing output. Look for:
   - Lines with epistemic markers (📌, 💭, ⚠️, 🧵, 🔗, 🔬)
   - Table rows with status indicators (✅, ❌, 🟡, ⏳, ⚠️)
   - Items in "Action Queue", "Heads Up", "Plan vs Reality" sections
   - Digest entries with timestamps
   - Commitment detections
   - Key assertions about people, dates, statuses, decisions

3. **Build the claim array.** For each claim, create an object matching the Claim Format above. Include `detail` (the raw source text) when available — this powers the expandable view.

4. **Populate the HTML template.** Read `align-template.html` from THIS skill's folder. Replace:
   - `{{CONTEXT}}` → human-readable context (e.g., "Rhythm, Mar 15" or "Digest Review, Mar 14")
   - `{{DATE}}` → today's date (YYYY-MM-DD)
   - `{{SOURCE}}` → source description (e.g., "/rhythm full" or "fabric digest")
   - `{{CONTEXT_SLUG}}` → kebab-case slug for filenames
   - `{{TIMEZONE}}` → IANA timezone for the exported `.md` "Generated:" line. Optional. Use the user's environment timezone if known (e.g., `Europe/Athens`). If left unsubstituted, the template falls back to the browser's local zone — that's a safe default and not a bug.
   - `// {{CLAIMS_INJECT}}` line and the `const claims = [];` line below it → replace with `const claims = [... your array ...];`

5. **Save the populated HTML** to the active working folder as `align-{context}-YYYY-MM-DD.html`.

6. **Present the file** with a surface-neutral handoff. The absolute path is the canonical artifact — every surface understands it. Add per-surface affordances on top.

   **Default (Claude Code, terminal, anywhere `computer://` is not available):**

   > Here's your alignment form with N claims extracted from today's output.
   > Open in your browser:
   > [align-{context}-YYYY-MM-DD.html](file:///absolute/path/to/file.html)
   > Path: `/absolute/path/to/file.html`
   > Rate claims, hit **Download align.md**, then tell me "done".

   **In Cowork (if a Cowork-specific MCP tool is wired, or you can otherwise confirm the runtime):** add one extra line offering the `computer://` shortcut so a single click opens the file in the default browser:

   > [Open in browser](computer:///absolute/path/to/file.html)

   When in doubt about the surface, prefer the default — the `file://` link is universally clickable in most terminals and chat surfaces, and the explicit path makes the absolute location grep-able and copy-able. Never make `computer://` the only handoff; that breaks Claude Code and any non-Cowork consumer.

### Phase 2: Apply the feedback and archive

When the user says "done" (or "apply", "process feedback", etc.):

#### Step 1: Find the align.md

The lookup is surface-agnostic: scan all common locations, glob for `align-*.md`, and pick the most recent match by mtime. If a filename matches the context slug used for the HTML form generated in Phase 1, prefer that match even if it isn't the newest. Ask only if multiple equally-recent files remain.

**Locations to check** (all of them, every time — no surface detection needed):
- `~/Downloads/` — universal browser default
- The active working folder where the HTML was saved (passed in from Phase 1 or inferred from current context)
- `incoming-docs/` in the root selected folder (Cowork-app convention; present only in Cowork sessions)
- The current working directory (Claude Code default)
- The root selected folder itself (Cowork-app convention)

The user can also explicitly hand off: "I saved it to /tmp/foo.md" — accept that path directly and skip the scan.

#### Step 2: Read and parse

The file has a predictable structure:
- `## Corrections Required` — claims marked wrong/almost/nuance with user's reality notes
- `## Confirmed / Other` — claims marked correct or skipped
- `## Missing — Not Captured` — things the user added that were absent from the original output

#### Step 3: Apply corrections

For each correction type:

**❌ Wrong / 🔶 Almost / 🔷 Needs nuance:**
- If the claim relates to a TASKS.md item → update TASKS.md with the corrected information.
- If the claim relates to a person/project/commitment → write to smart-memory **only if the tools are available** (see Smart-memory guard below). Tag with `["align-correction", "YYYY-MM-DD"]` in the `decisions` collection.
- If the claim relates to a meeting outcome → note the correction for future fabric assembly.

**➖ Irrelevant / ⬜ Skipped:**
- Note for future rhythm outputs to deprioritize this type of information.

**Missing items:**
- If it's a task → add to TASKS.md.
- If it's context/knowledge → write to smart-memory (guarded — see below).
- If it's a calendar/schedule item → flag for the user.

##### Smart-memory guard

Smart-memory is an MCP server that may or may not be wired in the current session — present in Cowork by default, not always present in Claude Code or in standalone runs. Before calling any of `recall`, `remember`, or `remember_facts`, check whether the tool is available in this turn:

- **Tools available** → call `remember()` and/or `remember_facts()` as described above. Proceed normally. Also drain the pending-corrections queue (next bullet).
- **Tools NOT available** → append each would-be smart-memory write to `rhythm/align-archive/align-corrections-pending.md` as a flat YAML block:

  ```yaml
  - queued_at: 2026-05-22T14:30:00+03:00
    session: align-todo-2026-05-21
    claim_id: 14
    claim_text: "Lars sent the FO one-pager refresh on 20 May."
    reality: "He didn't — meeting was 20 May, refresh wasn't shared."
    tags: [align-correction, 2026-05-22]
    collection: decisions
  ```

  Never block on a missing tool; the queue is the durable record.

- **At the start of every Phase 2 run with smart-memory available** → read `align-corrections-pending.md`, replay each entry through `remember_facts()`, then truncate the file (keep the file with a header, just clear the entries). Log the drain in the Phase 2 report.

This contract makes /align work end-to-end on any surface, and guarantees no correction is lost between a smart-memory-less Claude Code session and a subsequent Cowork session that has the tool.

#### Step 4: Archive both files as a datapoint

Every align session produces a **datapoint** = one `.html` + one `.md` pair. After applying corrections:

1. **Copy the `.md`** from wherever it was found → `rhythm/align-archive/align-{context}-{date}.md`
2. **Copy the `.html`** from the active working folder → `rhythm/align-archive/align-{context}-{date}.html`
3. **Delete the `.md` from `incoming-docs/`** (it's been processed; the archive is the permanent copy)
4. **Keep the `.html` in the active folder** as well (for local reference; the archive copy is the canonical one for `/retro`)

The archive folder is `rhythm/align-archive/`. Create it if it doesn't exist.

#### Step 5: Append to the manifest

Open `rhythm/align-index.md`. If it doesn't exist, create it with the header row.

Append a new row, where `#` is the next sequential session number:

```
| # | YYYY-MM-DD | {source description} | {total} | {✅} | {❌} | {🔶} | {🔷} | {🤷} | {➖} | {⬜} | `align-{context}-YYYY-MM-DD.md` |
```

Session counts must sum to total: `✅ + ❌ + 🔶 + 🔷 + 🤷 + ➖ + ⬜ = total`. Missing items (added by the user during the form session) are documented inside the per-session `.md` under `## Missing — Not Captured`, not in this index row. Accuracy rates live in a separate "Accuracy Rates" table in `align-index.md` and are intended to be regenerated by `/retro` from the manifest, not maintained inline.

#### Step 6: Report

Be concise:
> Applied 3 corrections, confirmed 8 claims, added 1 missing item to TASKS.md.
> Wrote 2 facts to smart-memory. Archived as datapoint #4 in `rhythm/align-archive/`.
> Accuracy: 69% (9/13 rated claims correct).

## Claim Extraction Heuristics

Not every line in a rhythm output is a "claim." Extract only lines that make a **falsifiable assertion**. Good claims:

- "LSR Weekly deadline is March 27" — date, verifiable
- "Craig partnership ending, saves €5K/month" — decision, amount
- "Lars handover NOT confirmed complete" — status assertion
- "Christina drafting UK scope response today" — commitment, timeline
- "CN follow-up call missing from calendar" — factual gap

Skip these:

- Section headers ("## Today's Schedule")
- Pure formatting ("---")
- Epistemic meta-notes ("Source Confidence" table — that's *about* claims, not a claim itself)
- The "Scholium" paragraph (that's Claude's own uncertainty reflection, not a claim to verify)

## File Naming

Files include a **context slug** derived from what produced the claims:

- HTML form: `align-{context}-YYYY-MM-DD.html` (in active working folder)
- Downloaded feedback: `align-{context}-YYYY-MM-DD.md` (user downloads from browser)
- If multiple alignment sessions in one day: `align-{context}-YYYY-MM-DD-2.html`, etc.

### Context Slug Rules

The context slug is a short kebab-case identifier for the claim source. Derive it automatically — confirm with user only if ambiguous.

| Source | Context slug | Example |
|--------|-------------|---------|
| `/rhythm` morning brief | `rhythm` | `align-rhythm-2026-03-15.html` |
| `/rhythm` day status | `rhythm-day` | `align-rhythm-day-2026-03-15.html` |
| `/rhythm expectations` | `expectations` | `align-expectations-2026-03-15.html` |
| Daily digest review | `digest` | `align-digest-2026-03-15.html` |
| Commitment detection | `commitments` | `align-commitments-2026-03-15.html` |
| adidas LSR session | `adidas-lsr` | `align-adidas-lsr-2026-03-15.html` |
| Glenigan review | `glenigan` | `align-glenigan-2026-03-15.html` |
| Condé Nast scope | `conde-nast` | `align-conde-nast-2026-03-15.html` |
| Generic / unknown | Ask the user | `align-session-2026-03-15.html` |

**Inference order:** (1) If `/rhythm` just ran → `rhythm` or `rhythm-day`. (2) If digest review → `digest`. (3) If a specific client/project is the topic → use client slug. (4) If unclear → ask.

The HTML title and subtitle also reflect the context: "Align — adidas LSR, Mar 15" not just "Align".

## Active Folder Convention

The active folder is **where the work lives**, not where the Cowork session started. Examples:

| Context | Active folder |
|---------|--------------|
| After `/rhythm` | `rhythm/` |
| After `/rhythm expectations` | `rhythm/expectations/` |
| Digest review | `rhythm/` |
| Working on adidas | `clients/adidas/adidas-project-delivery/` |
| Working on Glenigan | `clients/cils/Glenigan/` |
| General/unknown | Ask the user |

Always confirm the active folder before saving. A one-liner is fine: "Saving to `rhythm/` — correct?"

## Archive & Manifest

### Datapoint concept

Each align session produces a **datapoint**: one `.html` (the form) + one `.md` (the feedback). These are the raw material for `/retro` — the meta-retrospective that finds patterns in Claude's model divergence from reality.

### File locations

| What | Where | Purpose |
|------|-------|---------|
| Active `.html` | Active working folder (e.g., `rhythm/`) | Local context, interactive form |
| Archived `.html` | `rhythm/align-archive/` | Permanent record, `/retro` input |
| Archived `.md` | `rhythm/align-archive/` | Permanent record, `/retro` input |
| Manifest | `rhythm/align-index.md` | Quick lookup, stats over time |
| Incoming `.md` | `incoming-docs/` | Browser download dropbox — processed then deleted |

### Manifest format

`rhythm/align-index.md` is a markdown table:

```markdown
# Align Archive — Index

Manifest of all /align feedback datapoints. Each row = one alignment session.

| # | Date | Source | Claims | ✅ | ❌ | 🔶 | 🔷 | 🤷 | ➖ | ⬜ | File |
|---|------|--------|--------|---|---|---|---|---|---|---|------|
| 1 | 2026-03-11 AM | /rhythm full — morning brief | 15 | 9 | 1 | 2 | 2 | 0 | 0 | 1 | `align-rhythm-2026-03-11.md` |
```

Column order is fixed: `# | Date | Source | Claims | ✅ | ❌ | 🔶 | 🔷 | 🤷 | ➖ | ⬜ | File`. The `Source` column is a short human-readable description (not a folder path) — e.g., "/rhythm morning briefing", "todo-0515 + horizon + calendar", "/digest review 14:30 EET". The `🤷` column counts claims rated "can't verify" (typically those marked `verifiable: false` at generation time, plus any the user demoted manually).

## Template Features (v0.4.1)

The HTML template (`align-template.html`) includes:

- **Always-visible Download button** — a labeled Download control sits in the sticky header on every screen width and is always enabled, so export is never hidden behind a media query or gated until a claim is rated
- **Light theme** — clean, readable on all devices
- **Mobile-first** — single column, thumb-friendly tap targets, sticky progress bar, FABs for missing items and export
- **Desktop two-panel** — claims on left, summary/stats/missing/export on right
- **Keyboard shortcuts** — ↑↓ navigate, 1-5 rate, E expand, N focus notes
- **Expandable detail** — tap a claim to reveal raw content, attendees, source links
- **Auto-advance** — rating a claim moves focus to the next one
- **Progress bar** — color-coded by rating, updates in real-time
- **Pattern alerts** — warns when 3+ claims are wrong
- **Source-agnostic** — same template works for rhythm claims, digest entries, commitments, briefings

## Integration with Other Skills

- **/rhythm** → produces claims → **/align** corrects them
- **/digest** → produces timeline entries → **/align** reviews them (same template, timeline mode)
- **/retro** → reads `rhythm/align-archive/` + manifest → finds improvement patterns → proposes SKILL.md patches (weekly cadence)
- **smart-memory** → corrections feed into `recall()` for future sessions (tagged `align-correction` in `decisions` collection)
- **TASKS.md** → corrections update task statuses and add missing items
- **Future fabrics** → corrections about meetings/events inform fabric assembly

## What Good Looks Like

A well-used `/align` output is short: most claims are ✅ Correct with no notes. The 2–3 that need correction have clear "Reality:" notes. One or two missing items get captured. The whole thing takes 2 minutes to fill in and saves hours of future confusion.

Over time, the archive in `rhythm/align-archive/` accumulates structured datapoints that `/retro` can analyze for systematic patterns. The manifest gives a quick view of accuracy over time — is Claude getting better?
