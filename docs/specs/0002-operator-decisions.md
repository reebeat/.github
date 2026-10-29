# 0002 The operator's answers: 119 elements become `decided`

Status: **spec** (frozen when its PR opens). Date: 2026-10-29. Decided by: the operator's answers to the consequential decisions of the triage, recorded in lines 75 to 111 of the decision log (37 lines), and the name decision after the clearance check (line 113). Binding for: the PR that carries this file. Builds on [spec 0000](0000-intent-model.md) and [spec 0001](0001-model-corrections.md).

## Goal

Make the model say what the operator decided, and nothing more.

1. **Every element of an answered decision is `decided`.** It cites the log line of its decision (`log:N`), and its statement says the option the operator picked, with the operator's own notes. The waiting rationale is gone. 119 elements in 37 answers (lines 75 to 111; `counts.txt`): 9 in the organisation, 32 in reebeat, 40 in studio, 38 in foldkit-flow.
2. **The advice that is not an answer stays advice.** The triage put 342 more elements into "standard" (confirm in bulk) and "configuration" (confirm a default). The operator has not answered those. They stay `proposed` or `open`. Their advice moves out of the lead's files into `model/triage.yaml`, and `docs/confirm.md` prints it beside each element in a new column.
3. **The name decision after clearance (line 113).** The clearance check found a registered EU mark REBEAT and an active Norwegian registration FREEBEAT. The operator paused the first npm publish until a Norwegian IP advisor has answered, and keeps `reebeat` as the working name. The two name elements and the publish process say so.

No status of an element outside the 37 answers changes. A status moves only after the operator decides.

## Journey

```text
lead / operator
  1. read      docs/confirm.md          the answered elements are gone; each waiting row shows the lead's advice
  2. compare   bash docs/specs/0002-evidence/verify.sh
                                        the elements whose status changed are exactly the 119 answered ones,
                                        all to decided, each citing the log line of its decision
  3. check     bun run model:check      advice is for existing, still waiting elements (TRIAGE-*)
  4. gate      bun run ready            as in spec 0000
```

## Constraints and values

- **Status is earned.** An element is `decided` only where a log line shows the decision. The statement is what the log line says; wording that adds a fact the operator did not give stays out.
- **The picked option, not the recommendation.** Every pick equals the triage recommendation except where the operator added a note. The notes are in the statements: ffmpeg is libx264 "for now", with several encoders behind an adapter in future (line 78); a flag may bypass the plan-time failure for one output, so drift is silent but explicit, never a default (line 87); the open-core boundary holds "for now" (line 89); studio also uses the File System Access API natively where it exists (line 96); the package is `@reebeat/flow`, the repository stays `foldkit-flow`, and `@foldkit/flow` replaces it if Foldkit adopts the library (line 105); the name stays and a clearance check runs (line 75, then line 113).
- **A decided problem keeps its gap.** 16 answered elements are problems that carry a `gap` (work in a product repository). The answer decides how to resolve them, so they are `decided`, and the gap stays in `docs/gaps.md` with a fix that follows the decision. Spec 0000 made `GAP-STATUS` fail for a decided problem with a gap; that check is removed here, because `STATUS-DECIDED-NOT-OPERATOR` already demands an operator source for any decided element.
- **Advice is not a decision.** `model/triage.yaml` holds one line of advice per waiting element. A check fails when the advice names an element that does not exist (`TRIAGE-UNKNOWN-ID`) or that is already decided (`TRIAGE-DECIDED`): confirming an element must delete its advice.
- Line 112 of the log (a pg-outbox library, in its own repository) is about the operator's database tooling, not about the reebeat compiler, studio or foldkit-flow. It has no element in this model. It is in `sources/` because that file is a byte-for-byte copy of the operator's log.
- The copy of the log in `sources/` is the operator's file of 113 lines, byte for byte.

## What is built

| Part | Content |
| --- | --- |
| The answers | `model/{org,reebeat,studio,foldkit-flow}/*.yaml`: 119 elements `decided`, each with `log:N` in its sources. `docs/specs/0002-evidence/answers.tsv` lists decision, log line and element. |
| New elements | Two open problems that the answers made visible: a missing licence scan in foldkit-flow (log line 111) and a library that applies deletions before it reports them (log line 109). |
| Name | `constraint-org-working-name`, `constraint-reebeat-working-name` and `process-org-publish-packages` carry the clearance result and the paused first publish (line 113). Their status was already `decided`. |
| Triage advice | `model/triage.yaml` (schema `Triage`, loaded by `load.ts`), the checks `TRIAGE-UNKNOWN-ID` and `TRIAGE-DECIDED`, and the column "Triage advice" in `docs/confirm.md`. 342 entries. |
| Check removed | `GAP-STATUS` (see above). |
| The log | `sources/operator-decisions-2026-10.md` equals the operator's file (113 lines). |
| The state | `STATE.md` says what is in review and what waits. |

## Falsifiers

| # | Falsifier (must hold) | Gate | Negative control (must fail) |
| --- | --- | --- | --- |
| F1 | `bun run ready` exits 0 on a clean tree of the head | `ready` | F2 to F5 |
| F2 | The elements whose status changed against the base are exactly the answered elements, all to `decided` | `verify.sh` (`status:diff` and `answers.tsv`) | move one more status in a copy: exit 1 and the element is named |
| F3 | Every answered element is `decided` and cites the log line of its decision | `verify.sh` | change `log:100` to `log:99` in a copy: exit 1 and the element is named |
| F4 | The decision log in `sources/` is the log of 2026-10-29 | SHA-256 pin in `controls.sh` | edit one character of the copy: exit 1 |
| F5 | Advice is for existing, waiting elements | `model:check` (`checks.test.ts`) | advice for a decided element fails with `TRIAGE-DECIDED`; advice for an unknown id fails with `TRIAGE-UNKNOWN-ID` |
| F6 | A decided problem that keeps a gap is accepted | `model:check` | the real model holds 16; with `GAP-STATUS` they would fail (the check that spec 0000 added) |
| F7 | Every file source resolves at the pins | `sources:verify` | as in spec 0000 (F10) |

The raw output of the controls is in `docs/specs/0002-evidence/`.

## Scope and non-goals

- The 35 elements that are `decided` on a repository record alone stay as they are; the operator has not ratified them (last section of `docs/confirm.md`).
- The STANDARD and CONFIG groups of the triage are advice only. They are not decided here.
- No product repository is edited. The gaps that the answers settle are in `docs/gaps.md`; the lead files the follow-ups.
- The pins do not move. Elements that cite lines that a later change of the product repositories moves are a matter for the next re-pin.

## Open questions for the operator

1. `docs/confirm.md` lists what still waits, with the lead's advice. Confirming an element means changing its status and deleting its advice entry.
2. Line 112 (pg-outbox): does a pg-outbox library belong in this model as a product, or does it stay out of it?

## Revisions

Dated entries. A spec is revised only here; its text above is never edited silently after the PR opens.

- **2026-10-29, plan written** with the build.
