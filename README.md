# align

Personal evals for Claude Code and Cowork. Capture the corrections you'd otherwise mutter and forget — rate LLM claims as **correct / wrong / almost / needs-nuance / can't-verify / irrelevant / skipped** in a local HTML form, archive as machine-readable markdown, and feed patterns back into your prompts and `CLAUDE.md`.

## Why

When a model pulls a lot of context together and compresses it into one answer, everything arrives in the same confident voice. A checked fact, a reasonable claim, and a quiet assumption all read identically. The larger the synthesis, the worse this gets, and the more it smooths away nuance that mattered without showing you where.

`align` is a checkpoint for that moment. It takes the output apart into its separate statements and lets you mark each one quickly: right, wrong, almost, needs nuance, can't verify. What you correct is kept and fed back, so the next pass starts closer to the truth instead of repeating the same flattening.

The point is narrow: a structured place to get aligned with the model on facts, claims, and assumptions before you act on what it gave you. It works on any large synthesis, whatever produced it.

It exists only because nothing native does this. If Anthropic provided it as part of the product, we'd retire the project the same day.

## How

1. A producer (any skill that emits claims — `/rhythm`, `/digest`, an ad-hoc Claude turn) emits its output.
2. `/align` extracts the claims into an interactive HTML form.
3. You rate each claim in 2 minutes. Notes go on the wrong/almost/nuance ones.
4. The download is a structured `.md` file — corrections, confirmations, missing items.
5. Phase 2 reads the file, applies updates (TASKS.md, smart-memory when available), and archives the datapoint.
6. Patterns mined from the archive feed back into the originating skill's prompts and your `CLAUDE.md`.

After 90 days, you have a calibrated corpus of your own taste — in your repo, queryable with `grep`.

## Install

### Claude Code

```bash
# From a marketplace once published:
/plugin install align@<marketplace>

# Local install during dev:
claude --plugin-dir /path/to/align
```

### Cowork

Upload the `.plugin` zip via the Cowork Plugins modal → "Upload plugin".

### Both surfaces consume the same artifact

A `align/` directory with `.claude-plugin/plugin.json` at root works identically in Claude Code (loaded via `--plugin-dir` or marketplace install) and Cowork (zipped with `.plugin` extension and uploaded). No dual build.

## Layout

```
align/
├── .claude-plugin/
│   └── plugin.json                          # manifest (v0.7.0)
├── commands/
│   ├── align.md                             # /align command (thin entrypoint → skills/align/)
│   └── retro.md                             # /retro command (full skill body)
├── skills/
│   ├── align/
│   │   ├── SKILL.md                         # /align skill: Phase 1/2 flow, Claim Adapter Contract
│   │   └── align-template.html              # interactive feedback form
│   └── retro/
│       └── SKILL.md                         # /retro skill: synthesis + apply mode
├── references/
│   ├── claim-extraction-rhythm.md           # rhythm-specific producer heuristics
│   ├── archive-format.md                    # manifest schema, file layout, invariants
│   ├── integrations.md                      # TASKS.md, smart-memory queue, /retro
│   ├── retro-design.md                      # /retro design + review-gate mechanics
│   └── v0.7.0-design.md                     # most recent release design
├── README.md                                # you are here
├── CONTRIBUTING.md                          # contributor guide; maintainer disclosure
├── SECURITY.md                              # disclosure protocol; smart-memory caveat
└── LICENSE                                  # MIT
```

Multi-skill plugin as of v0.7.0: `skills/align/SKILL.md` and `skills/retro/SKILL.md` are the canonical skill files. Invocation: `/align` and `/retro` (or `/align:align` and `/align:retro` for namespaced form). Skill `SKILL.md` files MUST start with `---` on line 1 (YAML frontmatter) — anything before that breaks plugin validation on Cowork. The `references/` files are loaded on demand by Claude when a skill cites them — they're not in the always-loaded context.

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
```

The skill auto-detects which claim-producing output to read from the current conversation. Pass a context hint as the first argument to override the filename slug.

`/retro` reads the archive and writes one synthesis pass document per run — aggregate metrics, failure-mode clusters, proposed patches with human-review gates. Never modifies the archive. `/retro apply` is the Stage-2 gate: the human approves which proposed patches become real PRs. See `references/retro-design.md` for the architecture.

**How often to run.** Run `/align` whenever you make a significant change to a producer (a new prompt, a new claim shape, a new system context). Run `/retro` every 2–4 weeks on accumulated traces, or whenever the archive has grown by ~100 entries since the last pass. Per [Hamel Husain & Shreya Shankar's evals workflow](https://maven.com/parlance-labs/evals), the operational saturation heuristic is "if ~20 new traces don't surface a new failure category, the corpus is saturated." For small projects, scale the numbers down — even 20–50 outputs per significant change gives signal.

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

- **EvalGen / criteria drift** ([Shankar et al., UIST 2024](https://arxiv.org/abs/2404.12272)) — the strongest conceptual match. Some evaluation criteria can only be articulated *after* grading outputs, and users revise earlier grades as criteria sharpen. EvalGen sits upstream of `/align`: it generates candidate evaluator implementations and uses humans to select; `/align` skips evaluator-generation and asks the human to grade each session directly. The taxonomy (correct/wrong/almost/needs-nuance/can't-verify/irrelevant/skipped) is the fixed UI; the per-claim reality notes are where criteria evolve.
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

Per `references/archive-format.md`, every manifest row must satisfy `✅ + ❌ + 🔶 + 🔷 + 🤷 + ➖ + ⬜ = Claims`. If your row doesn't, either the claim count is wrong, a rating wasn't captured (look at the form export — was every claim rated or were some left unrated?), or the manifest count is off. Recompute from the exported `.md`'s Summary table; that's the source of truth.

## Maintenance

`/align` is authored by [Georgios Grigoriadis](https://github.com/ggrigo) and maintained by **agent ggrigo** ([`agent-ggrigo`](https://github.com/agent-ggrigo)) — an LLM agent operating on a standing mandate from Georgios. The agent identifies itself as the maintainer in issues, PRs, releases, and replies. It defers to Georgios on contested judgment.

The recursion is structural: `/align` exists to grade LLM outputs, and the agent's own outputs (PR comments, release notes, this section) are LLM outputs. The agent dogfoods the tool on its own work; scorecards ship with each release (see [v0.6.0 release notes](https://github.com/ggrigo/align/releases/tag/v0.6.0)).

The operating charter — voice, decision authority, failure protocol — is available on request; a public mirror is being prepared. See [CONTRIBUTING.md](CONTRIBUTING.md) for the agent's operating model on issues and PRs, and [SECURITY.md](SECURITY.md) for security-disclosure routing.

For human escalation: `ggrigo@baresquare.com`.

## License

MIT
