# A worked `/diagnose` pass — start to finish

A real walkthrough of `/diagnose` on a captured `/align` session. Use this as a concrete reference for what running the skill produces — input shape, trace output, and how the suggested fixes look.

This example builds on the `/align` pass walkthrough at [`walkthrough-readme-pass.md`](walkthrough-readme-pass.md). If you haven't read that, do — `/diagnose` operates on the `.md` artifact `/align` produces, so the loop only makes sense if you've seen the producer side first.

The source pass file here is from a synthetic team-digest producer — call it `/rhythm` — that generates one-paragraph meeting summaries from a transcript. The findings below show what `/diagnose` would surface against a stale `skills/rhythm/SKILL.md` instruction surface.

## The loop in four steps

1. **You ran `/align` on a producer output.** The pass `.md` landed in the archive (`.align/align-rhythm-2026-05-15.md`).
2. **You invoke `/diagnose <pass-file>`.** Skill reads the pass + the project's instruction surfaces (`CLAUDE.md`, `skills/*/SKILL.md`, `references/`, `TASKS.md`).
3. **Per-claim trace report writes to `.align/diagnose-rhythm-2026-05-15.md`.** Each actionable claim (❌ / 🔶 / 🔷) gets a quoted-evidence trace + 0–100 confidence + suggested fix.
4. **You read the report and act.** High-confidence traces (≥80) name specific lines to edit; medium-confidence ones surface alternative causes; low-confidence ones go to the speculative appendix.

What follows is the full output of step 3 on this specific session.

---

## Step 1 — the input pass file (excerpt)

The relevant excerpt from `.align/align-rhythm-2026-05-15.md`:

```markdown
### Claim 4: ❌ Wrong

> Anna and Andrew agreed to revisit the API spec next Tuesday.

> *rhythm-2026-05-15.md*

**Reality:** There is no Andrew on this team. The digest hallucinated a second person from a partial-name match in the transcript.

### Claim 12: 🔶 Almost

> The decision to defer the API redesign until Q3 was unanimous.

> *rhythm-2026-05-15.md*

**Reality:** Decision was made, but Vassia abstained — not unanimous.

### Claim 18: 🔷 Needs nuance

> The team should follow Hamel's structured-output evals course.

> *rhythm-2026-05-15.md*

**Reality:** Right recommendation in principle, but the team is using Anthropic's eval framework, not OpenAI's. Course material would need adaptation.
```

Three actionable claims — one wrong, one almost, one needs-nuance. `/diagnose` processes all three.

## Step 2 — invoke `/diagnose`

```
/diagnose .align/align-rhythm-2026-05-15.md
```

Default scope reads:

```yaml
diagnose:
  read:
    - CLAUDE.md
    - "**/CLAUDE.md"
    - "skills/*/SKILL.md"
    - "references/**/*.md"
    - TASKS.md
```

Smart-memory is off by default; add `--include-smart-memory` if a past correction's drain is the suspected cause.

## Step 3 — the trace report

`/diagnose` writes `.align/diagnose-rhythm-2026-05-15.md`:

```markdown
# /diagnose — rhythm-2026-05-15 · 2026-05-15

Pass file: `.align/align-rhythm-2026-05-15.md`
Pass result: 24 claims · 19 ✅ · 1 ❌ · 1 🔶 · 1 🔷 · 2 🤷 · 0 ⬜ · sum-invariant ✓

Diagnosis scope: CLAUDE.md, skills/*/SKILL.md, references/**/*.md, TASKS.md
Smart-memory: not included (default)
Confidence threshold: 80

## Per-claim traces

### Claim 4 — Wrong (confidence: 92)

**Claim:** Anna and Andrew agreed to revisit the API spec next Tuesday.
**User's reality note:** There is no Andrew on this team. The digest hallucinated a second person from a partial-name match.

**Source(s) traced:**

1. [`skills/rhythm/SKILL.md#L38`](file:./skills/rhythm/SKILL.md#L38) — quoted text:
   *"When the transcript has partial names, expand by inferring full names from the project's known attendees list."*
   This heuristic instructs the producer to expand partial-name mentions without a verification step against the actual attendee list. A transcript saying "An…" gets expanded to multiple candidates that match the prefix.

**Alternative explanations:** none with comparable evidence in scope.

**Suggested fix:** Update `skills/rhythm/SKILL.md` line 38. Replace the current heuristic with: *"When the transcript has partial names, only use names verified in TASKS.md §Team attendees. Never fabricate from partial matches — flag the ambiguity in the digest instead."* This shifts the heuristic from speculative-expansion to verification-then-expansion.

**Confidence: 92** — Single cited source, quoted verbatim, mechanical mapping from heuristic to observed failure.

---

### Claim 12 — Almost (confidence: 75)

**Claim:** The decision to defer the API redesign until Q3 was unanimous.
**User's reality note:** Vassia abstained.

**Source(s) traced:**

1. [`skills/rhythm/SKILL.md#L65`](file:./skills/rhythm/SKILL.md#L65) — quoted text:
   *"If no abstentions are mentioned in the transcript, treat the decision as unanimous."*
   This default-to-unanimous heuristic produces false positives when the transcript itself doesn't capture abstentions (which is common — abstainers often don't explicitly say "I abstain" in the audio).

**Alternative explanations:**
- The original transcript may have included Vassia's abstention in a way the digest filtered out (e.g., a parenthetical aside). If the transcript is recoverable, check.
- The producer's transcript-segmentation may have dropped the relevant turn.

