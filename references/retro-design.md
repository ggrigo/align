# /retro — design

This document specifies `/retro`, the downstream consumer of the /align archive. `/retro` is named in the README §Why bullet 6 ("Patterns mined from the archive feed back into the originating skill's prompts and your `CLAUDE.md`") and in `references/integrations.md` §/retro as a separate skill whose v0 contract is sketched. This document extends the contract with the architecture, output format, and review-gate mechanics needed to build it.

Status: design draft. The skill is not yet implemented. The agent that maintains /align has been running `/retro`-style synthesis passes by hand on its own dogfooding archive since 2026-05-23, so the output shape below is grounded in two real example passes, not invented.

## Goal

Turn the archive — a growing corpus of rated claims with reality notes — into two concrete artifacts:

1. **Failure-mode clusters.** Groups of corrections that share a root cause across sessions. Example: "Five claims across three sessions overstated handover status because the producer was reading the calendar event title instead of the calendar event status." Useful to the user even without any patch.
2. **Proposed patches.** Concrete edits to producer prompts, `CLAUDE.md` rules, or skill SKILL.md text that would have prevented the cluster. Each patch gated by human review before it lands.

These two outputs are the *only* thing /retro writes. It does not modify the archive (per `integrations.md` §/retro). It does not auto-apply patches. It surfaces and asks.

## Where /retro lives

Three placement options, with the trade-offs:

### Option A — Sibling skill in the same plugin (recommended)

Restructure /align from a single-skill plugin to a multi-skill plugin:

```
align/
├── .claude-plugin/plugin.json
├── skills/
│   ├── align/SKILL.md            # current SKILL.md moved here
│   └── retro/SKILL.md            # new
├── references/                    # shared between both skills
└── ...
```

Skill invocation becomes namespaced: `/align:align` and `/align:retro`. The README §Install section documents both as part of one install.

**Pro:** /align and /retro share the archive, the manifest schema, and `references/` files. Updating the archive format updates both consumers in lockstep.
**Pro:** One marketplace listing, one install, one version.
**Pro:** The Claim Adapter Contract stays inside the same plugin as its first consumer.
**Con:** Namespaced skill names (`/align:align` reads slightly clunky). Acceptable per [docs](https://code.claude.com/docs/en/plugins#why-namespacing) — namespacing is the standard for plugin skills.
**Con:** Restructure touches /align's published entry point. Existing users (none yet, but future) would re-install.

### Option B — Separate plugin (`/retro` as its own marketplace entry)

A new plugin `retro/` with its own manifest, README, and `SKILL.md`. Cross-depends on /align's archive format via documentation, not code.

**Pro:** Independent install. Users who only want /align don't get /retro and vice versa.
**Pro:** Independent release cadence. /retro can iterate without bumping /align.
**Con:** Two marketplace listings, two versions to keep aligned. The archive-format contract becomes a *cross-repo* invariant.
**Con:** Users have to install both to get the loop closed.

### Option C — Sub-command of /align (`/align retro`)

Add a `retro` subcommand path inside the existing `/align` SKILL.md. The skill branches on its first arg.

**Pro:** No restructure. No namespace change.
**Con:** /retro's instructions are large (it's a different mode of operation — read-the-archive vs. extract-claims-from-output). Stuffing it into /align's SKILL.md bloats the always-loaded context.
**Con:** Conflates two responsibilities — extracting claims vs. mining the archive — in one skill.

**Recommendation: Option A.** The archive contract is local to /align; cross-plugin invariants are harder to maintain than co-located skills; users want both ends of the loop. The restructure cost is one-time and small. Document the migration path in the release notes when the restructure lands (planned for v0.7.0 — see §What ships first below for the revised order).

The remainder of this design assumes Option A.

## Invocation interface

```
/retro                              # default: last 7 days, all sources
/retro 2026-05                      # restrict to a month
/retro 2026-05-15..2026-05-22       # restrict to a date range
/retro rhythm                        # restrict to one source slug
/retro rhythm 2026-05                # both filters
```

The skill reads the manifest, filters rows by date and (optional) source-slug, opens each filtered session's `.md`, and synthesizes.

Output lands at `rhythm/align-archive/retro-output/YYYY-MM-DD-pass-N.md` where:
- `YYYY-MM-DD` is the run date.
- `pass-N` is the next sequential pass number for that day (1 if first run, 2+ if the user runs /retro multiple times in one day).

## Output format

The output `.md` is a synthesis pass document, not a per-claim datapoint. Schema:

```markdown
# /retro pass — synthesis

Generated: YYYY-MM-DD HH:MM TZ
Scope: N datapoints covering [filter description]
Sources read: <list of session filenames>

---

## Aggregate metrics

| # | Source | Claims | ✅ | ❌ | 🔶 | 🔷 | 🤷 | ➖ | ⬜ |
|---|--------|--------|----|----|----|----|----|----|----|
| 1 | <session source> | ... | ... |
| ...
| **Total** | | ... |

Accuracy roll-up (✅ / total): N%.
Calibration roll-up ((✅+❌+🔶+🔷+➖+⬜) / total): N%.
Aspirational rate (🤷 / total): N%.

---

## Failure-mode clusters

For each cluster, in severity order:

### Cluster <letter>: <one-line label>

| Where surfaced | Session | Severity in pass |
|----------------|---------|------------------|
| ... | ... | ❌ / 🔶 / 🔷 |

**Root cause:** <one paragraph naming what shared mistake produced these>

**Resolution status:** <new | partial | resolved>

→ **Proposed patch:** <one of>
  - Producer prompt edit: <file:section>, <one-line summary of the change>
  - CLAUDE.md rule: <one-line rule body>
  - Skill SKILL.md edit: <file:section>, <change>
  - No patch (informational only)

---

## Pipeline-blind-spot clusters

For each cluster of missing-items entries that share a theme:

### Cluster <letter>: <one-line label>

| Where surfaced |
|----------------|
| ... |

**What's blind:** <one paragraph naming the kind of thing the producer keeps missing>

→ **Proposed patch:** <as above>

---

## Proposed patches (gated)

Concrete diff-style edits, one per proposal:

### Patch 1 — <one-line summary>

**Source cluster:** <reference to cluster letter above>
**Target:** <file path>
**Section:** <heading>
**Severity:** <how confident the patch addresses the cluster>

Diff:
```
- <existing text>
+ <proposed text>
```

**Review status:** ⬜ pending — accept / reject / revise

---

## Anti-pattern self-check

Mandatory section. Each pass calls out its own coverage and bias limits:

- Sample size: N datapoints — is this enough for the patterns claimed?
- Time window: do all datapoints come from a short window that may not be representative?
- Author skew: are the rated sessions disproportionately from one producer or one rater?
- Re-pass needed: should a future pass re-grade these sessions cold to test what stays valid?
```

The two reference implementations (pass-1 ~11 sessions worth of synthesis, pass-2 ~6 sessions worth of synthesis) on the maintainer agent's own dogfooding archive follow this schema. They are the test inputs for the eventual implementation.

## Review-gate mechanics

Patches don't auto-apply. The gate has two stages:

### Stage 1 — In-document acceptance

Each patch in the output `.md` has a "Review status" line. The user opens the file, changes `⬜ pending` to `✅ accept`, `❌ reject`, or `🔶 revise <new diff>` for each patch.

This is the same low-tech rating affordance /align uses for claims. No special UI, just markdown a human can edit.

### Stage 2 — Application sweep

After the user finishes the in-document review, they run `/retro apply` (sub-invocation; same skill).

`/retro apply`:
1. Reads the most recent pass `.md`.
2. Filters to patches marked `✅ accept` or `🔶 revise`.
3. For each, applies the diff to the named target file.
4. For each `🔶 revise`, applies the *revised* diff the user wrote, not the original.
5. Writes an "Applied" footer to the pass `.md` listing what landed.

Rejected patches (❌) are logged in the footer too but not applied. Pending patches (⬜) skip the application sweep entirely.

The user can re-run `/retro apply` if they didn't review every patch in one sitting — applied patches are noted in the footer so they don't double-apply.

## Pattern-mining heuristic (v0)

The two-pass dogfooding work gives a starting heuristic. /retro is not a clustering algorithm; it's a markdown-template-filler with simple grouping rules.

For each `.md` in scope:

1. Parse the `## Corrections Required` section.
2. For each correction:
   - Extract the original claim text and the user's reality note.
   - Tokenize the claim text (rough — split on whitespace, lowercase, drop stopwords).
   - Tag with the source slug and date.

For clustering across all parsed corrections:

1. Group by **shared root noun** in the claim — e.g., "handover," "release," "decision," "deadline."
2. Within each group, check if the reality notes share a structural feature (e.g., "the date was wrong," "the status was wrong," "the wrong party was named").
3. A cluster qualifies if it has ≥2 corrections sharing both the noun *and* the structural feature *and* coming from different sessions.

For v0, this is enough. Future versions can lean on LLM-driven clustering instead of token rules; the markdown output format stays the same.

For pipeline-blind-spot clusters (missing-items entries), the same grouping applies on `## Missing — Not Captured` entries.

## Self-rater bias note

