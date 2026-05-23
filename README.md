# align

Epistemic feedback loop for Claude Code and Cowork. Rate LLM-generated claims as **correct / wrong / almost / needs-nuance / can't-verify / irrelevant / skipped**, archive corrections as machine-readable markdown, and feed patterns back into your prompts and `CLAUDE.md`.

After 90 days, you have a calibrated corpus of your own taste — in your repo, queryable with `grep`.

## Why

LLM outputs contain claims. Some are right, some are wrong, some need nuance. Most people read the output, mutter "that's wrong," and move on. The correction never lands anywhere durable. `align` turns that into a structured artifact:

1. A skill (`/rhythm`, `/digest`, anything that produces claims) emits its output.
2. `/align` extracts the claims into an interactive HTML form.
3. You rate each claim in 2 minutes. Notes go on the wrong/almost/nuance ones.
4. The download is a structured `.md` file — corrections, confirmations, missing items.
5. Phase 2 reads the file, applies updates (TASKS.md, smart-memory when available), and archives the datapoint.
6. Patterns mined from the archive feed back into the originating skill's prompts and your `CLAUDE.md`.

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
│   └── plugin.json                          # manifest (v0.5.0)
├── commands/
│   └── align.md                             # /align slash command (thin entrypoint)
├── references/
│   ├── claim-extraction-rhythm.md           # rhythm-specific producer heuristics
│   ├── archive-format.md                    # manifest schema, file layout, invariants
│   └── integrations.md                      # TASKS.md, smart-memory queue, /retro
├── SKILL.md                                 # public Claim Adapter Contract + Phase 1/2 flow
├── align-template.html                      # interactive feedback form (self-contained HTML asset)
└── README.md                                # you are here
```

Single-skill plugin: `SKILL.md` at root, no `skills/` folder, auto-loaded by Claude Code v2.1.142+. The `references/` files are loaded on demand by Claude when SKILL.md cites them — they're not in the always-loaded context.

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
```

The skill auto-detects which claim-producing output to read from the current conversation. Pass a context hint as the first argument to override the filename slug.

`/retro` reads the archive and writes one synthesis pass document per run — aggregate metrics, failure-mode clusters, proposed patches with human-review gates. Never modifies the archive. See `references/retro-design.md` for the architecture.

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

- **EvalGen / criteria drift** (Shankar et al., UIST 2024, arXiv 2404.12272) — the strongest conceptual match. Users can only articulate evaluation criteria *after* grading outputs. `align`'s calibrated taxonomy (correct/wrong/almost/needs-nuance/can't-verify/irrelevant/skipped) maps to where criteria form.
- **Hamel Husain's evals school** — manually read 100+ traces, write notes, cluster into a failure taxonomy. Same philosophy, different packaging.

## License

MIT
