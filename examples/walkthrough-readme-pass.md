# A worked `/align` pass — start to finish

A real `/align` session, end-to-end, on a real piece of work. Use this as a concrete reference for what running the plugin actually produces and what the resulting artifact looks like.

The source being graded here is `/align`'s own `README.md` at commit [`36330d3`](https://github.com/ggrigo/align/commit/36330d3). The rater is the `/align` maintainer agent. This is a real dogfooding pass — the findings below drove [PR #44](https://github.com/ggrigo/align/pull/44).

## The loop in six steps

1. **A producer emits output.** Here: the README file (which is itself a producer of falsifiable claims about how `/align` works).
2. **`/align` extracts claims.** Each claim gets an `id`, the claim `text`, a `source` hint, and a few optional fields for context.
3. **A form opens.** Local HTML file, one row per claim, 7-shape rating taxonomy: ✅ correct / ❌ wrong / 🔶 almost / 🔷 needs nuance / 🤷 can't-verify / ➖ irrelevant / ⬜ skipped.
4. **You rate.** Two minutes, click through. Reality notes on the wrong/almost/nuance ones — *what's actually true and where to verify*.
5. **Form exports `.md`.** Structured markdown with one section per non-✅ claim plus a confirmed-claims summary.
6. **Archive + act.** The `.md` lands in the dogfooding archive; the findings drive concrete fixes (new commits, new PRs, prompt updates).

What follows is steps 2–6 as they played out on this specific source.

---

## Step 2 — `/align` extracts claims

Three representative claims (out of 28 the pass extracted):

```js
{
  id: "layout-manifest-version",
  text: "manifest (v0.5.0)",
  source: "README.md §Layout, line 45 — annotation in the directory tree on plugin.json"
}

{
  id: "layout-single-skill-plugin",
  text: "Single-skill plugin: SKILL.md at root, no skills/ folder, auto-loaded by Claude Code v2.1.142+",
  source: "README.md §Layout, line 57 — narrative paragraph below the tree"
}

{
  id: "usage-invocation-list",
  text: "/retro                       # synthesize the archive (last 7 days, all sources)",
  source: "README.md §Usage, line 76 — invocation list (incomplete — missing /retro apply variants)"
}
```

The full Claim Adapter Contract — what fields are required vs. optional, and how `/align` consumes them — lives in [`SKILL.md`](../SKILL.md).

## Step 3–4 — the form, and rating

`/align` opens the local HTML file at a `file://` (or `computer://` on Cowork) path. The form lists the 28 claims with the 7-shape buttons plus a reality-note text field. Two minutes of clicking; ~15 minutes if you have a lot of notes to write.

For this pass, the result distribution came out:

> **22 ✅ correct · 4 ❌ wrong · 2 🔶 almost · 0 🔷 · 0 🤷 · 0 ➖ · 0 ⬜**
>
> Sum invariant: 22+4+2+0+0+0+0 = 28 ✓

## Step 5 — the exported `.md`

The structured markdown is one section per non-✅ finding plus a confirmed-claims summary. Below are the four `❌ wrong` sections from this pass, lightly trimmed.

### ❌ "manifest (v0.5.0)" annotation in §Layout

> **Source:** Line 45 — `│   └── plugin.json   # manifest (v0.5.0)`
>
> **Reality:** Wrong. `plugin.json`'s version field is `0.6.0` (per [PR #9](https://github.com/ggrigo/align/pull/9) shipped 2026-05-23). The §Layout annotation predates v0.6.0 ship; never updated.
>
> **Rating:** ❌ wrong. One-character fix.

### ❌ "Single-skill plugin: SKILL.md at root, no skills/ folder"

> **Source:** Line 57.
>
> **Reality:** Wrong since [PR #23](https://github.com/ggrigo/align/pull/23) (`skills/align/SKILL.md` + `skills/align/align-template.html`) and [PR #24](https://github.com/ggrigo/align/pull/24) (`skills/retro/SKILL.md`). The repo is now in the additive phase of the multi-skill restructure — `skills/` exists alongside `commands/`; the "no skills/ folder" claim is materially false.
>
> **Rating:** ❌ wrong.

### ❌ §Layout directory tree missing files

> **Source:** Lines 42–55. The example tree.
>
> **Reality:** Missing files that exist in the repo: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `skills/align/`, `skills/retro/`, `commands/retro.md`, `references/retro-design.md`, `references/v0.7.0-design.md`. **A reader navigating the repo for the first time using §Layout as a map gets directed to ~5 places that don't represent the current canonical structure.**
>
> **Rating:** ❌ wrong. The heaviest finding in the pass — a literally misleading map.

### ❌ §Usage missing `/retro apply` invocations

> **Source:** Lines 69–79. The invocation list.
>
> **Reality:** Missing two invocations that ship in v0.7.0:
> - `/retro apply` (or `/retro apply <pass-file>`) — added in [PR #31](https://github.com/ggrigo/align/pull/31).
> - `/retro apply --dry-run` — added in [PR #35](https://github.com/ggrigo/align/pull/35).
>
> A user reading the README §Usage and never opening `commands/retro.md` would not know `/retro apply` exists.
>
> **Rating:** ❌ wrong (missing). Minor gap but real.

And the two 🔶 almost-correct claims:

- **Version pin `v2.1.142+`** — substance defensible, but the version specifier wasn't verifiable from the source the rater had at hand. Marked 🔶 with a "verify or remove" note.
- **§Layout box framing as authoritative-snapshot** — the box is titled `## Layout` (declarative) but visually presented as a snapshot of *current* state. A reader expects it to match the repo today. The framing problem is closely related to the ❌ on the tree contents above.

## Step 6 — what the findings drove

The pass surfaced a discrete cluster: all 4 ❌s and both 🔶s concentrate in **§Layout** (lines 42–57) and **§Usage** (lines 69–79). Both sections had been heavily touched before the v0.7.0 development burst, then went *untouched* during it — recent PRs targeted other sections (§Why, tagline, §Closest prior art) and the procedural sections drifted.

The fix landed as [PR #44](https://github.com/ggrigo/align/pull/44): version bump 0.6.0 → 0.7.0 + §Layout tree rewritten to current repo state (including `skills/`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, etc.) + §Usage gained the missing `/retro apply` invocations.

The same PR rewrote the "single-skill plugin, no skills/ folder" framing to describe the additive migration phase, with the namespaced `/align:align` and `/align:retro` invocation form named explicitly.

## What this demonstrates

- **The recursion is functional.** `/align` is itself a producer of claims (in the README, in `SKILL.md`, in any maintainer-facing doc). Grading the producer's own outputs surfaces drift that authoring discipline alone misses.
- **Cluster meta-findings are the most useful kind.** Four separate `❌` findings traced to *one* structural cause: sections that didn't get a second look during a burst of adjacent work. That root cause is what next-stretch discipline should track, not the individual fixes.
- **The archive entry persists** as a public artifact of the loop's evidence. The corpus over time becomes the calibrated dataset of your taste — exactly the framing in the README §Why.

## Where to read more

- The skill's full procedural spec: [`SKILL.md`](../SKILL.md).
- The archive's manifest schema + invariants: [`references/archive-format.md`](../references/archive-format.md).
- The `/retro` design (synthesis side of the loop): [`references/retro-design.md`](../references/retro-design.md).
- The current `/align` release design: [`references/v0.7.0-design.md`](../references/v0.7.0-design.md).
