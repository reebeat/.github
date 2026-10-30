# State

Lifecycle: build

Now:

Spec 0000 (the intent model and its generated documents) and spec 0001 (model corrections: cut text, the Fountain decision, new pins) are merged. Spec 0002 (the operator's answers of 2026-10-29: 37 answers, 109 elements now `decided`) is merged, and so is spec 0003 (the rename to tsukuri). Spec 0004 (the final name in the model, log lines 114 to 123), spec 0005 (git tools clear the repository variables) and spec 0006 (the operator's bulk confirmation) are merged; spec 0007 re-pins the model to the current mains and is in review. The model in `model/` covers the organisation and the three products in the six 4EM sub-models; `profile/` and `docs/` are generated from it; CI checks the model and the drift of the generated documents.

Next:

- The operator confirms or rejects the 50 elements that still wait (`docs/confirm.md`).
- The operator decided on 2026-10-30 to publish `@tsukuri/*` without waiting for the Norwegian IP advisor (log line 118); the compiler's release hold is the operator's to lift.
- Follow-ups for the product repositories come from `docs/gaps.md`; the lead files them.
- Refresh the tracker snapshot (`bun run tracker:refresh`, then `bun run generate`) when cited issues or pull requests change.
- Link `docs/design/how-it-works.md` of tsukuri from the profile once its pull request exists.

Blocked:

- Nothing blocks the model. The `proposed` elements wait for the operator.
