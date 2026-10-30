# 0004 The final name: the model says Tsukuri

Status: **spec** (frozen when its PR opens). Date: 2026-10-30. Decided by: the operator's decisions of 2026-10-29 and 2026-10-30 in the decision log: lines 114 (Tsukuri is the preferred replacement for the working name), 117 (rename the GitHub organisation, never delete one), 118 (the handle `tsukuri-labs`; publish `@tsukuri/*` now without waiting for the Norwegian IP advisor), 119 (D4: publish and skip the advisor; the operator accepts the trademark risk) and 123 (the domain `tsukuri.dev`).
Process: [spec 0000](0000-intent-model.md). The rename of the words is spec 0003 (merged); this spec changes what the model says about the name, which is a decision, not a rename.

## Goal

Make the model say what the log decided about the name, and stop saying that the name `reebeat` stays.

1. **The decision log copy is the operator's file.** `sources/operator-decisions-2026-10.md` is replaced by a byte-for-byte copy of the operator's file (123 lines; the first 113 lines are unchanged). The model cites lines 114 to 123 from here on.
2. **One new decided element** states the decision: `constraint-org-final-name` (the product is published as Tsukuri, no advisor has cleared it and the operator accepts the trademark risk; the GitHub handle `tsukuri-labs`; the npm organisation `tsukuri`; the domain `tsukuri.dev`). It cites lines 114, 117, 118, 119 and 123, and says only what they say: that the organisation was renamed is a repository fact and is not claimed.
3. **The two working-name constraints become history, by hand.** `constraint-org-working-name` and `constraint-reebeat-working-name` keep their ids and their `decided` status (the model has no "superseded" status and this spec adds none). Their title and statement now say that `reebeat` *was* the working name and point to the new element; they also cite lines 114, 118 and 119.
4. **Statements that said "the first publish is paused until the advisor has answered" say what line 118 decided.** Five elements: `process-org-publish-packages`, and the four foldkit-flow elements about publishing (`goal-flow-publish`, `problem-flow-unpublished`, `process-flow-publish-package`, `comp-flow-library`). Each also cites line 118 (and 119 where it says the advisor is skipped). The compiler's release hold is a repository fact that this model cannot cite at its current pin: no statement mentions it.
5. **One stale sentence is fixed.** `problem-tsukuri-dco-and-trademark-open` said the trademark policy is written "after the name is cleared" (line 82); it now says the operator skipped the clearance (lines 118 and 119), so the log names no trigger.

No other element changes, no status moves, and `model/sources.yaml` is untouched (the pins are re-pinned by a later spec).

## Journey

```text
lead / operator
  1. read     docs/goals.md           "The product is Tsukuri, under tsukuri-labs, @tsukuri and tsukuri.dev"
  2. compare  bash docs/specs/0004-evidence/verify.sh
              the log copy equals the operator's file; one element is added (decided) and no status changes
  3. gate     bun run ready           model:check, generate:check and the rest, as in spec 0000
```

## Constraints and values

- **Status is earned.** The new element is `decided` because lines 114, 117, 118 and 123 say what it says. The statement adds no fact that they do not give.
- **History is not rewritten.** The two constraints keep what the clearance check found and what the operator did at line 113; they say what came after.
- **The operator's file is never edited here.** It is copied.
- **Plain English.** Short sentences, active voice.

## Falsifiers

| # | Falsifier | Gate | Fails when |
| --- | --- | --- | --- |
| F1 | The log copy equals the operator's file byte for byte | `docs/specs/0004-evidence/verify.sh` (`cmp`) | one byte differs |
| F2 | Exactly one element is added, as `decided`; no existing element changes status | `bun run status:diff --ref origin/main --allow-added-decided` (`docs/specs/0004-evidence/status-diff.txt`: `0 status changes, 1 added`) | a status moves, or a second element appears |
| F3 | The model passes its checks and the generated documents equal the generator's output | `bun run model:check`, `bun run generate:check` | a dangling id, a cut value, a `decided` element with no operator source, a hand-edited generated file |
| F4 | No statement says the first publish is paused until the advisor has answered | `git grep -n -i 'paused' model` shows only the two history statements | a statement still says it |
| F5 | The pins are unchanged | `git diff origin/main -- model/sources.yaml` is empty | the pins moved |

## What is built

`sources/operator-decisions-2026-10.md` (copy), the new element in `model/org/goals.yaml`, the two constraints and five statements named above, the regenerated `profile/` and `docs/`, `docs/specs/0004-evidence/` (the verify script, its raw output and the status diff), and this spec.

## Revisions

(none yet)
