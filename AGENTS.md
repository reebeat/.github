# tsukuri-labs/.github

The organisation profile of tsukuri and the model of the intent behind its products: the compiler ([tsukuri](https://github.com/tsukuri-labs/tsukuri)), the editor ([tsukuri studio](https://github.com/tsukuri-labs/studio)) and the graph library ([foldkit-flow](https://github.com/tsukuri-labs/foldkit-flow)). Read [`README.md`](README.md); [`STATE.md`](STATE.md) says what is active. This repository is **public**: no secret, no personal data and no course-private material, ever. The 4EM method is cited from the book, never copied from coursework.

The lifecycle below is specified in [`docs/specs/0000-intent-model.md`](docs/specs/0000-intent-model.md). This file links facts that live in scripts or in the spec; it does not copy them. It was adapted from tsukuri studio's `AGENTS.md` (see [`PROVENANCE.md`](PROVENANCE.md)).

## The one rule of this repository

`model/` is the only hand-written source. `profile/README.md` and everything under `docs/` except `docs/specs/` are generated from it by `bun run generate`: never edit them. To change a statement, edit the YAML, run `bun run model:check` and `bun run generate`, and commit both. A test fails when a committed generated document differs from the generator's output.

- **Status is earned.** `decided` needs a source that shows the operator decided it: a line of `sources/operator-decisions-2026-10.md` (`log:N`) or a repository line that records the decision (`record:...`). Everything inferred is `proposed` with a `rationale`; a known gap or question is `open`. `sources/operator-decisions-2026-10.md` is the operator's log: it is replaced by a byte-for-byte copy of the operator's file when the operator adds lines, and never edited here.
- **A free or paid mark is earned separately.** An element can be `decided` while its mark is only a proposal. `pricing` is a decided mark: the element is decided and cites a line listed in `pricingDecisions` of `model/sources.yaml`. Every other mark is `proposedPricing`. `PRICING-UNDECIDED` fails otherwise.
- **An answer decides what it says.** Cite a log line only for the part it decides; do not carry the rest of an old statement into a decided element. Elements that an answer does not settle keep their status.
- **Cite exact lines.** File sources cite a commit pinned in `model/sources.yaml`. Run `bun run sources:verify --show` where the product repositories are checked out, and read the lines you cite.
- **Name problems.** Licences, blockers and unmeasured demand belong in the model.
- **Plain English.** Short sentences, active voice.
- **Quote text with `#`.** A plain YAML value ends at ` #`. Quote a value that holds one, or use a folded block (`>-`); the loader refuses a cut value and names the line.

## How a change travels

```text
spec → code → PR   (1:1)
```

- **One spec, one branch, one PR.** The spec is `docs/specs/NNNN-*.md`; the branch is `feat/NNNN-<slug>`. If a spec needs two PRs, it was two specs. A change to the model alone (a corrected statement, a confirmed status) is one PR that needs no new spec; say in the PR body which elements changed and why.
- **Plan and build are one step.** Write the plan (journey, constraints, falsifiers) first, then build without waiting for approval. Revise the plan as the build teaches: each change is a dated entry in the spec's Revisions section, never a silent edit. Stop only at an operator-owned fork (preference, authority, external effects), and report it.
- **The PR carries spec and code**, opens only when the whole journey is built and `bun run ready` passed on the head, and **freezes the spec**. Use skill `pr-create`; the PR body is the report.
- **Never block on a merge.** After opening a PR, start the next spec on a stacked branch.
- **Review judges three things**: the plan, the implementation, and their agreement. Use skill `review-pr`; `.agents/skills/review-pr/merge.sh` merges only a head with a passing recorded round, and `record-round.sh` refuses a pass that the PR's author recorded about its own head.
- **One writer per working directory.** A second agent works in its own worktree under `.worktrees/` (`/run/current-system/sw/bin/git worktree add .worktrees/<name> -b <branch>`; it is git-ignored). Use that full path: the harness rewrites a bare `git worktree` into `omp worktree`, which once copied `.worktrees/` into itself. Commit by pathspec on a shared tree.
- `main` is protected: a pull request is required (administrators included), the status check `checks` must pass, no force push, no deletion.

## Gates

Every gate is a root script in `package.json`; `bun run ready` runs them in this order. CI (`.github/workflows/checks.yml`) runs each script as its own step. Run everything inside devenv: `devenv shell -- bun run ready`. Set up once with `devenv shell -- bun install`, which also installs the git hooks (`prepare`).

| Gate | Command | Runs where | Catches | See it fail |
| --- | --- | --- | --- | --- |
| Commit message | commitlint (`.vite-hooks/commit-msg`) | every commit | a message that is not a Conventional Commit | `git commit -m "stuff"` |
| Secrets, staged | gitleaks on staged blobs (`.vite-hooks/pre-commit`) | every commit | a secret in a staged file | stage a file with a fake key in a well-known format |
| Format and lint, staged | `vp staged` (`vp check --fix`, `.vite-hooks/pre-commit`) | every commit | format drift, lint errors | stage a file with a `console.log` |
| Tests | `bun run test` (`.vite-hooks/pre-push`) | every push, `ready`, CI | a check that no longer fails on its negative control; a real model that fails a check; a generated document that differs from the model | delete a link of a component in a copy of the fixture (`tools/intent/test/checks.test.ts`); edit `docs/goals.md` by hand |
| Format, lint, types | `bun run check` (`vp check`) | `ready`, CI | Oxfmt drift; Oxlint with Ultracite, the Effect plugin and diagnostics, cognitive complexity above 15; type errors | a function with complexity 16 |
| Model | `bun run model:check` | `ready`, CI | every check listed in spec 0000 | add a goal that nothing serves |
| Generated documents | `bun run generate:check` | `ready`, CI | `profile/` or `docs/` differing from the generator's output | edit `docs/roadmap.md` by hand |
| Dead code | `bun run knip` | `ready`, CI | unused files, exports and dependencies | export a symbol nothing imports |
| Duplication | `bun run cpd` | `ready`, CI | copy-paste (threshold 0) | paste a 40-token block twice |
| Secrets, history | `bun run secrets` | `ready`, CI | a secret anywhere in the git history | commit a fake key on a scratch branch |

Not in CI: `bun run sources:verify` (needs checkouts of the product repositories at the pinned commits; reviewers run it), `bun run tracker:refresh` (needs `gh` and the network; run it when cited issues or pull requests change, then `generate`) and `bun run status:diff` (compares every status with `main`; it also fails on an element added as `decided`, unless `--allow-added-decided` is given and the PR says why; a PR that says "no status changed" shows its output).

## Effect

Every agent that writes TypeScript here writes native Effect (v4, pinned in the root `catalog`). Lookup order before writing: this file, then `tools/intent/node_modules/effect/AGENTS.md` and the `ai-docs/src` examples it links, then `node_modules/effect/src`, never memory or another copy. A total deterministic transformation (the checks, the renderers) stays a plain function. Files, processes and the network sit behind Effect services at the composition root, `tools/intent/src/cli.ts`. No lint suppression is used in this repository; fix the code, not the rule. Git runs through `tools/intent/src/git.ts` (`gitIn`), which removes the repository variables that a hook exports: without it the tests, run by the pre-push hook of a linked worktree, worked on the real repository (spec 0005).

## Conventions

- **Conventional Commits** (`feat(scope): …`, `fix: …`, `docs: …`, `chore: …`). Body lines at most 100 characters.
- **Never `--no-verify`.** A rejected commit can leave files staged: check `git status` after any hook failure.
- **Never set or change the git identity.**
- Python only for throwaway work; commit TypeScript.
- Copied code carries its provenance (source repository, commit, deviations) in a header or in `PROVENANCE.md`.
- Licence: Apache-2.0 (`LICENSE`, `NOTICE`).

## Emergency

Branch protection includes administrators. To remove it (operator only, an external effect):

```sh
gh api -X DELETE repos/tsukuri-labs/.github/branches/main/protection
```

Restore it afterwards: pull request required, status check `checks`, administrators included, no force push, no deletion.
