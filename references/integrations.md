# Integrations — TASKS.md, smart-memory, /retro, producers

This reference covers how /align interacts with the systems around it. Each integration is opt-in from the skill's perspective: if a target system isn't present, /align degrades gracefully rather than failing.

## Integration map

| Counterpart | Direction | What happens |
|-------------|-----------|--------------|
| **Producer skill** (rhythm, digest, code review, briefing, etc.) | Producer → /align | Producer emits claims matching the Claim Adapter Contract; /align renders the form |
| **TASKS.md** | /align → file | Corrections about task statuses update rows; missing items create new rows |
| **smart-memory MCP** (`recall` / `remember` / `remember_facts`) | /align → MCP, guarded | Corrections about people, projects, decisions are written to the `decisions` collection, tagged `align-correction` |
| **Pending queue** (`align-corrections-pending.md`) | /align → file (fallback) | When smart-memory MCP is absent, queued for next session |
| **/retro** | Archive → /retro | Reads the archive folder + manifest; mines patterns; proposes prompt patches and CLAUDE.md rules |
| **Fabric assembly** | /align → next fabric run | Corrections about meeting outcomes and timestamps inform future fabric assembly (informally — no programmatic hook today) |

## TASKS.md updates

When a Phase 2 correction relates to a task:

- **Status change** (e.g., "Wrong: Lars handover marked open but it closed last week") → update the row's status, add a closed_at date if applicable, leave a `<!-- align-correction YYYY-MM-DD -->` HTML comment for traceability.
- **Missing task** (user added it via the form's Missing-items affordance) → append a new row to the appropriate section, tag with `<!-- align-correction YYYY-MM-DD -->`.
- **Wrong detail** (e.g., "Almost: amount is €5K/month, not €4K") → patch the cell, leave the comment.

Do not delete rows from TASKS.md as a result of a correction. If an item is done, mark it done; don't erase the history.

## Smart-memory guard

Smart-memory is an MCP server exposing `recall`, `remember`, and `remember_facts` tools. It is present in Cowork by default, **not always present** in Claude Code or in a fresh plugin install. Phase 2 must check before calling.

### Detection

Before invoking any smart-memory tool, verify the tool is in the current session's tool list (the same way you check for any optional MCP tool). If `remember_facts` is callable, treat smart-memory as available.

### Behavior matrix

| Smart-memory present? | Behavior |
|-----------------------|----------|
| **Yes** | (a) Drain the pending queue first (see below). (b) Call `remember_facts()` for each correction with payload `{ collection: "decisions", text: "...", tags: ["align-correction", "YYYY-MM-DD"] }`. (c) Report writes in the Phase 2 summary |
| **No** | (a) Append each would-be write to `rhythm/align-archive/align-corrections-pending.md` as YAML. (b) Skip the call. (c) Mention the queue in the Phase 2 summary so the user knows a drain is pending |

Never block or fail because smart-memory is absent. The queue is the durable record; the absence is just a deferral.

### Pending queue format

`rhythm/align-archive/align-corrections-pending.md` is a flat YAML list under a markdown header. Each entry is one would-be smart-memory write:

```markdown
# Pending /align → smart-memory writes

Queued corrections that could not be persisted to smart-memory because the MCP tool was unavailable in the originating session. Drained by the next session that has the tool.

---

- queued_at: 2026-05-22T14:30:00+03:00
  session: align-todo-2026-05-21
  claim_id: 14
  claim_text: "Lars sent the FO one-pager refresh on 20 May."
  reality: "He didn't — meeting was 20 May, refresh wasn't shared."
  tags: [align-correction, 2026-05-22]
  collection: decisions

- queued_at: 2026-05-22T14:31:11+03:00
  session: align-todo-2026-05-21
  claim_id: 28
  claim_text: "Antonis catch-up email is still owed."
  reality: "Overtaken by the 20 May Antonis meeting; email no longer owed."
  tags: [align-correction, 2026-05-22]
  collection: decisions
```

Fields:
- `queued_at` — ISO 8601 timestamp with timezone offset.
- `session` — the session slug (matches the `.md` filename without extension).
- `claim_id` — integer matching the claim's `id` in the original form.
- `claim_text` — the original claim text, verbatim.
- `reality` — the user's correction note from the form.
- `tags` — list of strings, always includes `align-correction` + the date string.
- `collection` — smart-memory collection name; default `decisions`.

### Drain protocol

At the start of every Phase 2 run where smart-memory tools are available:

1. Read `align-corrections-pending.md` if it exists.
2. Parse the YAML entries.
3. For each entry, call `remember_facts()` with the equivalent payload.
4. After all entries are written, truncate the entries section of the file — keep the markdown header so the file structure stays visible, but clear the list.
5. Log the drain in the current Phase 2 report: `"Drained N pending corrections from prior sessions."`

If any entry fails to write (e.g., the MCP call errors), leave it in the queue and report the failure with the entry's `claim_id`. Never drop a correction.

## Smart-memory filter (opt-in, v0.7.0+)

By default, claim text and reality notes flow unfiltered into the `decisions` collection. This matches the producer-as-trust-boundary model (see `SECURITY.md` §What this policy doesn't cover). For users whose producers might surface sensitive content (meeting transcripts with attendee names, email bodies, internal discussions, contract amounts), an optional filter step intercepts each write.

The filter is prose, not code. Users declare it in their `CLAUDE.md`; Claude interprets and applies it per-correction. No JavaScript or regex required.

### Enabling the filter

In your `CLAUDE.md`, declare rules under an `<align-smart-memory-filter>` block:

```markdown
<align-smart-memory-filter>
For each correction about to be written to smart-memory:
- Skip writes from the meeting-digest producer where claim_text mentions attendee personal info.
- For code-review producer: pass through as-is.
- For any producer: if reality note contains a contract amount in € or $, replace the amount with "[REDACTED]" before writing.
- Otherwise: write as-is.
</align-smart-memory-filter>
```

The rules above are illustrative; the real shape is whatever the user writes. The filter is a free-form natural-language specification that Claude reads, applies per-correction, and treats as authoritative.

### Behavior

Before each `remember_facts()` call (or before each queue append, when smart-memory is unavailable):

1. Read the `<align-smart-memory-filter>` block from the user's `CLAUDE.md`, if present. Cache for the duration of the Phase 2 run.
2. Apply the rules to the current correction.
3. Three possible outcomes per correction:
   - **Write as-is** — payload unchanged.
   - **Write transformed** — payload uses scrubbed values from the filter.
   - **Skip** — no smart-memory write. The per-session `.md` archive entry still records the **original**; only the smart-memory layer skips.
4. The Phase 2 summary names the count of filtered / skipped writes:
   - *"Wrote 12 corrections to smart-memory; 3 transformed by filter, 1 skipped."*

### Filter applies before the queue too

When smart-memory is unavailable and writes go to `align-corrections-pending.md`, the filter still applies before the queue append. Queued entries are already filter-processed; the drain protocol calls `remember_facts()` on them without re-filtering. This keeps the filter's surface consistent regardless of MCP availability.

### What the filter does NOT do

- **Does not affect the per-session `.md` archive.** The archive is the source of truth and remains complete. The smart-memory layer is the convenience write.
- **Does not enforce filtering across producers.** The trust boundary remains the producer; the filter is a defense-in-depth opt-in, not a guarantee.
- **Does not prevent `/retro` from clustering on filtered content.** `/retro` reads the archive, not smart-memory; filtered/skipped corrections still surface in `/retro` synthesis.
- **Does not validate the user's rules.** If the rules are ambiguous, Claude interprets in good faith and reports the interpretation in the Phase 2 summary so the user can adjust.

If no filter is declared in `CLAUDE.md`, behavior is identical to v0.6.0 (unfiltered).

### Audit trail

For each correction processed, the Phase 2 summary should note:
- Total corrections processed
- Count written as-is
- Count written transformed (with anonymized example: "1 reality note scrubbed of contract amount")
- Count skipped (with reason summarized from the rule that matched)

This gives the user a per-session view of what the filter did, without leaking the original sensitive content.

## /retro integration

`/retro` is the downstream consumer that turns the archive into prompt patches and rules. It is a separate skill (currently planned, not built; design at `references/retro-design.md`). Its contract with /align:

- **Reads** `rhythm/align-archive/align-index.md` (manifest), all per-session `.md` files in the archive folder, and `align-corrections-pending.md`.
- **Does NOT modify** anything in `rhythm/align-archive/`. The archive is append-only from /align's side and read-only from /retro's side.
- **Writes** proposed CLAUDE.md additions and skill SKILL.md patches into a separate location (probably `rhythm/retro-output/` or directly into source skills with a marker), with human review gates before they land.

The expected cadence is weekly: /retro reads ~5-10 new sessions worth of corrections, surfaces failure-mode clusters, proposes one or two rule changes per run.

## Other producers (non-rhythm)

A producer is any skill or process that emits claims matching the Claim Adapter Contract (defined in `SKILL.md`). Examples already in use:

- **/rhythm** (morning briefings, day status, expectations) — see `references/claim-extraction-rhythm.md` for extraction heuristics.
- **Daily todo prints** — claims about item state (overdue, done, deadline drift). Already used at sessions #9 in the archive.
- **BGR headcount file** — claims about who's on the team. Session #8.
- **Benchmark design reports** — claims about architectural decisions and feasibility. Session #10.

A new producer should:
1. Define what counts as a claim in its output (the falsifiable-assertion rule).
2. Build the claim array with the required + relevant optional fields.
3. Pass the array to /align's Phase 1 (`/align <context-slug>`).
4. /align does the rest — render, hand off, parse, archive.

The producer does NOT need to live in this plugin. /align is a library other skills (or ad-hoc Claude turns) can call.