**Suggested fix:** Update `skills/rhythm/SKILL.md` line 65. Replace with: *"Do not assume unanimous. Default phrasing: 'X was decided; abstentions were not explicitly recorded in the transcript' — leaves room for the rater to verify against the meeting attendees."* Adds a small honesty hedge that costs little and avoids the false-positive shape.

**Confidence: 75** — Cited source supports the cause but a producer-side recoverability question remains; alternative explanations are plausible without more evidence.

---

### Claim 18 — Needs nuance (confidence: 60 — below threshold; see appendix)

(Filtered to "Speculative / unconfirmed" appendix.)

---

## Session-level findings

### Pattern: producer-side heuristics in `skills/rhythm/SKILL.md` are speculative by default

Both ❌ (Claim 4) and 🔶 (Claim 12) trace to the same shape — `skills/rhythm/SKILL.md` encourages confident-speculation heuristics ("expand partial names", "default to unanimous") rather than verify-then-claim heuristics. A single producer-side instruction-pattern fix (every heuristic that *generates* content from inference should require a verification step or hedge) would resolve both classes of failure.

This is a `/retro`-candidate pattern: across many sessions, what's the failure-mode aggregate of confident-speculation heuristics vs. verify-then-claim ones? Worth a longitudinal pass once you have ≥5 `/align` sessions on `/rhythm` outputs.

---

## Recommendations

| Priority | Action | Affected source | Estimated effort |
|---|---|---|---|
| High | Replace the partial-name expansion heuristic | `skills/rhythm/SKILL.md` line 38 | 10 min — one PR |
| Medium | Add abstention-hedge to vote-recording | `skills/rhythm/SKILL.md` line 65 | 10 min — same PR |
| Low | Surface the speculative-heuristic pattern in next `/retro` pass | `/retro` candidate | Wait + watch |

---

## Speculative / unconfirmed (appendix)

### Claim 18 — Needs nuance (confidence: 60; below threshold)

**Claim:** The team should follow Hamel's structured-output evals course.
**Possible causes** (no single quoted source above threshold):

- `TASKS.md` Q2 line 42 mentions evaluating Hamel's course as one of three candidates — the producer may have read this as a recommendation rather than as an open evaluation. Confidence 50.
- `CLAUDE.md` doesn't currently say which eval framework the team is using. The producer's recommendation defaults to the most-cited public reference. Adding "we use Anthropic's eval framework" to `CLAUDE.md` would constrain future claims. Confidence 45.

**Suggested action:** Surface in next `/retro` pass if pattern recurs across sessions. The fix likely sits in CLAUDE.md (declare the eval-framework choice) rather than in `skills/rhythm/SKILL.md`.

---

— /diagnose, 2026-05-15, run against `align-rhythm-2026-05-15.md`
```

## Step 4 — what you do next

Three concrete moves the report sets up:

1. **Open a one-line PR against `skills/rhythm/SKILL.md`** changing lines 38 and 65 per the High + Medium recommendations. That closes the structural cause behind two of the three actionable claims in one shot.
2. **Don't act on Claim 18 yet.** Confidence 60 is below threshold; the appendix recommendation is to watch for the pattern across sessions. The next `/retro` pass — once you have more `/rhythm` outputs in the archive — clusters this with similar cases or proves it was a one-off.
3. **`/diagnose`-the-`/diagnose`-report?** The report is itself an LLM output. If the suggested fixes feel off, run `/align` on the report — the per-claim traces ARE claims about cause. Depth-2 recursion is the practical stopping point (see [`skills/diagnose/SKILL.md`](../skills/diagnose/SKILL.md) §Recursion note).

## What `/diagnose` is *not*

- Not an auto-fixer. The report names files + lines but doesn't write the patches. `/diagnose apply` is a v0.9 candidate, deliberately deferred until the read-only mode has been used in anger.
- Not a longitudinal-pattern miner. `/diagnose` reads one pass file; `/retro` clusters across many. The skills compose — `/diagnose` for "why did *this session* go wrong"; `/retro` for "what patterns repeat across sessions."
- Not silent. If a claim has no in-scope source above the threshold, the report says so explicitly with a `--scope=` widening suggestion, rather than recursively reading more files.

## Tuning knobs

| Flag | Default | When to change |
|---|---|---|
| `--threshold=<N>` | `80` | Lower to `70` if you want more findings (with weaker evidence) surfaced into the main report instead of the appendix. Raise to `90` if you want only mechanical, single-source traces. |
| `--scope=<globs>` | (whitelist above) | Narrow when you want to test a specific instruction surface (e.g., `--scope=skills/rhythm/`). Widen when "no source found" is the result. |
| `--include-smart-memory` | off | Turn on when you suspect a past correction in the `decisions` collection is the cause. Capped confidence at 50 for smart-memory-only traces (entries are noisy by design). |

## When to use `/diagnose` vs. just opening the pass file and grepping

If you have one ❌ in a 24-claim pass, grepping the project for the offending phrase is often faster. `/diagnose` earns its tokens when:

- ≥3 actionable claims share a possible single root cause (the session-level findings section is the payoff).
- The instruction surfaces are deep (multi-level `skills/`, nested `references/`, several `CLAUDE.md` files) — manual grep is slow.
- The pattern repeats across sessions and you want a per-trace audit trail for the `/retro` corpus.

Otherwise — manual grep, fix, move on.

---

**Maintainer note:** this walkthrough was prepared by `agent-ggrigo` (the maintainer agent for /align operating under a public charter). Human-of-record for cases that warrant one: `ggrigo@baresquare.com`.
