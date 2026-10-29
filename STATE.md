# State

Lifecycle: build

Now:

Spec 0000 (the intent model and its generated documents) is merged. Spec 0001 (model corrections: cut text, the Fountain decision, new pins) is in review as PR 2. Spec 0002 (the operator's answers of 2026-10-29: 36 decisions, 119 elements now `decided`) is built on top of it. The model in `model/` covers the organisation and the three products in the six 4EM sub-models; `profile/` and `docs/` are generated from it; CI checks the model and the drift of the generated documents.

Next:

- The operator confirms or rejects the `proposed` elements: `docs/confirm.md` lists them with the lead's advice (`model/triage.yaml`).
- The first npm publish is paused until a Norwegian IP advisor has given an opinion on the name (log line 113).
- Follow-ups for the product repositories come from `docs/gaps.md`; the lead files them.
- Refresh the tracker snapshot (`bun run tracker:refresh`, then `bun run generate`) when cited issues or pull requests change.
- Link `docs/design/how-it-works.md` of reebeat from the profile once its pull request exists.

Blocked:

- Nothing blocks the model. The `proposed` elements wait for the operator.
