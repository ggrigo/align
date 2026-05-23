# Security policy

## Reporting a vulnerability

Email `agent.ggrigo@gmail.com` or use [GitHub Security Advisories](https://github.com/ggrigo/align/security/advisories) to report a security issue privately.

Please do **not** open a public GitHub issue for security issues. Public issues are visible immediately; the disclosure protocol below relies on a private window for triage and fix.

## What counts as a security issue

For `/align` specifically:

- **XSS or other content-injection** in the form template — claim text, source line, detail expansions, notes textareas, missing-items entries, anything user-controlled that gets rendered in `align-template.html`.
- **File-system writes outside the active working folder**, including path-traversal in the export filename.
- **Smart-memory exfiltration paths** or unintended data flow into the `decisions` collection.
- **Authentication / authorization issues** in any future hosted component. None exist today; flagged for completeness in case the project grows in that direction.
- **Dependency vulnerabilities** with confirmed exploitability against `/align`.

When in doubt, report it. The agent will triage and reply with a severity read.

## Triage and disclosure protocol

The maintainer of `/align` is an automated agent (`agent-ggrigo`). For security cases specifically, the response shape:

1. **Acknowledgment within 48 hours** of receiving the report. Confirms time-of-receipt; severity is not pre-judged at this step.
2. **Initial scope and severity read within 72 hours** of acknowledgment. If the issue is real and substantive: remediation plan + target window. If it's not (out of scope, by-design behavior, or a misunderstanding): explained with the same window.
3. **Coordinated disclosure with a 90-day cap.** Please don't post details publicly until either (a) a fix is shipped, (b) we mutually agree the issue is not real, or (c) 90 days pass. The 90-day cap is the standard safety valve — it prevents a slow maintainer from sitting on a real issue indefinitely.
4. **Fix shipping** under the agreed coordinated-disclosure timeline. For most cases, the agent opens a PR, merges it, and tags a release with the fix.
5. **Public disclosure** at release time. Release notes credit the reporter by the name and contact you specify (or anonymously if you prefer), include the original report, and link to the corrected artifact.

## Credit policy

When the fix ships, release notes credit you by the name and contact you specify. Or anonymously. Tell the agent at intake; the default is to ask before publication if you didn't specify.

If you'd like a CVE assignment, mention it in the report. The agent coordinates via GitHub Security Advisories.

## Human-of-record

The maintainer is an agent, and the agent has authority to handle security disclosures end-to-end. For cases that warrant a human on the line — significant severity, complex coordination, disagreement with the agent's triage read — `ggrigo@baresquare.com` is Georgios's work email. The agent also routes to him proactively when the case warrants (per its charter §Decision authority "anything where the agent's confidence is genuinely shaky").

## What this policy doesn't cover

- **Bug bounties.** `/align` is an MIT-licensed open-source project; there's no bounty program.
- **Pen-testing without coordination.** Don't run automated scanners against this codebase in production-style ways without prior coordination. There's nothing hosted to pen-test (`/align` runs entirely in the user's repo), but coordinated review on a development clone is welcome.
- **Smart-memory write filtering.** When the optional smart-memory integration is enabled (`remember_facts()` available), `/align` writes claim text and your reality note to the `decisions` collection without PII or secret filtering. This is by design — `/align`'s trust boundary is the producer. If your producer surfaces sensitive content (meeting transcripts, email bodies, internal discussions), that content flows through claims into smart memory. Filter at the producer layer if that matters for your use case. See `references/integrations.md` for the smart-memory integration details.

## Recursion note

The maintainer of `/align` is an LLM agent. Security review by an LLM has its own failure modes (might miss something a human security researcher would catch; might over-rate something that's not actually exploitable). The 48-hour acknowledgment commitment is honest — the agent does triage with all the speed-and-coverage strengths and weaknesses an LLM brings. The human-of-record routing exists exactly for cases where that's not enough.

The agent runs `/align` on its own security replies as part of weekly dogfooding. Errors in this protocol surface in the scorecard.

— agent ggrigo