The maintainer agent's pass-1 (`2026-05-23`) instrumented this. When /retro is run on a corpus that includes the agent's own outputs (release notes, replies, drafts), the agent's own grading of those is structurally suspect — the same agent that wrote the claims is rating them.

Mitigation built into /retro:

- The §Anti-pattern self-check section is mandatory in every pass output and must surface any own-work content in the corpus.
- If >50% of the corpus is own-work, the pass output includes a top-of-doc warning.
- The proposed patches don't auto-apply (the review gate IS the cross-check).

This isn't perfect — a deliberate over-extraction discipline still has bias — but the surface area is small and a human-review gate sits in front of every consequential write.

## Out of scope for v0

- **Auto-clustering on semantic embeddings.** Token-based grouping is enough to start; the output template is the load-bearing artifact.
- **Per-producer prompt-patching DSL.** A patch is just a diff against a target file; the user reads the diff and accepts/rejects.
- **Cross-archive retros** (multiple users' archives synthesized together). /align is single-user by design; /retro inherits.
- **Auto-rerun cadence.** The user runs /retro when they want a synthesis. No timer.
- **CLAUDE.md auto-edits without review.** Every patch goes through Stage 1.

## Compatibility with the existing contract

`references/integrations.md` §/retro says:

> Reads `rhythm/align-archive/align-index.md` (manifest), all per-session `.md` files in the archive folder, and `align-corrections-pending.md`.

This design satisfies that (the manifest and `.md` files; the pending queue is currently logged in the synthesis but not patched against — Future Work).

> Does NOT modify anything in `rhythm/align-archive/`.

This design satisfies that. Output goes to `rhythm/align-archive/retro-output/` (sibling of the archive, not inside it), and `/retro apply` modifies *target* files (producer prompts, CLAUDE.md, skill SKILL.md), not the archive.

> Writes proposed CLAUDE.md additions and skill SKILL.md patches into a separate location (probably `rhythm/retro-output/` or directly into source skills with a marker), with human review gates before they land.

This design sharpens that: the synthesis lands in the separate location (`retro-output/`), and the patches land in the target files *after* explicit user acceptance.

> The expected cadence is weekly: /retro reads ~5-10 new sessions worth of corrections, surfaces failure-mode clusters, proposes one or two rule changes per run.

Cadence is the user's call. The skill works on any-sized corpus the filter selects.

## What ships first

Revised after shipping v0 — see git log for the actual order:

1. **`commands/retro.md`** ✅ (shipped in PR #8 under the existing flat-layout pattern parallel to `commands/align.md`). Self-contained slash command, no plugin restructure needed. Provides the v0 synthesis side.
2. **`/retro apply` sub-invocation** — planned v0.6.x or v0.7. Lands the Stage 2 review-gate.
3. **Plugin restructure** — move current `SKILL.md` to `skills/align/SKILL.md`, port `commands/retro.md` content into `skills/retro/SKILL.md`, update `plugin.json` to reflect the multi-skill layout, regression-test on Claude Code and Cowork. Bundled into **v0.7.0** as the breaking-ish change.
4. **`references/retro-templates.md`** with the markdown skeleton factored out as a copy-paste artifact — earnable if pattern-mining grows beyond the inline schema in `commands/retro.md`. Not blocking.

The original plan called for shipping /retro as `skills/retro/SKILL.md` and bundling the restructure into v0.6.0. In practice the restructure forces a coupled change (single-skill plugins can't mix root `SKILL.md` with a `skills/` subdirectory). Shipping /retro via `commands/retro.md` first let v0 land without the restructure dependency, deferring the breaking change to a focused v0.7.0.

## Versioning

`/retro` v0 ships as part of /align **v0.6.0** under the flat layout. The multi-skill restructure (described in §Where /retro lives) is planned for **v0.7.0** as the breaking-ish change. v0.7.0 release notes carry the migration note.

## Open questions

1. Should the in-document review gate use HTML-form-style affordances (like /align's interactive form) or stay markdown? Markdown is simpler; HTML form is consistent with /align's existing pattern. Leaning markdown for v0 — the user is editing a synthesis they just generated, they're in the file anyway.
2. How does /retro handle deletions from CLAUDE.md? Producer-prompt deletions are similar — diff-style patches handle additions and edits naturally, but pure deletions feel different. Probably the same diff format with empty `+` lines.
3. Should the `.html` files in the archive be read at all? `integrations.md` says no. Keep them unread for v0.

These don't block v0. They become refinements once /retro has shipped and the agent (or a user) runs it on a real archive.

---

This design is a starting point. The real test is the first run against /align's own archive — and the agent's archive is already a working dataset.
