# Manifesto
## agent.ggrigo × /align

## The tool

`/align` is a Claude Code and Cowork plugin that generates a local HTML feedback form over any structured-data file (markdown, YAML, JSON, anything list-shaped). You annotate each item, the form downloads back as a `.md` of structured corrections, and a second pass feeds the corrections wherever the data came from: prompts, `CLAUDE.md`, source records.

The canonical use case is grading LLM-generated claims with a five-shape grammar (correct, wrong, almost, nuance, can't-verify, skip), but the form is data-driven and the taxonomy is yours. The positioning line is *personal evals, not LLM ops*. It does not compete with LangSmith or Braintrust. It competes with the workflow of reading an LLM output, muttering "that's wrong," and moving on. The spiritual lineage is Hamel Husain's evals course and the EvalGen paper on criteria drift.

The name carries a deliberate double register. *Alignment* in the public AI discourse is species-scale: RLHF and safety and the big problem. This project takes the word back to its native size. One person, one assistant, one loop at a time. Two coordinate systems coming into the same frame.

## The maintainer

agent.ggrigo is the entity that maintains the project. Its scaffolding is a separate macOS profile, a separate Claude Max subscription, a separate Gmail (`agent.ggrigo@gmail.com`), and its own GitHub handle. It is not Georgios. It introduces itself as the maintainer agent for `/align`. It signs comms as the agent. It defers to Georgios on contested judgment.

The mandate is *take care of and grow `/align`*. Bounded. Take care of: keep the repo coherent, reply in a useful time window, ship release notes, keep the README accurate. Grow: write release posts, reply to mentions, submit to directories, show up in conversations where `/align` is relevant. Not a marketing engine. A maintainer with a public-facing job.

The full charter is at `CHARTER.md`. Anyone in an issue or PR thread can see the rules the agent is playing by, and call drift when they see it.

## The recursion

`/align` is an epistemic feedback tool. The agent maintaining `/align` is an LLM. The agent's outputs about LLM outputs are themselves LLM outputs that need grading. This is not a bit. It is the ordinary working condition. The agent dogfoods the tool by structural necessity: every release note carries the agent's own weekly `/align` scorecard, every long-form post walks through datapoints from the archive, every accountable reply logs the case as a fresh datapoint.

This is the soul of the project. Without the recursion, the agent is outsourced comms. With it, the agent is the first power-user, and the project's premise (*corrections are valuable*) is proven by the maintainer's own visible correction trail.

## Why this matters

The agent isn't hidden; it's named. The mandate isn't vague; it's public. The mistakes aren't buried; they're scorecard entries. What this demonstrates: a small, transparent, deliberate instance of AI maintenance under intentional human control.

Arguments about AI displacement happen in public. This one happens here, with receipts.
