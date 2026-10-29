---
name: review-pr
description: "The pull-request loop for reebeat/.github: independent reviewers judge the plan, the implementation and their agreement, a fixer addresses findings, each round is recorded on the PR, and a passing PR is merged by merge.sh. Use when a PR is ready for review, when asked to review or merge a PR, or when a review round finishes."
---

<!-- Provenance: adapted from reebeat/studio @ d4fd75eaca83b9e8a98f073d5b1d957da5d6b8b8 (.agents/skills/review-pr/SKILL.md), which adapted it
     from reebeat/reebeat @ f7c348877585f54b6bf00651608726dd7e5044d3 and phibkro/vektorprogrammet-reimagined @ 1104c3019a76c619c4c8e9ee04c71ce191467ed4.
     Deviations: this repository has no browser, no Foldkit app and no verify skill, so those parts are removed; the reviewers check the
     model's sources instead (reviewers.md). `merge.sh` and `record-round.sh` are copied byte for byte. See PROVENANCE.md. -->

# Review and merge a pull request

The lead (the session that owns merges) runs this loop. Reviewers and fixers are separate agents, so the one who judges a change never wrote it. The binding contract is `docs/specs/0000-intent-model.md`.

```text
round 1..n:
  reviewers (independent, read-only on the repository) -> findings with severity
  pass?  -> merge
  else   -> fixer addresses every finding -> push -> next round
stop:   after round 3, unless an open finding is critical or high (then keep going);
        a stop without a pass is reported to the operator, never merged
```

## 1. Prepare

- A PR carries its spec and its code together. The spec is frozen when the PR opens; later changes to it are dated entries in its Revisions section.
- Create a separate detached worktree per reviewer or fixer role with **`/run/current-system/sw/bin/git worktree add --detach .worktrees/pr-$N-<role> origin/<head branch>`** (no local branch). The harness rewrites a bare `git worktree` into `omp worktree`, which once copied `.worktrees/` into itself. Remove each worktree when its role ends.
- Read the PR body, its spec (falsifiers and Revisions), and `git diff --stat origin/<base>...HEAD`.
- Before a heavy job (`bun run ready`, an install) check the operator's limits: `MemAvailable` after the job's demand at least 20% of RAM, swap-in under 1000 pages per second, memory PSI `full` avg60 under 10%, load average under the CPU threads. Wait while any limit is short.

## 2. Review round: two independent reviewers, in parallel

Give each reviewer the PR number, the worktree, the spec, and [`reviewers.md`](reviewers.md). Reviewers do not edit, push or comment; they report. Every reviewer says which of three things it judged:

- **(a) The plan**: the spec states the right problem, journey and falsifiers.
- **(b) The implementation**: it is correct, the gates are green, every control was shown.
- **(c) Their agreement**: the code does what the spec with its Revisions says. Undeclared scope, a falsifier with no test, or a silent change to the plan (no dated Revisions entry) is a finding of medium or above.

**Verification reviewer** (mainly (b) and the evidence side of (c)): `bun run ready` on the head; the PR body's falsifier table against the branch; every negative control re-run where cheap; the model's sources.

**Conformance reviewer** (mainly (a) and (c)): the spec, the diff against it, the repository rules, public-repository hygiene, and whether the model says what the sources say.

Both read CI's result on the head (`gh pr checks <n>`): the `checks` job must be green.

## 3. Decide

**Pass** when all of these hold: no open finding of medium or above; CI green on the head; `bun run ready` exits 0 on the head; every falsifier has a shown control. Low and nit findings go into the merge comment, or are fixed if cheap.

**Merge a passing PR** with `.agents/skills/review-pr/merge.sh <n> "<type>: <summary>"` from the main checkout (squash, title `<type>: <summary> (#<n>)`). It refuses (exit 4) unless a round recorded by `record-round.sh` passed the PR's current head, waits for CI green on that head (exit 1 when not green), and merges only that head. If `main` moved since the head was reviewed it computes the expected tree and refuses on conflicts (exit 2) or on files that both changed (exit 3): then rebase, require CI green, and record a new round.

**Otherwise**, start a fixer: a separate agent in the PR's worktree, with the findings verbatim. It fixes the code; the spec only through a dated Revisions entry. It commits, pushes and reports. Then the next round, with fresh reviewers.

## 4. Iteration limit

- Rounds 1 to 3: iterate until the PR passes.
- After round 3: continue only while an open finding is **critical or high**. If only medium or lower findings remain, stop: do not merge; report the PR, the open findings and the rounds to the operator.
- A finding that the same fix has failed twice is reported at once.

## 5. Record

Every round is recorded on the PR with `.agents/skills/review-pr/record-round.sh <n> <round> <pass|changes> <body-file>`: a GitHub review headed by the marker `<!-- review-round n=<round> head=<sha> verdict=<pass|changes> -->`. `merge.sh` reads the marker, so a PR without a passing record on its head cannot be merged.

The body file starts with three lines, and `record-round.sh` refuses a body without them:

```text
Author: <the agent or person who wrote the head commits>
Reviewers: <comma-separated names of the agents who reviewed>
Checked: plan, implementation, agreement      (exactly the parts (a), (b), (c) that were judged)
```

**A review that the author records about its own PR is not independent.** `record-round.sh` refuses a `pass` whose `Author` is among the `Reviewers`. After the three lines: the findings with severity, what the fixer changed, and the evidence (commands, output). The PR body lists the rounds (number, head, verdict) under `## Review rounds` once the PR passes.
