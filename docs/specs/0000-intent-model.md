# 0000 The intent model and its generated documents

Status: **spec** (frozen when its PR opens). Date: 2026-10-29. Decided by: the operator's assignment of 2026-10-29 (analyse the recorded intentions and plans of reebeat, document them with business-modelling practice, including 4EM, and generate the write-ups).
Binding for: every later change to `model/`, `tools/intent/` and the generated documents. Implemented by the PR that carries this file.

## Goal

Why the reebeat products exist, what they must do, who they are for and what is still undecided is written in one place, as data, with a source on every statement. People read it as documents; CI reads it as a model and fails when it contradicts itself. The documents (the organisation profile, the six 4EM sub-model pages, one page per product, a business-model canvas, a roadmap and a gap report) are generated from the data and are never edited by hand.

The model serves four readers: the operator, who confirms or rejects what the analysis inferred; contributors and agents, who need the reason behind a product; visitors of the GitHub organisation, who see the profile; and the owners of the product repositories, who get a list of what is missing and how to fix it.

## Constraints and values

- **One source per fact.** `model/` is the only hand-written source of the documents. A generated document is a pure function of the model, and a test fails when a committed document differs from what the generator makes (the generate, then test, then convention ladder of the operator's governing values).
- **The operator's words win.** `sources/operator-decisions-2026-10.md` is the operator's own decision log, copied unchanged. An element is `decided` only when a source line shows the operator decided it: a line of that log, or a line of a repository document that records the decision (`record:` sources). An agent's proposal, a spec's plan or an inference is `proposed`, with a `rationale` that says what the operator must confirm. A known gap or question is `open`.
- **Established practice, cited.** 4EM: Sandkuhl, Stirna, Persson and Wißotzki, *Enterprise Modeling: Tackling Business Challenges with the 4EM Method*, Springer 2014. Product vision board: Roman Pichler. Business Model Canvas: Osterwalder and Pigneur, *Business Model Generation*, 2010. Jobs to be done for personas. arc42 sections 1 (goals) and 10 (quality requirements) per product. The vocabulary of the model (kinds, sub-models, legal links, canvas blocks) is data in `tools/intent/src/vocabulary.ts`; this spec does not copy it.
- **Honest.** Licences, blockers and unmeasured demand are named as problems and constraints, not left out.
- **Public.** This repository is public. It holds no secret, no personal data and no course material. The 4EM method is cited from the book; no coursework, case or personal content is copied.
- **Plain English.** Statements use short sentences and active voice.
- **Default stack.** TypeScript 7, Bun, Effect v4 (the model schema is an Effect Schema), Oxfmt, Oxlint, Vite+, devenv. Lifecycle tooling is copied from `reebeat/studio` at `d4fd75e` (see `PROVENANCE.md`).

## Journey

```text
operator / contributor / agent
  1. read      profile/README.md (the organisation page), docs/README.md (the index), a sub-model or product page
  2. disagree  an element is wrong, missing or too strong: edit its YAML in model/<scope>/<sub-model>.yaml
  3. check     bun run model:check    every check below; findings name the element
  4. generate  bun run generate       rewrites profile/ and docs/ from the model
  5. commit    hooks: gitleaks, format and lint, Conventional Commit
  6. PR        skill pr-create; CI runs the same gates as `bun run ready`
  7. review    skill review-pr: independent reviewers, sources sampled against the repositories
  8. merge     merge.sh: refuses without a passing recorded round on the head
```

A reader who clones the repository and runs `devenv shell -- bun install` and `devenv shell -- bun run ready` sees every gate pass on a clean tree. Elements of the model cite their sources by a compact string (see `tools/intent/src/refs.ts` for the grammar); file sources cite a commit pinned in `model/sources.yaml`, so a line number stays true after the product repository moves on. `bun run sources:verify` checks them against local clones; `bun run tracker:refresh` rewrites `model/tracker.yaml` (the issue and pull-request snapshot that the roadmap reads) from GitHub.

## What is built

| Part | Content |
| --- | --- |
| The model | `model/<scope>/<sub-model>.yaml` for the scopes `org`, `reebeat`, `studio` and `foldkit-flow`, one file per 4EM sub-model: Goals, Business Rules, Concepts, Business Process, Actors and Resources, Technical Components and Requirements. Every element has an id, a kind, a statement, a status, sources and links. |
| The schema | `tools/intent/src/schema.ts`, an Effect Schema. A missing source, an empty source list, an unknown key or an unknown kind does not decode. |
| The checks | `tools/intent/src/checks.ts`; each has a negative control in `tools/intent/test/checks.test.ts`. |
| The generator | `tools/intent/src/generate.ts` and `tools/intent/src/render/`: Mermaid diagrams and tables. |
| The generated documents | `profile/README.md`; `docs/README.md`; `docs/goals.md`, `business-rules.md`, `concepts.md`, `business-processes.md`, `actors-and-resources.md`, `technical-components.md`; `docs/products/<product>.md` (vision board, the goals served, actors, key processes, rules, components, quality goals); `docs/business-model.md`; `docs/roadmap.md`; `docs/gaps.md`. |
| The source verifier | `bun run sources:verify [--show]`: every file source exists at the pinned commit, its lines exist, a `record:` line says "decided" or "operator", an `absent:` file is absent. Not in CI (CI has no checkouts); run by reviewers. |
| The lifecycle | hooks, commitlint, gitleaks, review and merge scripts, CI, copied from `reebeat/studio`. |
| Branch protection | `main`: pull request required (administrators included), required status check `checks`, no force push, no deletion. |

## The checks

CI fails on each of these. The codes are in `tools/intent/src/checks.ts`.

| Check | Fails when |
| --- | --- |
| Goal support | a goal has no supporting component, process, requirement, IS goal, spec, issue or pull request (a goal also counts as supported when a sub-goal is) |
| Component serves a goal | a component serves no goal, directly or through a requirement or IS goal it realizes (a rejected alternative is exempt) |
| Rule cites a goal | a rule has no `serves` link to a goal |
| Source on every element | an element has no source, or a source does not parse, or a decision-log line is beyond the log |
| Decided means operator | an element is `decided` and none of its sources is an operator decision |
| Proposed means reasoned | a `proposed` or `open` element has no rationale |
| Links | a link has an unknown type, a missing target, or joins kinds that its type may not join |
| Identity | an id repeats, or its prefix does not match its kind |
| Coverage | a scope has no element in one of the six sub-models |
| Products | a product has no, or more than one, product component, or states no quality goal; the organisation has no tagline |
| Canvas | a Business Model Canvas block has no element |
| Tracker | a cited issue or pull request has no entry in `model/tracker.yaml` |
| Drift | a committed generated document differs from the generated text |

## Falsifiers

Each falsifier has a negative control that is run and observed to fail. The controls of F2 to F9 are unit tests (a mutation of a valid fixture, expecting the one finding).

| # | Falsifier (must hold) | Gate | Negative control (must fail) |
| --- | --- | --- | --- |
| F1 | `bun run ready` exits 0 on a clean tree of the PR head | `ready` | F2 to F11 |
| F2 | A goal with no support fails | goal-support check | remove the links that support a goal in the fixture |
| F3 | A component that serves no goal fails | component check | remove a component's `serves` link |
| F4 | A rule that cites no goal fails | rule check | remove a rule's `serves` link |
| F5 | An element with no source, or an empty source list, does not load | schema decode | decode an element without `source` and one with `source: []` |
| F6 | A `decided` element whose source is not an operator decision fails | status check | set a repository line as the only source of a decided element |
| F7 | A generated document edited by hand fails | drift test | overwrite `docs/goals.md` in a temporary copy and delete `docs/gaps.md` |
| F8 | A link to a missing element, of an unknown type or between kinds that its type may not join fails | link check | dangling target, unknown type, `performs` from a concept |
| F9 | A scope without an element in each sub-model fails | coverage check | delete the only concept of a scope |
| F10 | Every file source resolves at the pinned commit; every `record:` cites a line that says "decided" or "operator" and is not a `Status:`, `Decided by:` or heading line; an `absent:` source is absent; a checkout that cannot answer is an error, never an absence | `bun run sources:verify` | `tools/intent/test/verifySources.test.ts` and `gitShow.test.ts`: a throwaway repository with a header line, a plain line, a line beyond the end, a missing file, an existing file cited as absent, an unknown commit and a missing checkout |
| F11 | `main` cannot be pushed to directly, and a PR cannot be merged without a passing recorded round | branch protection, `merge.sh` | read the protection with `gh api`; run `merge.sh` on this PR before a round is recorded: exit 4 |
| F12 | Nothing private enters: secrets are scanned on every commit and in CI history; reviewers sample the model against its sources | gitleaks, review | a synthetic key in a staged file is refused |

## Scope and non-goals

- This PR edits no product repository. The gap report lists what is missing in them and the fix for each; the lead files follow-ups.
- No new goals are invented. What the analysis inferred is `proposed`; the operator confirms or rejects each element in a later change.
- The roadmap is the model's tracker snapshot, not a project-management tool.
- No site is published from this repository; the documents are Markdown that GitHub renders.

## Risks

| Risk | Mitigation |
| --- | --- |
| A source line number drifts when the repository changes | file sources pin a commit; `sources:verify` checks them |
| The model becomes a second copy of the repositories | each element states intent and cites its source; it copies no specification text |
| The tracker snapshot goes stale | it records its date; `bun run tracker:refresh` rewrites it; the roadmap prints the date |
| An agent inflates a status | CI rejects `decided` without an operator source; reviewers sample sources |
| The lifecycle toolchain is copied into a fourth repository | recorded as a gap in the model; a shared home is the fix |

## Open questions for the operator

1. Confirm or reject every `proposed` element (the PR body lists them): personas, quality scenarios, the free and paid marks that are not the operator's two decided paid features, the structure of the value stream.
2. Should the lifecycle toolchain move to a shared home (this repository) instead of being copied into each repository?
3. Should the organisation-wide community health files (CONTRIBUTING, SECURITY, CODE_OF_CONDUCT) live in this repository, where GitHub uses them as defaults for repositories that have none? The gap report lists their absence per repository; this PR adds none.

## Revisions

Dated entries. A spec is revised only here; its text above is never edited silently after the PR opens.

- **2026-10-29, plan written** with the build.
- **2026-10-29, the decision log gained "Technical framing" (lines 58 to 65).** The log copy was refreshed; the three layers (Model, Plan, Build), Effect and XState, and React's core as a rejected alternative are in the model. Components gained the tiers `layer` and `external`, and the flag `rejected`.
- **2026-10-29, two review rounds of the sources (before the PR opened).** Independent reviewers sampled every element against its sources. Every element whose only support was a spec header ("Status", "Decided by: the operator's assignment") became `proposed`; `record:` sources cite only lines that state the decision; decided statements were cut back to the wording of the line. `sources:verify` gained the header rule and now fails closed when a checkout or commit is missing (the first version reported every `absent:` source as present because a failed `git show` returned empty text).
- **2026-10-29, the pricing marks.** The operator decided the principle and two paid features (multiplayer collaboration, integrated hosted AI agents). Every other `pricing` mark is `proposed`.
- **2026-10-29, links to the technical note.** The organisation profile links `docs/design/how-it-works.md` of pull request 24 of reebeat (`url` on the component). The link points at the pull request until the note lands on `main`.
