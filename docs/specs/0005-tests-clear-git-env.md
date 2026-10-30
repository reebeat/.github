# 0005 Git tools and tests clear the repository variables

Status: **spec** (frozen when its PR opens). Date: 2026-10-30. Decided by: the lead's request of 2026-10-30 after the incident of spec 0003's PR: the pre-push hook ran the tests of this package from a linked worktree and the tests changed the real repository. Not a decision of the operator's log.
Process: [spec 0000](0000-intent-model.md). Verify skill: none (no user-visible output; this repository has no feature map).

## Problem

Git exports `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE` and the other repository variables to every hook. `git push` from a linked worktree runs `.vite-hooks/pre-push`, which runs `bun run test`. The tests of `tools/intent` build a fixture repository in a temporary directory with `git -C <dir> init`, `add` and `commit`. A child that inherits `GIT_DIR` ignores `-C`: it worked on the repository that started the hook. On 2026-10-30 that gave 20 commits named `fixture` on the pushed branch, deleted files in the worktree, an index replaced by the fixture's, and `core.bare = true` in the shared clone configuration (the clone then refused `git status`). The source code of `statusDiff.ts` and `verifySources.ts` runs git the same way, so it had the same flaw.

## Goal

Every git child process of this package sees the repository that its `-C` names, whatever environment the parent has. A push from a linked worktree leaves the real repository as it was.

## Journey

```text
a contributor, in a linked worktree of this repository
  1. bun run test                     passes; includes the hook-environment test
  2. bash docs/specs/0005-evidence/hook-journey.sh
        records refs, HEAD, status and core.bare of the main clone, pushes the branch from the worktree
        (so the real pre-push hook runs the tests under git's own hook environment), records them again, compares
  3. bun run ready                    as in spec 0000
```

## Constraints and values

- **One construct.** `src/git.ts` (`gitIn`) is the one way to run git in a directory: tools and tests both use it. No other call to `ChildProcess.make("git", ...)` exists in this package.
- **The list is git's.** The variables are the output of `git rev-parse --local-env-vars`.
- **No lint suppression.** The test sets the variables in a child process through `env`, not in the test process.
- **No change to what the tools print or decide.**

## Falsifiers

| # | Falsifier | Gate | Fails when |
| --- | --- | --- | --- |
| F1 | A child process with a hook's variables (`GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE` of a real repository) runs the fixture builder and `statusDiffAgainst`; the real repository's `core.bare`, `HEAD`, refs, status and index are as before | `test/gitEnv.test.ts` (child `test/underHook.ts`) in `bun run test` | `gitIn` keeps the variables (control, `docs/specs/0005-evidence/control.txt`: `env: {}` in `src/git.ts` fails it with `expected ... to not equal ...`) |
| F2 | After a real push from a linked worktree, the main clone has the same refs, `HEAD`, `core.bare` and status | `docs/specs/0005-evidence/hook-journey.sh` (`journey.txt`) | any of them differs |
| F3 | No call of git outside `gitIn` | `git grep -n 'make("git"' tools` prints only `src/git.ts` | another call appears |
| F4 | The existing tests and gates pass | `bun run ready` | any gate fails |

## What is built

`tools/intent/src/git.ts`; `statusDiff.ts`, `verifySources.ts` and `test/gitRepo.ts` use it; `test/gitEnv.test.ts` and its child `test/underHook.ts` (a `knip` entry); `docs/specs/0005-evidence/`; a line in `AGENTS.md`.

## Revisions

(none yet)
