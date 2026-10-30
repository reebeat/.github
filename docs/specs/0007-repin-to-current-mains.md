# 0007 Re-pin the model to the current mains of the product repositories

Status: **spec** (frozen when its PR opens). Date: 2026-10-30. Decided by: the lead's request of 2026-10-30 (follow-up of spec 0003, the rename). Not a decision of the operator's log.
Process: [spec 0000](0000-intent-model.md). Stacked on spec 0006's PR (#7); merge that first.

## Problem

`model/sources.yaml` pinned the product repositories at the heads of 2026-10-29. Since then the rename (a word changed on most lines, and 9 files moved), the merges of spec 0004 of the compiler and spec 0005 of studio, and the Foldkit 0.170.0 bump moved the cited lines. A citation names a line at a pinned commit; after the rename the old paths (`packages/cli/bin/reebeat.ts`) and the old brand word in the cited text are history, and the new mains hold the facts that the model should describe.

## Goal

1. **New pins.** `model/sources.yaml` pins the compiler at `215868c`, studio at `14df3cd` and foldkit-flow at `a31331a` (the `origin/main` heads when the branch was made).
2. **Every citation resolves at its new pin.** 78 citations were renumbered or moved to a renamed path, 925 stayed, 74 were re-pointed by hand-checked fallback (below), and `bun run sources:verify` prints `Every file source resolves`.
3. **The rename is taken out of the comparison.** The tool `rename-prep/repin.ts` runs the OLD file through the rename mapping before it diffs against the NEW file, so a line that only the rename changed counts as unchanged. Only lines that another commit changed are reported.
4. **Statements that were facts about the old pin are corrected, and resolved items leave the model.** Six elements that the new mains resolved are deleted: the two Foldkit peer and Vite-plugin constraints of foldkit-flow, the three of studio (the plugin is on, Foldkit 0.170.0 peers `effect ~4.1.0`), and the compiler's "state machines are not merged" problem (spec 0004 is merged). Eleven are reworded to what the new mains say: the Foldkit version and peer range, the Foldkit project actor, the STATE.md problems of the three repositories (STATE.md is now one spec behind in studio and in the compiler), the STATE.md file resource, and `req-org-build-incremental` (its scenario now says what ADR-0000, merged, says: only that line is re-synthesised, the plan verdict returns without pixels, pixel reuse follows the spec for issue 9).
5. **Lows of the review of spec 0004 and 0006.** `constraint-org-final-name` no longer says "A published npm name is permanent" (an npm policy, not a log line). The advice that `comp-org-how-it-works` waits until the compiler's PR 24 merges is overridden by the operator's bulk confirmation (log line 118): it stays `decided` with the PR as its URL. `req-org-build-incremental` was advised to reword its scenario: done (item 4).
6. **`AGENTS.md`** says which directory names `verify-sources` reads: `<base>/reebeat`, `<base>/reebeat-studio` and `<base>/foldkit-flow` (the local checkouts keep their old names), not the product keys.

Not done, on purpose: 57 citations point at lines whose text another commit changed in substance (for example the compiler's glossary defines Keyframe, Line, Effect, Anchor and the Deck in terms of States and events now). Each is re-pointed at the new lines and listed in `docs/specs/0007-evidence/changed-citations.tsv` with its similarity; `needs-model-owner.txt` lists the 55 elements whose statement may now disagree with its citation. Rewriting the vocabulary of the compiler's model is a design change that belongs to the model owner, not to a re-pin.

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
| F3 | Exactly the six resolved elements are removed; none is added; no status of another element changes | `REF=<base> bash docs/specs/0007-evidence/verify.sh` (`0 status changes, 0 added, 6 removed`) | any other id appears |
| F4 | Every changed citation is listed | `docs/specs/0007-evidence/changed-citations.tsv` has 74 rows; the tool's report is `repin-report.txt` | a CHANGED line of the report is missing from the table |
| F5 | The model passes its checks | `bun run model:check`, `bun run generate:check` | a dangling link, a cut value |

## What is built

`model/sources.yaml`, the citation strings of `model/*/*.yaml`, the eleven rewordings and six deletions of item 4, the regenerated `profile/` and `docs/`, `docs/specs/0007-evidence/`, one sentence of `AGENTS.md`, and this spec. The re-pin was made by `rename-prep/repin.ts` and `repin-fallback.py` (a local tool, not a repository).

## Revisions

(none yet)
