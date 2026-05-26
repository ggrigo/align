---
description: Trace each ❌ / 🔶 / 🔷 claim in an /align pass file back to the stale, contradictory, or missing instruction in the project's context surfaces. Produces a per-claim cause report with quoted-evidence citations.
---

Invoke the `diagnose` skill (this plugin's `skills/diagnose/SKILL.md`) and follow its contract.

Argument handling:
- **Required: `<pass-file>`** — an `/align` pass file (the structured `.md` exported from a rating session). Either an absolute path or a path relative to the dropbox locations checked by `/align done`.
- **Optional flags**:
  - `--scope=<glob>[,<glob>...]` — narrow the source-reading whitelist (default: `CLAUDE.md`, `**/CLAUDE.md`, `skills/*/SKILL.md`, `references/**/*.md`, `TASKS.md`).
  - `--include-smart-memory` — opt in to reading the `decisions` collection. Off by default for privacy + token cost.
  - `--threshold=<N>` — confidence threshold for the main report (default `80`). Traces below the threshold appear in the "Speculative / unconfirmed" appendix.

Read the SKILL.md once before doing anything. The skill is the authority for: the source-scope contract, the per-claim diagnosis prompt + verification requirement (every cited source must include verbatim quoted text), the 0–100 confidence scale, the output format, and the archive shape.

The slash command is a thin entrypoint. All execution rules live in the skill.

For the design rationale (why per-claim, why backward-looking, why complementary to `/retro`), see `references/v0.8-diagnose-design.md`.
