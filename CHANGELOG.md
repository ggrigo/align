# Changelog

Release history at a glance. Detailed notes for each release live on the corresponding [GitHub Releases](https://github.com/ggrigo/align/releases) page.

Format follows [Keep a Changelog](https://keepachangelog.com/) for the per-version sections; versioning is [SemVer](https://semver.org/).

---

## [v0.8.1] — 2026-05-26

**Patch:** fix Cowork marketplace validation (drop `commands/`).

Cowork's marketplace validator rejected v0.8.0 because the plugin shipped both `commands/<name>.md` and `skills/<name>/SKILL.md` for the same names. Removed the three thin command wrappers (`commands/align.md`, `commands/retro.md`, `commands/diagnose.md`); the skills now own the slash-command entry directly. No functional change — `/align`, `/retro`, `/diagnose` still work. Build automation added: `.github/workflows/release.yml` auto-builds the `.plugin` zip on every `v*` tag push.

[Release notes →](https://github.com/ggrigo/align/releases/tag/v0.8.1)

## [v0.8.0] — 2026-05-26

**Closes the diagnostic loop.** Three additive landings:

- **`/diagnose` skill** — backward-trace each ❌/🔶/🔷 claim back to the stale instruction that caused it. Reads `CLAUDE.md`, `skills/*/SKILL.md`, `references/`, `TASKS.md` (smart-memory opt-in). Quoted-evidence citations, 0–100 confidence, threshold-80 filtering. Read-only.
- **`/retro` analyst pass** — per-producer accuracy variance + recurring-claim detection across the archive. Additive output; no public-contract change.
- **6-shape canonical taxonomy** — dropped `➖ Irrelevant` (the form never had a button for it; archive had zero ➖ rows across 16 sessions). New invariant: `✅+❌+🔶+🔷+🤷+⬜ = Claims`.

The trio (`/align` captures → `/diagnose` traces → `/retro` synthesizes) is now structurally complete.

[Release notes →](https://github.com/ggrigo/align/releases/tag/v0.8.0)

## [v0.7.0] — 2026-05-25

**Three-pane redesign + the apply side of `/retro`.**

- **`/retro apply`** — patch-applying side of the synthesis loop with explicit per-patch human-approval gate. `--dry-run` previews without writing.
- **Three-pane HTML form redesign** with three aesthetic presets (`editorial` / `modern` / `terminal`); keyboard-first rating (1–6 rate, ↑↓/jk navigate, N notes, auto-advance).
- **Multi-skill restructure** — namespaced invocations `/align:align` and `/align:retro` alongside legacy entrypoints; additive, no breaking change.
- **Opt-in smart-memory filter** declared in `CLAUDE.md`; default unfiltered.
- **Revisit-ratings banner** surfaces stale archive entries.
- **Marketplace + adoption surfaces** — `.claude-plugin/marketplace.json` added; `examples/walkthrough-readme-pass.md` first public worked walkthrough; `examples/producer-adapter.md` authoring guide.

[Release notes →](https://github.com/ggrigo/align/releases/tag/v0.7.0)

## [v0.6.0] — 2026-05-23

**`/retro` skill — synthesis side of the archive loop.** Reads accumulated `.align/` rows, writes a single pass document per run with aggregate metrics, failure-mode clusters, and proposed patches. Saturation check at Step 4.5. Plus contributor + security docs (`CONTRIBUTING.md`, `SECURITY.md`), template hardening, and the per-claim Claim Adapter Contract surfaced as the producer-side public interface.

[Release notes →](https://github.com/ggrigo/align/releases/tag/v0.6.0)

## [v0.5.0] — 2026-05-22

**First public publish** + Claim Adapter Contract promoted to first-class. Producer-side interface defined: any producer (rhythm, digest, todo, code-review, financial recon, ad-hoc Claude turn) that emits a claim array matching the schema can be aligned. Cross-surface install (`--plugin-dir` for Claude Code; `.plugin` zip upload for Cowork) via a single artifact.

(Tag-only; predates the GitHub Releases workflow.)

---

[v0.8.1]: https://github.com/ggrigo/align/releases/tag/v0.8.1
[v0.8.0]: https://github.com/ggrigo/align/releases/tag/v0.8.0
[v0.7.0]: https://github.com/ggrigo/align/releases/tag/v0.7.0
[v0.6.0]: https://github.com/ggrigo/align/releases/tag/v0.6.0
[v0.5.0]: https://github.com/ggrigo/align/compare/v0.5.0...v0.6.0
