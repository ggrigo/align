# Claim Extraction — Rhythm-Shaped Sources

This reference covers the *producer side* of the contract: how to walk a /rhythm-shaped output and turn it into an array of claims that the align template can render.

**When to use this file:**
- The source is `/rhythm`, `/rhythm expectations`, `/rhythm day status`, daily morning briefings produced by the rhythm pipeline, or any other output that uses the rhythm format (epistemic markers, status tables, structured sections).

**When NOT to use this file:**
- The source is structured text from another shape entirely — a code review, a financial reconciliation report, a meeting transcript, a custom analysis. In that case, write your own extraction logic and emit claims matching the Claim Adapter Contract in `SKILL.md`. The align skill does not care how the claims were extracted, only that the schema is honored.

The skill is source-agnostic by contract; this file documents one specific producer's heuristics, not a universal extraction algorithm.

## What is a claim?

A claim is a **falsifiable assertion** about the world. It must be possible for the user to look at the claim and say "right" or "wrong" — not "I don't know what this means."

Good claims:

- "LSR Weekly deadline is March 27" — a date, verifiable.
- "Craig partnership ending, saves €5K/month" — a decision and an amount.
- "Lars handover NOT confirmed complete" — a status assertion.
- "Christina drafting UK scope response today" — a commitment with a timeline.
- "CN follow-up call missing from calendar" — a factual gap.

Skip these:

- Section headers ("## Today's Schedule").
- Pure formatting ("---", blank lines, table dividers).
- Epistemic meta-notes ("Source Confidence" tables — those are *about* claims, not claims themselves).
- "Scholium" paragraphs (Claude's own uncertainty reflection — not a claim to verify).
- Imperative requests to the user ("Should I send the email?" is a question, not a claim).

## Extraction heuristics

Walk the source in document order and look for these landmarks:

1. **Lines with epistemic markers** — 📌, 💭, ⚠️, 🧵, 🔗, 🔬. Rhythm output uses these to tag the source quality of each assertion. Anything with a marker is a claim.

2. **Table rows with status indicators** — ✅, ❌, 🟡, ⏳, ⚠️. Status tables in rhythm output (Plan vs Reality, Action Queue) are claim-dense. Each row is one claim.

3. **Items in specific sections** — "Action Queue", "Heads Up", "Plan vs Reality", "What Matters", "Cross-References". These sections are explicitly claim-shaped by rhythm convention.

4. **Digest entries with timestamps** — `HH:MM source [text]` lines. Each entry is a chronological claim (use `time` and `icon` fields → timeline mode).

5. **Commitment detections** — explicit commitment lines from /rhythm expectations or the transcript commitment detector. Each is a claim about who promised what by when.

6. **Inline assertions about people, dates, statuses, decisions** — "Henning replied at 14:30", "Sony FY26 contract worth €484K", "Lars is leaving 31 May". Even without a marker, these are first-order claims and should be lifted.

## Building the claim object

For each extracted line:

- **`id`** — sequential integer starting at 1, in document order.
- **`text`** — the claim itself, as a short standalone sentence. Strip the marker, strip the timestamp prefix, strip the source-confidence annotation. The user should be able to read this without needing to look at the original.
- **`source`** — the epistemic marker line plus source tag if present. Example: `"📌 TASKS.md · 📌 Slack Mar 3"`. This is what appears under the claim text in italics.
- **`detail`** — when available, the verbatim original line from the rhythm output. Powers the expandable view.
- **`categories`** — topic tags inferred from the rhythm output's section headers. Example: `["adidas/lsr"]` for items in the adidas section.
- **`verifiable`** — set to `false` when the assertion is derived from filesystem state, a smart-memory recall, or multi-step LLM inference that the user can't independently verify. See the Claim Adapter Contract in `SKILL.md` for the full reasoning.

## Mode selection

- **Claim mode** (the default for /rhythm morning briefings and /rhythm expectations): no `time` field on any claim. Cards render as "Claim N" with the source line in italics. Use this for outputs that are conceptually a *list of assertions*.
- **Timeline mode** (for /rhythm day status, digests, commitment timelines): every claim has a `time` field. Cards render with a timestamp header and the icon. Use this for outputs that are conceptually a *chronological reading of the day*.

The template auto-detects mode based on whether any claim has `time`. Mixing modes within one form is supported but typically confusing — pick one per session.

## Context slug catalog

The context slug is a kebab-case identifier baked into the filename (`align-{slug}-YYYY-MM-DD.html`) and the form's title. Use this catalog for rhythm-shaped sources:

| Source | Context slug | Example filename |
|--------|--------------|------------------|
| `/rhythm` morning brief | `rhythm` | `align-rhythm-2026-03-15.html` |
| `/rhythm` day status | `rhythm-day` | `align-rhythm-day-2026-03-15.html` |
| `/rhythm expectations` | `expectations` | `align-expectations-2026-03-15.html` |
| Daily digest review | `digest` | `align-digest-2026-03-15.html` |
| Commitment detection | `commitments` | `align-commitments-2026-03-15.html` |
| adidas LSR session | `adidas-lsr` | `align-adidas-lsr-2026-03-15.html` |
| Glenigan review | `glenigan` | `align-glenigan-2026-03-15.html` |
| Condé Nast scope | `conde-nast` | `align-conde-nast-2026-03-15.html` |
| Daily todo list | `todo` | `align-todo-2026-05-21.html` |
| Team / headcount file | `team-lineup` | `align-team-lineup-2026-05-20.html` |
| Generic / unknown | Ask the user | `align-session-2026-03-15.html` |

**Inference order** when the slug isn't obvious:
1. If `/rhythm` just ran in this conversation, default to `rhythm` (morning) or `rhythm-day` (status update).
2. If reviewing a digest, default to `digest`.
3. If a specific client or project is the topic, use the client slug.
4. If you can identify a specific structured input (todo list, headcount file, financial report), name it.
5. If unclear, ask the user before generating the form. A misnamed file is worse than a 5-second clarification.

The HTML title and subtitle reflect the slug: "Align — adidas LSR, Mar 15" not just "Align".

## Active folder convention (rhythm-shaped sources)

The form is saved to the **active working folder** — where the work lives, not where the Cowork session was launched from. For rhythm-shaped sources:

| Context | Active folder |
|---------|---------------|
| After `/rhythm` (morning or day status) | `rhythm/` |
| After `/rhythm expectations` | `rhythm/expectations/` |
| Digest review | `rhythm/` |
| Working on adidas LSR | `clients/adidas/adidas-project-delivery/` |
| Working on Glenigan | `clients/cils/Glenigan/` |
| Daily todo print | `fabric/Α5/` (or wherever the todo lives) |
| Team / headcount file | `baresquare/finance/` |
| General / unknown | Ask the user once: "Saving to `rhythm/` — correct?" |

The archive copy of the .html and .md always goes to `rhythm/align-archive/` regardless of the active folder (see `references/archive-format.md`).

## What this file does NOT cover

- The *output* schema (claim object fields, modes, verifiability) — that's in `SKILL.md`.
- The archive format (manifest, per-session files) — that's in `references/archive-format.md`.
- Smart-memory writes and TASKS.md updates — those are in `references/integrations.md`.
- Extraction for non-rhythm sources — by design, each producer brings its own extraction logic and emits the contracted claim array directly.
