# Writing a producer adapter for `/align`

A walkthrough for when you have a skill, command, or ad-hoc producer that emits *something Claude says*, and you want to grade it with `/align`.

## What an adapter is

`/align` is source-agnostic. Any producer — a digest skill, a meeting summary, a code-review pass, a TASKS.md changelog, an ad-hoc Claude turn — can feed `/align` by:

1. Walking its own output and identifying **falsifiable claims**.
2. Building an array of claim objects matching the **Claim Adapter Contract**.
3. Invoking `/align` with a kebab-case context slug.

That array is the only contract. The producer can live in this plugin, in another plugin, or be hand-emitted by Claude in a one-off turn.

## The minimum viable claim

Three required fields:

```js
{
  id: 1,                          // sequential integer, document order
  text: "K16 has shipped",        // the falsifiable assertion
  source: "fabric digest"         // human-readable provenance
}
```

That's enough to render. The form will show a Claim 01 row with the text and source.

## A richer claim

Everything else is optional, and each field has a specific rendering consequence:

```js
{
  id: 4,
  text: "Nikos shared the K16 spec doc",
  source: "slack",

  // Timeline mode (all claims have `time`) → cards render with timestamp headers
  time: "13:26",

  // Source icon (rail + focused source pill); see ICON_GLYPH map in align-template.html
  icon: "slack",                  // calendar, gmail, slack, fireflies, drive, fabric, rhythm, briefing

  // Supporting context — shown in the focused-claim pane
  desc: "Linked from the #engineering channel; mentions the K16 milestone targets.",
  detail: "Nikos: 'sharing the K16 doc — see slack.com/files/K16spec.pdf'",

  // Tags — render as colored pills below the claim text
  categories: ["engineering", "k16"],
  files: ["K16spec.pdf (1.2MB)"],
  link: "https://slack.com/files/K16spec.pdf",  // parsed via new URL(); http(s) only

  // Epistemic affordance — pre-rates as "can't verify" with a visible badge
  verifiable: true                // default; set false for machine-only evidence
}
```

The `verifiable: false` affordance matters more than it looks. Some claims are derived from sources the user can't independently inspect — filesystem state they didn't read, smart-memory recall, multi-step inference. Asking a yes/no rating on those is a calibration trap: the user will guess, and the guess will be archived as truth. Mark those `verifiable: false` so they pre-render as 🤷 with a visible badge. The user can still upgrade or downgrade the rating, but the default acknowledges the epistemic gap.

## A concrete example — TASKS.md changelog producer

Suppose you have a skill that summarizes TASKS.md changes between two commits and produces a list of claims like:

> - The "ship K16 v1" task was marked done.
> - A new task "Audit smart-memory writes" was added.
> - The deadline on "Update CHARTER §State" was moved from 2026-05-30 to 2026-06-15.

A minimal adapter for this producer:

```js
const claims = [
  {
    id: 1,
    text: 'The "ship K16 v1" task was marked done',
    source: 'TASKS.md changelog 2026-05-20..2026-05-24',
    categories: ['tasks-md', 'k16']
  },
  {
    id: 2,
    text: 'A new task "Audit smart-memory writes" was added',
    source: 'TASKS.md changelog 2026-05-20..2026-05-24',
    categories: ['tasks-md', 'security']
  },
  {
    id: 3,
    text: 'The deadline on "Update CHARTER §State" was moved from 2026-05-30 to 2026-06-15',
    source: 'TASKS.md changelog 2026-05-20..2026-05-24',
    categories: ['tasks-md', 'charter']
  }
];
```

The producer hands this array to `/align` with a context slug:

```
/align tasks-changelog
```

`/align` reads the array, populates `align-template.html`, opens it from a `file://` (or `computer://` on Cowork) path. The user rates each claim in 2 minutes, downloads the structured `.md`, and `/align done` applies the corrections.

## What counts as a claim

A claim is a **falsifiable assertion** — something that can be definitely true or false in context the user understands.

- **Good claim**: *"The K16 deadline is 2026-06-15"* (verifiable against TASKS.md).
- **Good claim**: *"Nikos owns the K16 spec write-up"* (verifiable from people the user knows).
- **Bad claim**: *"K16 is going well"* (vague; not falsifiable).
- **Bad claim**: *"The team should prioritize K16"* (an opinion; not a fact).
- **Bad claim**: *"K16 has been mentioned 12 times in Slack this week"* (probably accurate but useless to rate).

When in doubt: would the user say *"that's wrong"* or *"that's right"* on this? If the answer is neither — drop it. Rating drift, scope-discrimination bias, and grading fatigue are the failure modes you're avoiding.

For rhythm-style producers (calendar + messaging + transcript + drive synthesis), see `references/claim-extraction-rhythm.md` for the specific heuristics.

## What `/align` will do with your array

Phase 1 — **Generate the HTML form**:

1. Substitutes your array into `align-template.html` at the `{{CLAIMS_INJECT}}` marker (replaces `const claims = [];` with `const claims = [...your array];`).
2. Substitutes `{{CONTEXT}}`, `{{DATE}}`, `{{SOURCE}}`, `{{CONTEXT_SLUG}}` from the values your producer provided.
3. Saves to the active working folder as `align-{slug}-YYYY-MM-DD.html`.
4. Hands off the absolute path + a `file://` link.

Phase 2 — **Read the downloaded `.md` and act**:

1. Scans common dropbox locations (`~/Downloads/`, working folder, `incoming-docs/`, cwd) for the most recent `align-*.md`.
2. Parses the four sections: Summary, Corrections Required, Confirmed / Other, Missing — Not Captured.
3. Applies corrections to TASKS.md (with `<!-- align-correction YYYY-MM-DD -->` comments), writes to smart-memory if available, archives the datapoint under the `.align/` folder per the archive-format spec.

## Where this fits in the lifecycle

| Stage | Tool | What it does |
|---|---|---|
| Build-time | cc-plugin-eval, claude-eval, promptfoo | Does your producer skill trigger correctly? |
| Run-time, per-session | `/align` (this) | Are this run's claims correct? |
| Run-time, accumulated | `/retro` | What patterns emerge across many runs? |
| Org-scale | Braintrust, Humanloop, etc. | Production-trace dashboards |

`/align` doesn't replace the build-time tools — it fills the gap they don't fill. A plugin author validates triggers in CI; a plugin user calibrates their reactions to outputs with `/align`.

## More reading

- `SKILL.md` — the canonical Claim Adapter Contract spec (this file is a usage-shaped companion).
- `references/integrations.md` — Phase 2 details on TASKS.md, smart-memory queue, and `/retro` integration.
- `references/archive-format.md` — manifest schema + file layout for the `.align/` archive.
- `examples/walkthrough-readme-pass.md` — an end-to-end pass against the README itself, with real findings.
