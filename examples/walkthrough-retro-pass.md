# A worked `/retro` pass — start to finish

A walkthrough of `/retro` running across an accumulated archive of `/align` sessions. Use this as a concrete reference for what longitudinal pattern-mining produces, what the saturation status means, and how the analyst pass surfaces non-discriminating signals.

This completes the trio walkthroughs. Pair with:

- [`walkthrough-readme-pass.md`](walkthrough-readme-pass.md) — `/align` on a single producer output.
- [`walkthrough-diagnose-pass.md`](walkthrough-diagnose-pass.md) — `/diagnose` on a single `/align` pass.
- **This file** — `/retro` across many `/align` passes.

The source corpus here continues the synthetic `/rhythm` team-digest scenario from the `/diagnose` walkthrough. After six sessions of grading `/rhythm` outputs, you have enough archive depth to run `/retro` and see the cluster patterns the per-session passes only hinted at.

## The loop in six steps

1. **Archive depth ≥3 sessions on at least one producer.** `/retro` works best after the corpus has enough data to cluster.
2. **Invoke `/retro`.** Skill reads `.align/align-index.md` + each row's `.md` pass file.
3. **Aggregate metrics + saturation check.** Step 4.5 surfaces whether new sessions are still surfacing new patterns or the corpus has converged.
4. **Analyst pass (v0.8 addition).** Per-producer variance + recurring-claim detection on top of cluster-shape reasoning.
5. **Patch proposal.** One pass document with proposed patches + clusters; written to `.align/retro-output/<date>-pass-N.md`.
6. **Optional `/retro apply`.** Reads accepted patches from the pass file, opens PRs with per-patch human-approval gates.

What follows is steps 3–6 as they play out on a realistic `/rhythm` corpus.

---

## Step 1 — the input archive (excerpt)

`.align/align-index.md` (the manifest) shows six relevant `/rhythm` sessions:

```
| # | Date | Source | Claims | ✅ | ❌ | 🔶 | 🔷 | 🤷 | ⬜ | File |
|---|------|--------|--------|---|---|---|---|---|---|------|
| 1 | 2026-05-15 | rhythm-2026-05-15 (Mon brief) | 24 | 19 | 1 | 1 | 1 | 2 | 0 | align-rhythm-2026-05-15.md |
| 2 | 2026-05-16 | rhythm-2026-05-16 (Tue brief) | 21 | 17 | 2 | 1 | 0 | 1 | 0 | align-rhythm-2026-05-16.md |
| 3 | 2026-05-17 | rhythm-2026-05-17 (Wed brief) | 23 | 18 | 1 | 2 | 0 | 2 | 0 | align-rhythm-2026-05-17.md |
| 4 | 2026-05-18 | rhythm-2026-05-18 (Thu brief) | 25 | 20 | 1 | 1 | 1 | 2 | 0 | align-rhythm-2026-05-18.md |
| 5 | 2026-05-22 | rhythm-2026-05-22 (Mon brief) | 22 | 18 | 1 | 2 | 0 | 1 | 0 | align-rhythm-2026-05-22.md |
| 6 | 2026-05-23 | rhythm-2026-05-23 (Tue brief) | 26 | 22 | 1 | 1 | 1 | 1 | 0 | align-rhythm-2026-05-23.md |
```

Six sessions, 141 claims rated, ✅ 81%, ❌ 5%, 🔶 6%. The aggregate looks healthy at the headline number — `/retro` is what surfaces the structural shape behind the headline.

## Step 2 — invoke

```
/retro
```

Default scope: read all rows in `.align/align-index.md` + their referenced `.md` files. Optional flags: `--since=<date>` to narrow window; `--source=<slug>` to focus on one producer.

## Step 3 — the pass output

`/retro` writes `.align/retro-output/2026-05-23-pass-1.md`:

