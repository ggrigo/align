# Examples

Worked end-to-end examples of `/align` runs against real sources. Each file shows: setup, claim extraction, rating result distribution, the exported `.md` findings, and what the findings drove (commits, PRs, prompt updates).

| File | Source graded | Result | Drove |
|---|---|---|---|
| [walkthrough-readme-pass.md](walkthrough-readme-pass.md) | `README.md` at [`36330d3`](https://github.com/ggrigo/align/commit/36330d3) — first comprehensive walkthrough | 28 claims · 22 ✅ · 4 ❌ · 2 🔶 | [PR #44](https://github.com/ggrigo/align/pull/44) |

If you've run a `/align` pass and want to contribute it as a public worked example, the bar is: real source, real findings, no sensitive content. Open a PR adding the file under `examples/` and a row above.
