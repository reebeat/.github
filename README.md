# tsukuri-labs/.github

The organisation profile of [tsukuri](https://github.com/tsukuri-labs), and the model of the intent behind its products: why they exist, what they must do, who they are for, and what is still undecided.

- [`profile/README.md`](profile/README.md) is the page that GitHub shows on the organisation.
- [`docs/README.md`](docs/README.md) is the index of the model: the six sub-model pages (goals, business rules, concepts, business processes, actors and resources, technical components and requirements), one page per product, the business-model canvas, the roadmap and the gap report.
- [`docs/specs/0000-intent-model.md`](docs/specs/0000-intent-model.md) says how the model is built and checked.

The model is data in [`model/`](model/), written with the 4EM method. It is the only hand-written source: every page above is generated from it (`bun run generate`), and CI fails when the model contradicts itself or a generated page differs from the model. The operator's own decisions are in [`sources/operator-decisions-2026-10.md`](sources/operator-decisions-2026-10.md); an element is `decided` only when a source line shows the operator decided it. Read [`AGENTS.md`](AGENTS.md) before you change anything.

This repository is licensed under the [Apache License 2.0](LICENSE); the copyright notice is in [`NOTICE`](NOTICE). Code copied from other repositories is listed in [`PROVENANCE.md`](PROVENANCE.md).