```markdown
# /retro — 2026-05-23 pass 1

Sessions read: 6 (rhythm-2026-05-15 through rhythm-2026-05-23)
Claims aggregated: 141
Distribution: 114 ✅ · 7 ❌ · 8 🔶 · 3 🔷 · 9 🤷 · 0 ⬜

## Saturation status: ACTIVE

Recent window (last 3 sessions, n=73 claims) still surfacing new failure-mode patterns vs. earlier window (sessions 1–3, n=68 claims):
- New cluster in recent window: "future-tense decisions stated as committed" (3 occurrences, not seen in earlier window).
- Earlier-window-only cluster: "attendee-name hallucination" (4 occurrences in sessions 1–3, 0 in sessions 4–6 — possibly resolved by the PR shipped after the cycle-15 /diagnose pass).

Corpus has NOT converged. Keep collecting traces; another pass in ~5 sessions is likely to surface different patterns. Don't act on the recent-window-only cluster yet — n=3 is below the typical confidence threshold for a structural patch.

## Failure-mode clusters

### Cluster 1: "default-to-unanimous" decision recording (5 ❌/🔶 across sessions 1, 2, 5, 6)

Sessions 1, 2, 5, 6 each have at least one 🔶 or ❌ where a decision was recorded as "unanimous" but the reality note flagged an abstention or dissent.

Cause: the producer-side heuristic in `skills/rhythm/SKILL.md` line 65 *("If no abstentions are mentioned in the transcript, treat the decision as unanimous.")* defaults to confident-speculation. This was identified by /diagnose in session 1 (see archive row #1's diagnose report) and a PR is in flight to add the abstention hedge — but the PR hasn't merged yet, so sessions 2/5/6 still showed the pattern.

### Cluster 2: "partial-name expansion" attendee hallucinations (3 ❌ in sessions 1–3, 0 in 4–6)

Identified in session 1 via /diagnose; the producer-side heuristic in `skills/rhythm/SKILL.md` line 38 was patched in PR #94. Sessions 4–6 do not show the pattern. Pattern: **resolved**; cluster is included for audit-trail completeness but no further action.

### Cluster 3: "future-tense decisions stated as committed" (3 occurrences in sessions 4–6, NEW)

Recent-window-only. Producer is phrasing "we should consider X" from the transcript as "the team decided to X" in the digest. The transcript-to-digest grammar normalization is too aggressive.

Currently below structural-patch confidence (n=3 across 73 claims = 4% of recent claims). Watch for another pass.

## Analyst pass (v0.8 — per-producer + recurring-claim)

### Per-producer variance: rhythm

Only one producer in this corpus. Variance not meaningful at n=1 producer. (Bookkeeping: when multiple producers are in the archive, this section ranks them by stddev of pass-rate to surface "unstable upstream" candidates.)

### Recurring-claim detection (across sessions)

Claims with text similarity ≥0.85 that recurred across ≥2 sessions:

- **"Decision X was unanimous"** (5 occurrences across sessions 1, 2, 5, 6, all with non-✅ ratings) — clearly under Cluster 1 above; not a new finding, but the recurrence + non-✅ ratio (5/5 = 100%) reinforces this is a deterministic producer-side defect, not noise.

- **"Action item: revisit next week"** (4 occurrences across sessions 1, 3, 4, 5, all ✅) — non-discriminating. Always-correct claims that recur are candidates for dropping from extraction (they add noise to the rating set without surfacing signal). Consider adding a filter in `skills/rhythm/SKILL.md` that suppresses generic action-item phrasings.

## Proposed patches

| # | Target | Patch | Rationale | Status |
|---|--------|-------|-----------|--------|
| 1 | `skills/rhythm/SKILL.md` L65 | Replace default-to-unanimous heuristic with abstention-hedge phrasing | Cluster 1 (5 occurrences); /diagnose session 1 also identified this; PR in flight | ⬜ already in flight as PR #93 |
| 2 | `skills/rhythm/SKILL.md` (extraction filter) | Suppress generic "revisit next week" action-items from claim extraction | Analyst-pass: non-discriminating recurring claim (4/4 ✅) | ✅ propose |
| 3 | `skills/rhythm/SKILL.md` (transcript grammar) | Add explicit "preserve modal verbs (should, might, would) in digest output" | Cluster 3 — NEW, but n=3 below structural threshold | 🔶 revise — wait for n≥5 |

## Recommended next action

Accept patches `#2` ✅ and consider `#3` 🔶 (manual rewrite if you have the language for it). Patch `#1` is already shipping; skip.

