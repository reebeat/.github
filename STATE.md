# State

Lifecycle: build

Now:

Spec 0000 (the intent model and its generated documents) is built and in review. The model in `model/` covers the organisation and the three products in the six 4EM sub-models; `profile/` and `docs/` are generated from it; CI checks the model and the drift of the generated documents.

Next:

- The operator confirms or rejects the `proposed` elements (the PR body lists them).
- Follow-ups for the product repositories come from `docs/gaps.md`; the lead files them.
- Refresh the tracker snapshot (`bun run tracker:refresh`, then `bun run generate`) when cited issues or pull requests change.
- Link `docs/design/how-it-works.md` of reebeat from the profile once its pull request exists.

Blocked:

- Nothing blocks the model. The `proposed` elements wait for the operator.
