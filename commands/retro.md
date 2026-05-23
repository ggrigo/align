---
description: Synthesize the /align archive into a pass document — aggregate metrics, failure-mode clusters, pipeline-blind-spot clusters, proposed patches with human-review gates. Reads the archive; never modifies it.
---

# /retro — archive synthesis

`/retro` is the downstream consumer of `/align`'s archive. It reads the manifest, opens each session's `.md`, and writes one synthesis pass document per run. It proposes patches; it does not apply them.

This command is the v0 synthesis side. The `/retro apply` sub-invocation (which carries patch acceptance forward to the actual target files) is a planned v0.2 extension; out of scope for this file.

See `references/retro-design.md` for the architectural rationale, placement options, and review-gate mechanics. See `references/archive-format.md` for the manifest and per-session `.md` schemas /retro reads from.

## Arguments

```
/retro                              # default: last 7 days, all sources
/retro 2026-05                      # one month
/retro 2026-05-15..2026-05-22       # explicit date range
/retro rhythm                        # filter by source slug
/retro rhythm 2026-05                # both filters
```

Resolve the args:

- If the arg matches `YYYY-MM` → month filter, last day inclusive.
- If the arg matches `YYYY-MM-DD..YYYY-MM-DD` → explicit range, both inclusive.
- If the arg is a single kebab-case token not matching either date shape → source-slug filter.
- If two args are provided → first is slug, second is date filter.
- If no args → default to last 7 days, all sources.

## Inputs

Read these in order:

1. **Manifest** at `rhythm/align-archive/align-index.md` (or equivalent — the archive folder may not be under `rhythm/`; check `~/align` working memory for the active archive path).
2. **Per-session `.md` files** in the archive folder, one per filtered row.
3. **Pending corrections queue** at `align-archive/align-corrections-pending.md` if it exists.

Skip the `.html` files. Per `references/integrations.md` §/retro integration: the archive is consumed via `.md` only.

If the manifest file is missing: the archive doesn't exist yet. Report this and stop. Do not create the manifest from /retro — that's /align's job during Phase 2.

If the manifest exists but the filter selects zero rows: tell the user the filter is empty and suggest broadening it. Do not write an empty pass file.

## Process

### Step 1 — Parse the manifest

Read each row and apply the date/slug filter. Keep:

- Session number (`#`)
- Date
- Source string
- The seven count columns (✅ ❌ 🔶 🔷 🤷 ➖ ⬜)
- Total `Claims` count
- Filename of the per-session `.md`

Verify the per-row sum-invariant (✅+❌+🔶+🔷+🤷+➖+⬜ = Claims). If any row fails, flag it in the pass output's anti-pattern section — don't stop.

### Step 2 — Read each session's `.md`

For each filtered row:

1. Open the `.md` file referenced in the manifest row.
2. Parse three sections (per `references/archive-format.md`):
   - `## Summary` table (already covered by the manifest; sanity-check the totals match)
   - `## Corrections Required` — list of corrections; each has a claim, the user's reality note, and a rating
   - `## Missing — Not Captured` — list of items the user added via the form's missing affordance

If any of the three sections is missing or malformed, log the file path in the anti-pattern section and proceed with what's available.

### Step 3 — Cluster corrections (failure modes)

For each correction across all sessions:

1. Extract the claim text and the reality note.
2. Tokenize the claim text (lowercase, drop stopwords, keep nouns and verbs).
3. Tag with source slug and session date.

To find clusters, group by:

- **Shared root noun** — the most-frequent meaningful noun in the claim. Examples: "handover," "release," "deadline," "decision," "deploy," "PR," "meeting."
- **Structural feature in the reality note** — what kind of correction it is. Examples: "date was wrong," "status was wrong," "wrong party named," "missed a precondition," "overstated completion."

A cluster qualifies if:

- ≥2 corrections share both the noun and the structural feature, AND
- They come from ≥2 different sessions (cross-session signal, not a single-session repeat).

For each qualifying cluster, name it with a one-line label, list its instances, and write a one-paragraph root-cause read. Severity tag is the strongest rating among the cluster's instances (❌ > 🔶 > 🔷).

### Step 4 — Cluster missing items (pipeline blind spots)

Same grouping as Step 3 but on `## Missing — Not Captured` entries:

- Shared noun / topic that keeps being missed by the producer.
- Optional shared structural feature (e.g., "always missing the cross-team dependency," "always missing the financial impact").

A cluster qualifies on the same ≥2/≥2 rule.

For each, write a one-paragraph "what's blind" note.

### Step 5 — Propose patches (gated)

For each qualifying cluster (failure-mode or blind-spot), propose one concrete patch. A patch is one of:

- **Producer prompt edit** — a target file path + section + diff.
- **CLAUDE.md rule** — a one-line rule body to add to the user's CLAUDE.md.
- **Skill SKILL.md edit** — a target file + section + diff.
- **Informational (no patch)** — for clusters where the right response is awareness, not a rule change.

Each patch has a Review status of `⬜ pending`. The user accepts/rejects/revises in the pass document directly (Stage 1 of the review gate — see `references/retro-design.md` §Review-gate mechanics).

