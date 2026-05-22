---
description: Generate an interactive feedback form for the latest claim-producing output (rhythm, digest, briefing, todo), then process the corrections back into TASKS.md, smart-memory, and the align archive.
---

Invoke the `align` skill (this plugin's `SKILL.md`) and follow its Phase 1 / Phase 2 contract.

Argument handling:
- **No args** → scan the current conversation for the most recent claim-producing output, extract claims, generate the HTML form. Default context slug is inferred from the producing skill (rhythm, digest, todo, etc.).
- **Single token** (e.g., `/align rhythm`, `/align todo`, `/align adidas-lsr`) → use the token as the context slug for filenames and the form title. Skip the inference step.
- **Phrase** (e.g., `/align done`, `/align apply`, `/align process feedback`) → jump to Phase 2: find the downloaded `.md`, parse it, apply corrections, archive.

Read the SKILL.md once before doing anything. The skill is the authority for: the claim schema (including the `verifiable: false` affordance), the surface-neutral handoff for the HTML form, the dropbox lookup, the smart-memory availability guard with queue-file fallback, and the archive + manifest format.

The slash command is a thin entrypoint. All execution rules live in the skill.
