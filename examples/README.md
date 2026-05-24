# Examples

Worked references for `/align` — both end-to-end pass walkthroughs and producer-authoring guides.

| File | Shape | What it shows |
|---|---|---|
| [walkthrough-readme-pass.md](walkthrough-readme-pass.md) | End-to-end pass | A real `/align` run on the README at [`36330d3`](https://github.com/ggrigo/align/commit/36330d3) — 28 claims, 22 ✅ · 4 ❌ · 2 🔶, findings drove [PR #44](https://github.com/ggrigo/align/pull/44) |
| [producer-adapter.md](producer-adapter.md) | Writing a producer | How to author a producer adapter against the Claim Adapter Contract — minimum viable claim, richer fields, what counts as a claim, a concrete TASKS.md-changelog example, and where this fits in the build-time → run-time → org-scale lifecycle |

If you've run a `/align` pass and want to contribute it as a public worked example, the bar is: real source, real findings, no sensitive content. Open a PR adding the file under `examples/` and a row above.