Do not propose more than one patch per cluster. If multiple patches would all help, pick the one most likely to land.

### Step 6 — Write the pass document

Output path: `<archive-folder>/retro-output/YYYY-MM-DD-pass-N.md` where:

- `YYYY-MM-DD` is today's date.
- `pass-N` is the next sequential pass number for today (1 if first, 2+ otherwise — check the directory).

Create the `retro-output/` subdirectory if it doesn't exist.

Use this schema:

```markdown
# /retro pass — synthesis

Generated: YYYY-MM-DD HH:MM TZ
Scope: <N datapoints, filter description>
Sources read: <list of session filenames>

---

## Aggregate metrics

| # | Source | Claims | ✅ | ❌ | 🔶 | 🔷 | 🤷 | ➖ | ⬜ |
|---|--------|--------|----|----|----|----|----|----|----|
| ... |
| **Total** | | ... |

Accuracy roll-up (✅ / total): N%.
Calibration roll-up ((✅+❌+🔶+🔷+➖+⬜) / total): N%.
Aspirational rate (🤷 / total): N%.

---

## Failure-mode clusters

### Cluster A: <label>

| Where surfaced | Session | Severity |
|----------------|---------|----------|
| ... |

**Root cause:** <one paragraph>

→ **Proposed patch:** <category, target, diff>
**Review status:** ⬜ pending

### Cluster B: ...

---

## Pipeline-blind-spot clusters

### Cluster <letter>: <label>

| Where surfaced |
|----------------|
| ... |

**What's blind:** <one paragraph>

→ **Proposed patch:** <as above>

---

## Proposed patches (gated)

### Patch 1 — <one-line summary>

**Source cluster:** Cluster <letter>
**Target:** <file path>
**Section:** <heading>

Diff:
```
- <existing>
+ <proposed>
```

**Review status:** ⬜ pending — accept / reject / revise

### Patch 2 — ...

---

## Anti-pattern self-check

- **Sample size:** N sessions. Is this enough for the patterns claimed? <yes/no, with reasoning>
- **Time window:** sessions span <date range>. Is this representative?
- **Author skew:** <list of session sources>. Any one producer over-represented?
- **Manifest sum-invariant violations:** <list any flagged rows>
- **Malformed session `.md` files:** <list any>
- **Re-pass recommendation:** <yes/no, with reasoning>

If >50% of sessions came from a single producer or rater, prepend a top-of-doc warning to the synthesis.
```

### Step 7 — Report back to the user

After writing the pass file, give the user:

1. The absolute path of the pass document.
2. The Aggregate metrics row totals (one line summary).
3. The count of clusters surfaced (failure-mode + blind-spot).
4. The count of proposed patches.
5. Next step: "Open the pass file, mark each patch ✅/❌/🔶 in the Review status line, then run `/retro apply` to land the accepted ones." (Note: `/retro apply` is planned v0.2; for v0 the user manually applies patches by reading the diff.)

## Stop conditions

- **Empty archive** (manifest missing or filter returns zero rows): report and stop. Don't write an empty file.
- **All sessions malformed:** report and stop. Don't write a pass that has no data behind it.
- **Sum-invariant violations across most rows:** report, log the violations, but still write the pass — the user needs to see what's broken.

## What /retro does NOT do

- **Modify the archive.** Never edit `align-index.md`, never edit per-session `.md` files. Read-only on the archive folder.
- **Apply patches automatically.** Stage 2 (`/retro apply`) is the only mechanism for landing patches; v0 doesn't include it. Users who want to apply v0-era proposals do it themselves by reading the diff and editing the target file.
- **Cluster across multiple users' archives.** /align is single-user by design. /retro reads one archive per run.
- **Read the `.html` files.** Per the archive contract, the `.md` carries the structured signal; the `.html` is for human re-inspection only.

## Failure modes to surface

The maintainer agent's own dogfooding passes (the practical /retro analog runs at `~/agent-ggrigo/.align/retro-output/2026-05-23-pass-1.md` and `pass-2.md`) showed three failure modes worth surfacing if /retro hits them:

1. **Self-rater bias.** If the corpus is >50% own-work (the producer and rater are the same entity), prepend a top-of-doc warning and bias §Anti-pattern self-check toward the conservative read.
2. **Sample bias from focused-on-changes passes.** If many sessions extracted dramatically fewer claims than peers (e.g., 14-16 vs. 26-27), the syntheses skew toward what changed and miss drift in unchanged content. Surface this in §Anti-pattern self-check.
3. **Aspirational claim ratio.** A high 🤷 rate (>15%) signals practices committed-but-untested. The synthesis should note that the corpus reads as forward-looking rather than testable — patches against aspirational content are weaker signal.

These are the calibration notes for the LLM running /retro. They are not user-facing UX.

## Recursion note

The /retro skill is run by an LLM, against an archive that grades claims made by LLMs. The synthesis pass document this skill produces is itself an LLM output and needs grading. The agent that maintains /align dogfoods /retro on its own outputs — the pattern-mining output gets graded by /align in the next session. The recursion is operational, not aspirational.

— `/align` maintainer agent (design grounded in real passes 2026-05-23)
