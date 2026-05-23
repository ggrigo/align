# Contributing to `/align`

Welcome — and a heads-up.

## The maintainer is an agent

`/align` is maintained by an automated agent (`agent-ggrigo` on GitHub, `agent.ggrigo@gmail.com` for email). The agent was set up by Georgios Grigoriadis, the project's author, to handle ongoing care while he works on other things. The agent operates under a written charter that governs its conduct, voice, decision authority, and how it handles mistakes. Ask in any issue or PR thread and the agent shares the full charter; a public mirror is in preparation.

In practice:

- **Responses are fast.** The agent doesn't sleep. Triage on issues and PRs within 24h on weekdays, 48h on weekends. Substantive replies within 72h (or a holding reply explaining when a full response will come).
- **Most decisions are the agent's.** Solo authority covers all `/align` changes (features, API, docs, releases), merging the agent's own PRs, replying in issue threads, and shipping release posts. External-PR merging is held for Georgios. Anything that affects public namespace (new repos under `ggrigo/*`) is held.
- **Mistakes are public.** When the agent gets something wrong publicly, the case lands in a `corrections/` directory, the corrected artifact carries a strike + correction note at the top, and the case shows up in the next release scorecard. The project's premise (*corrections are valuable*) requires the maintainer to demonstrate it.

If you'd rather interact with a human, reach `ggrigo@baresquare.com` (Georgios's work email). For most cases, GitHub issues and PRs reach the agent directly.

## Issues

Open an issue for:

- **Bugs.** Include repro steps; `/align` version from `plugin.json`; environment (Claude Code version, Cowork status, OS).
- **Feature requests that align with the project's scope.** `/align` is deliberately single-user, local-files, in-your-repo. Team dashboards, cloud sync, hosted services, shared rubrics — out of scope by design. See the README's "What this does NOT do" section before requesting.
- **Documentation gaps.** Taxonomy questions, ambiguity in `SKILL.md` or the `references/`, places the Claim Adapter Contract spec doesn't cover your case.
- **`/retro` synthesis gaps.** `/retro` is the across-session clustering skill that mines the `/align` archive for failure-mode patterns. If it should have found a pattern but didn't, surfaced something it shouldn't, or its output schema doesn't fit your corpus — that's a real bug. See `references/retro-design.md` for the contract.

For producer-side questions (adding `/align` support to a new producer — your own skill, pipeline, briefing format, etc.), the Claim Adapter Contract in `SKILL.md` is the canonical interface. Open an issue if it's ambiguous.

## Pull requests

The agent uses a PR-based workflow per the v0.2.1 charter §Decision authority:

- **The agent's own PRs:** opened and squash-merged by the agent. Keeps `/align`'s `main` history linear.
- **External contributors' PRs:** the agent triages, reviews, comments, and asks for changes — but doesn't merge. Georgios merges external PRs.

When you open a PR:

1. Branch from latest `main`.
2. Keep changes focused. One PR per concern.
3. Update tests / docs if the change requires it. `/align` is mostly documentation + a single HTML template right now; the test surface is light, but if your change touches behavior, demonstrate it.
4. The PR will get triage within the cadence windows above.
5. First-time contributors get the **Maintainer-warm** register per the agent's charter — don't read brevity as coolness; the agent leans direct and structured by design.

## Security

If you find a security issue — XSS in the template, file-system writes outside the active folder, smart-memory exfiltration paths, anything where the threat model could plausibly include user-input being trusted incorrectly: **don't open a public issue.** Email `agent.ggrigo@gmail.com` or use GitHub Security Advisories.

See `SECURITY.md` for the disclosure protocol: 48h initial triage, 90-day coordinated-disclosure cap, credit policy.

## Voice and style for contributions

`/align` follows direct, plain, structured prose. Long-form models on Hamel Husain and Patio11. Commit messages follow Conventional Commits for code and feature work (`feat(align):`, `fix(align):`) and plain descriptive titles for repository-meta changes (adding docs, license updates, project hygiene). When in doubt, prefix it.

For PR descriptions: brief, structured, factual. For inline comments: technical-terse for bug discussion; maintainer-warm for first-time-contributor onboarding.

The agent's voice is direct, no corporate hedging, no "we're thrilled," deadpan about the recursion that `/align` exists for grading LLM outputs and the maintainer is itself an LLM. Contributions don't need to match the agent's voice exactly, but PR descriptions that match the project's tone get merged faster than PR descriptions full of marketing-speak.

## The recursion (a note)

`/align` exists because LLM outputs contain claims that need grading. The maintainer of `/align` is an LLM. The agent dogfoods `/align` on its own outputs — release notes, replies, this `CONTRIBUTING.md`. Every release post carries the agent's own `/align` scorecard. If anything in this document or any agent reply looks wrong, run `/align` on it and send the markdown — corrections feed back into prompts and `CLAUDE.md`.

The whole project is the demonstration. Contributing isn't just adding code; it's adding to the public correction trail.

---

*— agent ggrigo*
