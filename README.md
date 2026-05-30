# align

[![Latest release](https://img.shields.io/github/v/release/ggrigo/align)](https://github.com/ggrigo/align/releases/latest)
[![License: MIT](https://img.shields.io/github/license/ggrigo/align)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/ggrigo/align)](https://github.com/ggrigo/align/stargazers)
[![Maintained by agent ggrigo](https://img.shields.io/badge/maintained%20by-agent%20ggrigo-2d5a3d)](https://github.com/agent-ggrigo)

Output review for Claude Code and Cowork — redline what's wrong in an AI output, keep the correction, feed it back. Rate each claim **correct / wrong / almost / needs-nuance / can't-verify / skipped** in a local HTML form and archive it as machine-readable markdown. Scales from a 30-second gut-check to a systematic eval pass — same interface, same kept corrections.

## Why

When a model pulls a lot of context together and compresses it into one answer, everything arrives in the same confident voice. A checked fact, a reasonable claim, and a quiet assumption all read identically. The larger the synthesis, the worse this gets, and the more it smooths away nuance that mattered without showing you where.

`align` is a checkpoint for that moment. It takes the output apart into its separate statements and lets you mark each one quickly: right, wrong, almost, needs nuance, can't verify. What you correct is kept and fed back, so the next pass starts closer to the truth instead of repeating the same flattening.

The point is narrow: a structured place to get aligned with the model on facts, claims, and assumptions before you act on what it gave you. It works on any large synthesis, whatever produced it — and it flexes with how much rigor the moment deserves, from a quick redline to a full claim-by-claim review pass.

It exists only because nothing native does this. If Anthropic provided it as part of the product, we'd retire the project the same day.

## Philosophy

Three load-bearing ideas:

1. **The recursion is the point.** LLMs produce claims; humans grade claims; the corrections feed back into prompts; the next LLM run is closer to the truth. `/align` makes the loop structural rather than ad-hoc. The agent maintaining this plugin grades its own outputs the same way — including this README.

2. **Per-claim, not per-response.** Most LLM outputs are a synthesis of many statements. Grading the whole response collapses that into a single noisy signal; per-claim grading preserves where the mistakes actually were. The 6-shape taxonomy (correct / wrong / almost / needs-nuance / can't-verify / skipped) is what lets per-claim work in 2 minutes.

3. **Downstream of upstream defenses.** Better prompts, RAG, chain-of-thought, abstention tuning — those reduce the rate of wrong claims. `/align` is what to do with the wrong claims that survive. It's the residue-catcher, not the prevention layer. Stack them; don't choose.

## How

1. A producer (any skill that emits claims — `/rhythm`, `/digest`, an ad-hoc Claude turn) emits its output.
2. `/align` extracts the claims into an interactive HTML form.
3. You rate each claim in 2 minutes. Notes go on the wrong/almost/nuance ones.
4. The download is a structured `.md` file — corrections, confirmations, missing items.
5. Phase 2 reads the file, applies updates (TASKS.md, smart-memory when available), and archives the datapoint.
6. Patterns mined from the archive feed back into the originating skill's prompts and your `CLAUDE.md`.

After 90 days, you have a calibrated corpus of your own taste — in your repo, queryable with `grep`.

## Install

The repo doubles as its own single-plugin marketplace — same install path works for **both Claude Code and Cowork**.

```
/plugin marketplace add ggrigo/align
/plugin install align@align
```

That's it. Updates land via `/plugin marketplace update align` then `/plugin install align@align` again.

**Counted alternative:** to install via the [skills.sh](https://www.skills.sh) CLI — which lets us see real install numbers — run `npx skills add ggrigo/align`. The native `/plugin` path above is fully supported; this one just routes through a channel that counts installs.

### Fallback: manual `.plugin` upload (Cowork)

If you'd rather sideload, download `align-X.Y.Z.plugin` from the [Releases page](https://github.com/ggrigo/align/releases) and upload via Cowork → Settings → Plugins → Upload plugin.

### Dev mode (Claude Code)

```bash
claude --plugin-dir /path/to/align
```

### Both surfaces consume the same artifact

An `align/` directory with `.claude-plugin/plugin.json` at root works identically in Claude Code (loaded via marketplace install or `--plugin-dir`) and Cowork (loaded via marketplace install or `.plugin` upload). No dual build.

## Layout

```
align/
├── .claude-plugin/
│   ├── plugin.json                          # manifest (v0.8.1)
│   └── marketplace.json                     # single-plugin marketplace (this repo serves itself)
├── skills/
│   ├── align/
│   │   ├── SKILL.md                         # /align skill: Phase 1/2 flow, Claim Adapter Contract
│   │   └── align-template.html              # interactive feedback form
│   ├── retro/
│   │   └── SKILL.md                         # /retro skill: synthesis + apply + saturation check
│   └── diagnose/
│       └── SKILL.md                         # /diagnose skill: per-claim root-cause trace
├── references/
│   ├── claim-extraction-rhythm.md           # rhythm-specific producer heuristics
│   ├── archive-format.md                    # manifest schema, file layout, invariants
│   ├── integrations.md                      # TASKS.md, smart-memory queue, /retro
│   ├── retro-design.md                      # /retro design + review-gate mechanics
│   └── v0.7.0-design.md                     # design notes for the v0.7.0 multi-skill restructure
├── README.md                                # you are here
├── CONTRIBUTING.md                          # contributor guide; maintainer disclosure
├── SECURITY.md                              # disclosure protocol; smart-memory caveat
└── LICENSE                                  # MIT
```

Skills-only plugin as of v0.8.1: `skills/align/SKILL.md`, `skills/retro/SKILL.md`, `skills/diagnose/SKILL.md` are the canonical entry points. Invocation: `/align`, `/retro`, `/diagnose` (or `/align:align`, `/align:retro`, `/align:diagnose` for namespaced form). Skill `SKILL.md` files MUST start with `---` on line 1 (YAML frontmatter) — anything before that breaks plugin validation on Cowork. The `references/` files are loaded on demand by Claude when a skill cites them — they're not in the always-loaded context.

**v0.8.1 note on structure:** v0.7.0–0.8.0 also shipped `commands/<name>.md` files as thin wrappers around the skills. v0.8.1 removed them — having both `commands/align.md` and `skills/align/SKILL.md` of the same name collides under Cowork's marketplace validator (Claude Code's loader was more permissive and just warned). Skills now own the slash command entry directly, matching the `anthropics/knowledge-work-plugins` pattern.

## Extending — using /align with a new producer

The skill is source-agnostic by contract. Any producer that emits an array of claim objects matching the Claim Adapter Contract in `SKILL.md` can be aligned. A new producer needs to:

1. Walk its output and identify *falsifiable claims*.
2. Build the array with required fields (`id`, `text`, `source`) and any useful optional fields (`time`, `icon`, `desc`, `detail`, `categories`, `verifiable`).
3. Invoke `/align` with a kebab-case context slug.

No instrumentation contract beyond the array. The producer can live in this plugin, in another plugin, or in an ad-hoc Claude turn. Existing non-rhythm producers in the archive: daily todo prints, headcount files, benchmark-design reports.

## Usage

```
/align                       # extract claims from the latest claim-producing output
/align rhythm                # use "rhythm" as the context slug
/align todo                  # use "todo" as the context slug
/align done                  # process the downloaded .md (Phase 2)
/retro                       # synthesize the archive (last 7 days, all sources)
/retro 2026-05               # restrict to a month
/retro rhythm                # restrict to one source slug
/retro apply                 # Stage 2 — open PRs from the most recent pass's proposed patches
/retro apply <pass-file>     # apply patches from a specific pass
/retro apply --dry-run       # show what /retro apply would do without writing
/diagnose <pass-file>        # trace each wrong claim back to the stale instruction that caused it
```

The skill auto-detects which claim-producing output to read from the current conversation. Pass a context hint as the first argument to override the filename slug.

`/retro` reads the archive and writes one synthesis pass document per run — aggregate metrics, failure-mode clusters, proposed patches with human-review gates. Never modifies the archive. `/retro apply` is the Stage-2 gate: the human approves which proposed patches become real PRs. See `references/retro-design.md` for the architecture.

**How often to run.** Run `/align` whenever you make a significant change to a producer (a new prompt, a new claim shape, a new system context). Run `/retro` every 2–4 weeks on accumulated traces, or whenever the archive has grown by ~100 entries since the last pass. Per [Hamel Husain & Shreya Shankar's evals workflow](https://maven.com/parlance-labs/evals), the operational saturation heuristic is "if ~20 new traces don't surface a new failure category, the corpus is saturated." For small projects, scale the numbers down — even 20–50 outputs per significant change gives signal.

## Worked examples

Three end-to-end walkthroughs in [`examples/`](examples/) — one per trio surface:

- [`walkthrough-readme-pass.md`](examples/walkthrough-readme-pass.md) — **`/align`** running on a single producer output (this README itself, as graded by the maintainer agent — a real dogfooding pass). Shows claim extraction, the HTML form, the exported `.md`, and how findings turned into PRs.
- [`walkthrough-diagnose-pass.md`](examples/walkthrough-diagnose-pass.md) — **`/diagnose`** running on a single `/align` pass. Shows the per-claim trace report — quoted-evidence citations, 0–100 confidence, threshold-80 filtering, the speculative appendix, session-level findings, and the recommendations table that drives a one-PR closure.
- [`walkthrough-retro-pass.md`](examples/walkthrough-retro-pass.md) — **`/retro`** running across many `/align` passes. Shows aggregate metrics, the saturation status, three failure-mode clusters, the v0.8 analyst pass (per-producer variance + recurring-claim detection), the proposed-patches table, and what `/retro apply` does with the human-approved ones.

Also worth a read: [`producer-adapter.md`](examples/producer-adapter.md) — the authoring guide for wiring your own producer to the Claim Adapter Contract.

## Cross-surface design

- **Surface-neutral handoff**: the form's absolute path is the canonical artifact. Cowork sessions additionally get a `computer://` quick-open affordance; Claude Code sessions use the `file://` link or the absolute path directly.
- **Surface-agnostic dropbox**: Phase 2 checks `~/Downloads/`, the active working folder, `incoming-docs/` (Cowork convention), and `cwd` (Claude Code convention) — picks the most recent `align-*.md` by mtime.
- **Smart-memory guard**: if smart-memory MCP tools aren't wired, corrections are queued to `align-corrections-pending.md` in the archive folder and drained by the next session that has the tools. No correction is ever dropped.
- **Configurable timezone**: the `.md` "Generated:" timestamp uses a `{{TIMEZONE}}` placeholder; falls back to the browser's local zone if unsubstituted.

## What this does NOT do

- Org-scale evaluation. There's no team dashboard, no shared queue, no org-wide accuracy metrics. By design.
- Run as a hosted service. Everything is files on disk in your repo. By design.
- Generalize across users. Your corrections are *your* corrections. By design.

If you want LangSmith / Humanloop / Braintrust / Phoenix functionality, install those. `align` competes with *no tool at all* — the workflow of reading an LLM output, muttering "that's wrong," and moving on.

## Closest prior art

- **EvalGen / criteria drift** ([Shankar et al., UIST 2024](https://arxiv.org/abs/2404.12272)) — the strongest conceptual match. Some evaluation criteria can only be articulated *after* grading outputs, and users revise earlier grades as criteria sharpen. EvalGen sits upstream of `/align`: it generates candidate evaluator implementations and uses humans to select; `/align` skips evaluator-generation and asks the human to grade each session directly. The taxonomy (correct/wrong/almost/needs-nuance/can't-verify/skipped) is the fixed UI; the per-claim reality notes are where criteria evolve.
- **Hamel Husain & Shreya Shankar's evals course** ([AI Evals For Engineers & PMs](https://maven.com/parlance-labs/evals)) — Hamel and Shreya (the EvalGen lead author above) teach the manual workflow: review ~100+ traces by hand, open-code reactions in free text, cluster into a failure taxonomy, count categories, iterate to theoretical saturation. `/align` operationalizes the inner loop — each per-claim rating is an open-coded observation; the 7-shape taxonomy is the failure-taxonomy UI; `/retro` is the across-session clustering step. The two prior-art entries above aren't independent — Shreya leads on EvalGen and co-teaches with Hamel.
- **Claude Code plugin-eval tooling** ([cc-plugin-eval](https://github.com/sjnims/cc-plugin-eval), [claude-eval](https://github.com/bkper/claude-eval), [promptfoo for Claude Code skills](https://www.mager.co/blog/2026-02-23-skills-validate-eval/)) — adjacent in name, complementary in role. These sit at the **build-time gate**: a plugin author validates that their skill triggers correctly and produces output of the expected shape, automated by LLM-as-judge or deterministic detection. `/align` sits at the **run-time inner loop**: a plugin consumer grades the actual claims that came out of a real session. Same plugin lifecycle, different points. A plugin author *should* use the build-time tools in CI; a plugin user *should* use `/align` in their inner loop. Pair them; don't choose.

## FAQ

### Claude keeps making the same mistakes — what does `/align` do that Claude's Profile Preferences and `CLAUDE.md` don't?

Claude's [Profile Preferences](https://promptoptimizer.tools/blog/how-to-set-up-claude-profile-preferences) and `CLAUDE.md` capture **generic preferences** that apply across sessions — *"don't use bullet points,"* *"always cite sources,"* *"prefer Python over JavaScript."* They run before you type. They're rules.

`/align` captures **specific corrections from specific outputs** — *"claim 4 is wrong, the deadline is 2026-06-15 not 2026-05-30,"* *"claim 12 confuses two people."* They run after Claude responds. They're observations.

The two complement each other. Use Profile Preferences for the durable rules. Use `/align` to surface what *should become* a rule by capturing the specific facts that go wrong. After 90 days of corrections in the archive, patterns emerge — and `/retro` synthesizes them into prompt edits + new `CLAUDE.md` lines.

### How do I save Claude's corrections so it doesn't make the same mistake next session?

Three layers, depending on the shape of the correction:

1. **One-off fact** (e.g., "K16 ships 2026-06-15, not 2026-05-30"): rate the wrong claim in the `/align` form, write the reality in the note. The downloaded `.md` carries the correction; `/align done` writes it to `TASKS.md` (if it's a task) and the `decisions` smart-memory collection (if it's a fact). Next session, Claude reads smart-memory.

2. **Generic preference** (e.g., "always show me the data table before the summary"): write it to your `CLAUDE.md` directly. `/align` doesn't replace this — but a pattern of corrections may reveal *which* preferences to add.

3. **Producer-side flaw** (e.g., "the digest skill is mis-extracting attendees"): after several sessions in the archive, `/retro` identifies the pattern and proposes a patch to the producer skill's prompt.

### How is `/align` different from LangSmith's "Align Evals"?

Different function, different audience. LangSmith Align Evals calibrates an **LLM-judge model** for **dev teams** running production traces — it adjusts the judge's prompt with few-shot examples so its automated scores agree with humans more often. `/align` is **human-in-the-loop** **per-claim** review by the **plugin's end user** in their session inner-loop — there is no judge to calibrate; the human IS the judge. Same lifecycle of "make AI evaluation better," different layer.

### Doesn't better prompting / RAG / system-prompt techniques solve this?

Partly. Upstream techniques (chain-of-thought, grounded quotes, abstention tuning, ensemble verification) **reduce** the rate of wrong claims. They don't capture the wrong claims that still slip through. `/align` is downstream of all those — it's about what to do with the wrong claims that survive your upstream defenses, so they don't recur.

The two are stackable. Better prompts shrink the input to `/align`. `/align` makes the residue not evaporate.

### Why per-claim instead of grading the whole response?

Most LLM outputs are a synthesis of many statements at once. *"Of the seven claims in this digest, claims 1–3 are right, claim 4 confused two people, claim 5 has a stale date, claims 6–7 are correct."* Per-response grading collapses that into a single noisy signal; per-claim grading preserves the structure of where the mistakes actually were. The archive of per-claim ratings is what `/retro` clusters on — which is why the granularity matters.

### Is the archive a flight recorder for future legal / audit needs?

No. The archive is **for the operator**, not for compliance or external accountability. It's local, append-only `.md` files in the operator's own repo. There's no team dashboard, no shared queue, no org-wide metrics. If you need org-scale eval-ops, look at [LangSmith, Braintrust, Humanloop, Langfuse, MLflow, Phoenix](#what-this-does-not-do) — they live in that lane.

## Troubleshooting

### The form doesn't open in my browser

The form is a local HTML file at the path `/align` reported in its handoff message. Open the file path directly — `open <path>` on macOS, `xdg-open <path>` on Linux, or paste the `file://` URL into your browser. On Cowork, the `computer://` link in the handoff is the equivalent.

### `/align done` can't find my downloaded `.md`

Phase 2 scans, in order: `~/Downloads/`, the active working folder, `incoming-docs/` (Cowork convention), and the current working directory. It picks the most recent `align-*.md` by mtime. If yours is elsewhere, pass the path explicitly: `/align done /path/to/your.md`.

### The Cowork plugin upload fails validation

If you're packaging `/align` as a `.plugin` for Cowork: `skills/align/SKILL.md` must start with `---` (YAML frontmatter) on line 1. Anything before that — including HTML comments — breaks Cowork's validator. Convention going forward: every `SKILL.md` starts with `---` on line 1; changelog comments belong after the closing `---`. This was fixed in `/align` v0.7.0; if you're working from a fork or older copy, check that the YAML is at the file head.

### Smart-memory writes aren't happening

`/align` writes to the `decisions` collection only when the smart-memory MCP tools are available in the active Claude session. If not wired, corrections queue to `align-corrections-pending.md` in the archive folder and drain when a later session has the tools. No correction is dropped silently — check the queue file if you're unsure whether a correction landed.

### The exported `.md` has the wrong date / timezone

The form substitutes `{{TIMEZONE}}` (IANA name like `Europe/Athens`) at template-render time if the skill provides it. If left unsubstituted, it falls back to the browser's local zone. To lock a session to a specific timezone, the producer skill should set the `{{TIMEZONE}}` placeholder when invoking `/align`.

### Sum-invariant check failed in my archive entry

Per `references/archive-format.md`, every manifest row must satisfy `✅ + ❌ + 🔶 + 🔷 + 🤷 + ⬜ = Claims`. If your row doesn't, either the claim count is wrong, a rating wasn't captured (look at the form export — was every claim rated or were some left unrated?), or the manifest count is off. Recompute from the exported `.md`'s Summary table; that's the source of truth.

## Maintenance

`/align` is authored by [Georgios Grigoriadis](https://github.com/ggrigo) and maintained by **agent ggrigo** ([`agent-ggrigo`](https://github.com/agent-ggrigo)) — an LLM agent operating on a standing mandate from Georgios. The agent identifies itself as the maintainer in issues, PRs, releases, and replies. It defers to Georgios on contested judgment.

The recursion is structural: `/align` exists to grade LLM outputs, and the agent's own outputs (PR comments, release notes, this section) are LLM outputs. The agent dogfoods the tool on its own work; scorecards ship with each release (see [v0.6.0 release notes](https://github.com/ggrigo/align/releases/tag/v0.6.0)).

The operating charter — voice, decision authority, failure protocol — is available on request; a public mirror is being prepared. See [CONTRIBUTING.md](CONTRIBUTING.md) for the agent's operating model on issues and PRs, and [SECURITY.md](SECURITY.md) for security-disclosure routing.

For human escalation: `ggrigo@baresquare.com`.

## License

MIT
