# 0007 Re-pin the model to the current mains of the product repositories

Status: **spec** (frozen when its PR opens). Date: 2026-10-30. Decided by: the lead's request of 2026-10-30 (follow-up of spec 0003, the rename). Not a decision of the operator's log.
Process: [spec 0000](0000-intent-model.md). Spec 0006 (#7) is merged; this PR is on `main`.

## Problem

`model/sources.yaml` pinned the product repositories at the heads of 2026-10-29. Since then the rename (a word changed on most lines, and 9 files moved), the merges of spec 0004 of the compiler and spec 0005 of studio, and the Foldkit 0.170.0 bump moved the cited lines. A citation names a line at a pinned commit; after the rename the old paths (`packages/cli/bin/reebeat.ts`) and the old brand word in the cited text are history, and the new mains hold the facts that the model should describe.

## Goal

1. **New pins.** `model/sources.yaml` pins the compiler at `215868c`, studio at `14df3cd` and foldkit-flow at `a31331a` (the `origin/main` heads when the branch was made).
2. **Every citation resolves at its new pin.** 78 citations were renumbered or moved to a renamed path, 925 stayed and 74 were re-pointed to the best-matching lines (below). `bun run sources:verify` prints `Every file source resolves`.
3. **The rename is taken out of the comparison.** The old file is run through the rename mapping before it is diffed against the new file, so a line that only the rename changed counts as unchanged. Only lines that another commit changed are reported.
4. **Statements that were facts about the old pin are corrected, and resolved items leave the model.** Seven elements that the new mains resolved are deleted: the two Foldkit peer and Vite-plugin constraints of foldkit-flow, the three of studio (the plugin is on, Foldkit 0.170.0 peers `effect ~4.1.0`), the compiler's "state machines are not merged" problem (spec 0004 is merged) and foldkit-flow's "module-mocking lint rule has a gap" problem (the rule matches `vite-plus/test` at the pin). Twelve elements are corrected in place: the Foldkit pin and peer range, the Foldkit project actor, the STATE.md resource and the three STATE.md problems (studio: spec 0005 is still said to be in review; compiler: spec 0004; flow: the blocked list), `req-org-build-incremental` (its scenario says what the merged ADR-0000 says), `concept-tsukuri-keyframe`, `concept-tsukuri-line` (the new glossary defines them through States and Scenes, so a relation moves with them), `rule-tsukuri-intent-resolved-in-schedule` and `problem-tsukuri-identity-scene-bounded`.
5. **What is not corrected is shown.** 50 elements keep their statements and cite lines whose text changed. They are listed in `model/triage.yaml` under `recheck`, with the old and the new citation and the similarity of the first line. The check `RECHECK-UNKNOWN-ID` keeps the list true, and `docs/confirm.md` has a section "Citations to re-read" that shows it. The tool code for this is small (`schema.ts`, `checks.ts`, `render/confirm.ts`, two tests).
6. **The tracker is refreshed** (`bun run tracker:refresh`): issue 4 of studio and pull request 17 of the compiler are no longer open, and items no longer cited leave the snapshot.
7. **Lows of the review of spec 0004 and 0006.** `constraint-org-final-name` no longer says "A published npm name is permanent" (an npm policy, not a log line). The advice that `comp-org-how-it-works` waits until the compiler's PR 24 merges is overridden by the operator's bulk confirmation (log line 118): it stays `decided` with the PR as its URL.
8. **`AGENTS.md`** says which directory names `verify-sources` reads: `<base>/reebeat`, `<base>/reebeat-studio` and `<base>/foldkit-flow` (the local checkouts keep their old names).

**What is reproducible from this repository.** The pins, `sources:verify` and the citation table are. The re-pin itself was made with two local scripts that need the rename tool's engine, which is not part of this repository: `docs/specs/0007-evidence/tools/repin.ts.txt` (the mapped diff, TypeScript) and `repin-fallback.py.txt` (the best-matching line by `difflib`, a throwaway Python script). They are kept for audit, not as runnable tools. A reviewer re-checks by sampling `changed-citations.tsv`: none of its 74 matches is byte-identical, and 67 are not deleted elements.

## Journey

```text
lead / operator
  1. compare  bash docs/specs/0007-evidence/verify.sh        the pins, the counts, sources:verify
  2. read     docs/specs/0007-evidence/changed-citations.tsv  every citation another commit changed, with what was done
  3. gate     bun run ready                                  model:check, generate:check, the rest
```

## Constraints and values

- **A citation cites a line that exists at its pin, and says what the element says, or it is listed.**
- **Resolved is not kept.** A constraint or problem that the new main resolved is deleted, as the triage recommended for stale items; its id leaves no dangling link.
- **No status moves.** Deleted elements are reported by `status:diff` as removed; no other element changes status.

## Falsifiers

| # | Falsifier | Gate | Fails when |
| --- | --- | --- | --- |
| F1 | Every file source resolves at the new pins | `bun run sources:verify --base /srv/share/projects` (`docs/specs/0007-evidence/verify.txt`: `Every file source resolves`) | a citation beyond the file or in a file absent at the pin |
| F2 | The pins are the current mains and only the three pins changed in `sources.yaml` | `git diff <base> -- model/sources.yaml` (3 lines) | another line moves |
| F3 | Exactly the seven resolved elements are removed; none is added; no status of another element changes | `REF=<base> bash docs/specs/0007-evidence/verify.sh` (`0 status changes, 0 added, 7 removed`) | any other id appears |
| F4 | Every changed citation is listed, and every kept one is on the re-read list | `docs/specs/0007-evidence/changed-citations.tsv` has 74 rows (7 deleted, 15 corrected, 52 kept = 50 elements in `recheck`); `docs/confirm.md` shows the 50 | a kept element is missing from `recheck`, or a listed id does not exist (`RECHECK-UNKNOWN-ID`) |
| F5 | The model passes its checks | `bun run model:check`, `bun run generate:check` | a dangling link, a cut value |

## What is built

`model/sources.yaml`, the citation strings of `model/*/*.yaml`, the twelve corrections and seven deletions of item 4, the `recheck` list and its tool code, the regenerated `profile/` and `docs/`, `docs/specs/0007-evidence/`, one sentence of `AGENTS.md`, and this spec. The re-pin was made by `rename-prep/repin.ts` and `repin-fallback.py` (a local tool, not a repository).

## Revisions

- **2026-10-30, review round 1 (RevIntent1).** The Goal above states the spec as built after the round. Changes against the first head: a seventh deletion (`problem-flow-lint-mocking-gap`: the rule matches `vite-plus/test` at the pin); four more corrections (`concept-tsukuri-keyframe`, `concept-tsukuri-line`, `rule-tsukuri-intent-resolved-in-schedule`, `problem-tsukuri-identity-scene-bounded`); the 50 kept citations are now shown (`recheck` in `model/triage.yaml`, check `RECHECK-UNKNOWN-ID`, a section of `docs/confirm.md`, two tests); the tracker refresh; the base is `main`; the evidence says which part is reproducible.
- **2026-10-30, after the merge (spec 0008).** Corrections to the wording above; the body is not edited. (1) The sentence "The re-pin was made by `rename-prep/repin.ts` and `repin-fallback.py`" is replaced by this: the committed evidence keeps only the TypeScript mapped-diff script (`docs/specs/0007-evidence/tools/repin.ts.txt`, which imports the rename tool's engine from outside this repository, so it does not run from here alone); the throwaway Python script that picked the best-matching lines is removed from the evidence; the re-pointing and the corrections were a manual pass whose result is the table. (2) The counts, each with its source. From `changed-citations.tsv` by script: 74 rows = 7 rows of deleted elements (6 elements; the seventh deleted element, `problem-tsukuri-state-machine-conformance`, has no row), 15 rows of corrected statements (11 elements), 52 rows of kept statements (50 elements, the `recheck` list). From the model diff between `d228723` and `aa0b413` (`bun` script over `model/*/*.yaml`): 7 elements deleted and 12 elements whose fields other than `source` changed (the 11 of the table, minus `resource-flow-state-file` whose change is its sources only, plus `constraint-org-final-name` and `req-org-build-incremental`, which have no row). Where the body says "twelve corrections", read: 12 elements by the model diff, 15 citations of 11 elements by the table.

