<!-- v0.5.0 — May 22, 2026. Phase 3 Correction SDK extraction. Slimmed SKILL.md from
     349 to ~220 lines; moved rhythm-specific extraction heuristics, context slug
     catalog, and active-folder convention to references/claim-extraction-rhythm.md.
     Moved archive folder layout, manifest schema, and naming conventions to
     references/archive-format.md. Moved smart-memory queue YAML format, drain
     protocol, TASKS.md handling, and producer onboarding to references/integrations.md.
     Promoted the claim schema to a first-class "Claim Adapter Contract" — the public
     interface any producer (rhythm, digest, code review, briefing, financial recon,
     anything) implements to be alignable. Dropped the "Architecture: Compartmentalization"
     section (extraction is done). Dropped the "Template Features (v0.4.1)" feature list
     (lives in the template's HTML comment). Dropped /rhythm-specific paths from the
     core body; they now live in claim-extraction-rhythm.md.
     v0.3.3 — May 22, 2026. Phase 1 cross-surface parity. Replaced the Cowork-only
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
  Epistemic feedback loop. Generate an interactive HTML form where the user rates LLM-produced claims as correct, wrong, almost, needs-nuance, can't-verify, or skip — plus add notes and flag missing items. Submit downloads an align.md that Claude reads back to apply corrections to TASKS.md, smart-memory (guarded), and the per-session archive.

  Source-agnostic by contract: any producer (rhythm, digest, briefing, todo, code review, financial recon, anything) that emits claims matching the Claim Adapter Contract can be aligned.

  Trigger words: "/align", "align", "give feedback", "correct the rhythm", "that's not right", "let me correct", "alignment feedback", "epistemic feedback", "calibrate".

  IMPORTANT: This skill writes output to the ACTIVE WORKING FOLDER — not the root selected folder. If no active folder is specified, ask.
---

# Align — Epistemic Feedback Loop

## Purpose

LLM outputs contain claims. Some are right, some are wrong, some need nuance. /align turns reading-and-muttering into a structured artifact:

1. A producer emits claims matching the Claim Adapter Contract below.
2. /align renders them into an interactive HTML form.
3. The user rates each claim, adds notes, flags missing items.
4. /align reads the downloaded `.md`, applies corrections to TASKS.md and smart-memory (when wired), archives the datapoint.
5. `/retro` mines the archive for failure-mode patterns → skill prompt patches and CLAUDE.md rules.

## Claim Adapter Contract

This is the public interface. A producer that emits an array of claim objects matching this schema can be aligned, regardless of what produced the output. No instrumentation contract beyond the array.

### Schema

```javascript
{
  id: 1,                          // sequential integer, document order (required)
  text: "Nikos shared K16 doc",   // the falsifiable assertion (required)
  source: "fabric digest",        // human-readable provenance (required)

  // Optional — for timeline-mode rendering
  time: "13:26",                  // timestamp; presence flips the form to timeline mode
  icon: "slack",                  // source icon key: calendar, gmail, slack, fireflies, drive, fabric, rhythm, commitment, briefing

  // Optional — supporting context
  desc: "Longer description...",  // one-line context below the claim
  detail: "Full raw content...",  // verbatim original, shown in expandable detail
  categories: ["adidas/lsr"],     // topic tags; surface in filters
  files: ["doc.pdf (5MB)"],       // file attachment labels
  attendees: "Thomas Tsotsos",    // meeting attendees (for transcript-sourced claims)
  link: "https://slack.com/...",  // canonical source link

  // Optional — epistemic affordance
  verifiable: true                // default true. Set false for claims derived from filesystem state, smart-memory recall, or multi-step LLM inference the user cannot independently verify. Pre-rates as 🤷 "can't verify" with a visible badge; the user can still override.
}
```

### Modes (auto-detected)

- **Claim mode** — no `time` on any object. Cards render as "Claim N" with the source line in italics. Use for *lists of assertions* (briefings, todos, status reviews).
- **Timeline mode** — every object has `time`. Cards render with timestamp headers and source icons. Use for *chronological readings* (digests, day status, commitment timelines).

Mixing modes within one form is supported but typically confusing — pick one per session.

### The `verifiable: false` affordance

Some claims are derived from sources the user can't inspect from memory — filesystem state they didn't read, smart-memory recall, multi-step inference. Asking a yes/no rating on those is a calibration trap: the user will guess, and the guess will be archived as truth. Mark such claims `verifiable: false` so they pre-render as 🤷 with a visible badge. The user can still upgrade or downgrade the rating, but the default acknowledges the epistemic gap.

### Producer responsibilities

A producer (rhythm, digest, code review, anything) must:

1. Walk its output and identify falsifiable claims. (For rhythm-shaped sources, the heuristics live in `references/claim-extraction-rhythm.md`. For other sources, the producer brings its own extraction logic.)
2. Build the claim array matching the schema above.
3. Provide context for the form: a human-readable `{{CONTEXT}}` label, a `{{SOURCE}}` description, a kebab-case `{{CONTEXT_SLUG}}` for filenames.
4. Optionally provide `{{TIMEZONE}}` (IANA name) to lock the timestamp in the exported `.md`.

Everything below this section is /align's responsibility, not the producer's.

## Two Phases

### Phase 1: Generate the HTML form

1. **Identify the active working folder.** Where the work lives, not where the session was launched from. Infer from context; ask if ambiguous. For rhythm-shaped sources, the inference table lives in `references/claim-extraction-rhythm.md`.

2. **Receive or extract claims.** If the producer hands you a claim array, use it. If not — and the source is /rhythm-shaped — apply the heuristics in `references/claim-extraction-rhythm.md`.

3. **Populate `align-template.html`** by substituting:
   - `{{CONTEXT}}` → human-readable context (e.g., "Rhythm, Mar 15", "Todo + Horizon, May 21").
   - `{{DATE}}` → `YYYY-MM-DD`.
   - `{{SOURCE}}` → short source description shown in the form header.
   - `{{CONTEXT_SLUG}}` → kebab-case for filenames.
   - `{{TIMEZONE}}` → IANA timezone (optional; falls back to browser local if unsubstituted).
   - The `// {{CLAIMS_INJECT}}` line and the `const claims = [];` below it → replace with `const claims = [... your array ...];`.

4. **Save** to the active working folder as `align-{slug}-YYYY-MM-DD.html`.

5. **Hand off, surface-neutral.** The absolute path is the canonical artifact — every surface understands it. Add per-surface affordances on top.

   **Default (Claude Code, terminals, anywhere `computer://` is unavailable):**

   > Here's your alignment form with N claims extracted from today's output.
   > Open in your browser:
   > [align-{slug}-YYYY-MM-DD.html](file:///absolute/path/to/file.html)
   > Path: `/absolute/path/to/file.html`
   > Rate claims, hit **Download align.md**, then tell me "done".

   **In Cowork** (when a Cowork-specific MCP tool confirms the runtime): add one extra line for one-click open:

   > [Open in browser](computer:///absolute/path/to/file.html)

   Never make `computer://` the only handoff — that breaks Claude Code and any non-Cowork consumer.

### Phase 2: Apply the feedback and archive

Triggered when the user says "done", "apply", "process feedback", etc.

#### Step 1 — Find the align.md

Surface-agnostic: scan all common locations, glob for `align-*.md`, pick the most recent match by mtime. If a filename matches the context slug from Phase 1, prefer it even if not newest.

Locations checked (all of them, every time):
- `~/Downloads/` — universal browser default.
- The active working folder (from Phase 1).
- `incoming-docs/` under the root selected folder (Cowork convention; present in Cowork only).
- The current working directory (Claude Code default).
- The root selected folder itself (Cowork convention).

The user can also hand off explicitly: "I saved it to /tmp/foo.md" — accept and skip the scan.

#### Step 2 — Read and parse

The `.md` has three named sections (export format from the template):
- `## Corrections Required` — claims marked wrong / almost / needs-nuance, each with a Reality note from the user.
- `## Confirmed / Other` — claims marked correct, irrelevant, skipped, or can't-verify.
- `## Missing — Not Captured` — items the user added that weren't in the original output.

#### Step 3 — Apply corrections

For each `Corrections Required` entry:
- If the claim relates to a TASKS.md item → update the row. Append `<!-- align-correction YYYY-MM-DD -->` for traceability. Don't delete.
- If the claim is about a person, project, or decision → write to smart-memory **only if the tools are available** (guard below). Tag with `["align-correction", "YYYY-MM-DD"]` in the `decisions` collection.
- If the claim is about a meeting outcome → leave a note for the next fabric-assembly run.

For `Missing — Not Captured`:
- If it's a task → add to TASKS.md with the correction comment.
- If it's context/knowledge → write to smart-memory (guarded).
- If it's a calendar/schedule item → flag for the user inline in the report.

##### Smart-memory guard

Smart-memory MCP (`recall`, `remember`, `remember_facts`) is present in Cowork by default and **not always present** in Claude Code. Before invoking, check tool availability:

- **Tool available** → drain the pending queue first (see `references/integrations.md`), then write the current corrections.
- **Tool unavailable** → append each would-be write to `rhythm/align-archive/align-corrections-pending.md` as a YAML entry. Never block. The queue is drained by the next session that has the tool.

Full YAML format and drain protocol: `references/integrations.md`.

#### Step 4 — Archive both files as a datapoint

Every session produces a datapoint = one `.html` + one `.md`. Copy both into `rhythm/align-archive/`. Delete the `.md` from the dropbox once archived. Keep the `.html` in the active folder for local reference; the archive copy is the canonical one for `/retro`.

Full archive folder layout, naming, and invariants: `references/archive-format.md`.

#### Step 5 — Append to the manifest

Append a row to `rhythm/align-index.md` (column schema, sum-invariant, and what doesn't go in the row: `references/archive-format.md`).

#### Step 6 — Report

Be concise. Example:

> Applied 3 corrections, confirmed 8 claims, added 1 missing item to TASKS.md.
> Wrote 2 facts to smart-memory; drained 0 from the pending queue.
> Archived as datapoint #11 in `rhythm/align-archive/`.

## Where things live

| Concern | File |
|---------|------|
| Rhythm-specific claim extraction, context slug catalog, active folder table | `references/claim-extraction-rhythm.md` |
| Datapoint concept, file locations, manifest schema, naming, sum invariant | `references/archive-format.md` |
| TASKS.md update rules, smart-memory queue YAML, drain protocol, /retro contract, producer onboarding | `references/integrations.md` |
| Interactive form UX, template features, exportMd() | `align-template.html` (the asset) |
| This file | Public contract + Phase 1/2 flow |

## What good looks like

A well-used /align run is short: most claims ✅ with no notes; 2–3 need a Reality note; 1–2 missing items get captured. Two minutes to fill in, saves hours of future confusion.

Over time, the archive accumulates calibrated datapoints. /retro mines them. The originating skill's prompts and the user's CLAUDE.md absorb the lessons. The system learns.