After human review of the proposed patches, run `/retro apply` to open one PR per accepted patch with the proposed diff.

---

— /retro pass 1, 2026-05-23
```

## Step 4 — review the pass + mark patches

Open `.align/retro-output/2026-05-23-pass-1.md` and review. Edit the Status column on each row:

- `⬜` → unrated (Pass 1 default)
- `✅ accept` → /retro apply should open a PR
- `❌ reject` → discard; don't auto-PR
- `🔶 revise <diff>` → I'll edit the proposed patch manually; apply the revised version

After review, the pass file's Status column might read:

```markdown
| # | Target | Patch | Rationale | Status |
|---|--------|-------|-----------|--------|
| 1 | skills/rhythm/SKILL.md L65 | Replace default-to-unanimous heuristic | Cluster 1 | ❌ reject (already in PR #93) |
| 2 | skills/rhythm/SKILL.md (extraction filter) | Suppress generic action-items | Analyst-pass | ✅ accept |
| 3 | skills/rhythm/SKILL.md (transcript grammar) | Preserve modal verbs | Cluster 3 — NEW | 🔶 revise: add to skills/rhythm/SKILL.md §Grammar with rationale citing this pass |
```

## Step 5 — `/retro apply`

```
/retro apply .align/retro-output/2026-05-23-pass-1.md
```

What it does:

1. Reads accepted (`✅`) and revised (`🔶`) patches from the pass file.
2. For each, opens a PR against the named target file with the proposed (or revised) diff.
3. PR body references the pass file + the cluster/claim evidence.
4. Appends an `Applied` footer to the pass file noting which patches resulted in which PR URLs.
5. Skips rejected (`❌`) and unrated (`⬜`) patches; surfaces a one-line summary of skips.

The `--dry-run` flag previews the PRs without opening them:

```
/retro apply --dry-run .align/retro-output/2026-05-23-pass-1.md
```

Useful when the pass has many patches and you want to see the aggregate before opening N PRs.

## Step 6 — close the loop

After `/retro apply`:

1. **Each opened PR has a per-patch human gate.** Review the diff, merge or close per patch.
2. **The pass file's `Applied` footer is the audit trail.** Future `/retro` runs read this to avoid re-proposing patches that already shipped.
3. **The corpus accumulates.** Next `/retro` pass (Pass 2, when archive depth grows another N sessions) clusters against a different baseline.

## When to run `/retro` vs. just open a `/diagnose` report

| Question | Use |
|---|---|
| Why did *this specific session* go wrong? | `/diagnose <pass-file>` — single-session, backward-trace |
| What patterns repeat across many sessions? | `/retro` — longitudinal, cluster + saturation + analyst pass |
| Should this patch ship? | `/retro apply` — opens the PR with per-patch human gate |

The trio composes deliberately: `/align` captures, `/diagnose` traces single sessions back to causes, `/retro` aggregates patterns across sessions, `/retro apply` ships the fixes.

## What `/retro` is *not*

- Not real-time. `/retro` is a longitudinal aggregator; run it weekly or after meaningful archive growth, not after every session.
- Not auto-merge. `/retro apply` opens PRs; each PR is a per-patch human-approval gate.
- Not single-source. If your archive has only one source slug, the per-producer-variance analyst pass is bookkeeping-only. The cluster + saturation work still applies; the analyst pass earns its tokens once you have multiple producers.

## Tuning knobs

| Flag | Default | When to change |
|---|---|---|
| `--since=<date>` | (all rows) | Narrow window — useful when an older archive is contaminated by since-fixed issues. |
| `--source=<slug>` | (all sources) | Focus on one producer when multi-source noise muddles cluster shape. |
| `--saturation-threshold=<N>` | 5 | Number of recent sessions required to call corpus "saturated." Lower if you trust your producer's stability; raise if not. |

---

**Maintainer note:** this walkthrough was prepared by `agent-ggrigo` (the maintainer agent for /align operating under a public charter). Human-of-record for cases that warrant one: `ggrigo@baresquare.com`.
